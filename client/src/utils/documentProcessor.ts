// @/utils/documentProcessor.ts
import * as pdfjsLib from "pdfjs-dist";

// Configure PDF.js worker with optimized hybrid approach
const LOCAL_URL = '/pdf.worker.min.mjs';

// Use a reliable CDN version that's widely available
// Version 3.11.174 is well-supported and stable
const RELIABLE_CDN_VERSION = '3.11.174';
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
      
      const pdf = await pdfjsLib.getDocument({
        data: arrayBuffer
      }).promise;

      let fullText = '';
      
      // Extract text from all pages
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        try {
          const page = await pdf.getPage(pageNum);
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
   * Process DOCX files (basic implementation)
   * Note: This is a simplified version. For production use, consider using mammoth.js or similar
   */
  private static async processDocx(file: File): Promise<string> {
    // For now, throw an error suggesting alternatives
    // In production, you'd want to implement proper DOCX parsing
    throw new Error('DOCX processing requires additional setup. Please convert to PDF or plain text first.');
    
    // If you want to implement DOCX support, you could use:
    // 1. mammoth.js (npm install mammoth)
    // 2. docx-preview (npm install docx-preview)
    // 3. Convert to HTML first then extract text
  }
}