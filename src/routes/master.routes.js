import express from 'express';
import * as masterController from '../controller/master.controller.js';

const router = express.Router();

router.get('/stages', masterController.getStages);
router.get('/sources', masterController.getSources);
router.get('/languages', masterController.getLanguages);

export default router;
