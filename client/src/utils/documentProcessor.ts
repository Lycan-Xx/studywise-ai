// @/utils/documentProcessor.ts
import * as pdfjsLib from "pdfjs-dist";

// ─── Heading detection types ───────────────────────────────────────────────────

/**
 * A structural heading detected in the source document before AI processing.
 * Passing these to the server lets the AI confirm structure rather than guess it.
 */
export interface DetectedHeading {
  text: string;
  /** 1 = major (H1 / Chapter), 2 = section (H2), 3 = subsection (H3) */
  level: number;
  /** Character offset in the full extracted text string */
  position: number;
}

/**
 * What processFile now returns — text plus any structural hints we could extract
 * for free from the document format (docx HTML tags, markdown #, numbered sections).
 */
export interface ProcessedDocument {
  text: string;
  headings: DetectedHeading[];
  /** How headings were found — lets the server know how much to trust them */
  detectionMethod: 'html' | 'markdown' | 'heuristic' | 'none';
}

// Configure PDF.js worker with optimized hybrid approach
const LOCAL_URL = '/pdf.worker.min.mjs';

// CRITICAL: Prefer using runtime pdfjs-dist version when available
// Mismatch between API and Worker versions causes: "The API version X does not match the Worker version Y"
const RUNTIME_PDFJS_VERSION = (pdfjsLib && (pdfjsLib as any).version) ? (pdfjsLib as any).version : '5.4.54';
const RELIABLE_CDN_VERSION = RUNTIME_PDFJS_VERSION;
const CDN_URL = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${RELIABLE_CDN_VERSION}/pdf.worker.min.js`;

// For optimal performance and reliability:
// - Use CDN in production for better caching and performance
// - Use local in development for consistency and offline work

// Check if we're in development mode (Vite-specific)
// @ts-ignore - import.meta.env might not be defined in all environments
const isDevelopment = typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'development';

if (isDevelopment) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = LOCAL_URL;
  console.log('PDF.js worker configured for development (local):', LOCAL_URL);
} else {
  pdfjsLib.GlobalWorkerOptions.workerSrc = CDN_URL;
  console.log('PDF.js worker configured for production (CDN):', CDN_URL);
  console.log('Local fallback available at:', LOCAL_URL);
}

export class DocumentProcessor {
  /**
   * Soft cap on upload size, enforced client-side before any parsing begins.
   * 15MB comfortably covers a scanned lecture note or a large DOCX with embedded
   * images, while protecting low-RAM devices (common in the African market this
   * app targets first) from a browser tab crash during PDF.js/mammoth parsing.
   */
  private static readonly MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

  /**
   * Check if a file type is supported
   */
  static isSupported(file: File): boolean {
    const supportedTypes = [
      'text/plain',
      'text/markdown',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];
    
    const supportedExtensions = ['.txt', '.md', '.pdf', '.docx', '.doc'];
    
    return supportedTypes.includes(file.type) || 
           supportedExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
  }

  /**
   * Process different file types and extract text + structural headings.
   * Returns a ProcessedDocument instead of a plain string so callers can pass
   * detected headings to the server as module boundary hints.
   */
  static async processFile(file: File): Promise<ProcessedDocument> {
    // Guard BEFORE any parsing starts — reading a 15MB+ file into an ArrayBuffer
    // and running pdfjs-dist/mammoth over it can spike well past what a budget
    // Android device's browser tab can hold without crashing.
    if (file.size > this.MAX_FILE_SIZE) {
      const sizeMb = (file.size / 1024 / 1024).toFixed(1);
      const capMb = (this.MAX_FILE_SIZE / 1024 / 1024).toFixed(0);
      throw new Error(
        `This file is ${sizeMb}MB — please upload files under ${capMb}MB. ` +
        `Try splitting large documents into chapters, or compress scanned PDFs before uploading.`
      );
    }

    try {
      if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
        return await this.processTextFile(file);
      } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        return await this.processPdf(file);
      } else if (file.name.endsWith('.docx') || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        return await this.processDocx(file);
      } else {
        throw new Error(`Unsupported file type: ${file.type || 'unknown'}`);
      }
    } catch (error) {
      console.error('Error processing file:', error);
      throw error;
    }
  }

  // ─── Heading extraction helpers ─────────────────────────────────────────────

  /**
   * Extract headings from mammoth's HTML output (<h1>–<h4> tags).
   * This is the most reliable method — DOCX heading styles map directly to HTML tags.
   */
  private static extractHeadingsFromHtml(html: string, fullText: string): DetectedHeading[] {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const headings: DetectedHeading[] = [];
    let searchFrom = 0;

    doc.body.childNodes.forEach(node => {
      const el = node as HTMLElement;
      if (!el.tagName) return;

      const tag = el.tagName.toLowerCase();
      const text = el.textContent?.trim() || '';

      if (['h1', 'h2', 'h3', 'h4'].includes(tag) && text.length > 0) {
        const level = parseInt(tag[1]);
        // Find the heading's position in the extracted plain text
        const position = fullText.indexOf(text, searchFrom);
        headings.push({
          text,
          level,
          position: position >= 0 ? position : searchFrom,
        });
        if (position >= 0) searchFrom = position + text.length;
      }
    });

    return headings;
  }

  /**
   * Extract headings from plain text / markdown using pattern matching.
   * Handles: # markdown, numbered sections, Chapter/Section/Unit/Topic prefixes,
   * and ALL-CAPS short lines (common in handwritten or scan-converted notes).
   */
  private static extractHeadingsFromText(text: string): {
    headings: DetectedHeading[];
    method: 'markdown' | 'heuristic' | 'none';
  } {
    const headings: DetectedHeading[] = [];
    let offset = 0;
    let foundMarkdown = false;

    for (const line of text.split('\n')) {
      const trimmed = line.trim();

      // Markdown headings: #, ##, ###
      const mdMatch = trimmed.match(/^(#{1,3})\s+(.+)/);
      if (mdMatch) {
        foundMarkdown = true;
        headings.push({
          text: mdMatch[2].trim(),
          level: mdMatch[1].length,
          position: offset,
        });
      } else {
        // Numbered section: "1.", "2.1", "1.2.3  Title"
        const numberedMatch = trimmed.match(/^(\d+(?:\.\d+)*)\s{1,4}([A-Z].{2,60})$/);
        if (numberedMatch) {
          const dots = (numberedMatch[1].match(/\./g) || []).length;
          headings.push({ text: trimmed, level: Math.min(dots + 1, 3), position: offset });
        }
        // Chapter / Section / Unit / Topic / Part prefix
        else if (/^(chapter|section|unit|topic|part)\s+\d+/i.test(trimmed) && trimmed.length < 80) {
          headings.push({ text: trimmed, level: 1, position: offset });
        }
        // ALL-CAPS short line — typical in handwritten / low-fidelity scans
        else if (
          /^[A-Z][A-Z\s\d\-:]{3,50}$/.test(trimmed) &&
          trimmed.split(' ').length <= 8 &&
          trimmed.split(' ').length >= 2
        ) {
          headings.push({ text: trimmed, level: 2, position: offset });
        }
      }

      offset += line.length + 1; // +1 for the newline
    }

    if (headings.length === 0) return { headings: [], method: 'none' };
    return { headings, method: foundMarkdown ? 'markdown' : 'heuristic' };
  }

  /**
   * Process plain text / markdown files.
   * Extracts markdown headings (#, ##, ###) and heuristic section markers.
   */
  private static async processTextFile(file: File): Promise<ProcessedDocument> {
    const text = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string || '');
      reader.onerror = () => reject(new Error('Failed to read text file'));
      reader.readAsText(file);
    });

    const { headings, method } = this.extractHeadingsFromText(text);
    console.log(`📑 Text/MD heading detection (${method}): ${headings.length} headings found`);

    return { text, headings, detectionMethod: method };
  }

  /**
   * Process PDF files using PDF.js.
   * After text extraction, runs heuristic heading detection on the result.
   * (PDF.js exposes font-size metadata per item but it requires canvas rendering —
   *  heuristic pattern matching gives us 80% of the value at zero extra cost.)
   */
  private static async processPdf(file: File): Promise<ProcessedDocument> {
    try {
      // Convert file to ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Load the PDF document
      console.log('PDF.js workerSrc:', pdfjsLib.GlobalWorkerOptions.workerSrc);
      console.log('PDF.js version:', pdfjsLib.version);
      
      // Try loading the PDF document. If worker/API version mismatch occurs, fallback to local worker
      try {
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        // proceed only if successful
        var loadedPdf = pdf;
      } catch (e) {
        console.warn('PDF.js initial load error, attempting fallback to local worker...', e);

        // Parse workerSrc to extract worker version if possible
        try {
          const workerSrc = pdfjsLib.GlobalWorkerOptions.workerSrc || '';
          const versionMatch = workerSrc.match(/pdf.js\/(\d+\.\d+\.\d+)\//);
          const workerVersion = versionMatch ? versionMatch[1] : null;
          if (workerVersion && pdfjsLib.version && workerVersion !== pdfjsLib.version) {
            console.warn(`PDF.js API version: ${pdfjsLib.version}, Worker version: ${workerVersion} (mismatch). Using local worker as fallback.`);
          }
        } catch (parseErr) {
          console.warn('Could not parse worker version from workerSrc', parseErr);
        }

        // Force local worker as a safe fallback and retry
        pdfjsLib.GlobalWorkerOptions.workerSrc = LOCAL_URL;
        console.log('PDF.js worker fallback set to local worker:', LOCAL_URL);

        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        var loadedPdf = pdf;
      }

      let fullText = '';
      
      // Extract text from all pages
  for (let pageNum = 1; pageNum <= (loadedPdf as any).numPages; pageNum++) {
        try {
          const page = await (loadedPdf as any).getPage(pageNum);
          const textContent = await page.getTextContent();
          
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();
          
          if (pageText) {
            fullText += (fullText ? '\n\n' : '') + pageText;
          }
        } catch (pageError) {
          console.warn(`Error processing page ${pageNum}:`, pageError);
          continue; // Skip problematic pages
        }
      }

      if (!fullText.trim()) {
        throw new Error('No text content found in PDF. The PDF might contain only images or be password protected.');
      }

      const { headings, method } = this.extractHeadingsFromText(fullText);
      console.log(`📑 PDF heading detection (${method}): ${headings.length} headings found`);

      return { text: fullText, headings, detectionMethod: method };
    } catch (error) {
      console.error('PDF processing error:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to process PDF: ${error.message}`);
      }
      throw new Error('Failed to process PDF file');
    }
  }

  /**
   * Process DOCX files using mammoth.js.
   * mammoth converts to HTML which preserves heading levels (h1–h4) — we extract
   * those before discarding the HTML, giving us the most reliable heading data
   * of all three formats.
   */
  private static async processDocx(file: File): Promise<ProcessedDocument> {
    try {
      const mammoth = await import('mammoth');
      const arrayBuffer = await file.arrayBuffer();

      // convertToHtml preserves heading tags; extractRawText strips them — use HTML
      const result = await mammoth.convertToHtml({ arrayBuffer } as any);

      if (result.messages && result.messages.length > 0) {
        console.warn('Mammoth conversion warnings:', result.messages);
      }

      // Extract plain text from HTML for the content field
      const parser = new DOMParser();
      const htmlDoc = parser.parseFromString(result.value, 'text/html');
      const text = htmlDoc.body.innerText || htmlDoc.body.textContent || '';

      if (!text.trim()) {
        throw new Error('No text content found in DOCX. The file might be empty or corrupted.');
      }

      // Extract headings from the HTML before we discard it
      const headings = this.extractHeadingsFromHtml(result.value, text);
      console.log(`📑 DOCX heading detection (html): ${headings.length} headings found`);

      // If no HTML headings found, fall back to heuristic scan of the plain text
      if (headings.length === 0) {
        const { headings: fallbackHeadings, method } = this.extractHeadingsFromText(text);
        console.log(`📑 DOCX fallback heading detection (${method}): ${fallbackHeadings.length} headings found`);
        return { text, headings: fallbackHeadings, detectionMethod: method };
      }

      return { text, headings, detectionMethod: 'html' };
    } catch (error) {
      console.error('DOCX processing error:', error);
      if (error instanceof Error) {
        if (error.message.includes('mammoth')) {
          throw new Error('DOCX processing library not loaded. Please refresh the page and try again.');
        }
        throw new Error(`Failed to process DOCX: ${error.message}`);
      }
      throw new Error('Failed to process DOCX file');
    }
  }
}