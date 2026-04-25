import pool from "../../config/connectionDb.js";

const createTableQuery = ` 
  CREATE TABLE message_queue (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  channel           message_channel NOT NULL,
  prospect_id       BIGINT,
  template_id       BIGINT,
  to_address        VARCHAR(500) NOT NULL,
  payload           JSONB NOT NULL,
  status            message_status DEFAULT 'PENDING',
  retry_count       INT DEFAULT 0,
  max_retries       INT DEFAULT 3,
  last_attempt_at   TIMESTAMP,
  scheduled_at      TIMESTAMP,
  sent_at           TIMESTAMP,
  error_message     TEXT,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by        BIGINT,

  -- Indexes
  CONSTRAINT fk_template FOREIGN KEY (template_id)
    REFERENCES message_templates(id)
    ON DELETE SET NULL
);`;

export async function createTable() {
  try {
    await pool.query(createTableQuery);
    console.log("Table created successfully");
  } catch (err) {
    console.error("Error creating table", err);
  }
}
