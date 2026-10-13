# Backend database

The backend uses the local `app.db` SQLite file by default. To use Cloud SQL
for MySQL, set `INSTANCE_CONNECTION_NAME`, `DB_USER`, `DB_PASSWORD`, and
`DB_NAME`. On Cloud Run, attach the Cloud SQL instance to the service and store
`DB_PASSWORD` in Secret Manager rather than in a checked-in environment file.
Admin login issues a twelve-hour JWT, and the orders API requires that admin
token. Configure `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_JWT_SECRET`; keep
the password and signing secret in Secret Manager when deployed.
Set `ADMIN_EMAIL` to `admin@gmail.com` and configure the requested password as
the `ADMIN_PASSWORD` secret on the deployed backend. There is a single login form for admin and customers: `POST /api/login` checks the
admin credentials first and returns `role: "admin"` with an admin token, otherwise
it signs in a customer (`role: "customer"`). `POST /api/admin/login` is still
available for API clients. Redeploy the backend with these environment
values before using an existing deployed link.
Google sign-in requires a Google OAuth web client ID in `GOOGLE_CLIENT_ID`.
Create a Web application OAuth client in Google Cloud Console and add each app
hostname (including `http://localhost:5000`) as an authorized JavaScript origin.
Set the client ID in the backend environment and restart/redeploy the backend.
Google ID tokens are verified by the backend; Google-only accounts are created
without a phone number; checkout asks for a contact number when it is needed.
The client ID is currently not configured in the local backend, so Google
sign-in cannot complete until a valid ID and authorized origins are supplied.
Authenticated admins can add products from the Admin dashboard. Products are
stored in the `products` table and served by `/api/products`. The Admin product
form stores product details as entered. When a customer selects Kannada, the
backend translates product names and descriptions with Google Cloud Translation
and caches the results in `product_translation_cache`, so unchanged text is
only translated once. This sends product text to Google Cloud and incurs charges
under the project's Cloud Translation pricing.

Enable the Cloud Translation API, configure billing, and grant the backend's
runtime service account `roles/cloudtranslate.user` in the Google Cloud project.
For local development, set `GOOGLE_CLOUD_PROJECT` and configure Application
Default Credentials with `gcloud auth application-default login`. The Admin
form remains unchanged; newly added or edited product text is translated
automatically the next time the storefront is viewed in Kannada.
Admins can also select a product to edit and update its details. The product
photo input can open a mobile device's rear camera or select an image; images
are resized in the browser before being saved in the product record.
Orders of ₹199 or more have free delivery; orders below ₹199 have a ₹25 delivery fee.
The order API calculates item prices and delivery fees from the database rather
than trusting totals submitted by the browser.
Orders also store the customer name, phone, and email supplied at checkout,
alongside the delivery address.
Customers can edit their name, email, phone, and address from the profile page,
and upload a square-cropped, resized JPEG profile photo. Profile updates require
a customer login token and enforce unique email/phone values.

For a one-time migration of a local SQLite database, start the Cloud SQL Auth
Proxy on port 3307 and run `node migrate-sqlite-to-cloudsql.js` with
`DB_PASSWORD` set. The migration stops if either Cloud SQL table is nonempty,
so it will not silently merge or overwrite existing records.

Orders can be cancelled using their per-order token for two minutes after
placement. The backend stores only the token hash and rejects cancellation
after the deadline or after an order has already changed status.
Each new order also has a private tracking token. The Orders page displays its
progress and refreshes the status automatically; admins can advance an order
from Confirmed to Preparing, Out for delivery, and Delivered in the dashboard.
The backend stores only the tracking-token hash and prevents status rollback.
The admin dashboard can edit the store address used as the starting point for
customer Google Maps directions; it defaults to Koramangala, Bengaluru.
Customers can open or share the route from that store address to the delivery
address. The route is a Google Maps directions link, not live driver GPS.

## Cloud Run container

The repository-root `Dockerfile` builds the frontend and backend together on
Node.js 22. Build from the repository root so the backend can serve
`E-commerce_frontend`. For production, configure Cloud Run with the Cloud SQL
instance connection name, database name, and Secret Manager references for
`DB_USER`, `DB_PASSWORD`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and
`ADMIN_JWT_SECRET`. Grant the Cloud Run service identity Cloud SQL Client, Secret Manager Secret
Accessor, and Cloud Translation API User roles. Keep SQLite for local development only;
Cloud Run instances do not provide durable local storage.
