USE prospecting_db;

-- ─────────────────────────────────────────
-- MASTER DATA TABLES (md_ prefix)
-- ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS md_languages (
  language_id VARCHAR(10) PRIMARY KEY,
  language_name VARCHAR(100) NOT NULL,
  native_name VARCHAR(100),
  direction ENUM('LTR','RTL') DEFAULT 'LTR',
  is_active TINYINT(1) DEFAULT 1,
  sort_order INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS md_message_templates (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  template_code VARCHAR(100) NOT NULL,
  language_id VARCHAR(10) NOT NULL,
  channel ENUM('EMAIL','SMS','WHATSAPP') NOT NULL,
  subject VARCHAR(500) NULL,
  body TEXT NOT NULL,
  variables JSON NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_template (template_code, language_id, channel),
  FOREIGN KEY (language_id) REFERENCES md_languages(language_id)
);

-- ─────────────────────────────────────────
-- TRANSACTION DATA TABLES (td_ prefix)
-- ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS td_message_queue (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  channel ENUM('EMAIL','SMS','WHATSAPP') NOT NULL,
  prospect_id BIGINT NULL,
  template_id BIGINT NULL,
  to_address VARCHAR(500) NOT NULL,
  payload JSON NOT NULL,
  status ENUM('PENDING','PROCESSING','SENT','FAILED','CANCELLED') 
    DEFAULT 'PENDING',
  retry_count INT DEFAULT 0,
  max_retries INT DEFAULT 3,
  last_attempt_at DATETIME NULL,
  scheduled_at DATETIME NULL,
  sent_at DATETIME NULL,
  error_message TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by BIGINT NULL,
  INDEX idx_status (status),
  INDEX idx_scheduled (scheduled_at),
  INDEX idx_prospect (prospect_id)
);

CREATE TABLE IF NOT EXISTS td_message_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  queue_id BIGINT NOT NULL,
  channel ENUM('EMAIL','SMS','WHATSAPP') NOT NULL,
  to_address VARCHAR(500),
  provider VARCHAR(100),
  provider_msg_id VARCHAR(255),
  status_code VARCHAR(50),
  response_body TEXT,
  delivered_at DATETIME,
  attempt_number INT,
  INDEX idx_queue (queue_id)
);