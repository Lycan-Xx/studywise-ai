// @/utils/documentProcessor.ts
import * as pdfjsLib from "pdfjs-dist";

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
   * Process different file types and extract text
   */
  static async processFile(file: File): Promise<string | null> {
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

  /**
   * Process plain text files
   */
  private static async processTextFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string || '');
      reader.onerror = () => reject(new Error('Failed to read text file'));
      reader.readAsText(file);
    });
  }

  /**
   * Process PDF files using PDF.js
   */
  private static async processPdf(file: File): Promise<string> {
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

      return fullText;
    } catch (error) {
      console.error('PDF processing error:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to process PDF: ${error.message}`);
      }
      throw new Error('Failed to process PDF file');
    }
  }

  /**
   * Process DOCX files using mammoth.js
   */
  private static async processDocx(file: File): Promise<string> {
    try {
      // Dynamically import mammoth to avoid loading it when not needed
      const mammoth = await import('mammoth');
      
      // Convert file to ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Convert DOCX to HTML using mammoth
      const result = await mammoth.convertToHtml({
        arrayBuffer: arrayBuffer
      });
      
      // Extract plain text from HTML
      // Create a temporary div to parse HTML and extract text content
      const parser = new DOMParser();
      const htmlDoc = parser.parseFromString(result.value, 'text/html');
      const text = htmlDoc.body.innerText || htmlDoc.body.textContent || '';
      
      if (!text.trim()) {
        throw new Error('No text content found in DOCX. The file might be empty or corrupted.');
      }
      
      // Log any conversion messages/warnings
      if (result.messages && result.messages.length > 0) {
        console.warn('Mammoth conversion warnings:', result.messages);
      }
      
      return text;
    } catch (error) {
      console.error('DOCX processing error:', error);
      if (error instanceof Error) {
        // Check if mammoth import failed
        if (error.message.includes('mammoth')) {
          throw new Error('DOCX processing library not loaded. Please refresh the page and try again.');
        }
        throw new Error(`Failed to process DOCX: ${error.message}`);
      }
      throw new Error('Failed to process DOCX file');
    }
  }
}