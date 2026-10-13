require("dotenv").config({ path: require("path").join(__dirname, ".env") });
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");
const mysql = require("mysql2/promise");
const { GoogleAuth, OAuth2Client } = require("google-auth-library");
const PRODUCTS = require("./product");

const app = express();
const googleAuthClient = new OAuth2Client();
const translationAuth = new GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/cloud-platform"]
});
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLOUD_PROJECT = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || "";
const frontendCandidates = [
    path.join(__dirname, "..", "E-commerce_frontend"),
    path.join(__dirname, "E-commerce_frontend"),
    __dirname
];
const frontendDir = frontendCandidates.find((dir) => fs.existsSync(path.join(dir, "index.html"))) || path.join(__dirname, "E-commerce_frontend");
const DB_PATH = path.join(__dirname, "app.db");
const DEFAULT_STORE_LOCATION = "Koramangala, Bengaluru, Karnataka, India";
const DEFAULT_STOCK = 20;
const MAX_STOCK = 1000000;
const useCloudSql = Boolean(process.env.INSTANCE_CONNECTION_NAME || process.env.DB_HOST);
const db = useCloudSql
    ? mysql.createPool({
        socketPath: process.env.INSTANCE_CONNECTION_NAME
            ? `/cloudsql/${process.env.INSTANCE_CONNECTION_NAME}`
            : undefined,
        host: process.env.DB_HOST || undefined,
        port: Number(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || "kamagere_app",
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || "kamagere_mart",
        waitForConnections: true,
        connectionLimit: 5,
        queueLimit: 0
    })
    : new DatabaseSync(DB_PATH);

app.use(cors());
app.use(express.json({ limit: "128kb" }));
app.use(express.static(frontendDir));

// ===============================
// Validation helpers
// ===============================

const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])\S{8,}$/;
const PHONE_REGEX = /^[6-9]\d{9}$/;

function validEmail(email) {
    return EMAIL_REGEX.test(String(email || "").trim());
}

function validPassword(password) {
    return PASSWORD_REGEX.test(String(password || ""));
}

function validPhone(phone) {
    return PHONE_REGEX.test(String(phone || "").trim());
}



// ===============================
// Database helpers
// ===============================

async function runDb(query, params = []) {
    if (useCloudSql) {
        const [result] = await db.execute(query, params);
        return {
            lastID: result.insertId ?? null,
            changes: result.affectedRows ?? 0
        };
    }

    const result = db.prepare(query).run(...params);
    return {
        lastID: result.lastInsertRowid ?? null,
        changes: result.changes ?? 0
    };
}

async function getDb(query, params = []) {
    if (useCloudSql) {
        const [rows] = await db.execute(query, params);
        return rows[0] || null;
    }

    return db.prepare(query).get(...params) || null;
}

async function allDb(query, params = []) {
    if (useCloudSql) {
        const [rows] = await db.execute(query, params);
        return rows;
    }

    return db.prepare(query).all(...params) || [];
}

async function translateToKannada(texts) {
    const projectId = GOOGLE_CLOUD_PROJECT || await translationAuth.getProjectId();
    if (!projectId) {
        throw new Error("Google Cloud project is not configured for translation.");
    }

    const client = await translationAuth.getClient();
    const response = await client.request({
        url: `https://translation.googleapis.com/v3/projects/${encodeURIComponent(projectId)}/locations/global:translateText`,
        method: "POST",
        data: {
            contents: texts,
            mimeType: "text/plain",
            sourceLanguageCode: "en",
            targetLanguageCode: "kn"
        },
        timeout: 15000
    });
    const translations = response.data?.translations;
    if (!Array.isArray(translations) || translations.length !== texts.length) {
        throw new Error("Google Cloud Translation returned an incomplete response.");
    }
    return translations.map((translation) => {
        if (typeof translation.translatedText !== "string" || !translation.translatedText.trim()) {
            throw new Error("Google Cloud Translation returned empty text.");
        }
        return translation.translatedText;
    });
}

function normalizeUserRow(row) {
    if (!row) return null;

    return {
        id: row.id,
        name: row.name,
        email: row.email,
        phone: row.phone,
        password: row.password,
        address: row.address || "",
        profileImage: row.profileImage || ""
    };
}

function normalizeOrderRow(row) {
    if (!row) return null;

    return {
        id: row.id,
        userId: row.userId,
        date: row.date,
        items: Array.isArray(row.items) ? row.items : JSON.parse(row.items || "[]"),
        subtotal: Number(row.subtotal || 0),
        delivery: Number(row.delivery || 0),
        total: Number(row.total || 0),
        customerName: row.customerName || "",
        customerPhone: row.customerPhone || "",
        customerEmail: row.customerEmail || "",
        address: row.address,
        payment: row.payment || "COD",
        status: row.status || "Confirmed",
        source: row.source || "Cart"
    };
}

function normalizeProductRow(row) {
    return {
        id: Number(row.id),
        name: row.name,
        category: row.category,
        unit: row.unit,
        price: Number(row.price),
        oldPrice: Number(row.oldPrice),
        discount: Number(row.discount),
        image: row.image,
        description: row.description,
        stock: Math.max(0, Number(row.stock ?? 0))
    };
}

// Checks the store admin's credentials (from environment variables).
// Returns { ok:true, token, email } on a match, { ok:false } on a mismatch and
// { configured:false } when the admin login has not been set up on the server.
function checkAdminCredentials(email, password) {
    const adminEmail = String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || "";
    const signingSecret = process.env.ADMIN_JWT_SECRET || "";
    if (!adminEmail || !adminPassword || !signingSecret) {
        return { ok: false, configured: false };
    }
    if (typeof email !== "string" || typeof password !== "string") {
        return { ok: false, configured: true };
    }
    const hash = (value) => crypto.createHash("sha256").update(value).digest();
    const emailMatches = crypto.timingSafeEqual(
        hash(email.trim().toLowerCase()),
        hash(adminEmail)
    );
    const passwordMatches = crypto.timingSafeEqual(hash(password), hash(adminPassword));
    if (!emailMatches || !passwordMatches) {
        return { ok: false, configured: true };
    }
    const token = jwt.sign(
        { email: adminEmail, role: "admin" },
        signingSecret,
        { expiresIn: "12h" }
    );
    return { ok: true, configured: true, token, email: adminEmail };
}

function createCustomerToken(user) {
    const signingSecret = process.env.ADMIN_JWT_SECRET;
    if (!signingSecret) {
        throw new Error("Customer authentication is not configured.");
    }
    return jwt.sign(
        { sub: String(user.id), role: "customer" },
        signingSecret,
        { expiresIn: "8h" }
    );
}

