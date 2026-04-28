const express=require("express");
const multer=require("multer");
const db=require("./db");

const app=express();

app.use(express.json());
app.use(express.urlencoded({extended:true}));


const storage=multer.diskStorage({

destination:(req,file,cb)=>{
cb(null,"uploads/");
},

filename:(req,file,cb)=>{
cb(
null,
Date.now()+"-"+file.originalname
);
}

});

const upload=multer({
storage:storage
});


/* POST Notes API */
app.post(
"/notes",
upload.array("files"),
(req,res)=>{

const {
prospect_id,
note_text,
created_by
}=req.body;

let attachments=[];

if(req.files){
attachments=
req.files.map(
f=>f.filename
);
}

db.query(
`INSERT INTO notes
(
prospect_id,
note_text,
attachment_paths,
created_by
)
VALUES(?,?,?,?)`,
[
prospect_id,
note_text,
JSON.stringify(attachments),
created_by
],
(err,result)=>{

if(err)
return res.status(500).json(err);

res.json({
message:"Note Added"
});

});

});


/* GET Notes API */
app.get(
"/notes/:id",
(req,res)=>{

db.query(
`SELECT *
FROM notes
WHERE prospect_id=?`,
[req.params.id],
(err,rows)=>{

if(err)
return res.status(500).json(err);

res.json(rows);

});

});


app.listen(
3000,
()=>{
console.log(
"Server running on 3000"
);
}
);