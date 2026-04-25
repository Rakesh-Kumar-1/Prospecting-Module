import pool from "../../config/connectionDb.js";

const createTableQuery = ` 
  CREATE TABLE IF NOT EXISTS message_templates (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  
  template_code   VARCHAR(100) NOT NULL,
  language_id     VARCHAR(10)  NOT NULL,
  channel         message_channel NOT NULL,

  subject         VARCHAR(500),
  body            TEXT NOT NULL,

  variables       JSONB, -- ['name','company']

  is_active       BOOLEAN DEFAULT TRUE,

  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP,

  CONSTRAINT uk_template UNIQUE (template_code, language_id, channel)
);`

export async function createTable() {
  try {
    await pool.query(createTableQuery);
    console.log('Table created successfully');
  } catch (err) {
    console.error('Error creating table', err);
  }
};