const express = require("express");
const fileUpload = require("express-fileupload");
const pdfParse = require("pdf-parse");
const app = express();


app.use("/",express.static("public"));
app.use(fileUpload());

app.post("/extract-text", (req, res) => {
    if (!req.files || !req.files.pdfFile) {
        res.status(400).send("No file uploaded");
        return;
    }

    const files = Array.isArray(req.files.pdfFile) ? req.files.pdfFile : [req.files.pdfFile];
    const promises = files.map(file => pdfParse(file));

    Promise.all(promises).then(results => {
        const extractedTexts = results.map(result => result.text).join("\n\n");
        res.send(extractedTexts);
    }).catch(error => {
        res.status(500).send("Error processing files");
    });
});



app.listen(8000);