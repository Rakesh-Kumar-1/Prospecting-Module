import db from "../../config/db.js";

const createTableQuery = `
CREATE TABLE IF NOT EXISTS td_messages_queue (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  channel ENUM('EMAIL','SMS','WHATSAPP') NOT NULL,
  to_address VARCHAR(500) NOT NULL,
  subject VARCHAR(500),
  body TEXT NOT NULL,
  status ENUM('PENDING','PROCESSING','SENT','FAILED') DEFAULT 'PENDING',
  retry_count INT DEFAULT 0,
  locked_by VARCHAR(100) NULL,
  locked_at TIMESTAMP NULL,
  processed_at TIMESTAMP NULL,
  error_message TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_status (status),
  INDEX idx_locked_at (locked_at),
  INDEX idx_retry (retry_count)
);
`;

export async function createTable() {
  try {
    await db.execute(createTableQuery);
    console.log("Table created successfully");
  } catch (err) {
    console.error("Error creating table", err);
  }
}
