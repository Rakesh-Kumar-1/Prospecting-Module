const Twilio = require('twilio');
const axios = require('axios');
const config = require('../config');
const logger = require('../db/logger');

const sendSMS = async (to, body) => {
  const provider = config.sms.provider;

  if (provider === 'twilio') {
    const client = new Twilio(config.sms.twilio.sid, config.sms.twilio.token);
    const message = await client.messages.create({
      body,
      from: config.sms.twilio.from,
      to,
    });
    logger.info(`[SMS][Twilio] Sent to ${to} | SID: ${message.sid}`);
    return { provider: 'twilio', messageId: message.sid, status: message.status };

  } else if (provider === 'msg91') {
    const response = await axios.post(
      'https://api.msg91.com/api/v5/flow/',
      {
        template_id: config.sms.msg91.templateId,
        short_url: '0',
        mobiles: to.replace('+', ''),
        VAR1: body,
      },
      {
        headers: {
          authkey: config.sms.msg91.key,
          'Content-Type': 'application/json',
        },
      }
    );
    logger.info(`[SMS][MSG91] Sent to ${to}`);
    return {
      provider: 'msg91',
      messageId: response.data.request_id || null,
      status: response.data.type || 'success',
    };

  } else {
    throw new Error(`UNKNOWN_SMS_PROVIDER: ${provider}`);
  }
};

module.exports = { sendSMS };