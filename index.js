require('dotenv').config();
const express = require("express");
const fileUpload = require("express-fileupload");
const pdfParse = require("pdf-parse");
const app = express();

const { Client } = require("@octoai/client");
const client = new Client(process.env.OCTOAI_TOKEN);


async function summarizeText(client, text) {

  const completion = await client.chat.completions.create({
    model: "llama-2-13b-chat-fp16",
    messages: [
      {
        role: "system",
        content: "Summarize the following text in the best possible way with each section point wise!",
      },
      {
        role: "user",
        content: "Text Content: \n" + text,
      },
    ],
  });

  return completion.choices[0].message.content;
}

app.use("/", express.static("public"));
app.use(fileUpload());

app.post("/extract-text", async (req, res) => {
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

  try {
    const extractedTexts = await Promise.all(promises);
    
    // Summarize each extracted text
    const summaryPromises = extractedTexts.map(async (extracted) => {
      const summary = await summarizeText(client, extracted.text);
      return {
        filename: extracted.filename,
        summary: summary,
      };
    });

    const summaries = await Promise.all(summaryPromises);
    
    res.json(summaries);
  } catch (error) {
    res.status(500).send("Error processing files");
  }
});

app.listen(8000, () => {
  console.log("Server started on port 8000");
});
