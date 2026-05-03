import db from "../config/db.js"

export const addNote = async (prospectId, noteText, createdBy) => {
    try {
        const values = [prospectId, noteText, JSON.stringify([]), createdBy];
        const query = `INSERT INTO notes(prospect_id,note_text,attachment_paths,created_by)VALUES(?,?,?,?)`;
        const [result] = await db.execute(query, values);
        return { id: result.insertId };
    } catch(err){
        throw err;
    }
}

export const getNotes = async (prospectId) => {
    try{
        const [rows] = await notesModel.fetchNotes(prospectId);
        return rows;
    }catch(err){
        throw err;
    }
};

export const updateNote = async (noteId, noteText) => {
    try{
        await notesModel.updateNoteModel(noteId, noteText);
        return { message: "Updated successfully" };
    }catch(err){
        throw err;
    }
};