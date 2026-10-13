# Kamagere Mart — Frontend (HTML + CSS + JavaScript)

This is a complete frontend starter for a grocery/e-commerce workflow inspired by the currently visible Kamagere Mart site.

The current public site exposes these customer flows: delivery address, search, profile/login/register, cart, checkout, COD/UPI selection, orders and password/account flows. The project below turns those flows into separate VS Code pages with responsive navigation and localStorage-based frontend state.

## Tech
- HTML5
- CSS3
- Vanilla JavaScript
- localStorage for frontend demo state
- Optional Google Apps Script adapter
- Optional GCP architecture notes

## Project structure

kamagere-mart-frontend/
├── index.html
├── pages/
│   ├── auth.html
│   ├── cart.html
│   ├── checkout.html
│   ├── orders.html
│   └── profile.html
├── css/
│   └── style.css
├── js/
│   ├── app.js
│   └── data.js
├── assets/
├── apps-script/
│   └── Code.gs
├── gcp/
│   └── README.md
└── README.md

## Run in VS Code

1. Open the project folder in VS Code.
2. Install the "Live Server" extension.
3. Right-click `index.html` -> "Open with Live Server".
4. Test:
   - Home/search/category
   - Add to cart
   - Cart quantity changes
   - Checkout
   - Address
   - COD/UPI selection
   - Place order
   - Orders
   - Login/register
   - Profile/logout
   - Mobile bottom navigation

## Important frontend limitation

This is frontend-only. Authentication, email OTP, real inventory, order persistence, UPI payment verification, admin operations and secure customer data require a backend.

For a real deployment, connect `apps-script/Code.gs` or a GCP API and replace localStorage calls with fetch() calls.

## Suggested production workflow

Customer
  -> Home
  -> Search/category
  -> Product
  -> Add to cart
  -> Cart
  -> Login/register
  -> Delivery address
  -> Payment selection
  -> Payment/UPI handoff
  -> Order confirmation
  -> Orders/tracking

Admin/backend
  -> Products
  -> Inventory
  -> Orders
  -> Customers
  -> Delivery status
  -> Payment reconciliation

## UI/UX requirements covered

- Responsive desktop/tablet/mobile layouts
- Sticky desktop header
- Mobile bottom navigation
- Clear CTA buttons
- Large touch targets
- Cart badge
- Empty states
- Checkout summary
- Address capture
- Search and category filters
- Accessible form labels
- Minimal dependency footprint

## Production security

Do not implement password verification, OTP verification, UPI signature validation or payment confirmation only in browser JavaScript. Those must be handled server-side.


## Cart vs Buy Now workflow

The frontend now uses two separate localStorage concepts:

- `km_cart` — persistent shopping cart. Products added with **Add to Cart** live here.
- `km_buy_now` — temporary Buy Now checkout session. It contains only the selected product and quantity and is never added to `km_cart`.

### Expected behavior

1. Add Product A and Product B to Cart.
2. Open Product C and click **Buy Now**.
3. Checkout shows **Product C only**.
4. Place the Buy Now order.
5. Products A and B remain in the cart.
6. Open Cart and click **Proceed to Checkout** to buy A and B later.

Delivery:
- subtotal of ₹199 or more → FREE
- subtotal below ₹199 → ₹25

The same delivery rule is used for Cart checkout and Buy Now checkout. The API
recalculates the item prices and delivery charge from the database.

At checkout, **Use my current location** asks for browser location permission,
shows the selected point on Google Maps, and adds a Google Maps link to the
delivery address. Browser geolocation requires HTTPS or localhost; customers
can always enter their address manually.

The Orders page shows each order's progress and a Google Maps route from the
store to the delivery address. Customers can open or share that route. Admins
can update order status and edit the store location used as the route origin.

Product cards show inline plus/minus controls after an item is added to the
cart. Each newly placed order can be cancelled from the Orders page for two
minutes; cancellation is verified and time-limited by the backend.


## Authentication validation

Login (shared by admin and customers) and Registration validate email addresses on the client and server.

Password policy:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special symbol

Admin login requires backend environment variables. Copy `backend/.env.example` to `backend/.env` and set your real credentials. Never commit `.env`.

The frontend customer login now uses email + password. Customer registration still collects a phone number and validates it as a 10-digit Indian mobile number.

Admin authentication is intentionally handled by the backend rather than hard-coded in frontend JavaScript.
After customer login, the app returns to **Home**. The bottom navigation provides
**Home**, **Orders**, **Cart**, and **Profile**. Checkout pre-fills name, phone,
and email from the signed-in account; those details remain editable, and the
delivery address can be entered or edited for each order. Admins use the same
login form; successful admin credentials open the Admin dashboard.
The Contact page currently displays the store number `91+ 0000000000`.

In the Admin dashboard, select a product's **Edit** button to update its
details. The product photo input opens the rear camera on supported phones or
lets you choose an image; the browser resizes photos before saving.
