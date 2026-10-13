// Test Anthropic Claude API Integration
import { aiService } from "../server/services/AIService.js";

async function runTest() {
  console.log("🚀 Starting Anthropic Claude integration test...");

  // NOTE (security): server-side key only — never add a VITE_* fallback here.
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    console.error("❌ ANTHROPIC_API_KEY is not defined in the environment!");
    process.exit(1);
  }

  console.log(`🔑 Key found: ${key.substring(0, 7)}...${key.substring(key.length - 4)}`);

  // Check providers status
  const status = aiService.getProviderStatus();
  const claudeStatus = status["claude-3-opus"];
  
  if (!claudeStatus) {
    console.error("❌ claude-3-opus is not registered in AIService providers!");
    process.exit(1);
  }

  console.log("📋 Claude 3 Opus status in AIService:", JSON.stringify(claudeStatus, null, 2));

  if (!claudeStatus.available) {
    console.warn("⚠️ claude-3-opus is registered but marked as not available.");
  }

  // Force a call to the private makeProviderRequest method to test direct communication
  console.log("\n📡 Sending test request to Anthropic Claude (Claude 3 Opus)...");
  try {
    const testPrompt = `Generate exactly 1 high-quality easy test question from this content:
"The Solar System consists of the Sun and the objects that orbit it."

REQUIREMENTS:
- Question Types: multiple-choice
- Difficulty: easy

RESPONSE FORMAT — Return valid JSON only (no markdown, no preamble):
{
  "questions": [
    {
      "id": "q1",
      "type": "multiple-choice",
      "question": "What is at the center of the Solar System?",
      "options": ["The Earth", "The Sun", "Mars", "Jupiter"],
      "correctAnswer": "The Sun",
      "explanation": "The Sun is at the center of the Solar System.",
      "difficulty": "easy",
      "points": 1,
      "sourceText": "The Solar System consists of the Sun and the objects that orbit it."
    }
  ]
}`;

    const response = await (aiService as any).makeProviderRequest("claude-3-opus", testPrompt);
    console.log("✅ Received response from Anthropic Claude:\n");
    console.log(response);

    // Try parsing the response to ensure it's valid JSON
    const parsed = JSON.parse(response.trim().replace(/^```json\s*/i, "").replace(/\s*```$/, ""));
    if (parsed && parsed.questions && parsed.questions.length > 0) {
      console.log("\n🎉 Integration test PASSED! JSON response is valid and well-formed.");
    } else {
      console.error("\n❌ Integration test FAILED: Response did not contain questions array.");
    }
  } catch (error) {
    console.error("\n❌ Request failed with error:", error);
    process.exit(1);
  }
}

runTest();
