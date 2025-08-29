// src/utils/documentProcessor.ts
import type { ExtractResult } from "mammoth";
import type { PDFDocumentProxy, TextContent } from "pdfjs-dist";
import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";

/**
 * DocumentProcessor
 * Handles .txt, .md, .docx, and .pdf files.
 * PDF worker is configured for Vite by serving from /public/pdf.worker.min.js
 */
export class DocumentProcessor {
  private static mammoth: any = null;

  /**
   * Dynamically load mammoth.js for DOCX
   */
  private static async loadMammoth() {
    if (!this.mammoth) {
      try {
        this.mammoth = await import("mammoth");
      } catch (err) {
        console.error("Failed to load mammoth.js:", err);
        throw new Error("DOCX processing not available.");
      }
    }
    return this.mammoth;
  }

  /**
   * Set PDF.js worker to Vite public path
   */
  private static configurePdfWorker() {
    // Must be served from /public/pdf.worker.min.js
    GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
  }

  /**
   * Process DOCX file
   */
  private static async processDocx(file: File): Promise<string> {
    const mammoth = await this.loadMammoth();
    const arrayBuffer = await file.arrayBuffer();
    const result: ExtractResult = await mammoth.extractRawText({ arrayBuffer });
    if (result.messages.length > 0) {
      console.warn("DOCX warnings:", result.messages);
    }
    return result.value.trim();
  }

  /**
   * Process PDF file
   */
  private static async processPdf(file: File): Promise<string> {
    this.configurePdfWorker();

    const arrayBuffer = await file.arrayBuffer();
    const pdf: PDFDocumentProxy = await getDocument({ data: arrayBuffer }).promise;

    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent: TextContent = await page.getTextContent();
      const pageText = textContent.items.map((item) => item.str).join(" ");
      fullText += pageText + "\n\n";
    }

    return fullText.trim();
  }

  /**
   * Process text-based files (.txt, .md)
   */
  private static async processText(file: File): Promise<string> {
    const text = await file.text();
    return text.trim();
  }

  /**
   * Main processing function
   */
  public static async processFile(file: File): Promise<string> {
    const extension = file.name.toLowerCase().split(".").pop();

    try {
      switch (extension) {
        case "docx":
          return await this.processDocx(file);
        case "pdf":
          return await this.processPdf(file);
        case "txt":
        case "md":
        case "markdown":
          return await this.processText(file);
        default:
          return await this.processText(file); // fallback
      }
    } catch (err) {
      console.error(`Failed to process ${file.name}:`, err);
      // fallback: try reading as text
      try {
        const fallback = await file.text();
        if (fallback.trim()) return fallback.trim();
        throw new Error("No content found in file");
      } catch {
        throw new Error(`Failed to process ${file.name}: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    }
  }

  /**
   * Supported file types
   */
  public static getSupportedExtensions(): string[] {
    return ["txt", "md", "markdown", "docx", "pdf"];
  }

  public static isSupported(file: File): boolean {
    const extension = file.name.toLowerCase().split(".").pop();
    return this.getSupportedExtensions().includes(extension || "");
  }
}
