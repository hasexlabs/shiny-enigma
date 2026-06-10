import { callNvidiaChatModel } from './nvidia-utility.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages, mode } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Invalid messages conversation stream payload." });
  }

  const activeNvidiaKey = process.env.NVIDIA_API_KEY || process.env.RAG_LLM_API_KEY;
  const isLlmActive = !!activeNvidiaKey &&
                       activeNvidiaKey !== "MY_NVIDIA_API_KEY" &&
                       activeNvidiaKey !== "MY_RAG_LLM_API_KEY" &&
                       activeNvidiaKey !== "";

  const lastUserMsg = messages[messages.length - 1]?.content || "";
  const queryLower = lastUserMsg.toLowerCase();

  // ROUTER SECURITY PROTECTION: Refuse matrix disclosures
  const isMatrixQuery = /model routing|routing matrix|escalation matrix|cognitive model|what model|architectures|which model|escalation protocols/i.test(queryLower);
  if (isMatrixQuery) {
    return res.json({
      content: `MAVERICK OS SECURITY PROTOCOLS

Disclosure and viewing of the cognitive model routing and system escalation matrix is strictly prohibited by security rules and guidelines. Maverick AI is powered by the unified Maverick proprietary orchestration engine.`,
      usingFallback: false,
      detectedMode: "learn"
    });
  }

  const systemPrompt = `You are Maverick, a highly capable executive assistant, strategist, and mission-control system.
Your role is not to entertain. Your role is to help the user think clearly, make better decisions, and execute effectively.`;

  if (isLlmActive) {
    try {
      const requestMessages = [
        { role: "system", content: systemPrompt },
        ...messages
      ];

      const modelCascade = [
        "meta/llama-3.1-8b-instruct",
        "meta/llama-3.3-70b-instruct",
        "meta/llama-3.2-3b-instruct"
      ];

      let apiResponseContent = "";
      let finalModelUsed = "";
      let success = false;

      for (const model of modelCascade) {
        try {
          apiResponseContent = await callNvidiaChatModel(model, requestMessages, activeNvidiaKey, { temperature: 0.4 });
          finalModelUsed = model;
          success = true;
          break;
        } catch (err) {
          console.warn(`Model ${model} execution error: ${err?.message || err}. Escalating...`);
        }
      }

      if (success && apiResponseContent) {
        return res.json({
          content: apiResponseContent,
          usingFallback: false,
          sourceModel: finalModelUsed,
          detectedMode: "learn"
        });
      }
    } catch (error) {
      console.error('NVIDIA API error:', error);
    }
  }

  // Fallback response
  return res.json({
    content: "I'm currently operating in fallback mode due to API unavailability. Please ensure your NVIDIA API key is configured in the environment variables.",
    usingFallback: true,
    detectedMode: "learn"
  });
}
