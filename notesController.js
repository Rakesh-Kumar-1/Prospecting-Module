import * as notesService from "../services/notesService.js";
import { CreateError } from "../middleware/createError.js";

export const createNote = async (req, res, next) => {
  try {
    const { note_text, created_by, attachment_paths } = req.body; // ✅ added attachment_paths

    if (!note_text) {
      return next(CreateError(400, "note text required"));
    }

    const result = await notesService.addNote(
      req.params.id,
      note_text,
      created_by,
      attachment_paths || []  // ✅ pass it to service
    );

    res.status(201).json({ success: true, data: result });

  } catch (err) { next(err); }
};

export const listNotes = async (req, res, next) => {
  try {
    const notes = await notesService.getNotes(req.params.id);
    res.json({ success: true, data: notes });
  } catch (err) { next(err); }
};

export const updateNote = async (req, res, next) => {
  try {
    const result = await notesService.updateNote(req.params.noteId, req.body.note_text);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};