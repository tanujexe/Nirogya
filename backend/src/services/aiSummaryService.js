const fs = require('fs');
const path = require('path');
const axios = require('axios');
const Tesseract = require('tesseract.js');
const pdfParseLib = require('pdf-parse');

/**
 * Robust helper to parse PDF text across different pdf-parse versions (v1 and v2)
 */
/**
 * Robust helper to parse PDF text across different pdf-parse versions (v1 and v2)
 */
const parsePdfText = async (buffer) => {
  // console.log("Starting PDF text extraction...");
  if (!buffer) return { text: '' };
  
  // Try modern class-based API first (v2.x)
  const PDFParseExport = pdfParseLib.PDFParse || pdfParseLib;
  
  if (typeof PDFParseExport === 'function') {
    try {
      // Attempt to instantiate with 'new'
      const parser = new PDFParseExport({ data: buffer });
      if (parser.getText) {
        return await parser.getText();
      }
    } catch (e) {
      // If it failed because it's NOT a class, or for other reasons, fall back
      if (!e.message.includes('not a constructor') && !e.message.includes('invoked without \'new\'')) {
        console.warn("PDF class parse failed:", e.message);
      }
    }
    
    // Fallback to traditional function call (v1.x)
    try {
      return await pdfParseLib(buffer);
    } catch (e) {
      if (e.message.includes('invoked without \'new\'')) {
        // One last try with 'new' on the main export if it wasn't a constructor on PDFParseExport
        const parser = new pdfParseLib({ data: buffer });
        return await parser.getText();
      }
      throw e;
    }
  }
  
  // Fallback for ESM-style default exports
  if (pdfParseLib.default && typeof pdfParseLib.default === 'function') {
    return await pdfParseLib.default(buffer);
  }

  throw new Error("Compatible pdf-parse library not found");
};
const Groq = require('groq-sdk');
const MedicalRecord = require('../models/MedicalRecord');
const env = require('../config/env');
const { cloudinary } = require('../config/cloudinary');

let groq = null;

const getGroqClient = () => {
  const apiKey = env.GROQ_API_KEY || process.env.GROQ_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!groq) {
    groq = new Groq({ apiKey });
  }
  return groq;
};

/**
 * Downloads a file from URL to buffer
 */
const downloadFile = async (url, cloudinaryId, fileType) => {
  // 1. Try authenticated Cloudinary private download URL first (bypasses Cloudinary PDF delivery restrictions)
  if (cloudinaryId && (url?.includes('cloudinary.com') || fileType === 'application/pdf')) {
    try {
      const resourceType = url?.includes('/raw/upload') ? 'raw' : 'image';
      const format = fileType === 'application/pdf' ? 'pdf' : undefined;
      const dlUrl = cloudinary.utils.private_download_url(cloudinaryId, format, {
        resource_type: resourceType,
        type: 'upload',
      });
      const response = await axios({
        url: dlUrl,
        method: 'GET',
        responseType: 'arraybuffer',
        timeout: 30000,
      });
      if (response.data && response.data.length > 0) {
        return response.data;
      }
    } catch (authError) {
      console.warn('Private download URL attempt failed, trying direct URL:', authError.message);
    }
  }

  // 2. Direct URL fallback
  try {
    let fetchUrl = url;

    if (fetchUrl && fetchUrl.startsWith('//')) {
      fetchUrl = 'https:' + fetchUrl;
    } else if (fetchUrl && !fetchUrl.startsWith('http')) {
      return fs.readFileSync(fetchUrl);
    }

    const response = await axios({
      url: fetchUrl,
      method: 'GET',
      responseType: 'arraybuffer',
      timeout: 30000
    });
    return response.data;
  } catch (error) {
    console.error("Download Error:", error.message, "URL:", url);
    throw error;
  }
};

/**
 * Extracts text from an image or PDF buffer
 * If direct PDF parse is available, use it; otherwise fallback to image-conversion OCR trick
 */
