/* ============================================================
   VIBRANT WINES — ORDER PORTAL CONFIGURATION
   This is the ONLY file you should need to edit day-to-day.
   ============================================================ */

const CONFIG = {

  // ----------------------------------------------------------
  // 1. PORTFOLIO SOURCE
  // The portal reads the live wine list straight from this page
  // every time someone visits — so whenever you update prices or
  // wines on that page, this portal updates automatically.
  //
  // To point this portal at a different list in future, change
  // ONLY the line below. Nothing else in the code needs to change.
  // ----------------------------------------------------------
  PORTFOLIO_URL: "https://vibrantwinessg.github.io/Pricelist-Vibrant/",

  // ----------------------------------------------------------
  // 2. CLIENT / PORTAL LABEL
  // Shown in the page title and header. Change per corporate client.
  // ----------------------------------------------------------
  CLIENT_NAME: "Barclays Wine Club",

  // ----------------------------------------------------------
  // 3. EMAIL (via EmailJS — no backend server needed)
  // Only ONE email is sent per order: the order details to
  // ADMIN_EMAIL below. Customers do not receive anything.
  // See README.md "Email setup" section for the exact click-by-click
  // steps to get these three values from https://www.emailjs.com
  // ----------------------------------------------------------
  EMAILJS_PUBLIC_KEY: "UyoUoe_6qHekBZmlr",
  EMAILJS_SERVICE_ID: "service_733i7yj",
  EMAILJS_ADMIN_TEMPLATE_ID: "template_f7qxgso",     // sends the order to Vibrant Wines

  ADMIN_EMAIL: "info@vibrantwines.com",

  // ----------------------------------------------------------
  // 4. MISC SETTINGS
  // ----------------------------------------------------------
  CURRENCY: "SGD",
  HIDE_SOLD_OUT: false,      // true = hide sold-out wines completely instead of showing a disabled "Sold Out" state
  MOQ_NOTE: "",              // optional line shown near checkout, e.g. "Minimum order value: $500"
};