function requireCustomer(req, res, next) {
    const signingSecret = process.env.ADMIN_JWT_SECRET;
    const authorization = req.get("authorization") || "";
    const token = authorization.startsWith("Bearer ")
        ? authorization.slice(7)
        : "";
    if (!signingSecret || !token) {
        return res.status(401).json({ message: "Customer sign-in is required." });
    }

    try {
        const session = jwt.verify(token, signingSecret);
        if (
            typeof session !== "object" ||
            session.role !== "customer" ||
            !/^\d+$/.test(String(session.sub || ""))
        ) {
            return res.status(403).json({ message: "Customer access is required." });
        }
        req.customerId = Number(session.sub);
        next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({ message: "Customer session is invalid or expired." });
        }
        console.error("Customer token verification error:", error);
        return res.status(500).json({ message: "Unable to verify customer session." });
    }
}

function productArt(label) {
    const safeLabel = String(label)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><rect width="800" height="600" rx="42" fill="#16a34a"/><circle cx="150" cy="120" r="80" fill="#ffffff" fill-opacity=".2"/><circle cx="650" cy="420" r="140" fill="#ffffff" fill-opacity=".12"/><text x="400" y="300" text-anchor="middle" font-family="Arial,sans-serif" font-size="38" font-weight="700" fill="#fff">${safeLabel}</text></svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function validateProductInput(body) {
    const { name, category, unit, price, oldPrice, description, image, stock } = body;
    const normalizedName = String(name || "").trim();
    const normalizedCategory = String(category || "").trim();
    const normalizedUnit = String(unit || "").trim();
    const normalizedDescription = String(description || "").trim();
    const numericPrice = Number(price);
    const numericOldPrice = oldPrice === "" || oldPrice == null
        ? numericPrice
        : Number(oldPrice);
    const normalizedImage = String(image || "").trim();

    if (!normalizedName || !normalizedCategory || !normalizedUnit || !normalizedDescription) {
        return { error: "Name, category, unit, price, and description are required." };
    }
    if (normalizedName.length > 255 || normalizedCategory.length > 100 || normalizedUnit.length > 100 || normalizedDescription.length > 2000) {
        return { error: "One or more product fields exceed the allowed length." };
    }
    if (!Number.isFinite(numericPrice) || numericPrice <= 0 || numericPrice > 10000000) {
        return { error: "Enter a valid product price greater than zero." };
    }
    if (!Number.isFinite(numericOldPrice) || numericOldPrice < numericPrice || numericOldPrice > 10000000) {
        return { error: "MRP must be equal to or greater than the selling price." };
    }
    if (normalizedImage.startsWith("data:")) {
        if (
            normalizedImage.length > 60000 ||
            !/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(normalizedImage)
        ) {
            return { error: "Captured product photos must be JPEG images smaller than 60 KB." };
        }
    } else if (normalizedImage) {
        let parsedImage;
        try {
            parsedImage = new URL(normalizedImage);
        } catch {
            return { error: "Product image must be a valid HTTPS image URL." };
        }
        if (parsedImage.protocol !== "https:") {
            return { error: "Product image must use HTTPS." };
        }
    }

    let normalizedStock = null;
    if (stock !== "" && stock != null) {
        normalizedStock = Number(stock);
        if (!Number.isSafeInteger(normalizedStock) || normalizedStock < 0 || normalizedStock > MAX_STOCK) {
            return { error: "Stock must be a whole number between 0 and " + MAX_STOCK + "." };
        }
    }

    const discount = Math.round((1 - numericPrice / numericOldPrice) * 100);
    return {
        product: {
            name: normalizedName,
            category: normalizedCategory,
            unit: normalizedUnit,
            price: numericPrice,
            oldPrice: numericOldPrice,
            discount,
            image: normalizedImage,
            description: normalizedDescription,
            stock: normalizedStock
        }
    };
}

// Insert the built-in catalogue (product.js). With onlyIfEmpty the catalogue is
// only seeded into a brand-new database, so products an admin removed stay removed
// after a restart. Without it, any default product that is missing is put back.
async function seedDefaultProducts({ onlyIfEmpty = false } = {}) {
    if (onlyIfEmpty) {
        const existing = await getDb("SELECT COUNT(*) AS total FROM products");
        if (Number(existing?.total || 0) > 0) return 0;
    }

    let restored = 0;
    for (const product of PRODUCTS) {
        const sameName = await getDb("SELECT id FROM products WHERE name = ?", [product.name]);
        if (sameName) continue;

        const idTaken = await getDb("SELECT id FROM products WHERE id = ?", [product.id]);
        const columns = ["name", "category", "unit", "price", "oldPrice", "discount", "image", "description", "stock"];
        const values = [
            product.name,
            product.category,
            product.unit,
            product.price,
            product.oldPrice,
            product.discount,
            product.image,
            product.description,
            DEFAULT_STOCK
        ];
        if (!idTaken) {
            columns.unshift("id");
            values.unshift(product.id);
        }
        await runDb(
            `INSERT INTO products (${columns.join(", ")}) VALUES (${columns.map(() => "?").join(", ")})`,
            values
        );
        restored += 1;
    }
    return restored;
}

// Give stock back (failed order or cancelled order)
async function releaseStock(items) {
    for (const item of items) {
        try {
            await runDb(
                "UPDATE products SET stock = stock + ? WHERE id = ?",
                [Number(item.quantity) || 0, Number(item.id)]
            );
        } catch (error) {
            console.error("Release Stock Error:", error);
        }
    }
}

async function initializeDatabase() {
    if (useCloudSql) {
        await db.query(`
            CREATE TABLE IF NOT EXISTS users (
                id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(254) NOT NULL UNIQUE,
                phone VARCHAR(20) NULL UNIQUE,
                password VARCHAR(255) NULL,
                address TEXT NOT NULL,
                profileImage MEDIUMTEXT NULL
            ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
        `);
        await db.query("ALTER TABLE users MODIFY phone VARCHAR(20) NULL, MODIFY password VARCHAR(255) NULL");
        const [userColumns] = await db.query("SHOW COLUMNS FROM users");
        if (!userColumns.some((column) => column.Field === "profileImage")) {
            await db.query("ALTER TABLE users ADD COLUMN profileImage MEDIUMTEXT NULL");
        }
        await db.query(`
            CREATE TABLE IF NOT EXISTS orders (
                id VARCHAR(32) NOT NULL PRIMARY KEY,
                userId BIGINT UNSIGNED NULL,
                date VARCHAR(64) NOT NULL,
                items LONGTEXT NOT NULL,
                subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0,
                delivery DECIMAL(12, 2) NOT NULL DEFAULT 0,
                total DECIMAL(12, 2) NOT NULL DEFAULT 0,
                customerName VARCHAR(255) NULL,
                customerPhone VARCHAR(20) NULL,
                customerEmail VARCHAR(254) NULL,
                address TEXT NOT NULL,
                payment VARCHAR(64) NOT NULL DEFAULT 'COD',
                status VARCHAR(64) NOT NULL DEFAULT 'Confirmed',
                source VARCHAR(64) NOT NULL DEFAULT 'Cart',
                createdAt BIGINT NULL,
                cancelTokenHash CHAR(64) NULL,
                trackingTokenHash CHAR(64) NULL,
                INDEX orders_user_id (userId)
            ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
        `);
        const [orderColumns] = await db.query("SHOW COLUMNS FROM orders");
        const orderColumnNames = new Set(orderColumns.map((column) => column.Field));
        if (!orderColumnNames.has("createdAt")) {
            await db.query("ALTER TABLE orders ADD COLUMN createdAt BIGINT NULL");
        }
        if (!orderColumnNames.has("cancelTokenHash")) {
            await db.query("ALTER TABLE orders ADD COLUMN cancelTokenHash CHAR(64) NULL");
        }
        if (!orderColumnNames.has("trackingTokenHash")) {
            await db.query("ALTER TABLE orders ADD COLUMN trackingTokenHash CHAR(64) NULL");
        }
        for (const [column, definition] of [
            ["customerName", "VARCHAR(255) NULL"],
            ["customerPhone", "VARCHAR(20) NULL"],
            ["customerEmail", "VARCHAR(254) NULL"]
        ]) {
            if (!orderColumnNames.has(column)) {
                await db.query(`ALTER TABLE orders ADD COLUMN ${column} ${definition}`);
            }
        }
        await db.query(`
            CREATE TABLE IF NOT EXISTS products (
                id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                category VARCHAR(100) NOT NULL,
                unit VARCHAR(100) NOT NULL,
                price DECIMAL(12, 2) NOT NULL,
                oldPrice DECIMAL(12, 2) NOT NULL,
                discount INT NOT NULL DEFAULT 0,
                image TEXT NOT NULL,
                description TEXT NOT NULL,
                stock INT NOT NULL DEFAULT ${DEFAULT_STOCK}
            ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
        `);
        const [productColumns] = await db.query("SHOW COLUMNS FROM products");
        const productColumnNames = new Set(productColumns.map((column) => column.Field));
        if (!productColumnNames.has("stock")) {
            await db.query(`ALTER TABLE products ADD COLUMN stock INT NOT NULL DEFAULT ${DEFAULT_STOCK}`);
        }
        await db.query(`
            CREATE TABLE IF NOT EXISTS product_translation_cache (
                sourceHash CHAR(64) NOT NULL PRIMARY KEY,
                sourceText TEXT NOT NULL,
                translatedText TEXT NOT NULL
            ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
        `);
        await db.query(`
            CREATE TABLE IF NOT EXISTS app_settings (
                settingKey VARCHAR(100) NOT NULL PRIMARY KEY,
                settingValue TEXT NOT NULL
            ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
        `);
        await db.execute(
            "INSERT IGNORE INTO app_settings (settingKey, settingValue) VALUES (?, ?)",
            ["store_location", DEFAULT_STORE_LOCATION]
        );
        await seedDefaultProducts({ onlyIfEmpty: true });
        return;
    }

    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            phone TEXT UNIQUE,
            password TEXT,
            address TEXT DEFAULT '',
            profileImage TEXT
        );

        CREATE TABLE IF NOT EXISTS orders (
            id TEXT PRIMARY KEY,
            userId INTEGER,
            date TEXT NOT NULL,
            items TEXT NOT NULL,
            subtotal REAL NOT NULL DEFAULT 0,
            delivery REAL NOT NULL DEFAULT 0,
            total REAL NOT NULL DEFAULT 0,
            customerName TEXT,
            customerPhone TEXT,
            customerEmail TEXT,
            address TEXT NOT NULL,
            payment TEXT NOT NULL DEFAULT 'COD',
            status TEXT NOT NULL DEFAULT 'Confirmed',
            source TEXT NOT NULL DEFAULT 'Cart',
            createdAt INTEGER,
            cancelTokenHash TEXT,
            trackingTokenHash TEXT
        );

        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            unit TEXT NOT NULL,
            price REAL NOT NULL,
            oldPrice REAL NOT NULL,
            discount INTEGER NOT NULL DEFAULT 0,
            image TEXT NOT NULL,
            description TEXT NOT NULL,
            stock INTEGER NOT NULL DEFAULT ${DEFAULT_STOCK}
        );

        CREATE TABLE IF NOT EXISTS app_settings (
            settingKey TEXT PRIMARY KEY,
            settingValue TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS product_translation_cache (
            sourceHash TEXT PRIMARY KEY,
            sourceText TEXT NOT NULL,
            translatedText TEXT NOT NULL
        );
    `);
    db.prepare(
        "INSERT OR IGNORE INTO app_settings (settingKey, settingValue) VALUES (?, ?)"
    ).run("store_location", DEFAULT_STORE_LOCATION);

    const sqliteUserColumns = db.prepare("PRAGMA table_info(users)").all();
    if (sqliteUserColumns.some((column) => ["phone", "password"].includes(column.name) && column.notnull)) {
        db.exec(`
            BEGIN;
            ALTER TABLE users RENAME TO users_legacy;
            CREATE TABLE users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                phone TEXT UNIQUE,
                password TEXT,
                address TEXT DEFAULT '',
                profileImage TEXT
            );
            INSERT INTO users (id, name, email, phone, password, address)
            SELECT id, name, email, phone, password, address FROM users_legacy;
            DROP TABLE users_legacy;
            COMMIT;
        `);
    }
    const currentUserColumns = new Set(
        db.prepare("PRAGMA table_info(users)").all().map((column) => column.name)
    );
    if (!currentUserColumns.has("profileImage")) {
        db.exec("ALTER TABLE users ADD COLUMN profileImage TEXT");
    }

    const sqliteProductColumns = new Set(
        db.prepare("PRAGMA table_info(products)").all().map((column) => column.name)
    );
    if (!sqliteProductColumns.has("stock")) {
        db.exec(`ALTER TABLE products ADD COLUMN stock INTEGER NOT NULL DEFAULT ${DEFAULT_STOCK}`);
    }

    const sqliteOrderColumns = new Set(
        db.prepare("PRAGMA table_info(orders)").all().map((column) => column.name)
    );
    if (!sqliteOrderColumns.has("createdAt")) {
        db.exec("ALTER TABLE orders ADD COLUMN createdAt INTEGER");
    }
    if (!sqliteOrderColumns.has("cancelTokenHash")) {
        db.exec("ALTER TABLE orders ADD COLUMN cancelTokenHash TEXT");
    }
    if (!sqliteOrderColumns.has("trackingTokenHash")) {
        db.exec("ALTER TABLE orders ADD COLUMN trackingTokenHash TEXT");
    }
    for (const column of ["customerName", "customerPhone", "customerEmail"]) {
        if (!sqliteOrderColumns.has(column)) {
            db.exec(`ALTER TABLE orders ADD COLUMN ${column} TEXT`);
        }
    }

    await seedDefaultProducts({ onlyIfEmpty: true });
}


// ===============================
// Home API
// ===============================

app.get("/", (req, res) => {
    res.sendFile(path.join(frontendDir, "index.html"));
});

app.get("/health", (req, res) => {
    res.json({
        status: "ok",
        service: "Kamagere Mart Backend"
    });
});


// ===============================
// Products API
// ===============================

app.get("/api/products", async (req, res) => {
    try {
        const rows = await allDb("SELECT * FROM products ORDER BY id");
        res.json(rows.map(normalizeProductRow));
    } catch (error) {
        console.error("Get Products Error:", error);
        res.status(500).json({
            message: "Unable to load products."
        });
    }
});

app.post("/api/product-translations", async (req, res) => {
    try {
        const suppliedIds = req.body?.productIds;
        if (
            !Array.isArray(suppliedIds) ||
            suppliedIds.length < 1 ||
            suppliedIds.length > 10 ||
            suppliedIds.some((id) => !Number.isSafeInteger(Number(id)) || Number(id) <= 0)
        ) {
            return res.status(400).json({ message: "Request between 1 and 10 valid product IDs." });
        }

        const productIds = [...new Set(suppliedIds.map(Number))];
        const placeholders = productIds.map(() => "?").join(", ");
        const products = await allDb(
            `SELECT id, name, description FROM products WHERE id IN (${placeholders})`,
            productIds
        );
        if (products.length !== productIds.length) {
            return res.status(404).json({ message: "One or more products were not found." });
        }

        const textsByHash = new Map();
        for (const product of products) {
            for (const sourceText of [product.name, product.description]) {
                const sourceHash = crypto.createHash("sha256").update(sourceText).digest("hex");
                textsByHash.set(sourceHash, sourceText);
            }
        }

        const hashes = [...textsByHash.keys()];
        const cachedRows = await allDb(
            `SELECT sourceHash, sourceText, translatedText
             FROM product_translation_cache WHERE sourceHash IN (${hashes.map(() => "?").join(", ")})`,
            hashes
        );
        const translationsByHash = new Map(
            cachedRows.map((row) => [row.sourceHash, row.translatedText])
        );
        const untranslated = hashes.filter((hash) =>
            !translationsByHash.has(hash) ||
            cachedRows.find((row) => row.sourceHash === hash)?.sourceText !== textsByHash.get(hash)
        );

        for (let offset = 0; offset < untranslated.length; offset += 20) {
            const batchHashes = untranslated.slice(offset, offset + 20);
            const batchTexts = batchHashes.map((hash) => textsByHash.get(hash));
            const translatedTexts = await translateToKannada(batchTexts);
            for (let index = 0; index < batchHashes.length; index += 1) {
                const sourceHash = batchHashes[index];
                const sourceText = batchTexts[index];
                const translatedText = translatedTexts[index];
                const insert = useCloudSql
                    ? `INSERT INTO product_translation_cache (sourceHash, sourceText, translatedText)
                       VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE
                       sourceText = VALUES(sourceText), translatedText = VALUES(translatedText)`
                    : `INSERT OR REPLACE INTO product_translation_cache
                       (sourceHash, sourceText, translatedText) VALUES (?, ?, ?)`;
                await runDb(insert, [sourceHash, sourceText, translatedText]);
                translationsByHash.set(sourceHash, translatedText);
            }
        }

        res.json({
            translations: products.map((product) => {
                const nameHash = crypto.createHash("sha256").update(product.name).digest("hex");
                const descriptionHash = crypto.createHash("sha256").update(product.description).digest("hex");
                return {
                    id: Number(product.id),
                    name: translationsByHash.get(nameHash),
                    description: translationsByHash.get(descriptionHash)
                };
            })
        });
    } catch (error) {
        console.error("Product Translation Error:", error);
        res.status(503).json({
            message: "Automatic Kannada translation is unavailable. Check Google Cloud Translation API setup."
        });
    }
});

app.post("/api/products", requireAdmin, async (req, res) => {
    try {
        const validation = validateProductInput(req.body);
        if (validation.error) {
            return res.status(400).json({ message: validation.error });
        }
        const product = {
            ...validation.product,
            image: validation.product.image || productArt(validation.product.name)
        };
        const insert = await runDb(
            `INSERT INTO products
                (name, category, unit, price, oldPrice, discount, image, description, stock)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                product.name,
                product.category,
                product.unit,
                product.price,
                product.oldPrice,
                product.discount,
                product.image,
                product.description,
                product.stock ?? DEFAULT_STOCK
            ]
        );
        const created = await getDb("SELECT * FROM products WHERE id = ?", [insert.lastID]);
        res.status(201).json({
            message: "Product added successfully.",
            product: normalizeProductRow(created)
        });
    } catch (error) {
        console.error("Create Product Error:", error);
        res.status(500).json({
            message: "Unable to add product."
        });
    }
});

