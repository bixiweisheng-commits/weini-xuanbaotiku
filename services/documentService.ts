import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Configure PDF.js worker
// CRITICAL FIX: We strictly match the version to avoid "GlobalWorkerOptions" errors or "fake worker" warnings on cloud deployments.
// We use esm.sh which handles the module format correctly.
const PDFJS_VERSION = '4.10.38'; // Matches a stable modern version, or use pdfjsLib.version if available at runtime
// Fallback to the library's reported version if possible, otherwise use a known good CDN version
const version = pdfjsLib.version || PDFJS_VERSION;
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;

export const extractTextFromFile = async (file: File): Promise<string> => {
  const fileType = file.type;

  try {
    if (fileType === 'application/pdf') {
      return await extractTextFromPDF(file);
    } else if (
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.name.endsWith('.docx')
    ) {
      return await extractTextFromDocx(file);
    } else {
      throw new Error('不支持的文件格式。请上传 PDF 或 DOCX 文件。');
    }
  } catch (error) {
    console.error('Error extracting text:', error);
    throw new Error('无法读取文档内容，请检查文件是否损坏或受密码保护。');
  }
};

const extractTextFromPDF = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
    }

    return fullText;
  } catch (e) {
    console.error("PDF Parsing detailed error:", e);
    throw new Error("PDF 解析失败。如果是云端部署，可能是Worker跨域问题。");
  }
};

const extractTextFromDocx = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
};