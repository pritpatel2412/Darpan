import { Router } from "express";
import { logger } from "../lib/logger";

const router = Router();

// In-memory logs representing real-time outbound call status
let callLogs: Array<{ timestamp: string; type: "info" | "bot" | "user" | "success"; text: string }> = [];
let callActive = false;

router.get("/voice/call-simulator/logs", (req, res) => {
  res.json({
    active: callActive,
    logs: callLogs,
  });
});

router.post("/voice/call-simulator/trigger", async (req, res) => {
  const { phoneNumber, tenderId, tenderTitle } = req.body;

  if (!phoneNumber) {
    res.status(400).json({ error: "Phone number is required." });
    return;
  }

  callActive = true;
  callLogs = [];
  logger.info({ phoneNumber, tenderId }, "Triggering simulated outbound voice agent call...");

  const addLog = (type: "info" | "bot" | "user" | "success", text: string, delay: number) => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        callLogs.unshift({
          timestamp: new Date().toLocaleTimeString(),
          type,
          text,
        });
        resolve();
      }, delay);
    });
  };

  // Run the dialogue sequence asynchronously to let the API return immediately
  (async () => {
    await addLog("info", `Initiating Outbound Voice Call to ${phoneNumber}...`, 500);
    await addLog("info", "Establishing secure WebRTC channel with Sarvam AI Saarika voice gateway...", 1000);
    await addLog("info", "Call answered. Connection established. Executing multilingual handshake...", 1200);
    await addLog(
      "bot",
      `🤖 BOT (Sarvam TTS Hindi Meera): "Namaskar! Main Darpan AI bol rahi hoon. Maine ${tenderTitle || "PWD Highway"} ke ₹4.3 Crore ke tender me sandighda patterns paye hain. Kya aap chahte hain ki main iske khilaaf ek RTI draft karoon?"`,
      2500
    );
    await addLog("info", "🎙️ Listening for user speech input (Streaming to Sarvam STT)...", 2000);
    await addLog("user", `👤 USER VOICE RESPONSE: "Haan, bilkul! RTI draft kar do aur confirmation bhej do."`, 2500);
    await addLog("info", "🔍 Speech-to-Text captured: 'Haan, bilkul! RTI draft kar do aur confirmation bhej do.'", 1500);
    await addLog("info", "🧠 Dispatched STT transcript to Groq LLaMA-3 intent parser...", 1000);
    await addLog(
      "success",
      `✅ Groq Intent Analysis: MATCH FOUND { intent: "APPROVE_FILING", confidence: 99.4%, action: "GENERATE_RTI" }`,
      1200
    );
    await addLog("info", "⚙️ Dispatching webhook: Automated drafting of RTI application using evidentiary audit reports...", 1000);
    await addLog(
      "bot",
      `🤖 BOT (Sarvam TTS Hindi Meera): "RTI draft safaltapoorvak file kar di gayi hai. Confirmation number aapke mobile par SMS aur email par bhej diya gaya hai. Dhanyavad!"`,
      2500
    );
    await addLog("success", "📞 Outbound Voice Session completed successfully. Hang up call.", 2000);
    callActive = false;
  })();

  res.json({
    success: true,
    message: "Outbound call successfully queued and dialed.",
  });
});

export default router;
