// Load environment variables FIRST, before any other imports
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the project root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Export a function to verify environment is loaded
export function verifyEnvironment() {
  const vars = ['GEMINI_API_KEY', 'VITE_GEMINI_API_KEY', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
  const missing = vars.filter(v => !process.env[v]);
  
  if (missing.length > 0) {
    console.log(`⚠️  Missing env vars: ${missing.join(', ')}`);
  } else {
    console.log('✅ Environment variables verified');
  }
}