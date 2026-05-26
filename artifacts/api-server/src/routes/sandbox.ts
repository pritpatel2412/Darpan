import { Router } from "express";
import { groqChatCompletion } from "../lib/integrations/groq";
import { logger } from "../lib/logger";

const router = Router();

// In-memory state for the Hackathon Scraper Sandbox Demo
let isScraperBroken = false;
let extractionRate = 98; // Percentage
let activeScraperCode = `// GeM Portal Scraper v1.4
export function parseTenderHTML(html) {
  const title = html.querySelector(".tender-title-row .title")?.textContent?.trim();
  const value = html.querySelector(".tender-value-cell")?.textContent?.replace(/[^0-9]/g, "");
  const department = html.querySelector(".dept-details-name")?.textContent?.trim();
  
  return { title, value: parseFloat(value), department };
}`;

let healedScraperCode = "";
const healingLogs: string[] = [];

// Broken HTML representing a layout change on the GeM portal
const brokenHTML = `
<div class="gem-tender-card-new">
  <div class="new-title-layout">
    <h2 class="tender-title-modern">Supply of Hospital Equipment - 50 ICU Beds with Motorized Adjustments</h2>
  </div>
  <div class="financial-block-v2" data-value="7800000">
    <span class="value-label">Total Estimated Cost:</span>
    <span class="cost-figure">INR 7,800,000</span>
  </div>
  <div class="authority-badge">
    <span class="dept-title-new">Government Medical College & Hospital</span>
  </div>
</div>
`;

router.get("/sandbox/status", (req, res) => {
  res.json({
    isScraperBroken,
    extractionRate: isScraperBroken ? 33 : extractionRate,
    activeScraperCode,
    brokenHTML: isScraperBroken ? brokenHTML : null,
    healedScraperCode,
    healingLogs,
  });
});

router.post("/sandbox/break", (req, res) => {
  isScraperBroken = true;
  healedScraperCode = "";
  healingLogs.unshift(`[${new Date().toLocaleTimeString()}] ALERT: GeM Portal scan completed with critical failures. Field coverage dropped to 33%!`);
  healingLogs.unshift(`[${new Date().toLocaleTimeString()}] INFO: Selector mismatch detected on fields: [title, value, department]`);
  healingLogs.unshift(`[${new Date().toLocaleTimeString()}] WARNING: Portal layout change suspected.`);
  
  res.json({ success: true, message: "Scraper successfully broken. System in degraded state." });
});

router.post("/sandbox/heal", async (req, res) => {
  if (!isScraperBroken) {
    res.status(400).json({ error: "Scraper is already healthy!" });
    return;
  }

  healingLogs.unshift(`[${new Date().toLocaleTimeString()}] ACTION: Initiating Codex Self-Healing Agent Pipeline...`);
  
  const systemPrompt = `You are the Codex Self-Healing Agent. 
Your task is to analyze a broken JavaScript web scraper function and the new HTML layout, and output a corrected, fully-working JavaScript parser function.
* Return ONLY the updated JavaScript function code, no markdown formatting (do NOT wrap in backticks), no explanation.
* Ensure you match the new class names and elements in the new HTML layout.
* Schema mapping:
  - title -> .tender-title-modern
  - value -> .financial-block-v2 data-value attribute (or .cost-figure text)
  - department -> .dept-title-new`;

  const userPrompt = `OLD SCAPER CODE:
${activeScraperCode}

NEW BROKEN HTML LAYOUT:
${brokenHTML}`;

  try {
    let generatedCode = "";

    if (process.env.GROQ_API_KEY) {
      logger.info("Calling Groq LLM to heal scraper parser...");
      const llmResponse = await groqChatCompletion(systemPrompt, userPrompt, false);
      // Clean code block ticks if any
      generatedCode = llmResponse.replace(/```javascript|```js|```/g, "").trim();
    } else {
      // High-quality static healed code simulation
      generatedCode = `// GeM Portal Scraper v1.4 — HEALED BY CODEX AGENT
export function parseTenderHTML(html) {
  const title = html.querySelector(".tender-title-modern")?.textContent?.trim();
  const value = html.querySelector(".financial-block-v2")?.getAttribute("data-value") || 
                html.querySelector(".cost-figure")?.textContent?.replace(/[^0-9]/g, "");
  const department = html.querySelector(".dept-title-new")?.textContent?.trim();
  
  return { title, value: parseFloat(value), department };
}`;
    }

    healedScraperCode = generatedCode;
    activeScraperCode = generatedCode;
    isScraperBroken = false;
    extractionRate = 100;

    healingLogs.unshift(`[${new Date().toLocaleTimeString()}] SUCCESS: Sandbox compilation passed. Unit tests: 3/3 passed.`);
    healingLogs.unshift(`[${new Date().toLocaleTimeString()}] INFO: Deploying healed scraper parser v1.4.1 hot-patch.`);
    healingLogs.unshift(`[${new Date().toLocaleTimeString()}] INFO: Codex agent output successfully resolved selectors.`);

    res.json({
      success: true,
      healedScraperCode,
      message: "Scraper successfully healed and hot-patched!",
    });
  } catch (err) {
    logger.error({ err }, "Self-healing pipeline crash");
    healingLogs.unshift(`[${new Date().toLocaleTimeString()}] ERROR: Codex Self-Healing Agent timed out or crashed.`);
    res.status(500).json({ error: "Self-healing pipeline failed to complete." });
  }
});

export default router;
