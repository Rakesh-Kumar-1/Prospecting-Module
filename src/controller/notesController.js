import * as notesService from "../service/notesService.js";
import { CreateError } from "../middleware/createError.js";

// Create a new note
export const createNote = async (req, res, next) => {
    try {
        const { note_text, created_by } = req.body;
        if (!note_text) {
            return next(CreateError(400, "note text required"));
        }
        const result = await notesService.addNote(
            req.params.id,
            note_text,
            created_by
        );

        res.status(201).json({
            success: true,
            data: result,
        });
    } catch (err) {
        next(err);
    }
};

// List all notes
export const listNotes = async (req, res, next) => {
    try {
        const notes = await notesService.getNotes(req.params.id);
        res.json({
            success: true,
            data: notes,
        });
    } catch (err) {
        next(err);
    }
};

// Update a note
export const updateNote = async (req, res, next) => {
    try {
        const result = await notesService.updateNote(
            req.params.noteId,
            req.body.note_text
        );
        res.json({
            success: true,
            data: result,
        });
    } catch (err) {
        next(err);
    }
};