app.put("/api/products/:id", requireAdmin, async (req, res) => {
    try {
        const productId = Number(req.params.id);
        if (!Number.isSafeInteger(productId) || productId <= 0) {
            return res.status(400).json({ message: "Invalid product ID." });
        }

        const existing = await getDb("SELECT id, image, stock FROM products WHERE id = ?", [productId]);
        if (!existing) {
            return res.status(404).json({ message: "Product not found." });
        }

        const validation = validateProductInput(req.body);
        if (validation.error) {
            return res.status(400).json({ message: validation.error });
        }
        const product = {
            ...validation.product,
            image: validation.product.image || existing.image || productArt(validation.product.name)
        };

        await runDb(
            `UPDATE products
             SET name = ?, category = ?, unit = ?, price = ?, oldPrice = ?, discount = ?, image = ?, description = ?, stock = ?
             WHERE id = ?`,
            [
                product.name,
                product.category,
                product.unit,
                product.price,
                product.oldPrice,
                product.discount,
                product.image,
                product.description,
                product.stock ?? Number(existing.stock ?? 0),
                productId
            ]
        );
        const updated = await getDb("SELECT * FROM products WHERE id = ?", [productId]);
        res.json({
            message: "Product updated successfully.",
            product: normalizeProductRow(updated)
        });
    } catch (error) {
        console.error("Update Product Error:", error);
        res.status(500).json({
            message: "Unable to update product."
        });
    }
});

