const express = require("express");
const multer = require("multer");
const db = require("./config/db");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });


// ✅ POST - FIXED ROUTE (was /notes, now /prospects/:id/notes)
app.post("/prospects/:id/notes", (req, res) => {

  console.log("BODY:", req.body);

  const { note_text, created_by, attachment_paths } = req.body || {};
  const prospect_id = req.params.id; // ✅ taken from URL

  if (!note_text) {
    return res.status(400).json({ error: "note_text required" });
  }

  db.query(
    `INSERT INTO notes(prospect_id, note_text, attachment_paths, created_by)
     VALUES(?, ?, ?, ?)`,
    [
      prospect_id,
      note_text,
      JSON.stringify(attachment_paths || []),  // ✅ fixed field name
      created_by
    ],
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.status(201).json({ success: true, message: "Note Added", id: result.insertId });
    }
  );
});


// ✅ GET
app.get("/prospects/:id/notes", (req, res) => {
  db.query(
    `SELECT * FROM notes WHERE prospect_id=? ORDER BY created_at DESC`,
    [req.params.id],
    (err, rows) => {
      if (err) return res.status(500).json(err);
      res.json({ success: true, data: rows });
    }
  );
});


// ✅ PATCH
app.patch("/notes/:noteId", (req, res) => {
  console.log("PATCH HIT");

  const noteId = req.params.noteId;
  const { note_text } = req.body;

  if (!note_text) {
    return res.status(400).json({ error: "note_text required" });
  }

  db.query(
    `UPDATE notes SET note_text=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
    [note_text, noteId],
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({ success: true, message: "Updated successfully" });
    }
  );
});


app.listen(3000, () => {
  console.log("Server running on 3000");
});