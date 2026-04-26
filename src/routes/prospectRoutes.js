import express from 'express';
import * as prospectController from '../controller/prospectController.js';
import { upload, parseExcelMiddleware } from '../middleware/excelParser.js';

const router = express.Router();

// 1. Bulk Excel upload
// POST /prospects/upload
router.post('/upload', upload.single('file'), parseExcelMiddleware, prospectController.uploadProspects);

// 2. List (paginated, filtered)
// GET /prospects
router.get('/', prospectController.listProspects);

// 3. Get single prospect
// GET /prospects/:id
router.get('/:id', prospectController.getProspect);

// 4. Update fields
// PATCH /prospects/:id
router.patch('/:id', prospectController.updateProspect);

// 5. Move to new stage
// POST /prospects/move-stage
router.post('/move-stage', prospectController.moveStage);

// 6. Bulk transfer to user
// POST /prospects/transfer
router.post('/transfer', prospectController.transferProspects);

// 7. Stage + transfer timeline
// GET /prospects/:id/history
router.get('/:id/history', prospectController.getProspectHistory);

export default router;
