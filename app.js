/* ============================================================
   VIBRANT WINES — ORDER PORTAL
   app.js — portfolio parsing, filtering, cart, checkout, email.
   No backend. No inventory checks. Reads CONFIG from config.js.
   ============================================================ */

const CART_KEY = "vibrantWinesCart_v1";

let PRODUCTS = [];          // flat list, parsed from the portfolio page
let cart = loadCart();      // [{id, qty}]
let activeFilters = { search: "", region: "", style: "", grape: "", sort: "default" };

const $ = (id) => document.getElementById(id);

document.addEventListener("DOMContentLoaded", init);

async function init() {
  $("clientLabel").textContent = CONFIG.CLIENT_NAME || "";
  if (CONFIG.MOQ_NOTE) {
    $("moqNote").textContent = CONFIG.MOQ_NOTE;
    $("moqNote").style.display = "block";
  }

  wireStaticEvents();
  renderCart();

  try {
    const html = await fetchPortfolioHtml(CONFIG.PORTFOLIO_URL);
    PRODUCTS = parsePortfolio(html);
    if (PRODUCTS.length === 0) throw new Error("No wines found on the portfolio page.");
    buildFilterOptions(PRODUCTS);
    renderProducts();
  } catch (err) {
    console.error(err);
    $("mainContent").innerHTML = `
      <div class="load-error">
        <p><strong>We couldn't load the current wine list.</strong></p>
        <p>${escapeHtml(err.message || String(err))}</p>
        <p>This usually means the portfolio page at <code>${escapeHtml(CONFIG.PORTFOLIO_URL)}</code>
        is unreachable, or the browser blocked the cross-site request. Try refreshing the page,
        or contact info@vibrantwines.com if this keeps happening.</p>
      </div>`;
  }
}

/* ============================================================
   FETCH + PARSE THE SOURCE PORTFOLIO PAGE
   ============================================================ */

