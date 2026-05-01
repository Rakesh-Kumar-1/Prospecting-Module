import express from "express";
import * as notesController from "../controller/notesController.js";

const router = express.Router();

router.post("/:id/notes",notesController.createNote);

router.get("/:id/notes",notesController.listNotes);

router.patch("/notes/:noteId",notesController.updateNote);

export default router;