// Set the available quantity of one product (admin "restock" / manual correction)
app.patch("/api/products/:id/stock", requireAdmin, async (req, res) => {
    try {
        const productId = Number(req.params.id);
        const stock = Number(req.body?.stock);
        if (!Number.isSafeInteger(productId) || productId <= 0) {
            return res.status(400).json({ message: "Invalid product ID." });
        }
        if (req.body?.stock === "" || req.body?.stock == null || !Number.isSafeInteger(stock) || stock < 0 || stock > MAX_STOCK) {
            return res.status(400).json({ message: "Stock must be a whole number between 0 and " + MAX_STOCK + "." });
        }
        const result = await runDb("UPDATE products SET stock = ? WHERE id = ?", [stock, productId]);
        const updated = await getDb("SELECT * FROM products WHERE id = ?", [productId]);
        if (!updated) {
            return res.status(404).json({ message: "Product not found." });
        }
        res.json({ message: "Stock updated.", product: normalizeProductRow(updated), changed: result.changes });
    } catch (error) {
        console.error("Update Stock Error:", error);
        res.status(500).json({ message: "Unable to update stock." });
    }
});

// Quick edit from the storefront: change the pack size (unit) and/or the stock
app.patch("/api/products/:id", requireAdmin, async (req, res) => {
    try {
        const productId = Number(req.params.id);
        if (!Number.isSafeInteger(productId) || productId <= 0) {
            return res.status(400).json({ message: "Invalid product ID." });
        }
        const existing = await getDb("SELECT id FROM products WHERE id = ?", [productId]);
        if (!existing) {
            return res.status(404).json({ message: "Product not found." });
        }

        const updates = [];
        const values = [];
        if (req.body?.unit !== undefined) {
            const unit = String(req.body.unit || "").trim();
            if (!unit || unit.length > 100) {
                return res.status(400).json({ message: "Enter a pack size (up to 100 characters)." });
            }
            updates.push("unit = ?");
            values.push(unit);
        }
        if (req.body?.stock !== undefined) {
            const stock = Number(req.body.stock);
            if (req.body.stock === "" || req.body.stock === null || !Number.isSafeInteger(stock) || stock < 0 || stock > MAX_STOCK) {
                return res.status(400).json({ message: "Stock must be a whole number between 0 and " + MAX_STOCK + "." });
            }
            updates.push("stock = ?");
            values.push(stock);
        }
        if (!updates.length) {
            return res.status(400).json({ message: "Nothing to update." });
        }

        await runDb(`UPDATE products SET ${updates.join(", ")} WHERE id = ?`, [...values, productId]);
        const updated = await getDb("SELECT * FROM products WHERE id = ?", [productId]);
        res.json({ message: "Product updated.", product: normalizeProductRow(updated) });
    } catch (error) {
        console.error("Quick Update Product Error:", error);
        res.status(500).json({ message: "Unable to update product." });
    }
});

