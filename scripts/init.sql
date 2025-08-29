-- Trading Agent DB Schema (v17 full)
CREATE DATABASE IF NOT EXISTS trading_agent;
USE trading_agent;

-- Signals table (analysis results)
CREATE TABLE IF NOT EXISTS signals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  symbol VARCHAR(32) NOT NULL,
  side VARCHAR(8) NOT NULL,
  entry DECIMAL(18,8),
  sl DECIMAL(18,8),
  tp DECIMAL(18,8),
  rr DECIMAL(10,4),
  bias VARCHAR(16),
  tf_context VARCHAR(64),
  execution_tf VARCHAR(8),
  status VARCHAR(16) DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders table (execution + fills)
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  signal_id INT,
  symbol VARCHAR(32),
  side VARCHAR(8),
  qty DECIMAL(18,8),
  entry DECIMAL(18,8),
  sl DECIMAL(18,8),
  tp DECIMAL(18,8),
  status VARCHAR(16) DEFAULT 'OPEN',
  pnl DECIMAL(18,8) DEFAULT 0,
  fee DECIMAL(18,8) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Runtime settings (Telegram commands modify these)
CREATE TABLE IF NOT EXISTS runtime_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(64) UNIQUE,
  setting_value VARCHAR(255),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
