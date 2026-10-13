const path = require("path");
const { DatabaseSync } = require("node:sqlite");
const mysql = require("mysql2/promise");

async function migrate() {
    const sqlitePath = process.env.SQLITE_PATH || path.join(__dirname, "app.db");
    const sqlite = new DatabaseSync(sqlitePath, { readOnly: true });
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || "127.0.0.1",
        port: Number(process.env.DB_PORT) || 3307,
        user: process.env.DB_USER || "kamagere_app",
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || "kamagere_mart"
    });

    try {
        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(254) NOT NULL UNIQUE,
                phone VARCHAR(20) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                address TEXT NOT NULL
            ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
        `);
        await connection.query(`
            CREATE TABLE IF NOT EXISTS orders (
                id VARCHAR(32) NOT NULL PRIMARY KEY,
                userId BIGINT UNSIGNED NULL,
                date VARCHAR(64) NOT NULL,
                items LONGTEXT NOT NULL,
                subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0,
                delivery DECIMAL(12, 2) NOT NULL DEFAULT 0,
                total DECIMAL(12, 2) NOT NULL DEFAULT 0,
                address TEXT NOT NULL,
                payment VARCHAR(64) NOT NULL DEFAULT 'COD',
                status VARCHAR(64) NOT NULL DEFAULT 'Confirmed',
                source VARCHAR(64) NOT NULL DEFAULT 'Cart',
                INDEX orders_user_id (userId)
            ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
        `);
        const users = sqlite.prepare("SELECT * FROM users ORDER BY id").all();
        const orders = sqlite.prepare("SELECT * FROM orders ORDER BY date").all();
        const [[userCount]] = await connection.query("SELECT COUNT(*) AS count FROM users");
        const [[orderCount]] = await connection.query("SELECT COUNT(*) AS count FROM orders");

        if (Number(userCount.count) !== 0 || Number(orderCount.count) !== 0) {
            throw new Error("Target Cloud SQL tables are not empty; refusing to migrate into them.");
        }

        await connection.beginTransaction();
        for (const user of users) {
            await connection.execute(
                "INSERT INTO users (id, name, email, phone, password, address) VALUES (?, ?, ?, ?, ?, ?)",
                [user.id, user.name, user.email, user.phone, user.password, user.address || ""]
            );
        }
        for (const order of orders) {
            await connection.execute(
                `INSERT INTO orders
                    (id, userId, date, items, subtotal, delivery, total, address, payment, status, source)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    order.id,
                    order.userId,
                    order.date,
                    order.items,
                    order.subtotal,
                    order.delivery,
                    order.total,
                    order.address,
                    order.payment,
                    order.status,
                    order.source
                ]
            );
        }
        await connection.commit();

        const [[migratedUsers]] = await connection.query("SELECT COUNT(*) AS count FROM users");
        const [[migratedOrders]] = await connection.query("SELECT COUNT(*) AS count FROM orders");
        if (Number(migratedUsers.count) !== users.length || Number(migratedOrders.count) !== orders.length) {
            throw new Error("Cloud SQL row counts did not match the SQLite source.");
        }

        console.log(`Migrated ${users.length} users and ${orders.length} orders.`);
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        sqlite.close();
        await connection.end();
    }
}

migrate().catch((error) => {
    console.error("SQLite migration failed:", error);
    process.exitCode = 1;
});
