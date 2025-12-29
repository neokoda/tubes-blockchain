import sqlite3 from "sqlite3";
const db = new sqlite3.Database('./chainvoice.db');

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        wallet_address TEXT PRIMARY KEY,
        business_name TEXT,
        description TEXT,
        npwp TEXT UNIQUE
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS djp_faktur_pajak (
        nomor_faktur TEXT PRIMARY KEY,
        npwp_penjual TEXT,
        nominal_total REAL
    )`);

    const stmt = db.prepare("INSERT OR REPLACE INTO djp_faktur_pajak VALUES (?, ?, ?)");
    stmt.run("INV-2024-001", "1234567890", 50000000);
    stmt.finalize();

    console.log("Database initialized & seeded!");
});

db.close();