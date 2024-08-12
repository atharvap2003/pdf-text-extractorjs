require('dotenv').config();
const express = require("express");
const fileUpload = require("express-fileupload");
const pdfParse = require("pdf-parse");
const app = express();

app.use("/", express.static("public"));
app.use(fileUpload());

app.post("/extract-text", (req, res) => {
  if (!req.files || !req.files.pdfFiles) {
    res.status(400).send("No file uploaded");
    return;
  }

  const files = Array.isArray(req.files.pdfFiles)
    ? req.files.pdfFiles
    : [req.files.pdfFiles];
  const promises = files.map((file) =>
    pdfParse(file).then((result) => ({
      filename: file.name,
      text: result.text.replace(/(\n\s*\n)+/g, "\n"), // Add 4 line breaks for page breaks or multiple consecutive line breaks
    }))
  );

  Promise.all(promises)
    .then((extractedTexts) => {
      res.json(extractedTexts);
    })
    .catch((error) => {
      res.status(500).send("Error processing files");
    });

});
app.listen(8000);
