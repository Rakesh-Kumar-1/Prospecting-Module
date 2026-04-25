import express from 'express';
import * as controller from '../controller/messagesController.js';

const router = express.Router();

router.post('/send-bulk', controller.sendBulk);  // Bulk send route
router.post('/send-single', controller.sendSingle);  // Single send route
router.get('/queue', controller.queue);  // Queue status route

router.post('/templates', controller.postTemplates); // Create template
router.put('/templates/:id', controller.updateTemplates); // Update template
router.get('/templates', controller.getTemplates); // List templates




export default router;