// Remove a product from the store
app.delete("/api/products/:id", requireAdmin, async (req, res) => {
    try {
        const productId = Number(req.params.id);
        if (!Number.isSafeInteger(productId) || productId <= 0) {
            return res.status(400).json({ message: "Invalid product ID." });
        }
        const result = await runDb("DELETE FROM products WHERE id = ?", [productId]);
        if (result.changes !== 1) {
            return res.status(404).json({ message: "Product not found." });
        }
        res.json({ message: "Product removed.", id: productId });
    } catch (error) {
        console.error("Delete Product Error:", error);
        res.status(500).json({ message: "Unable to remove product." });
    }
});

// Put back any built-in products that were removed (each comes back with default stock)
app.post("/api/admin/products/restore-defaults", requireAdmin, async (req, res) => {
    try {
        const restored = await seedDefaultProducts();
        res.json({
            message: restored
                ? restored + " default product" + (restored === 1 ? "" : "s") + " restored."
                : "All default products are already in the store.",
            restored
        });
    } catch (error) {
        console.error("Restore Products Error:", error);
        res.status(500).json({ message: "Unable to restore default products." });
    }
});


// ===============================
// Register API
// ===============================

app.get("/api/auth/google/config", (req, res) => {
    res.json({ clientId: GOOGLE_CLIENT_ID || null });
});

app.get("/api/store-location", async (req, res) => {
    try {
        const setting = await getDb(
            "SELECT settingValue FROM app_settings WHERE settingKey = ?",
            ["store_location"]
        );
        res.json({ storeLocation: setting?.settingValue || DEFAULT_STORE_LOCATION });
    } catch (error) {
        console.error("Get Store Location Error:", error);
        res.status(500).json({ message: "Unable to load the store location." });
    }
});

app.put("/api/admin/store-location", requireAdmin, async (req, res) => {
    try {
        const storeLocation = String(req.body?.storeLocation || "").trim();
        if (!storeLocation || storeLocation.length > 500) {
            return res.status(400).json({
                message: "Enter a store address up to 500 characters."
            });
        }

        if (useCloudSql) {
            await db.execute(
                `INSERT INTO app_settings (settingKey, settingValue) VALUES (?, ?)
                 ON DUPLICATE KEY UPDATE settingValue = VALUES(settingValue)`,
                ["store_location", storeLocation]
            );
        } else {
            db.prepare(
                `INSERT INTO app_settings (settingKey, settingValue) VALUES (?, ?)
                 ON CONFLICT(settingKey) DO UPDATE SET settingValue = excluded.settingValue`
            ).run("store_location", storeLocation);
        }

        return res.json({ message: "Store location updated.", storeLocation });
    } catch (error) {
        console.error("Update Store Location Error:", error);
        return res.status(500).json({ message: "Unable to update the store location." });
    }
});

