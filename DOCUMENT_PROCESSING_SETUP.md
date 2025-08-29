# Document Processing Setup Guide

This guide walks you through setting up mammoth.js and pdf.js for processing DOCX and PDF files in your React application.

## 1. Install Required Packages

Run these commands in your project root:

```bash
# Install mammoth.js for DOCX processing
npm install mammoth

# Install pdf.js for PDF processing  
npm install pdfjs-dist

# Install type definitions (optional but recommended)
npm install --save-dev @types/mammoth
```

## 2. Package Overview

### Mammoth.js
- **Purpose**: Converts Microsoft Word (.docx) documents to HTML or plain text
- **Size**: ~200KB minified
- **Browser Support**: Modern browsers with ArrayBuffer support
- **Documentation**: https://github.com/mwilliamson/mammoth.js

### PDF.js
- **Purpose**: Renders PDF files and extracts text content
- **Size**: ~500KB minified (includes worker)
- **Browser Support**: All modern browsers
- **Documentation**: https://mozilla.github.io/pdf.js/

## 3. Implementation Architecture

### DocumentProcessor Utility
We've created a centralized `DocumentProcessor` class that:
- Dynamically imports libraries only when needed
- Handles different file types uniformly
- Provides fallback error handling
- Supports future extension for new file types

### Key Features:
- **Lazy Loading**: Libraries are only loaded when needed
- **Error Handling**: Graceful fallbacks for unsupported files
- **Type Safety**: TypeScript definitions included
- **Extensible**: Easy to add new file type support

## 4. Supported File Types

| Extension | Library | Status | Notes |
|-----------|---------|--------|-------|
| .txt      | Native  | ✅ Ready | Direct text reading |
| .md       | Native  | ✅ Ready | Markdown as plain text |
| .docx     | Mammoth | ✅ Ready | Extracts plain text from Word docs |
| .pdf      | PDF.js  | ✅ Ready | Extracts text from all pages |

## 5. Usage Examples

### Basic File Processing
```typescript
import { DocumentProcessor } from '@/utils/documentProcessor';

// Process any supported file
const content = await DocumentProcessor.processFile(file);

// Check if file is supported
if (DocumentProcessor.isSupported(file)) {
  // Process the file
}

// Get list of supported extensions
const extensions = DocumentProcessor.getSupportedExtensions();
// Returns: ['txt', 'md', 'markdown', 'docx', 'pdf']
```

### Integration with File Upload
```typescript
const handleFileUpload = async (file: File) => {
  try {
    const content = await DocumentProcessor.processFile(file);
    
    // Append to existing content with separator
    const separator = `\n\n--- Document Content (${file.name}) ---\n\n`;
    const newContent = existingContent + separator + content;
    
    setNotes(newContent);
  } catch (error) {
    console.error('Processing failed:', error);
    alert('Failed to process file. Please try a different format.');
  }
};
```

## 6. Performance Considerations

### Bundle Size Impact
- **Mammoth.js**: ~200KB (loaded only when DOCX files are processed)
- **PDF.js**: ~500KB (loaded only when PDF files are processed)
- **Dynamic Loading**: Libraries are imported on-demand, not in main bundle

### Memory Usage
- **DOCX**: Moderate memory usage, processes entire document
- **PDF**: Higher memory usage for large PDFs, processes page by page
- **Cleanup**: Automatic garbage collection after processing

### Processing Speed
- **Text files**: Instant (< 1ms)
- **DOCX files**: Fast (10-100ms for typical documents)
- **PDF files**: Moderate (100ms-1s depending on page count and complexity)

## 7. Error Handling

The DocumentProcessor includes comprehensive error handling:

### Fallback Strategy
1. Try specific library (mammoth.js or pdf.js)
2. If library fails, attempt basic text reading
3. If all fails, show user-friendly error message

### Common Issues and Solutions

#### DOCX Processing Fails
```typescript
// Fallback to basic text reading
try {
  const content = await DocumentProcessor.processFile(file);
} catch (error) {
  // User sees: "Failed to process document.docx. Please try a different format."
  console.error('DOCX processing failed:', error);
}
```

#### PDF Processing Fails
```typescript
// PDF.js worker loading issues
// Solution: CDN worker source is automatically configured
pdfjsLib.GlobalWorkerOptions.workerSrc = 
  `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
```

#### Network Issues
- Libraries are loaded from npm packages (local)
- PDF.js worker loaded from CDN (fallback available)
- Offline functionality maintained for already-loaded libraries

## 8. Testing

### Test Different File Types
1. **Text files**: Create .txt and .md files with sample content
2. **DOCX files**: Export from Microsoft Word or Google Docs
3. **PDF files**: Use various PDF sources (text-based, not scanned images)

### Test Scenarios
- Empty files
- Large files (>1MB)
- Files with special characters
- Password-protected files (should fail gracefully)
- Corrupted files

## 9. Future Enhancements

### Additional File Types
- **RTF**: Rich Text Format support
- **ODT**: OpenDocument Text support  
- **HTML**: HTML file processing
- **EPUB**: E-book format support

### Advanced Features
- **OCR**: Optical Character Recognition for scanned PDFs
- **Image Text**: Extract text from images in documents
- **Metadata**: Extract document properties and metadata
- **Formatting**: Preserve basic formatting in extracted text

## 10. Troubleshooting

### Common Issues

#### "Cannot find module 'mammoth'"
```bash
# Ensure mammoth is installed
npm install mammoth
```

#### "PDF.js worker not found"
```typescript
// Check worker source configuration
console.log(pdfjsLib.GlobalWorkerOptions.workerSrc);
```

#### "File processing takes too long"
```typescript
// Add timeout for large files
const processWithTimeout = (file: File, timeout = 30000) => {
  return Promise.race([
    DocumentProcessor.processFile(file),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Processing timeout')), timeout)
    )
  ]);
};
```

### Debug Mode
Enable detailed logging by setting:
```typescript
// In development
if (process.env.NODE_ENV === 'development') {
  console.log('Document processing debug mode enabled');
}
```

## 11. Security Considerations

### File Validation
- File size limits (recommended: 10MB max)
- File type validation (whitelist approach)
- Content sanitization for extracted text

### Privacy
- All processing happens client-side
- No files uploaded to external servers
- Memory cleared after processing

This setup provides a robust, extensible document processing system that handles multiple file formats while maintaining good performance and user experience.