const extractText = async (buffer, mimeType, cloudinaryId, fileUrl) => {
  const isCloudinary = fileUrl && fileUrl.includes('cloudinary.com');
  const isPdf = mimeType === 'application/pdf';
  const isRaw = fileUrl && fileUrl.includes('/raw/upload');

  // CASE 1: Standard PDF parsing (Fast and accurate when buffer is available)
  if (isPdf && buffer) {
    try {
      const data = await parsePdfText(buffer);
      if (data && data.text && data.text.trim().length > 20) {
        return data.text;
      }
    } catch (parseErr) {
      console.warn('PDF parse failed, falling back to OCR if available:', parseErr.message);
    }
  }

  // CASE 2: Cloudinary "Image" Type PDF fallback using JPG OCR trick
  if (isPdf && isCloudinary && !isRaw && cloudinaryId) {
    console.log("Using Cloudinary image-conversion OCR trick...");
    let fullText = '';
    for (let page = 1; page <= 3; page++) {
      try {
        const jpgUrl = cloudinary.url(cloudinaryId + '.jpg', {
          resource_type: 'image',
          page,
          sign_url: true,
          secure: true
        });
        
        const response = await axios.get(jpgUrl, { responseType: 'arraybuffer' });
        const result = await Tesseract.recognize(response.data, 'eng');
        fullText += `\n--- Page ${page} ---\n` + result.data.text;
      } catch (err) {
        console.log(`Stop at page ${page}: ${err.message}`);
        break;
      }
    }
    
    if (fullText.trim().length > 0) {
      return fullText;
    }
  }

  // CASE 3: Image OCR
  if (mimeType.startsWith('image/') && buffer) {
    const result = await Tesseract.recognize(buffer, 'eng');
    return result.data.text;
  }

  throw new Error('Unable to extract text from document. Please ensure the document is clear.');
};

/**
 * Generates summary using Groq
 */
const generateSummary = async (extractedText) => {
  const client = getGroqClient();
  if (!client) {
    throw new Error('Groq API Key is not configured. Please add GROQ_API_KEY to your .env file.');
  }

  const prompt = `
You are an AI healthcare assistant.
Analyze the uploaded medical report and generate a patient-friendly educational summary.

Return:
- Key findings
- Abnormal values
- Severity indicators
- Suggested specialist
- Easy explanation for non-medical users

Avoid making direct diagnosis claims.
Avoid fear-inducing language.
Keep response medically responsible.
Use clean structured JSON format EXACTLY like this:
{
  "keyFindings": ["finding 1", "finding 2"],
  "abnormalValues": ["value 1", "value 2"],
  "severityLevel": "Low/Medium/High/Unknown",
  "suggestedSpecialist": "specialist name",
  "explanation": "easy explanation"
}

Here is the extracted text from the report:
${extractedText.substring(0, 8000)}
`;

  const availableModels = ['openai/gpt-oss-20b', 'qwen/qwen3.8-27b', 'openai/gpt-oss-120b'];
  let lastError = null;

  for (const model of availableModels) {
    try {
      const chatCompletion = await client.chat.completions.create({
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        model,
        temperature: 0.2,
        response_format: { type: "json_object" }
      });

      const responseText = chatCompletion.choices[0]?.message?.content;
      if (responseText) {
        return JSON.parse(responseText);
      }
    } catch (err) {
      console.warn(`Groq model ${model} failed, trying next:`, err.message);
      lastError = err;
    }
  }

  throw new Error('Failed to generate summary: ' + (lastError ? lastError.message : 'Unknown AI error'));
};

exports.summarizeRecord = async (recordId, userId) => {
  const record = await MedicalRecord.findById(recordId);

  if (!record) {
    throw new Error('Record not found');
  }

  // Authorize user (or if admin, let it pass, but typically only owner)
  if (record.userId.toString() !== userId.toString()) {
    throw new Error('Not authorized to summarize this record');
  }

  // 1. If summary already generated, return early
  if (record.summaryGenerated && record.aiSummary) {
    return record.aiSummary;
  }

  // 2. Download File
  let buffer = null;
  try {
    buffer = await downloadFile(record.fileUrl, record.cloudinaryId, record.fileType);
  } catch (error) {
    // If it's a Cloudinary PDF, we can still proceed using the image-conversion trick in extractText
    if (record.fileType === 'application/pdf' && record.cloudinaryId && record.fileUrl.includes('cloudinary.com')) {
      console.warn('Initial PDF download failed (401), but will try image-conversion trick...');
    } else {
      throw new Error('Failed to download record file: ' + error.message);
    }
  }

  // 3. Extract Text
  let extractedText;
  try {
    extractedText = await extractText(buffer, record.fileType, record.cloudinaryId, record.fileUrl);
  } catch (error) {
    throw new Error('Failed to extract text from record: ' + error.message);
  }

  if (!extractedText || extractedText.trim().length === 0) {
    throw new Error('No text could be extracted from this document.');
  }

  // 4. Generate AI Summary
  let summary;
  try {
    summary = await generateSummary(extractedText);
  } catch (error) {
    throw new Error('Failed to generate AI summary: ' + error.message);
  }

  // 5. Save to MongoDB
  record.extractedText = extractedText;
  record.aiSummary = summary;
  record.summaryGenerated = true;
  await record.save();

  return summary;
};
