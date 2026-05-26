import { logger } from "../logger";

/**
 * Converts plain text into highly realistic Hindi TTS audio base64 stream using Sarvam AI's Bulbul model.
 * Ref: https://api.sarvam.ai/text-to-speech
 */
export async function generateHindiTTS(text: string): Promise<string> {
  const apiKey = process.env.SARVAM_API_KEY;

  if (!apiKey) {
    logger.warn("SARVAM_API_KEY is not configured. Simulating regional voice alert generation.");
    return getFallbackAudioBase64();
  }

  try {
    logger.info("Requesting Sarvam AI TTS (Hindi - Meera speaker)...");

    const response = await fetch("https://api.sarvam.ai/text-to-speech", {
      method: "POST",
      headers: {
        "api-subscription-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: text,
        target_language_code: "hi-IN",
        speaker: "meera", // Standard clear female professional voice model
        speech_sample_rate: 8000,
        output_audio_codec: "wav",
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      logger.error({ status: response.status, errText }, "Sarvam AI TTS API request failed.");
      return getFallbackAudioBase64();
    }

    const data = await response.json() as any;
    // Sarvam API returns a base64 encoded string inside the response
    const audioContent = data.audio || data.audios?.[0] || "";

    if (!audioContent) {
      logger.error("No audio content returned from Sarvam AI TTS.");
      return getFallbackAudioBase64();
    }

    logger.info("Sarvam AI TTS audio base64 stream successfully fetched!");
    return audioContent;
  } catch (err) {
    logger.error({ err }, "Error during Sarvam AI TTS generation. Falling back to mock.");
    return getFallbackAudioBase64();
  }
}

/**
 * Generates a mock base64 audio stream for fallback/local execution.
 */
function getFallbackAudioBase64(): string {
  // A standard, very short mock WAV base64 header string to verify end-to-end integration flows without crashing
  return "UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";
}
