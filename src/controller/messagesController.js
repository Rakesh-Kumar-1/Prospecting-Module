import * as messageService from '../service/messagesService.js';
import db from '../config/db.js';
import { CreateError } from '../middleware/createError.js';

export const sendBulk = async (req, res, next) => {
  try {
    const { template_id, scheduled_at, messages,userId } = req.body;

    if (!template_id || !userId) {
      return next(CreateError(400, "Missing required fields"));
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      return next(CreateError(400, "Missing required fileds"));
    }

    // Validate each message
    for (let msg of messages) {
      if (!msg.to || !msg.prospect_id) {
        return next(CreateError(400, "Each message must have 'to' and 'prospect_id'"));
      }

      if (!msg.payload || typeof msg.payload !== "object") {
        return next(CreateError(400, "Each message must have valid payload"));
      }
    }

    const result = await messageService.enqueueBulk({ template_id, scheduled_at, messages,userId });
    return res.status(201).json({ success: true, message: "Bulk messages queued" });
  } catch (err) {
    return next(err);
  }
};
/* 
{
  "template_id": 39,
  "scheduled_at": "2026-04-27 12:00:00",
  "messages": [
    {
      "prospect_id": 101,
      "to": "user1@example.com",
      "payload": { "name": "Rakesh", "order_id": "ORD1" }
    },
    {
      "prospect_id": 102,
      "to": "user2@example.com",
      "payload": { "name": "Amit", "order_id": "ORD2" }
    }
  ],
  "userId": 101
}
*/

export const sendSingle = async (req, res, next) => {
  try {
    const { template_id, to, prospect_id, payload, scheduled_at,userId } = req.body;

    // Basic validation
    if (!template_id || !to || !prospect_id || !userId) {
      return next(CreateError(400, 'Missing required fields'))
    }

    if (!payload || typeof payload !== "object") {
      return next(CreateError(400, 'Payload must be a valid JSON object'))
    }

    // Call service
    const result = await messageService.enqueueMessage({ template_id, to, prospect_id, payload, scheduled_at, userId });
    return res.status(201).json({ success: true, message: "Message queued successfully", data: result });

  } catch (err) {
    return next(CreateError(500, 'Internal Server Error'));
  }
};
/*
{
  "template_id" : 39,
  "to": "user@example.com",
  "payload": {
    "name": "Rakesh",
    "order_id": "ORD123"
  },
  "scheduled_at": "2026-04-27T12:00:00Z",
  "userId": 101
}
*/
export const queue = async (req, res, next) => {
  try {
    let { status, channel, prospect_id, page, limit } = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;

    const offset = (page - 1) * limit;
    // Default status
    if (status) {
      if (typeof status === "string") {
        status = status.split(",");
      }
    } else {
      // default allow all status if not provided
      status = ['PENDING', 'FAILED'];
    }
    // Channel normalize
    if (channel) {
      if (typeof channel === "string") {
        channel = channel.split(",");
      }
    }

    // prospect_id normalize
    if (prospect_id) {
      if(typeof prospect_id === "string") {
        prospect_id = prospect_id.split(",").map(id => parseInt(id));
      }
    }

    // Validation
    const allowedStatus = ['PENDING', 'PROCESSING', 'SENT', 'FAILED', 'CANCELLED'];
    for (let s of status) {
      if (!allowedStatus.includes(s)) {
        return next(CreateError(400, `Invalid status: ${s}`));
      }
    }

    const allowedChannels = ['EMAIL', 'SMS', 'WHATSAPP'];
    if (channel) {
      for (let c of channel) {
        if (!allowedChannels.includes(c)) {
          return next(CreateError(400, `Invalid channel: ${c}`));
        }
      }
    }

    // Call service
    const result = await messageService.queue({ status, channel, prospect_id, limit, offset });

    return res.status(200).json({
      success: true,
      page,
      limit,
      total: result.total,
      totalPages: Math.ceil(result.total / limit),
      data: result.rows
    });

  } catch (err) {
    return next(err);
  }
}
/*
{
  "templateCode": "string (optional)",
  "language_id": "string (optional)",
  "status": "string | comma-separated values (optional)",
  "channel": "string | comma-separated values (optional)",
  "prospect_id": "number (optional)",
  "page": "number (optional, default=1)",
}
 */
export const postTemplates = async (req, res, next) => {
  try {
    const { templateCode, channel, language_id, subject, body } = req.body;
    if (!templateCode || !channel || !language_id || !subject || !body) {
      return next(CreateError(400, 'Missing required fields'))
    }
    const result = await messageService.postTemplates({ templateCode, channel, language_id, subject, body });
    if (!result) {
      return next(CreateError(400, 'Template with same code, language and channel already exists'));
    }
    return res.status(201).json({ success: true, message: 'Template created successfully' });
  }
  catch (error) {
    next(CreateError(500, 'Internal Server Error'));
  }
}
/*
 API Schemas for create templates:
 {
  "templateCode": "FOLLOW UP",
  "channel": "EMAIL",
  "language_id": "en",
  "subject": "Order Confirmation",
  "body": "Hello {{name}}, your order {{order_id}} is confirmed.",
  "isActive": true,
  "userId": 101
}
*/
export const updateTemplates = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = req.body;
    if (!id || !data) {
      return next(CreateError(400, 'Missing required fields'))
    }
    const result = await messageService.updateTemplates(id, data);
    if (!result) {
      return next(CreateError(404, 'Template not found'));
    }
    return res.status(200).json({success: true,message: "Template updated successfully"});
  }
  catch (error) {
    next(CreateError(500, 'Internal Server Error'));
  }
}
/*
API for update template:
{
  "templateCode": "FOLLOW UP",
  "channel": "EMAIL",
  "language_id": "en",
  "subject": "Updated Order Confirmation",
  "body": "Hello {{name}}, your order {{order_id}} has been successfully confirmed.",
  "isActive": true,
  "userId": 101
}
*/

export const getTemplates = async (req, res, next) => {
  try {
    let { templateCode, channel, language_id, page } = req.query;
    page = parseInt(page) || 1;
    const limit = 10; // Default limit
    const offset = (page - 1) * limit;

    // Handle multiple channels

    if (channel) {
      if (typeof channel === "string") {
        channel = channel.split(",");
      }
    }

    // Validation
    const allowedChannels = ['EMAIL', 'SMS', 'WHATSAPP'];
    if (channel) {
      for (let c of channel) {
        if (!allowedChannels.includes(c)) {
          return next(CreateError(400, `Invalid channel: ${c}`));
        }
      }
    }

    // Call service
    const result = await messageService.getTemplates({ templateCode, channel, language_id, limit, offset });
    return res.json({ success: true, count: result.total, data: result.templates });

  } catch (err) {
    return next(CreateError(500, 'Internal Server Error'));
  }
}
/*
API for get templates with filters:
/templates?templateCode=FOLLOW%20UP&channel=EMAIL&channel=SMS&channel=WHATSAPP&language_id=en
*/

export const healthCheck = async (req, res,) => {
  const [rows] = await db.query("SELECT * FROM td_messages_queue");
  console.log(rows);
  return res.json({ success: true, message: "API is healthy" ,data: rows});
}