app.post("/api/auth/google", async (req, res) => {
    if (!GOOGLE_CLIENT_ID) {
        return res.status(503).json({
            message: "Google sign-in is not configured. Set GOOGLE_CLIENT_ID on the server."
        });
    }

    const credential = String(req.body?.credential || "");
    if (!credential || credential.length > 12000) {
        return res.status(400).json({ message: "A valid Google credential is required." });
    }

    let googleUser;
    try {
        const ticket = await googleAuthClient.verifyIdToken({
            idToken: credential,
            audience: GOOGLE_CLIENT_ID
        });
        googleUser = ticket.getPayload();
    } catch (error) {
        console.error("Google credential verification error:", error);
        return res.status(401).json({ message: "Unable to verify your Google account." });
    }

    if (!googleUser?.sub || !googleUser.email || googleUser.email_verified !== true) {
        return res.status(401).json({ message: "Google did not provide a verified email address." });
    }

    try {
        let userRow = await getDb(
            "SELECT * FROM users WHERE LOWER(email) = LOWER(?)",
            [googleUser.email]
        );

        if (!userRow) {
            const name = String(googleUser.name || googleUser.email.split("@")[0]).slice(0, 255);
            const insertResult = await runDb(
                "INSERT INTO users (name, email, phone, password, address) VALUES (?, ?, NULL, NULL, ?)",
                [name, googleUser.email, ""]
            );
            userRow = await getDb("SELECT * FROM users WHERE id = ?", [insertResult.lastID]);
        }

        const user = normalizeUserRow(userRow);
        return res.json({
            message: "Google sign-in successful",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                address: user.address,
                profileImage: user.profileImage
            },
            token: createCustomerToken(user)
        });
    } catch (error) {
        console.error("Google account sign-in error:", error);
        return res.status(500).json({ message: "Unable to sign in with your Google account." });
    }
});

app.post("/api/register", async (req, res) => {
    try {
        const {
            name,
            email,
            phone,
            password,
            address
        } = req.body;
        const normalizedName = String(name || "").trim();
        const normalizedEmail = String(email || "").trim().toLowerCase();
        const normalizedPhone = String(phone || "").trim();

        if (!normalizedName || !normalizedEmail || !normalizedPhone || !password) {
            return res.status(400).json({
                message: "Please fill all required fields"
            });
        }

        if (!validEmail(normalizedEmail)) {
            return res.status(400).json({
                message: "Please enter a valid email address."
            });
        }

        if (!validPhone(normalizedPhone)) {
            return res.status(400).json({
                message: "Please enter a valid 10-digit Indian mobile number."
            });
        }

        if (!validPassword(password)) {
            return res.status(400).json({
                message: "Password must be at least 8 characters and contain uppercase, lowercase, number, and special symbol."
            });
        }

        const [existingEmail, existingPhone] = await Promise.all([
            getDb("SELECT id FROM users WHERE LOWER(email) = ?", [normalizedEmail]),
            getDb("SELECT id FROM users WHERE phone = ?", [normalizedPhone])
        ]);

        if (existingEmail || existingPhone) {
            const message = existingEmail && existingPhone
                ? "This email address and phone number are already registered."
                : existingEmail
                    ? "Email is already registered."
                    : "Phone number is already registered.";
            return res.status(409).json({
                message
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const insertResult = await runDb(
            "INSERT INTO users (name, email, phone, password, address) VALUES (?, ?, ?, ?, ?)",
            [normalizedName, normalizedEmail, normalizedPhone, hashedPassword, address || ""]
        );

        const user = normalizeUserRow(
            await getDb("SELECT * FROM users WHERE id = ?", [insertResult.lastID])
        );

        res.status(201).json({
            message: "Registration successful",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                address: user.address,
                profileImage: user.profileImage
            }
        });

    } catch (error) {
        const duplicateKey = String(error.code || "").toLowerCase() === "er_dup_entry"
            || String(error.message || "").includes("UNIQUE constraint failed: users.");
        if (duplicateKey) {
            const duplicateEmail = String(error.message || "").toLowerCase().includes("email");
            return res.status(409).json({
                message: duplicateEmail
                    ? "Email is already registered."
                    : "Phone number is already registered."
            });
        }

        console.error("Register Error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
});


// ===============================
// Customer Login API
// ===============================

app.post("/api/login", async (req, res) => {
    try {
        const {
            email,
            password
        } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required."
            });
        }

        if (!validEmail(email)) {
            return res.status(400).json({
                message: "Please enter a valid email address."
            });
        }

        // One login form for everyone: the admin's credentials are recognised first
        // and answered with an admin session; everybody else is a customer.
        const adminCheck = checkAdminCredentials(email, password);
        if (adminCheck.ok) {
            return res.json({
                message: "Admin login successful",
                role: "admin",
                token: adminCheck.token,
                admin: { email: adminCheck.email, role: "admin" }
            });
        }

        if (!validPassword(password)) {
            return res.status(400).json({
                message: "Password must be at least 8 characters and contain uppercase, lowercase, number, and special symbol."
            });
        }

        const userRow = await getDb(
            "SELECT * FROM users WHERE LOWER(email) = LOWER(?)",
            [email]
        );

        if (!userRow) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        const user = normalizeUserRow(userRow);
        const passwordMatch = Boolean(user.password) && await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        res.json({
            message: "Login successful",
            role: "customer",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                address: user.address,
                profileImage: user.profileImage
            },
            token: createCustomerToken(user)
        });

    } catch (error) {
        console.error("Login Error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
});

app.put("/api/profile", requireCustomer, async (req, res) => {
    try {
        const name = String(req.body?.name || "").trim();
        const email = String(req.body?.email || "").trim();
        const phone = String(req.body?.phone || "").trim();
        const address = String(req.body?.address || "").trim();
        const profileImage = String(req.body?.profileImage || "");

        if (!name || name.length > 255) {
            return res.status(400).json({ message: "Enter a name up to 255 characters." });
        }
        if (!validEmail(email)) {
            return res.status(400).json({ message: "Please enter a valid email address." });
        }
        if (!validPhone(phone)) {
            return res.status(400).json({ message: "Please enter a valid 10-digit Indian mobile number." });
        }
        if (address.length > 2000) {
            return res.status(400).json({ message: "Address must be 2,000 characters or fewer." });
        }
        if (
            profileImage.length > 100000 ||
            (profileImage && !/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(profileImage))
        ) {
            return res.status(400).json({ message: "Profile photos must be JPEG images smaller than 75 KB." });
        }

        const duplicate = await getDb(
            "SELECT id FROM users WHERE (LOWER(email) = LOWER(?) OR phone = ?) AND id != ?",
            [email, phone, req.customerId]
        );
        if (duplicate) {
            return res.status(409).json({ message: "That email address or phone number is already in use." });
        }

        const existing = await getDb("SELECT * FROM users WHERE id = ?", [req.customerId]);
        if (!existing) {
            return res.status(404).json({ message: "Customer account not found." });
        }

        await runDb(
            "UPDATE users SET name = ?, email = ?, phone = ?, address = ?, profileImage = ? WHERE id = ?",
            [name, email, phone, address, profileImage || existing.profileImage || "", req.customerId]
        );
        const updated = normalizeUserRow(await getDb("SELECT * FROM users WHERE id = ?", [req.customerId]));
        res.json({
            message: "Profile updated successfully.",
            user: {
                id: updated.id,
                name: updated.name,
                email: updated.email,
                phone: updated.phone,
                address: updated.address,
                profileImage: updated.profileImage
            }
        });
    } catch (error) {
        console.error("Profile Update Error:", error);
        res.status(500).json({ message: "Unable to update your profile." });
    }
});


// ===============================
// Admin Login API
// ===============================

function requireAdmin(req, res, next) {
    const signingSecret = process.env.ADMIN_JWT_SECRET;
    if (!signingSecret) {
        return res.status(503).json({
            message: "Admin authentication is not configured."
        });
    }

    const authorization = req.get("authorization") || "";
    const token = authorization.startsWith("Bearer ")
        ? authorization.slice(7)
        : "";
    if (!token) {
        return res.status(401).json({
            message: "Admin sign-in is required."
        });
    }

    try {
        const session = jwt.verify(token, signingSecret);
        if (typeof session !== "object" || session.role !== "admin") {
            return res.status(403).json({
                message: "Admin access is required."
            });
        }
        req.admin = session;
        next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({
                message: "Admin session is invalid or expired."
            });
        }
        console.error("Admin token verification error:", error);
        return res.status(500).json({
            message: "Unable to verify admin session."
        });
    }
}

// Lets the browser confirm a saved admin sign-in is still valid
app.get("/api/admin/session", requireAdmin, (req, res) => {
    res.json({
        admin: { email: req.admin.email, role: "admin" },
        expiresAt: req.admin.exp ? req.admin.exp * 1000 : null
    });
});

app.post("/api/admin/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Admin email and password are required."
            });
        }

        if (!validEmail(email)) {
            return res.status(400).json({
                message: "Please enter a valid admin email address."
            });
        }

        if (typeof password !== "string") {
            return res.status(400).json({
                message: "Admin email and password are required."
            });
        }

        const adminCheck = checkAdminCredentials(email, password);
        if (!adminCheck.configured) {
            return res.status(503).json({
                message: "Admin login is not configured."
            });
        }
        if (!adminCheck.ok) {
            return res.status(401).json({
                message: "Invalid admin email or password."
            });
        }
        const token = adminCheck.token;
        const adminEmail = adminCheck.email;

        res.json({
            message: "Admin login successful",
            token,
            admin: {
                email: adminEmail,
                role: "admin"
            }
        });

    } catch (error) {
        console.error("Admin Login Error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
});


