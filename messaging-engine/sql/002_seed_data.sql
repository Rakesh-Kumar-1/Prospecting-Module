USE prospecting_db;

-- Insert languages
INSERT INTO language_master 
(language_id, language_name, native_name, direction, sort_order) 
VALUES
('EN', 'English', 'English', 'LTR', 1),
('HI', 'Hindi', 'हिन्दी', 'LTR', 2),
('AR', 'Arabic', 'العربية', 'RTL', 3),
('ZH_CN', 'Chinese (Simplified)', '中文(简体)', 'LTR', 4),
('ES', 'Spanish', 'Español', 'LTR', 5),
('FR', 'French', 'Français', 'LTR', 6),
('DE', 'German', 'Deutsch', 'LTR', 7),
('PT', 'Portuguese', 'Português', 'LTR', 8),
('RU', 'Russian', 'Русский', 'LTR', 9),
('BN', 'Bengali', 'বাংলা', 'LTR', 10);

-- Insert email templates
INSERT INTO message_templates 
(template_code, language_id, channel, subject, body, variables) 
VALUES
(
  'WELCOME_EMAIL', 'EN', 'EMAIL',
  'Welcome, {{name}} from {{company}}!',
  '<h2>Hi {{name}},</h2><p>Thank you for your interest.</p><p>Your manager <strong>{{agent_name}}</strong> will reach out within <strong>{{response_hours}}</strong> hours.</p><p>Best regards,<br/>{{company_name}} Team</p>',
  '["{{name}}", "{{company}}", "{{agent_name}}", "{{response_hours}}", "{{company_name}}"]'
),
(
  'FOLLOWUP_EMAIL', 'EN', 'EMAIL',
  'Following up — {{name}}',
  '<h2>Hi {{name}},</h2><p>We wanted to follow up on your inquiry. Can we help with anything?</p><p>Best,<br/>{{agent_name}}</p>',
  '["{{name}}", "{{agent_name}}"]'
),
(
  'WELCOME_EMAIL', 'HI', 'EMAIL',
  '{{company}} में आपका स्वागत है, {{name}}!',
  '<h2>नमस्ते {{name}},</h2><p>हमारी सेवाओं में रुचि के लिए धन्यवाद।</p><p>आपका मैनेजर <strong>{{agent_name}}</strong> <strong>{{response_hours}}</strong> घंटों में संपर्क करेगा।</p><p>धन्यवाद,<br/>{{company_name}} टीम</p>',
  '["{{name}}", "{{company}}", "{{agent_name}}", "{{response_hours}}", "{{company_name}}"]'
),
(
  'WELCOME_SMS', 'EN', 'SMS',
  NULL,
  'Hi {{name}}, welcome! Your manager {{agent_name}} will call within {{response_hours}}hrs. - {{company_name}}',
  '["{{name}}", "{{agent_name}}", "{{response_hours}}", "{{company_name}}"]'
),
(
  'FOLLOWUP_SMS', 'EN', 'SMS',
  NULL,
  'Hi {{name}}, just checking in. Any questions? Reply or call us. - {{agent_name}}',
  '["{{name}}", "{{agent_name}}"]'
),
(
  'WELCOME_SMS', 'HI', 'SMS',
  NULL,
  'नमस्ते {{name}}, स्वागत है! {{agent_name}} {{response_hours}} घंटे में कॉल करेंगे। - {{company_name}}',
  '["{{name}}", "{{agent_name}}", "{{response_hours}}", "{{company_name}}"]'
);