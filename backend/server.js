// import express from "express";
// import fetch from "node-fetch";
// import cors from "cors";

// const app = express();
// const port = 3333;

// const corsOptions = {
//   origin: "*",
//   optionsSuccessStatus: 200,
// };
// app.use(cors(corsOptions));

// app.get("/fetch-job", async (req, res) => {
//   const jobUrl = req.query.url;
//   const response = await fetch(jobUrl);
//   const html = await response.text();
//   res.send(html);
// });

// app.listen(port, () => console.log(`Listening on PORT:${port}...`));

//===================
import express from "express";
//const express = require("express");
import fetch from "node-fetch";
//const fetch = require("node-fetch");
import cors from "cors";
//const cors = require("cors");
import fileUpload from "express-fileupload";
//const fileUpload = require("express-fileupload");
import mammoth from "mammoth";
//const mammoth = require("mammoth");
import { PDFParse } from "pdf-parse";
//import multer from "multer";

// import { createRequire } from "module";
// const require = createRequire(import.meta.url);
// const pdfParse = require("pdf-parse");

// async function extractPdfText(buffer) {
//   const data = await pdfParse(buffer);
//   return data.text;
// }

const app = express();
const port = 3333;

const corsOptions = {
  origin: "*",
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(fileUpload());

//const upload = multer({ storage: multer.memoryStorage() });

function normalizeText(rawText) {
  return rawText
    .replace(/\r\n/g, "\n") // unify line endings
    .replace(/\n{2,}/g, "\n") // collapse multiple blank lines
    .replace(/\s+/g, " ") // collapse multiple spaces/tabs
    .trim(); // remove leading/trailing whitespace
}

function normalizeAndTagText(rawText) {
  const text = normalizeText(rawText);
  const sections = [
    "Education",
    "Experience",
    "Work Experience",
    "Skills",
    "Projects",
    "Certifications",
    "Awards",
    "Publications",
  ];
  const tagged = {};
  let currentSection = "General";
  text.split(/\n/).forEach((line) => {
    const match = sections.find((sec) =>
      line.toLowerCase().includes(sec.toLowerCase()),
    );
    if (match) {
      currentSection = match;
      tagged[currentSection] = [];
    } else {
      if (!tagged[currentSection]) tagged[currentSection] = [];
      tagged[currentSection].push(line);
    }
  });
  for (const key in tagged) {
    tagged[key] = tagged[key].join(" ").trim();
  }
  return { normalized: text, sections: tagged };
}

// --- Job URL Fetch ---
app.get("/fetch-job", async (req, res) => {
  const jobUrl = req.query.url;
  const response = await fetch(jobUrl);
  const html = await response.text();
  res.send(html);
});

// --- CV Upload ---
app.post("/upload-cv", async (req, res) => {
  if (!req.files || !req.files.cv || Object.keys(req.files).length === 0) {
    return res.status(400).send({ success: false, error: "No CV uploaded" });
  }

  const cvFile = req.files.cv;

  try {
    let text = "";

    if (cvFile.name.endsWith(".docx")) {
      const result = await mammoth.extractRawText({ buffer: cvFile.data });
      text = result.value;
      // res.send({ success: true, text: result.value });
    } else if (cvFile.name.endsWith(".pdf")) {
      const parser = new PDFParse({ data: cvFile.data });

      const result = await parser.getText();

      text = result.text;
      // text = textResult.text; //result.text;
      // res.send({ success: true, text: result.text });
    } else if (cvFile.name.endsWith(".txt")) {
      text = cvFile.data.toString("utf-8");
      //res.send({ success: true, text: cvFile.data.toString("utf-8") });
    } else {
      return res.send({ success: false, error: "Unsupported document format" });
    }
    const processed = normalizeAndTagText(text);
    res.send({
      success: true,
      text: processed.normalized,
      sections: processed.sections,
    });
    // const cleanText = normalizeText(text);
    // res.send({ success: true, text: cleanText });
  } catch (err) {
    res.status(500).send({ success: false, error: err.message });
  }
});

app.listen(port, () => console.log(`Listening on PORT:${port}...`));
