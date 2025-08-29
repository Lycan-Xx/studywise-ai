// Type definitions for mammoth.js
declare module 'mammoth' {
  export interface ConvertToHtmlOptions {
    styleMap?: string[];
    includeDefaultStyleMap?: boolean;
  }

  export interface MammothResult {
    value: string; // HTML string
    messages: Array<{ type: string; message: string }>;
  }

  export function convertToHtml(
    input: ArrayBuffer | Uint8Array | { read: () => Promise<ArrayBuffer> },
    options?: ConvertToHtmlOptions
  ): Promise<MammothResult>;
}