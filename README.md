# Vibrant Wines — Order Portal

A simple ordering website for corporate wine club clients. No backend, no
payment processing, no inventory tracking — it just shows the current
Vibrant Wines portfolio, lets someone build a cart, and emails you the
order. This README assumes zero coding experience.

---

## What this site does

- Reads the live wine list straight from `https://vibrantwinessg.github.io/Pricelist-Vibrant/`
  every time someone visits. Update a price on that page, and this portal
  shows the new price automatically — nothing to touch here.
- Lets visitors filter/search by region, style, grape, and sort by price or name.
- Add to cart, adjust quantities, remove items — cart is remembered even if
  they close the tab and come back later.
- Checkout collects name, phone, email, delivery address, delivery
  instructions — no payment info is ever asked for.
- On submit, one email is sent automatically to `info@vibrantwines.com`
  with the full order. The customer does not receive an email — you follow
  up with them directly with an invoice.

---

## The 3 files you'll actually touch

| File | What it's for |
|---|---|
| `config.js` | The portfolio link, client name, and email settings. This is 95% of what you'll ever edit. |
| `logo2.png` | The Vibrant Wines logo shown in the top bar. Only touch this if the logo ever changes. |
| `index.html` | The page structure. You likely never need to open this. |
| `styles.css` | Colors and layout. You likely never need to open this. |
| `app.js` | The logic (parsing, cart, checkout). You likely never need to open this. |

**To point this portal at a different price list in future** (e.g. a
Barclays-specific list instead of the general portfolio), open `config.js`
and change only this one line:

```js
PORTFOLIO_URL: "https://vibrantwinessg.github.io/Pricelist-Vibrant/",
```

Nothing else needs to change.

---

## Part 1 — Put this on the internet (GitHub Pages)

