import db from "../config/db.js";
import * as notesModel from "../model/notesModel.js";


export const addNote = async ( prospectId,noteText,createdBy) => {

const values = [prospectId,noteText,JSON.stringify([]),createdBy];
const query = `INSERT INTO notes(prospect_id,note_text,attachment_paths,created_by)VALUES(?,?,?,?)`;
const [result] = await db.execute(query, values);

return {id: result.insertId};
};

export const getNotes = async (prospectId) => {
       
       const [rows] =await notesModel.fetchNotes(prospectId);
return rows;
};

export const updateNote = async (noteId,noteText) => {await notesModel.updateNoteModel(noteId,noteText);
        return {message: "Updated successfully"};
};