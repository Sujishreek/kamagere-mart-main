# kamagere_mart

## Admin & stock

- Sign in with `ADMIN_EMAIL` / `ADMIN_PASSWORD` (see `backend/.env.example`). The admin can open every page (Home, Cart, Orders, Profile) and gets an extra **Admin** tab with the dashboard.
- **Stock**: every product has a stock count (new database: 20 each). Each order reduces it automatically (20 → 19 …), and cancelling an order within the 2-minute window gives the stock back.
- When a product reaches 0 it shows **Sold out / Product not available** on the storefront (no Add to Cart / Buy Now) and **Sold out** in the admin list.
- Admin dashboard: add products (with a stock quantity), edit, **Update stock** (restock), **Remove**, **Restore default products** (puts back any removed built-in products), and **Refresh data**.
- Products are only seeded into an empty database, so a product removed by the admin stays removed after a restart.
- Existing databases are upgraded automatically (a `stock` column with default 20 is added).

## Admin sign-in, Home tools and browser support

- **Stays signed in**: the admin sign-in is saved in the browser (valid 12 hours), so pressing Home, opening a new tab or refreshing never signs the admin out. It ends only with **Logout** (bar at the top of every page, Dashboard, or Profile) or when it expires. Signing out in one tab signs out the other tabs too.
- **One login page for everyone**: the admin and customers use the same Login form. Enter the admin email/password (`ADMIN_EMAIL` / `ADMIN_PASSWORD`) and you land on the Admin dashboard; any other registered customer lands on the store. Old `/#admin-login` links open this same login.
- **Admin tools on Home**: when the admin is signed in, every product card shows its stock, a **Remove** button, and editable **Pack size** and **Stock** with one Save button.
- **Kannada**: the dashboard, Home tools and their messages follow the English / ಕನ್ನಡ switch.
- **Browsers**: written for current Chrome, Edge, Firefox and Safari (including iPhone / Android phones); needs Chrome/Edge 80+, Firefox 78+, Safari/iOS 13.4+. Flexbox `gap` needs Chrome/Edge 84+, Firefox 63+, Safari/iOS 14.1+. Voice search works only in browsers that support speech recognition (Chrome, Edge, Safari); others show a message.
