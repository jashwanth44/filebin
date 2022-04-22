import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import { nanoid } from "nanoid";
import { existsSync, mkdirSync, readdirSync, unlinkSync } from "fs";

const app = express();
const port = 3000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const maxSizeMB = 20;
const maxFileSize = maxSizeMB * 1024 * 1024;
const baseURL = "http://localhost:3000";

const storage = multer.diskStorage({
    destination: function(req, file, cb){
        const fileId = nanoid();
        req.downURL = baseURL + "/download/" + fileId;
        const destDir = path.join(__dirname, '/src/uploads/', fileId);
        if( !existsSync(destDir) ){
            mkdirSync(destDir, { recursive:true });
        }
        cb(null, destDir);
    },
    filename: function(req, file, cb){
        console.log(file);
        cb(null, file.originalname);
    }
})

function fileFilter(req, file, cb){
    if(file.size > maxFileSize){
        req.fileValid = false;
        cb(null, false);
    }
    else{
        req.fileValid = true;
        cb(null, true);
    }
}

const fileUpload = multer({ storage: storage, fileFilter: fileFilter });


app.use("/src", express.static(path.join(__dirname, '/src')));
app.use(express.json());

app.get("/", (req,res)=>{
    res.sendFile(path.join(__dirname,'/src/index.html'));
});

app.post("/upload", fileUpload.single('user-file'), (req, res)=>{
    res.type('json');
    if(!req.fileValid){
        res.send({
            "error":{
                "msg":"Invalid File"
            },
            "success":false,
            "msg":"upload failed"            
        });
    }
    else{
        res.send({
            "success":true,
            "msg":"upload successful",
            "downLink":req.downURL
        });
    }
});

app.get("/download/:fileId", (req, res)=>{    
    const fileId = req.params.fileId;
    const fileDir = path.join(__dirname, '/src/uploads/', fileId);
    if( !existsSync(fileDir) ){
        res.status(400).type('json').send({
            "error":{
                "msg":"Invalid Link"
            }
        });
        return;
    }

    const fileName = readdirSync(fileDir)[0];
    if( typeof(fileName) == 'undefined' ){
        res.status(400).type('json').send({
            "error":{
                "msg":"This link has already been used"
            }
        });
        return;
    }

    const filePath = path.join(fileDir, fileName);    

    res.set("Content-Disposition", "attachment;filename=" + fileName);
    res.set("Content-Type", "application/octet-stream");
    res.sendFile(filePath, (err)=>{
        if(err){
            console.log(err);
        }
        else{
            unlinkSync(filePath);
        }
    });    
});

app.listen(port,()=>console.log("Listening on port " + port));