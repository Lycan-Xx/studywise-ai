// Type definitions for pdfjs-dist
declare module 'pdfjs-dist' {
  export interface GlobalWorkerOptions {
    workerSrc: string;
  }

  export const GlobalWorkerOptions: GlobalWorkerOptions;
  export const version: string;

  export interface PDFDocumentLoadingTask {
    promise: Promise<PDFDocumentProxy>;
  }

  export interface PDFDocumentProxy {
    numPages: number;
    getPage(pageNumber: number): Promise<PDFPageProxy>;
  }

  export interface PDFPageProxy {
    getTextContent(): Promise<TextContent>;
    getViewport(params: { scale: number }): PageViewport;
  }

  export interface PageViewport {
    width: number;
    height: number;
  }

  export interface TextContent {
    items: Array<TextItem>;
  }

  export interface TextItem {
    str: string;
    dir: string;
    width: number;
    height: number;
    transform: number[];
    fontName: string;
  }

  export interface DocumentInitParameters {
    data?: ArrayBuffer | Uint8Array;
    url?: string;
    httpHeaders?: Record<string, string>;
    withCredentials?: boolean;
    password?: string;
    length?: number;
    range?: { begin: number; end: number };
  }

  export function getDocument(src: DocumentInitParameters): PDFDocumentLoadingTask;
}