async function fetchPortfolioHtml(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Portfolio page returned HTTP ${res.status}.`);
  return await res.text();
}

function parsePortfolio(html) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const sections = doc.querySelectorAll("section.producer");
  const products = [];

  sections.forEach((section) => {
    const h1 = section.querySelector("h1");
    if (!h1) return;
    const producerName = cleanText(h1.textContent);

    const eyebrowEl = section.querySelector(".eyebrow");
    let region = eyebrowEl ? cleanText(eyebrowEl.textContent) : "Other";
    region = region.split("—")[0].trim();
    region = toTitleCase(region);

    const etaEl = section.querySelector(".eta-note");
    const eta = etaEl ? cleanText(etaEl.textContent) : "";

    const imgEl = section.querySelector(".bandeau img");
    const photo = imgEl ? imgEl.getAttribute("src") : "";
    const photoUrl = photo ? new URL(photo, CONFIG.PORTFOLIO_URL).href : "";

    const rows = section.querySelectorAll("table.wines tbody tr, table.wines tr");
    rows.forEach((tr) => {
      const cuveeTd = tr.querySelector("td.cuvee");
      const descTd = tr.querySelector("td.desc");
      const priceTd = tr.querySelector("td.price");
      if (!cuveeTd || !priceTd) return;

      const typeEl = cuveeTd.querySelector(".type");
      const typeText = typeEl ? cleanText(typeEl.textContent) : "";
      const cuveeClone = cuveeTd.cloneNode(true);
      const typeInClone = cuveeClone.querySelector(".type");
      if (typeInClone) typeInClone.remove();
      const cuveeName = cleanText(cuveeClone.textContent);

      if (!cuveeName) return;

      const priceRaw = cleanText(priceTd.textContent);
      const soldOut = /sold\s*out/i.test(priceRaw);
      const priceNum = soldOut ? null : parseFloat(priceRaw.replace(/[^0-9.]/g, ""));

      const { style, grape } = splitStyleGrape(typeText);

      const id = slugify(`${producerName}__${cuveeName}`);

      products.push({
        id,
        producer: producerName,
        region,
        eta,
        photo: photoUrl,
        cuvee: cuveeName,
        type: typeText,
        style,
        grape,
        desc: descTd ? cleanText(descTd.textContent) : "",
        price: priceNum,
        soldOut,
      });
    });
  });

  return products;
}

function splitStyleGrape(typeText) {
  if (!typeText) return { style: "", grape: "" };
  const m = typeText.match(/^([^(]+)\(?([^)]*)\)?$/);
  const style = m ? m[1].trim() : typeText.trim();
  const grape = m && m[2] ? m[2].trim() : "";
  return { style, grape };
}

function cleanText(t) {
  return (t || "").replace(/\s+/g, " ").trim();
}

function toTitleCase(s) {
  // Region eyebrows are ALL CAPS on the source site; keep proper wine-region casing.
  const smallWords = new Set(["de", "du", "des", "la", "le", "les", "et", "d'"]);
  return s
    .toLowerCase()
    .split(" ")
    .map((w, i) => {
      if (i > 0 && smallWords.has(w)) return w;
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(" ");
}

function slugify(s) {
  return s
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/* ============================================================
   FILTER BAR
   ============================================================ */

function buildFilterOptions(products) {
  fillSelect("regionFilter", uniqueSorted(products.map(p => p.region)));
  fillSelect("styleFilter", uniqueSorted(products.map(p => p.style).filter(Boolean)));
  fillSelect("grapeFilter", uniqueSorted(products.flatMap(p => splitGrapeList(p.grape))));
}

function splitGrapeList(grape) {
  if (!grape) return [];
  return grape.split(/\s*\/\s*|\s*,\s*/).map(g => g.trim()).filter(Boolean);
}

function uniqueSorted(arr) {
  return [...new Set(arr)].sort((a, b) => a.localeCompare(b));
}

function fillSelect(id, values) {
  const el = $(id);
  values.forEach(v => {
    const opt = document.createElement("option");
    opt.value = v;
    opt.textContent = v;
    el.appendChild(opt);
  });
}

function wireStaticEvents() {
  $("searchInput").addEventListener("input", (e) => { activeFilters.search = e.target.value.toLowerCase(); renderProducts(); });
  $("regionFilter").addEventListener("change", (e) => { activeFilters.region = e.target.value; renderProducts(); });
  $("styleFilter").addEventListener("change", (e) => { activeFilters.style = e.target.value; renderProducts(); });
  $("grapeFilter").addEventListener("change", (e) => { activeFilters.grape = e.target.value; renderProducts(); });
  $("sortSelect").addEventListener("change", (e) => { activeFilters.sort = e.target.value; renderProducts(); });
  $("resetFilters").addEventListener("click", () => {
    activeFilters = { search: "", region: "", style: "", grape: "", sort: "default" };
    $("searchInput").value = "";
    $("regionFilter").value = "";
    $("styleFilter").value = "";
    $("grapeFilter").value = "";
    $("sortSelect").value = "default";
    renderProducts();
  });

  $("openCartBtn").addEventListener("click", openCart);
  $("closeCartBtn").addEventListener("click", closeCart);
  $("overlay").addEventListener("click", closeCart);
  $("checkoutBtn").addEventListener("click", openCheckout);
  $("closeCheckoutBtn").addEventListener("click", closeCheckout);
  $("continueShoppingBtn").addEventListener("click", closeCheckout);
  $("orderForm").addEventListener("submit", submitOrder);
}

/* ============================================================
   PRODUCT GRID
   Rendered grouped by region. Every interactive element is bound
   fresh after each render via delegated listeners on the grid
   container (never duplicate data-attributes between actions).
   ============================================================ */

function filteredSortedProducts() {
  let list = PRODUCTS.filter(p => {
    if (CONFIG.HIDE_SOLD_OUT && p.soldOut) return false;
    if (activeFilters.region && p.region !== activeFilters.region) return false;
    if (activeFilters.style && p.style !== activeFilters.style) return false;
    if (activeFilters.grape && !splitGrapeList(p.grape).includes(activeFilters.grape)) return false;
    if (activeFilters.search) {
      const hay = `${p.producer} ${p.cuvee} ${p.desc}`.toLowerCase();
      if (!hay.includes(activeFilters.search)) return false;
    }
    return true;
  });

  if (activeFilters.sort === "price-asc") list = [...list].sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
  else if (activeFilters.sort === "price-desc") list = [...list].sort((a, b) => (b.price ?? -Infinity) - (a.price ?? -Infinity));
  else if (activeFilters.sort === "name-asc") list = [...list].sort((a, b) => a.cuvee.localeCompare(b.cuvee));

  return list;
}

function renderProducts() {
  const list = filteredSortedProducts();
  $("resultCount").textContent = `${list.length} wine${list.length === 1 ? "" : "s"}`;

  if (list.length === 0) {
    $("mainContent").innerHTML = `<div class="empty-state">No wines match your filters. Try clearing a filter or search term.</div>`;
    return;
  }

  let html = "";
  if (activeFilters.sort === "default") {
    const groups = groupByRegion(list);
    for (const region of Object.keys(groups)) {
      html += `<div class="region-group">
        <div class="region-title">${escapeHtml(region)}</div>
        <div class="grid">${groups[region].map(productCard).join("")}</div>
      </div>`;
    }
  } else {
    html = `<div class="grid">${list.map(productCard).join("")}</div>`;
  }

  $("mainContent").innerHTML = html;

  // Delegated listeners, re-bound to the freshly rendered grid each time.
  $("mainContent").querySelectorAll("[data-action]").forEach(el => {
    el.addEventListener("click", handleProductAction);
  });
}

function groupByRegion(list) {
  const groups = {};
  list.forEach(p => {
    if (!groups[p.region]) groups[p.region] = [];
    groups[p.region].push(p);
  });
  return groups;
}

function productCard(p) {
  const inCart = cart.find(i => i.id === p.id);
  const qty = inCart ? inCart.qty : 0;
  const photoHtml = p.photo
    ? `<img class="card-photo" src="${escapeHtml(p.photo)}" alt="" loading="lazy">`
    : `<div class="card-photo"></div>`;

  let actionHtml;
  if (p.soldOut) {
    actionHtml = `<span class="sold-out-label">Sold out</span>`;
  } else if (qty > 0) {
    actionHtml = `
      <div class="qty-stepper">
        <button type="button" data-action="dec" data-id="${escapeHtml(p.id)}">&minus;</button>
        <span class="qty-val">${qty}</span>
        <button type="button" data-action="inc" data-id="${escapeHtml(p.id)}">+</button>
      </div>`;
  } else {
    actionHtml = `<button type="button" class="add-btn" data-action="add" data-id="${escapeHtml(p.id)}">Add to Cart</button>`;
  }

  return `
    <article class="card">
      ${photoHtml}
      <div class="card-body">
        <div class="card-eyebrow">${escapeHtml(p.region)}</div>
        <div class="card-producer">${escapeHtml(p.producer)}</div>
        <div class="card-title">${escapeHtml(p.cuvee)}</div>
        ${p.type ? `<div class="card-type">${escapeHtml(p.type)}</div>` : ""}
        ${p.eta ? `<div class="card-eta">${escapeHtml(p.eta)}</div>` : ""}
        <div class="card-desc">${escapeHtml(p.desc)}</div>
        <div class="card-footer">
          <div class="card-price">${p.soldOut ? "" : money(p.price)}</div>
          ${actionHtml}
        </div>
      </div>
    </article>`;
}

function handleProductAction(e) {
  const action = e.currentTarget.dataset.action;
  const id = e.currentTarget.dataset.id;
  if (action === "add") addToCart(id);
  else if (action === "inc") changeQty(id, 1);
  else if (action === "dec") changeQty(id, -1);
}

/* ============================================================
   CART (persisted to localStorage, keyed by stable product id)
   ============================================================ */

function loadCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function addToCart(id) {
  const item = cart.find(i => i.id === id);
  if (item) item.qty += 1;
  else cart.push({ id, qty: 1 });
  saveCart();
  renderProducts();
  renderCart();
}

function changeQty(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter(i => i.id !== id);
  saveCart();
  renderProducts();
  renderCart();
}

function removeFromCart(id) {
  cart = cart.filter(i => i.id !== id);
  saveCart();
  renderProducts();
  renderCart();
}

function getCartDetailed() {
  return cart
    .map(i => {
      const p = PRODUCTS.find(x => x.id === i.id);
      return p ? { ...p, qty: i.qty, lineTotal: (p.price || 0) * i.qty } : null;
    })
    .filter(Boolean);
}

function cartTotal() {
  return getCartDetailed().reduce((sum, x) => sum + x.lineTotal, 0);
}

function money(n) {
  return `$${Number(n).toLocaleString("en-SG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function renderCart() {
  const detailed = getCartDetailed();
  const totalQty = detailed.reduce((sum, x) => sum + x.qty, 0);
  $("cartCount").textContent = totalQty;

  if (detailed.length === 0) {
    $("cartBody").innerHTML = `<div class="drawer-empty">Your cart is empty.</div>`;
    $("cartFooter").style.display = "none";
    return;
  }

  $("cartBody").innerHTML = detailed.map(x => `
    <div class="cart-line">
      <div class="cart-line-info">
        <div class="cart-line-name">${escapeHtml(x.producer)} — ${escapeHtml(x.cuvee)}</div>
        <div class="cart-line-meta">${escapeHtml(x.type || "")}</div>
        <div class="cart-line-controls">
          <div class="qty-stepper">
            <button type="button" data-action="dec" data-id="${escapeHtml(x.id)}">&minus;</button>
            <span class="qty-val">${x.qty}</span>
            <button type="button" data-action="inc" data-id="${escapeHtml(x.id)}">+</button>
          </div>
          <span class="cart-line-price">${money(x.lineTotal)}</span>
        </div>
        <button type="button" class="remove-link" data-action="remove" data-id="${escapeHtml(x.id)}">Remove</button>
      </div>
    </div>`).join("");

  $("cartBody").querySelectorAll("[data-action]").forEach(el => {
    el.addEventListener("click", (e) => {
      const action = e.currentTarget.dataset.action;
      const id = e.currentTarget.dataset.id;
      if (action === "inc") changeQty(id, 1);
      else if (action === "dec") changeQty(id, -1);
      else if (action === "remove") removeFromCart(id);
    });
  });

  $("cartFooter").style.display = "block";
  $("cartTotal").textContent = money(cartTotal());
}

function openCart() { $("cartDrawer").classList.add("open"); $("overlay").classList.add("open"); }
function closeCart() { $("cartDrawer").classList.remove("open"); $("overlay").classList.remove("open"); }

/* ============================================================
   CHECKOUT
   ============================================================ */

function openCheckout() {
  if (cart.length === 0) return;
  closeCart();
  $("checkoutStep").style.display = "block";
  $("thankYouStep").style.display = "none";
  $("modalTitle").textContent = "Checkout";
  renderOrderSummary();
  $("checkoutOverlay").classList.add("open");
}

function closeCheckout() {
  $("checkoutOverlay").classList.remove("open");
}

function renderOrderSummary() {
  const detailed = getCartDetailed();
  $("orderSummary").innerHTML =
    detailed.map(x => `
      <div class="order-summary-line">
        <span>${escapeHtml(x.producer)} — ${escapeHtml(x.cuvee)} &times; ${x.qty}</span>
        <span>${money(x.lineTotal)}</span>
      </div>`).join("") +
    `<div class="order-summary-total"><span>Total</span><span>${money(cartTotal())}</span></div>`;
}

async function submitOrder(e) {
  e.preventDefault();
  const name = $("custName").value.trim();
  const phone = $("custPhone").value.trim();
  const email = $("custEmail").value.trim();
  const address = $("custAddress").value.trim();
  const instructions = $("custInstructions").value.trim();

  if (!name || !phone || !email || !address) return;

  const detailed = getCartDetailed();
  if (detailed.length === 0) return;

  const submitBtn = $("submitOrderBtn");
  const status = $("formStatus");
  submitBtn.disabled = true;
  status.className = "form-status sending";
  status.textContent = "Sending your order…";

  const itemsText = detailed.map(x => `${x.producer} — ${x.cuvee} (${x.type || ""}) x${x.qty} = ${money(x.lineTotal)}`).join("\n");
  const itemsHtml = detailed.map(x => `<div>${escapeHtml(x.producer)} — ${escapeHtml(x.cuvee)} (${escapeHtml(x.type || "")}) &times; ${x.qty} = ${money(x.lineTotal)}</div>`).join("");
  const totalStr = money(cartTotal());
  const orderDate = new Date().toLocaleString("en-SG", { dateStyle: "medium", timeStyle: "short" });

  const commonParams = {
    customer_name: name,
    customer_phone: phone,
    customer_email: email,
    customer_address: address,
    delivery_instructions: instructions || "—",
    order_items_text: itemsText,
    order_items_html: itemsHtml,
    order_total: totalStr,
    order_date: orderDate,
    to_email: email,
    admin_email: CONFIG.ADMIN_EMAIL,
  };

  try {
    if (!window.emailjs || !CONFIG.EMAILJS_PUBLIC_KEY || CONFIG.EMAILJS_PUBLIC_KEY.startsWith("PASTE_")) {
      throw new Error("Email is not configured yet (see config.js).");
    }
    emailjs.init({ publicKey: CONFIG.EMAILJS_PUBLIC_KEY });

    await emailjs.send(CONFIG.EMAILJS_SERVICE_ID, CONFIG.EMAILJS_ADMIN_TEMPLATE_ID, commonParams);

    cart = [];
    saveCart();
    renderCart();
    renderProducts();

    $("checkoutStep").style.display = "none";
    $("thankYouStep").style.display = "block";
    $("thankYouName").textContent = `, ${name}`;
    $("orderForm").reset();
    status.textContent = "";
  } catch (err) {
    console.error(err);
    status.className = "form-status error";
    status.textContent = `We couldn't send your order automatically (${err.message || err}). Please email your order to ${CONFIG.ADMIN_EMAIL} directly, or try again.`;
  } finally {
    submitBtn.disabled = false;
  }
}

/* ============================================================
   UTIL
   ============================================================ */

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
