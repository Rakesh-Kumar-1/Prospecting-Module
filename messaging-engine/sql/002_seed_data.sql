USE prospecting_db;

-- Insert languages into md_languages
INSERT IGNORE INTO md_languages
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

-- Insert templates into md_message_templates
INSERT IGNORE INTO md_message_templates
(template_code, language_id, channel, subject, body, variables)
VALUES
(
  'WELCOME_EMAIL', 'EN', 'EMAIL',
  'Welcome to Talent Micro — {{name}}!',
  '<h2>Dear {{name}},</h2>
   <p>Welcome! We are thrilled to connect with you.</p>
   <p>At <strong>Talent Micro</strong> we are committed to
   helping you find the best opportunities.</p>
   <p>Your dedicated manager <strong>{{agent_name}}</strong>
   will reach out within <strong>{{response_hours}}</strong>
   hours.</p>
   <p>Warm regards,<br/><strong>{{agent_name}}</strong>
   <br/>Talent Micro</p>',
  '["{{name}}", "{{agent_name}}", "{{response_hours}}"]'
),
(
  'FOLLOWUP_EMAIL', 'EN', 'EMAIL',
  'Following up — {{name}}',
  '<h2>Dear {{name}},</h2>
   <p>I wanted to follow up on our previous conversation.</p>
   <p>Please let us know if there is anything we can help
   you with.</p>
   <p>Best regards,<br/><strong>{{agent_name}}</strong>
   <br/>Talent Micro</p>',
  '["{{name}}", "{{agent_name}}"]'
),
(
  'FORMAL_GREETING', 'EN', 'EMAIL',
  'Greetings from Talent Micro — {{name}}',
  '<h2>Dear {{name}},</h2>
   <p>I hope this message finds you in good health
   and high spirits.</p>
   <p>My name is <strong>{{sender_name}}</strong>, and I am
   reaching out on behalf of <strong>Talent Micro</strong>
   — a company dedicated to connecting exceptional talent
   with outstanding opportunities.</p>
   <p>We have been closely following the remarkable work
   being done at <strong>{{company}}</strong>, and we believe
   there is strong potential for meaningful collaboration.</p>
   <p>I would be delighted to schedule a brief introductory
   call at your earliest convenience.</p>
   <p>Warm regards,<br/><strong>{{sender_name}}</strong>
   <br/>{{sender_title}}<br/>Talent Micro
   <br/>{{sender_email}}<br/>{{sender_phone}}</p>',
  '["{{name}}", "{{company}}", "{{sender_name}}", "{{sender_title}}", "{{sender_email}}", "{{sender_phone}}"]'
),
(
  'WELCOME_EMAIL', 'HI', 'EMAIL',
  'Talent Micro में आपका स्वागत है, {{name}}!',
  '<h2>प्रिय {{name}},</h2>
   <p>आपका स्वागत है!</p>
   <p>आपके मैनेजर <strong>{{agent_name}}</strong>
   <strong>{{response_hours}}</strong> घंटों में संपर्क
   करेंगे।</p>
   <p>धन्यवाद,<br/>Talent Micro</p>',
  '["{{name}}", "{{agent_name}}", "{{response_hours}}"]'
),
(
  'WELCOME_SMS', 'EN', 'SMS',
  NULL,
  'Hi {{name}}, welcome to Talent Micro! Your manager {{agent_name}} will call within {{response_hours}}hrs.',
  '["{{name}}", "{{agent_name}}", "{{response_hours}}"]'
),
(
  'FOLLOWUP_SMS', 'EN', 'SMS',
  NULL,
  'Hi {{name}}, following up from Talent Micro. Any questions? - {{agent_name}}',
  '["{{name}}", "{{agent_name}}"]'
),
(
  'WELCOME_SMS', 'HI', 'SMS',
  NULL,
  'नमस्ते {{name}}, Talent Micro में स्वागत है! {{agent_name}} {{response_hours}} घंटे में कॉल करेंगे।',
  '["{{name}}", "{{agent_name}}", "{{response_hours}}"]'
);