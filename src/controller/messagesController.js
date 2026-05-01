import * as messageService from '../service/messagesService.js';
import db from '../config/db.js';
import { CreateError } from '../middleware/createError.js';

// POST /api/messages/send-bulk
/*
{
  "template_id": 2,
  "messages": [
    {
      "prospect_id": 101,
      "payload": {
        "meeting_date": "2026-05-02",
        "meeting_link": "https://meet.google.com/a1"
      }
    },
    {
      "prospect_id": 102,
      "payload": {
        "meeting_date": "2026-05-03",
        "meeting_link": "https://meet.google.com/b2"
      }
    }
  ]
}
*/
export const sendBulk = async (req, res, next) => {
  try {
    const { template_id, messages } = req.body;
    const userId = req.authentication['userid'];

    if (!template_id || !userId) {
      return next(CreateError(400, 'Missing required fields'));
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      return next(CreateError(400, 'Messages must be a non-empty array'));
    }

    for (const item of messages) {
      if (!item.prospect_id) {
        return next(CreateError(400, 'prospect_id is required for each message'));
      }
      if (item.payload && typeof item.payload !== 'object') {
        return next(CreateError(400, 'payload must be JSON object'));
      }
    }

    const result = await messageService.enqueueBulkMessages({ template_id, userId, messages });

    return res.status(201).json({
      success: true,
      message: 'Bulk messages queued successfully',
      data: result,
    });

  } catch (error) {
    return next(error);
  }
};

// POST /api/messages/send-single
/*
{
  "template_id": 2,
  "prospect_id": 101,
  "payload": {
    "meeting_date": "2026-05-02",
    "meeting_link": "https://meet.google.com/abc"
  }
}
*/
export const sendSingle = async (req, res, next) => {
  try {
    const { template_id, prospect_id, payload } = req.body;
    const userId = req.authentication['userid'];

    if (!template_id || !prospect_id || !userId) {
      return next(CreateError(400, 'Missing required fields'));
    }

    if (payload && typeof payload !== 'object') {
      return next(CreateError(400, 'Payload must be a valid JSON object'));
    }

    const result = await messageService.enqueueMessage({ template_id, prospect_id, payload, userId });

    return res.status(201).json({
      success: true,
      message: 'Message queued successfully',
      data: result,
    });

  } catch (err) {
    return next(err);
  }
};

// GET /api/messages/queue
// /queue?channel=EMAIL&channel=SMS&prospect_id=123&page=2&limit=10
export const queue = async (req, res, next) => {
  try {
    let { channel, prospect_id, page, limit } = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    const offset = (page - 1) * limit;

    if (channel) {
      if (typeof channel === 'string') channel = channel.split(',');
    }

    if (prospect_id) {
      if (typeof prospect_id === 'string') prospect_id = prospect_id.split(',');
      prospect_id = prospect_id.map((id) => Number(id));
    }

    const allowedChannels = ['EMAIL', 'SMS', 'WHATSAPP'];
    if (channel) {
      for (const c of channel) {
        if (!allowedChannels.includes(c)) {
          return next(CreateError(400, `Invalid channel: ${c}`));
        }
      }
    }

    const result = await messageService.queue({ channel, prospect_id, limit, offset });

    return res.status(200).json({
      success: true,
      page,
      limit,
      total: result.total,
      totalPages: Math.ceil(result.total / limit),
      data: result.rows,
    });

  } catch (err) {
    return next(err);
  }
};

// POST /api/messages/templates
/*
{
  "templateCode": "FOLLOW UP",
  "channel": "EMAIL",
  "language_id": "EN",
  "subject": "Order Confirmation",
  "body": "Hello {{name}}, your order {{order_id}} is confirmed."
}
*/
export const postTemplates = async (req, res, next) => {
  try {
    const { templateCode, channel, language_id, subject, body } = req.body;

    if (!templateCode || !channel || !language_id || !subject || !body) {
      return next(CreateError(400, 'Missing required fields'));
    }

    const result = await messageService.postTemplates({ templateCode, channel, language_id, subject, body });

    if (!result) {
      return next(CreateError(400, 'Template with same code, language and channel already exists'));
    }

    return res.status(201).json({ success: true, message: 'Template created successfully' });

  } catch (error) {
    next(CreateError(500, 'Internal Server Error'));
  }
};

// PATCH /api/messages/templates/:id
/*
{
  "subject": "Updated Order Confirmation",
  "body": "Hello {{name}}, your order {{order_id}} confirmed."
}
*/
export const updateTemplates = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = req.body;

    if (!id || !data) {
      return next(CreateError(400, 'Missing required fields'));
    }

    const result = await messageService.updateTemplates(id, data);

    if (!result) {
      return next(CreateError(404, 'Template not found'));
    }

    return res.status(200).json({ success: true, message: 'Template updated successfully' });

  } catch (error) {
    next(CreateError(500, 'Internal Server Error'));
  }
};

// GET /api/messages/templates
// /templates?templateCode=WELCOME&channel=EMAIL,SMS&language_id=EN&page=1&limit=10
export const getTemplates = async (req, res, next) => {
  try {
    let { templateCode, channel, language_id, page, limit } = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 30;
    const offset = (page - 1) * limit;

    if (channel) {
      if (typeof channel === 'string') channel = channel.split(',');
    }

    const allowedChannels = ['EMAIL', 'SMS', 'WHATSAPP'];
    if (channel) {
      for (const c of channel) {
        if (!allowedChannels.includes(c)) {
          return next(CreateError(400, `Invalid channel: ${c}`));
        }
      }
    }

    const result = await messageService.getTemplates({ templateCode, channel, language_id, limit, offset });

    return res.status(200).json({
      success: true,
      count: result.total,
      data: result.templates,
    });

  } catch (err) {
    return next(CreateError(500, 'Internal Server Error'));
  }
};

// GET /api/messages/health
export const healthCheck = async (req, res) => {
  const [rows] = await db.query('SELECT * FROM td_messages_queue');
  console.table(rows);
  return res.json({ success: true, message: 'API is healthy', data: rows });
};