// ===============================
// Orders API
// ===============================

app.post("/api/orders", async (req, res) => {
    try {
        const {
            userId,
            customerName,
            customerPhone,
            customerEmail,
            items,
            address,
            payment,
            source
        } = req.body;

        if (!Array.isArray(items) || !items.length) {
            return res.status(400).json({
                message: "No items in order"
            });
        }

        if (typeof address !== "string" || !address.trim()) {
            return res.status(400).json({
                message: "Delivery address is required"
            });
        }
        const normalizedCustomerName = String(customerName || "").trim();
        const normalizedCustomerPhone = String(customerPhone || "").trim();
        const normalizedCustomerEmail = String(customerEmail || "").trim();
        if (!normalizedCustomerName || normalizedCustomerName.length > 255) {
            return res.status(400).json({ message: "Enter a valid customer name." });
        }
        if (!validPhone(normalizedCustomerPhone)) {
            return res.status(400).json({ message: "Enter a valid 10-digit Indian mobile number." });
        }
        if (!validEmail(normalizedCustomerEmail)) {
            return res.status(400).json({ message: "Enter a valid email address." });
        }

        // Merge repeated lines for the same product so stock is checked against the total asked for
        const requested = new Map();
        for (const item of items) {
            const productId = Number(item?.id);
            const quantity = Number(item?.quantity);
            if (!Number.isSafeInteger(productId) || productId <= 0 || !Number.isSafeInteger(quantity) || quantity <= 0) {
                return res.status(400).json({
                    message: "Order contains an invalid product or quantity"
                });
            }
            requested.set(productId, (requested.get(productId) || 0) + quantity);
        }

        const pricedItems = [];
        for (const [productId, quantity] of requested) {
            const product = await getDb(
                "SELECT id, name, unit, price, stock FROM products WHERE id = ?",
                [productId]
            );
            if (!product) {
                return res.status(400).json({
                    message: "Order contains a product that is no longer available"
                });
            }
            const available = Math.max(0, Number(product.stock ?? 0));
            if (available <= 0) {
                return res.status(409).json({
                    message: `${product.name} is sold out.`
                });
            }
            if (quantity > available) {
                return res.status(409).json({
                    message: `Only ${available} of ${product.name} ${available === 1 ? "is" : "are"} available.`
                });
            }

            pricedItems.push({
                id: Number(product.id),
                name: product.name,
                price: Number(product.price),
                unit: product.unit,
                quantity
            });
        }

        const orderSubtotal = Math.round(
            (pricedItems.reduce((sum, item) => sum + item.price * item.quantity, 0) + Number.EPSILON) * 100
        ) / 100;
        const orderDelivery = orderSubtotal >= 199 ? 0 : 25;
        const createdAt = Date.now();
        const cancelToken = crypto.randomBytes(32).toString("hex");
        const cancelTokenHash = crypto.createHash("sha256").update(cancelToken).digest("hex");
        const trackingToken = crypto.randomBytes(32).toString("hex");
        const trackingTokenHash = crypto.createHash("sha256").update(trackingToken).digest("hex");
        const order = {
            id: "KM" + Date.now().toString().slice(-7),
            userId: userId || null,
            date: new Date().toLocaleString("en-IN"),
            createdAt,
            cancelToken,
            trackingToken,
            items: pricedItems,
            subtotal: orderSubtotal,
            delivery: orderDelivery,
            total: orderSubtotal + orderDelivery,
            customerName: normalizedCustomerName,
            customerPhone: normalizedCustomerPhone,
            customerEmail: normalizedCustomerEmail,
            address: address.trim(),
            payment: payment || "COD",
            status: "Confirmed",
            source: source === "Buy Now" ? "Buy Now" : "Cart"
        };

        // Take the stock first. The UPDATE only succeeds while enough is left, so two
        // customers buying the last item at once cannot both get it.
        const reservedItems = [];
        for (const item of pricedItems) {
            const reservation = await runDb(
                "UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?",
                [item.quantity, item.id, item.quantity]
            );
            if (reservation.changes !== 1) {
                await releaseStock(reservedItems);
                return res.status(409).json({
                    message: `${item.name} just sold out or has less stock than you asked for. Please review your cart.`
                });
            }
            reservedItems.push(item);
        }

        try {
            await runDb(
                `INSERT INTO orders (id, userId, date, items, subtotal, delivery, total, customerName, customerPhone, customerEmail, address, payment, status, source, createdAt, cancelTokenHash, trackingTokenHash)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    order.id,
                    order.userId,
                    order.date,
                    JSON.stringify(order.items),
                    order.subtotal,
                    order.delivery,
                    order.total,
                    order.customerName,
                    order.customerPhone,
                    order.customerEmail,
                    order.address,
                    order.payment,
                    order.status,
                    order.source,
                    order.createdAt,
                    cancelTokenHash,
                    trackingTokenHash
                ]
            );
        } catch (insertError) {
            await releaseStock(reservedItems);
            throw insertError;
        }

        res.status(201).json({
            message: "Order placed successfully",
            order
        });

    } catch (error) {
        console.error("Order Error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
});

app.get("/api/orders/:id/track", async (req, res) => {
    try {
        const orderId = String(req.params.id || "");
        const authorization = req.get("authorization") || "";
        const trackingToken = authorization.startsWith("Bearer ")
            ? authorization.slice(7)
            : "";
        if (!/^[a-f0-9]{64}$/i.test(trackingToken)) {
            return res.status(401).json({ message: "A valid order tracking token is required." });
        }

        const row = await getDb(
            "SELECT status, trackingTokenHash FROM orders WHERE id = ?",
            [orderId]
        );
        if (!row) {
            return res.status(404).json({ message: "Order not found." });
        }
        if (!row.trackingTokenHash || !/^[a-f0-9]{64}$/i.test(String(row.trackingTokenHash))) {
            return res.status(403).json({ message: "Tracking is unavailable for this order." });
        }

        const suppliedHash = crypto.createHash("sha256").update(trackingToken).digest();
        const storedHash = Buffer.from(String(row.trackingTokenHash), "hex");
        if (!crypto.timingSafeEqual(suppliedHash, storedHash)) {
            return res.status(403).json({ message: "Tracking is unavailable for this order." });
        }

        return res.json({ status: row.status || "Confirmed" });
    } catch (error) {
        console.error("Track Order Error:", error);
        return res.status(500).json({ message: "Unable to retrieve order tracking." });
    }
});

app.patch("/api/orders/:id/cancel", async (req, res) => {
    try {
        const orderId = String(req.params.id || "");
        const cancelToken = String(req.body.cancelToken || "");
        if (!orderId || !/^[a-f0-9]{64}$/i.test(cancelToken)) {
            return res.status(400).json({ message: "A valid order cancellation token is required." });
        }

        const row = await getDb(
            "SELECT status, createdAt, cancelTokenHash, items FROM orders WHERE id = ?",
            [orderId]
        );
        if (!row) {
            return res.status(404).json({ message: "Order not found." });
        }
        if (!row.cancelTokenHash || !/^[a-f0-9]{64}$/i.test(String(row.cancelTokenHash))) {
            return res.status(403).json({ message: "This order cannot be cancelled from this browser." });
        }

        const suppliedHash = crypto.createHash("sha256").update(cancelToken).digest();
        const storedHash = Buffer.from(String(row.cancelTokenHash), "hex");
        if (!crypto.timingSafeEqual(suppliedHash, storedHash)) {
            return res.status(403).json({ message: "This order cannot be cancelled from this browser." });
        }
        if (row.status !== "Confirmed") {
            return res.status(409).json({ message: "This order has already been processed and cannot be cancelled." });
        }

        const createdAt = Number(row.createdAt);
        const ageMs = Date.now() - createdAt;
        if (!Number.isFinite(createdAt) || ageMs < 0 || ageMs >= 2 * 60 * 1000) {
            return res.status(410).json({ message: "The 2-minute cancellation window has expired." });
        }

        const result = await runDb(
            `UPDATE orders SET status = 'Cancelled'
             WHERE id = ? AND status = 'Confirmed' AND createdAt = ? AND cancelTokenHash = ?`,
            [orderId, createdAt, String(row.cancelTokenHash)]
        );
        if (result.changes !== 1) {
            return res.status(409).json({ message: "This order has already been processed and cannot be cancelled." });
        }

        try {
            const cancelledItems = Array.isArray(row.items) ? row.items : JSON.parse(row.items || "[]");
            await releaseStock(cancelledItems);
        } catch (error) {
            console.error("Cancel Order Restock Error:", error);
        }

        res.json({ message: "Order cancelled successfully.", status: "Cancelled" });
    } catch (error) {
        console.error("Cancel Order Error:", error);
        res.status(500).json({ message: "Unable to cancel order." });
    }
});

app.patch("/api/orders/:id/status", requireAdmin, async (req, res) => {
    try {
        const orderId = String(req.params.id || "");
        const nextStatus = String(req.body?.status || "");
        const statuses = ["Confirmed", "Preparing", "Out for delivery", "Delivered"];
        if (!statuses.includes(nextStatus)) {
            return res.status(400).json({ message: "Choose a valid order status." });
        }

        const order = await getDb("SELECT status FROM orders WHERE id = ?", [orderId]);
        if (!order) {
            return res.status(404).json({ message: "Order not found." });
        }
        const currentStatus = order.status || "Confirmed";
        if (currentStatus === "Cancelled") {
            return res.status(409).json({ message: "A cancelled order cannot be updated." });
        }
        if (currentStatus === nextStatus) {
            return res.json({ status: currentStatus });
        }
        if (statuses.indexOf(nextStatus) < statuses.indexOf(currentStatus)) {
            return res.status(409).json({ message: "Order status cannot move backwards." });
        }

        const result = await runDb(
            "UPDATE orders SET status = ? WHERE id = ? AND status = ?",
            [nextStatus, orderId, currentStatus]
        );
        if (result.changes !== 1) {
            return res.status(409).json({ message: "Order status changed. Refresh and try again." });
        }
        return res.json({ status: nextStatus });
    } catch (error) {
        console.error("Update Order Status Error:", error);
        return res.status(500).json({ message: "Unable to update order status." });
    }
});


// ===============================
// Get Orders API
// ===============================

app.get("/api/orders", requireAdmin, async (req, res) => {
    try {
        const rows = await allDb(
            "SELECT * FROM orders ORDER BY date DESC"
        );

        const orders = rows.map(normalizeOrderRow).filter(Boolean);
        res.json(orders);
    } catch (error) {
        console.error("Get Orders Error:", error);
        res.status(500).json({
            message: "Server error"
        });
    }
});


// ===============================
// Frontend fallback
// ===============================

app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(frontendDir, "index.html"));
});


// ===============================
// Start Server
// ===============================

const PORT = Number(process.env.PORT) || 5000;

initializeDatabase()
    .then(() => {
        app.listen(PORT, "0.0.0.0", () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error("Database initialization failed:", error);
        process.exitCode = 1;
    });