1. Go to [github.com](https://github.com) and create a free account if you
   don't have one already.
2. Click the **+** icon (top right) → **New repository**. Name it something
   like `barclays-wine-portal`. Set it to **Public**. Click **Create repository**.
3. On the repo page, click **Add file → Upload files**. Drag in all 5
   files from this package (`index.html`, `styles.css`, `app.js`,
   `config.js`, `logo2.png`). Make sure they land at the top level of the
   repo, not inside a folder. Click **Commit changes**.
4. Go to **Settings → Pages** (left sidebar). Under "Build and deployment",
   set **Source** to "Deploy from a branch", **Branch** to `main` and folder
   to `/ (root)`. Click **Save**.
5. Wait about a minute, refresh that same Settings → Pages screen, and
   you'll see a green banner with your live URL — something like
   `https://yourusername.github.io/barclays-wine-portal/`.

That's the link you send to your corporate client.

---

## Part 2 — Set up email (EmailJS, ~5 minutes, no code)

This site is static (no server), so it uses a free service called **EmailJS**
to actually send the order email from the browser. You do NOT need the
customer to receive anything — only `info@vibrantwines.com` gets an email
per order. Everything here is point-and-click in EmailJS's own website —
you're not writing any code, just pasting 3 short ID values at the end.

**One thing you do need**: any single email account for EmailJS to send
*through*. This does **not** need to be `info@vibrantwines.com`, and you
don't need to set anything up on that mailbox at all. The sending account
and the receiving address are completely independent — you could create a
brand-new, free Gmail account solely for this purpose (e.g.
`vibrantwinesportal@gmail.com`), connect *that* to EmailJS in Step 2, and
in Step 3 simply put `info@vibrantwines.com` as the template's "To email".
Orders will land in the real Vibrant Wines inbox without you ever touching
its settings. This is the simplest route and what we'd recommend.

### Step 1 — Create your account
Go to [emailjs.com](https://www.emailjs.com) → **Sign Up** (free plan is
fine to start — 200 emails/month, i.e. 200 orders since we only send 1 email per order now).

### Step 2 — Connect an email account
In the EmailJS dashboard, go to **Email Services → Add New Service**. Pick
Gmail (or whichever provider you used for the sending account — see the
note above) and follow the on-screen prompts to connect it. Copy the
**Service ID** shown — you'll need it shortly.

### Step 3 — Create the order email template
Go to **Email Templates → Create New Template**. This is the only email
sent — it lands in `info@vibrantwines.com` with the order details.

- **To email**: `info@vibrantwines.com`
- **Subject**: `New order from {{customer_name}}`
- **Content** (paste this into the body):

```
New order received via the order portal.

Name: {{customer_name}}
Phone: {{customer_phone}}
Email: {{customer_email}}
Address: {{customer_address}}
Delivery instructions: {{delivery_instructions}}
Order date: {{order_date}}

Items:
{{order_items_text}}

Total: {{order_total}}
```

Save the template, and copy its **Template ID**.

### Step 4 — Get your Public Key
Go to **Account → General**, and copy your **Public Key**.

### Step 5 — Paste all 3 values into `config.js`
Open `config.js` (either directly on GitHub — click the file, then the
pencil/edit icon — or on your computer) and paste in the three values you
copied:

```js
EMAILJS_PUBLIC_KEY: "...",
EMAILJS_SERVICE_ID: "...",
EMAILJS_ADMIN_TEMPLATE_ID: "...",
```

Save / commit the change. Email will start working within a minute or two.

### Step 6 — Test it
Place a real test order on your live site and confirm the email arrives at
`info@vibrantwines.com`.

---

## Part 3 — Setting up a new client site in future

You mentioned future clients may need their own separate site with the
same wine list and features. That's exactly how this is built to work —
each client gets their own copy:

1. On GitHub, open this repo and click **Use this template** (or just
   **Add file → Upload files** into a brand-new empty repo, uploading the
   same 5 files again).
2. Open that new repo's `config.js` and change **only** `CLIENT_NAME` to
   the new client's name (e.g. `"Acme Corp Wine Club"`). Leave
   `PORTFOLIO_URL` as-is unless this client specifically needs a different
   wine list.
3. Repeat the EmailJS steps above — you can reuse the same EmailJS account
   and email service (Step 2), just create one new template per client if
   you want the "New order from..." emails to say which client it came
   from, or reuse the same template for all clients if that's not important.
4. Turn on GitHub Pages for the new repo (Part 1, step 4) and you'll get a
   second, independent link for that client.

Nothing about the wine-parsing, cart, or checkout logic needs to change —
`config.js` is the only file that differs between client sites.

---

## What "price overrides" would mean (not built — you said it's not needed yet)

Right now, every client sees the exact same prices, pulled live from the
portfolio page. If a specific client ever negotiates a different price for
particular wines (e.g. Barclays gets a special rate on one cuvée while
everyone else pays the listed price), that's what a "price override" would
be for — a small list in that client's `config.js` saying "for this wine,
charge this instead." It's not built in yet since none of your clients
need it — just mention it if that comes up, and it's a small addition.

---

## Confirmed: cross-site loading of the wine list works

The portal loads `https://vibrantwinessg.github.io/Pricelist-Vibrant/` from
a *different* GitHub Pages site (your order portal's own address). Browsers
normally block this kind of cross-site request unless the source site
explicitly allows it — this is called CORS.

**Good news: GitHub Pages allows this for every public site, always, with
no configuration needed.** GitHub Pages serves all public content with an
`Access-Control-Allow-Origin: *` header on every response, and — per
GitHub's own support threads — there is no way to turn this off. So as
long as `https://vibrantwinessg.github.io/Pricelist-Vibrant/` stays a public
GitHub Pages site, this will keep working with zero setup on your end.

If wines ever fail to load anyway, it's almost certainly one of: the
portfolio page URL changed, the portfolio page itself is temporarily down,
or (rarely) GitHub Pages having an outage — not a CORS problem. The app
shows a specific error message on-screen if loading fails, rather than a
blank page, so you'll know which it is.

---

## Known limits (by design, not bugs)

- **No inventory checking.** Anyone can add more bottles to their cart than
  actually exist. You confirm real availability when you follow up with the
  invoice — this was an explicit requirement, not an oversight.
- **No payment collection.** Intentional — invoicing happens separately.
- **Only one email is sent per order** (to `info@vibrantwines.com`) —
  customers do not receive an automated email. We still collect their
  email address on the form as a contact detail for your follow-up.
- **Free EmailJS plan caps at 200 emails/month** (= 200 orders, since each
  order now sends just 1 email). If a client's order volume grows, upgrade
  the EmailJS plan from their dashboard — no code changes needed.
- **The portfolio must stay reachable** at the URL in `config.js`. If that
  page's address ever changes, update the one line in `config.js`.

---

## If something breaks

- **Wines aren't loading at all**: open the site, right-click → Inspect →
  Console tab, and see what error is shown. Most commonly this means the
  `PORTFOLIO_URL` page is temporarily down, or its web address changed.
- **Emails aren't arriving**: double check the 4 values in `config.js` are
  pasted in exactly (no extra spaces, no quotes missing), and that your
  EmailJS account's connected email service is still authorized (EmailJS
  dashboard → Email Services will show a warning icon if it's disconnected).
- For anything else, paste the exact error message to your AI assistant
  along with which file you were editing.
