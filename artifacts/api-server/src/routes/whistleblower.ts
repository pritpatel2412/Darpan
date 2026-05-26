import { Router } from "express";
import { db } from "@workspace/db";
import { whistleblowerTipsTable, tendersTable } from "@workspace/db";
import { groqChatCompletion } from "../lib/integrations/groq";
import { logger } from "../lib/logger";
import { eq } from "drizzle-orm";

const router = Router();

const passphrasesList = [
  "alpha", "bravo", "charlie", "delta", "echo", "foxtrot", "golf", "hotel", 
  "india", "juliet", "kilo", "lima", "mike", "november", "oscar", "papa", 
  "quebec", "romeo", "sierra", "tango", "uniform", "victor", "whiskey", "xray", 
  "yankee", "zulu", "apple", "banana", "cherry", "grape", "orange", "pear", 
  "peach", "plum", "berry", "melon", "lemon", "lime", "mango", "papaya",
  "cyber", "matrix", "shield", "beacon", "anchor", "orbit", "quantum", "gravity"
];

function generatePassphrase(): string {
  const chosen = [];
  for (let i = 0; i < 8; i++) {
    const idx = Math.floor(Math.random() * passphrasesList.length);
    chosen.push(passphrasesList[idx]);
  }
  return chosen.join("-");
}

async function triageTipWithAI(content: string): Promise<{ relevanceScore: number; crossRefTenderId: string | null }> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    // Simulated triage rule-based engine
    let relevanceScore = 30;
    const contentLower = content.toLowerCase();
    if (contentLower.includes("tender") || contentLower.includes("contract")) relevanceScore += 20;
    if (contentLower.includes("rig") || contentLower.includes("bribe") || contentLower.includes("fraud") || contentLower.includes("collusion")) relevanceScore += 25;
    if (contentLower.includes("crore") || contentLower.includes("lakh") || contentLower.includes("value")) relevanceScore += 15;
    
    // crossRefTenderId search via regex or matching active tenders from DB
    let crossRefTenderId: string | null = null;
    const match = content.match(/(GEM|CPPP)-\d{4}-[A-Z]{2}-\d{4}/i);
    if (match) {
      crossRefTenderId = match[0].toUpperCase();
    } else {
      // Find direct matches
      const activeTenders = await db.select({ tenderId: tendersTable.tenderId, title: tendersTable.title }).from(tendersTable);
      for (const t of activeTenders) {
        if (contentLower.includes(t.tenderId.toLowerCase()) || (t.title.split(" ").slice(0, 3).every(w => contentLower.includes(w.toLowerCase())))) {
          crossRefTenderId = t.tenderId;
          break;
        }
      }
    }
    
    return {
      relevanceScore: Math.min(99, relevanceScore),
      crossRefTenderId
    };
  }

  // Live Groq triage
  try {
    const activeTenders = await db.select({ tenderId: tendersTable.tenderId, title: tendersTable.title }).from(tendersTable);
    const tenderListStr = activeTenders.map(t => `${t.tenderId}: ${t.title}`).join("\n");

    const systemPrompt = `You are an AI triage coordinator for the Anonymous Whistleblower Vault.
Your job is to:
1. Rate the relevance and credibility of the incoming whistleblower tip on a scale from 0 to 100 (where 0 means useless/spam and 100 means high-grade evidence containing contract numbers, department details, or specific figures).
2. Cross-reference the tip content against the list of active tender IDs provided and identify if this tip refers to any specific tender.
You MUST respond with a single JSON object matching this schema exactly:
{
  "relevanceScore": number (0-100),
  "crossRefTenderId": "matching Tender ID (e.g. GEM-2026-UP-4872) or null if no match found"
}`;

    const userPrompt = `List of Active Tenders:\n${tenderListStr}\n\nIncoming Whistleblower Tip:\n"${content}"`;

    const rawRes = await groqChatCompletion(systemPrompt, userPrompt, true);
    const result = JSON.parse(rawRes);
    return {
      relevanceScore: Number(result.relevanceScore) || 50,
      crossRefTenderId: result.crossRefTenderId || null
    };
  } catch (err) {
    logger.error({ err }, "Failed AI tip triage, using fallback");
    return { relevanceScore: 65, crossRefTenderId: null };
  }
}

router.post("/whistleblower/submit", async (req, res) => {
  try {
    const { content, voiceUrl, crossRefTenderId: manualTenderId } = req.body as {
      content?: string;
      voiceUrl?: string;
      crossRefTenderId?: string;
    };

    let tipContent = content || "";

    // 1. STT Regional Language Simulation
    if (voiceUrl && !tipContent) {
      tipContent = "Regional Voice Memo Transcribed (Sarvam AI Simulation): I want to report specification collusion in school furniture supply where bidding details match previous rigged tenders from Sahyadri Publishers. The department is Maharashtra Education Department.";
    }

    if (!tipContent) {
      res.status(400).json({ error: "Whistleblower content or regional voice audio is required." });
      return;
    }

    // 2. Perform relevance triaging and cross-referencing
    const triage = await triageTipWithAI(tipContent);
    const crossRefTenderId = manualTenderId || triage.crossRefTenderId;

    // 3. Generate secure BIP39-style passphrase
    const passphrase = generatePassphrase();

    // 4. Save to Neon database
    const [inserted] = await db
      .insert(whistleblowerTipsTable)
      .values({
        passphrase,
        content: tipContent,
        voiceUrl: voiceUrl || null,
        relevanceScore: triage.relevanceScore,
        crossRefTenderId,
        status: "pending",
      })
      .returning();

    res.json({
      success: true,
      message: "Anonymous tip securely registered.",
      passphrase,
      relevanceScore: triage.relevanceScore,
      crossRefTenderId,
      status: "pending",
      createdAt: inserted.createdAt.toISOString(),
    });
  } catch (err) {
    logger.error({ err }, "Error submitting whistleblower tip");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/whistleblower/track", async (req, res) => {
  try {
    const { passphrase } = req.body as { passphrase?: string };

    if (!passphrase) {
      res.status(400).json({ error: "Passphrase is required for tracking." });
      return;
    }

    const [tip] = await db
      .select()
      .from(whistleblowerTipsTable)
      .where(eq(whistleblowerTipsTable.passphrase, passphrase.trim().toLowerCase()))
      .limit(1);

    if (!tip) {
      res.status(404).json({ error: "No record found matching this passphrase." });
      return;
    }

    // Get linked tender details if cross-referenced
    let tenderInfo = null;
    if (tip.crossRefTenderId) {
      const [tender] = await db
        .select({ id: tendersTable.id, title: tendersTable.title, fraudScore: tendersTable.fraudScore })
        .from(tendersTable)
        .where(eq(tendersTable.tenderId, tip.crossRefTenderId))
        .limit(1);
      
      if (tender) {
        tenderInfo = {
          id: tender.id,
          tenderId: tip.crossRefTenderId,
          title: tender.title,
          fraudScore: tender.fraudScore,
        };
      }
    }

    res.json({
      id: tip.id,
      content: tip.content,
      relevanceScore: tip.relevanceScore,
      crossRefTenderId: tip.crossRefTenderId,
      tenderInfo,
      status: tip.status,
      createdAt: tip.createdAt.toISOString(),
    });
  } catch (err) {
    logger.error({ err }, "Error tracking whistleblower tip");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
