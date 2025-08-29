import mysql from "mysql2/promise";
import { config } from "./config.js";

let pool;

/**
 * Initialize MySQL connection pool
 */
export async function initDB() {
  if (!pool) {
    pool = mysql.createPool({
      host: config.dbHost,
      port: config.dbPort,
      user: config.dbUser,
      password: config.dbPass,
      database: config.dbName,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
    console.log("✅ MySQL connected:", config.dbHost, config.dbName);
  }
  return pool;
}

/**
 * Generic query
 */
export async function query(sql, params = []) {
  const conn = await initDB();
  const [rows] = await conn.execute(sql, params);
  return rows;
}

/**
 * Runtime Settings
 */
export async function setSetting(key, value) {
  await query(
    `INSERT INTO runtime_settings (setting_key, setting_value) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value)`,
    [key, value]
  );
}

export async function getSetting(key, def = null) {
  const rows = await query(
    `SELECT setting_value FROM runtime_settings WHERE setting_key=?`,
    [key]
  );
  return rows.length ? rows[0].setting_value : def;
}

/**
 * Save signal
 */
export async function saveSignal(signal) {
  const {
    symbol,
    side,
    entry,
    sl,
    tp,
    rr,
    bias,
    tf_context,
    execution_tf,
    status,
  } = signal;

  const result = await query(
    `INSERT INTO signals
      (symbol, side, entry, sl, tp, rr, bias, tf_context, execution_tf, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [symbol, side, entry, sl, tp, rr, bias, tf_context, execution_tf, status]
  );

  return result.insertId;
}

/**
 * Save order
 */
export async function saveOrder(order) {
  const {
    signal_id,
    symbol,
    side,
    qty,
    entry,
    sl,
    tp,
    status,
    pnl,
    fee,
  } = order;

  const result = await query(
    `INSERT INTO orders
      (signal_id, symbol, side, qty, entry, sl, tp, status, pnl, fee)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [signal_id, symbol, side, qty, entry, sl, tp, status, pnl, fee]
  );

  return result.insertId;
}
