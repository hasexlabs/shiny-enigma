import { callNvidiaChatModel } from './nvidia-utility.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { sections, history, lastRecommendation } = req.body;
  if (!sections) {
    return res.status(400).json({ error: "Missing sections data for assessment." });
  }

  const activeNvidiaKey = process.env.NVIDIA_API_KEY || process.env.RAG_LLM_API_KEY;
  const isLlmActive = !!activeNvidiaKey &&
                       activeNvidiaKey !== "MY_NVIDIA_API_KEY" &&
                       activeNvidiaKey !== "MY_RAG_LLM_API_KEY" &&
                       activeNvidiaKey !== "";

  const systemPrompt = `You are a Behavioral Intelligence System. Your job is to analyze the user's current journal entry alongside their historical entries to identify patterns.

Focus on:
1. Repeated successes
2. Repeated failures
3. Behavioral triggers
4. Excuses that appear in multiple entries
5. Changes in consistency over time
6. Whether previous recommendations were followed
7. What is actually causing progress or stagnation

Rules:
- Never simply restate what the user wrote
- Never give generic advice
- Never say "work harder", "be more disciplined", or "stay motivated"
- Every insight must be supported by evidence from current or past entries
- If there is insufficient evidence, explicitly say so
- Compare today's entry against historical patterns
- Track whether the user is improving, plateauing, or regressing
- DEFAULT TO PLAIN TEXT in all responses. Do not use markdown formatting.

You must output a raw JSON object string with the following fields:
{
  "behavioralScore": <number between 0 and 100>,
  "trajectory": "<Improving / Stable / Declining>",
  "keyPattern": "<Description of the main behavioral pattern>",
  "evidence": "<Specific evidence from current or past entries supporting the pattern>",
  "blindSpot": "<Something the user repeatedly fails to notice>",
  "rootCause": "<What is actually causing progress or stagnation>",
  "progressSinceLastEntry": "<Assessment of whether the user has improved since the last entry>",
  "mostImportantAction": "<The single most important action for the next 24 hours>",
  "confidenceLevel": "<High / Medium / Low>",
  "repeatedSuccesses": ["<success pattern 1>", "<success pattern 2>"],
  "repeatedFailures": ["<failure pattern 1>", "<failure pattern 2>"],
  "recurringExcuses": ["<excuse pattern 1>", "<excuse pattern 2>"],
  "behavioralTriggers": ["<trigger 1>", "<trigger 2>"],
  "recommendationFollowed": <boolean, whether previous recommendation was followed>
}

If no historical data is available, set trajectory to "Stable", use "Insufficient historical data" for fields requiring evidence, and set confidenceLevel to "Low".

Do NOT output anything else except this valid, parseable JSON block.`;

  // Build user prompt
  let userPrompt = `CURRENT ENTRY:\n`;
  userPrompt += `SECTION 1: Concrete Progress / Wins:\n${JSON.stringify(sections.section1)}\n\n`;
  userPrompt += `SECTION 2: Procrastinations / Avoided Tasks:\n${JSON.stringify(sections.section2)}\n\n`;
  userPrompt += `SECTION 3: Mistakes / Weak Decisions:\n${JSON.stringify(sections.section3)}\n\n`;
  userPrompt += `SECTION 4: Lessons / Insights:\n${JSON.stringify(sections.section4)}\n\n`;
  userPrompt += `SECTION 5: Non-Negotiable for Tomorrow:\n${JSON.stringify(sections.section5)}\n\n`;
  userPrompt += `SECTION 6: Ideas / Opportunities:\n${JSON.stringify(sections.section6)}\n\n`;

  if (history && history.length > 0) {
    userPrompt += `HISTORICAL ENTRIES (${history.length} most recent):\n\n`;
    history.forEach((entry, index) => {
      userPrompt += `Entry ${index + 1} (timestamp: ${entry.timestamp}):\n`;
      userPrompt += `Wins: ${JSON.stringify(entry.sections.section1)}\n`;
      userPrompt += `Procrastinations: ${JSON.stringify(entry.sections.section2)}\n`;
      userPrompt += `Mistakes: ${JSON.stringify(entry.sections.section3)}\n`;
      userPrompt += `Lessons: ${JSON.stringify(entry.sections.section4)}\n`;
      if (entry.evaluation) {
        userPrompt += `Previous evaluation: ${JSON.stringify(entry.evaluation)}\n`;
      }
      userPrompt += `\n`;
    });
  }

  if (lastRecommendation) {
    userPrompt += `\nPREVIOUS RECOMMENDATION: ${lastRecommendation}\n`;
  }

  userPrompt += `\nAnalyze this log alongside historical patterns and output the JSON evaluation structure:`;

  if (!isLlmActive) {
    // Fallback calculation
    const winsCount = sections.section1?.length || 0;
    const procrastinationsCount = sections.section2?.length || 0;
    const mistakesCount = sections.section3?.length || 0;
    const lessonsCount = sections.section4?.length || 0;
    const tomorrowCount = sections.section5?.length || 0;
    const ideasCount = sections.section6?.length || 0;

    let score = 50;
    score += winsCount * 8;
    score += lessonsCount * 3;
    score += ideasCount * 2;
    score += tomorrowCount * 2;
    score -= procrastinationsCount * 12;
    score -= mistakesCount * 10;

    if (winsCount >= 3 && procrastinationsCount <= 1) {
      score += 15;
    }

    if (winsCount === 0 && procrastinationsCount >= 3) {
      score -= 10;
    }

    score = Math.max(0, Math.min(100, score));

    const fallbackResponse = {
      behavioralScore: score,
      trajectory: "Stable",
      keyPattern: "Insufficient historical data for pattern detection",
      evidence: "Historical pattern analysis requires API key. Current analysis based on single entry only.",
      blindSpot: "Cannot detect without historical comparison",
      rootCause: "Cannot determine without behavioral pattern tracking",
      progressSinceLastEntry: "Cannot assess without previous entries",
      mostImportantAction: sections.section5?.[0] || "Complete primary target for tomorrow",
      confidenceLevel: "Low",
      repeatedSuccesses: [],
      repeatedFailures: [],
      recurringExcuses: [],
      behavioralTriggers: [],
      recommendationFollowed: false
    };

    return res.json({
      success: true,
      evaluation: fallbackResponse,
      source: "SECURE_ENGINE_LOCAL_FALLBACK",
      requiresApiKey: true,
      details: "Historical pattern analysis requires API key. Enable NVIDIA API key for full behavioral intelligence features."
    });
  }

  // Try NVIDIA API
  const modelsToTry = [
    "meta/llama-3.1-8b-instruct",
    "meta/llama-3.3-70b-instruct",
    "nvidia/llama-3.1-nemotron-70b-instruct",
    "qwen/qwen2.5-coder-72b-instruct"
  ];

  let rawResponseText = "";
  let finalModelUsed = "";
  let success = false;

  for (const model of modelsToTry) {
    try {
      rawResponseText = await callNvidiaChatModel(model, [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ], activeNvidiaKey, { temperature: 0.9, responseFormat: "json" });

      if (rawResponseText && rawResponseText.trim().length > 0) {
        finalModelUsed = model;
        success = true;
        break;
      }
    } catch (modelErr) {
      console.warn(`Model ${model} failure: ${modelErr?.message || modelErr}`);
    }
  }

  if (success && rawResponseText) {
    try {
      const parsed = JSON.parse(rawResponseText.replace(/```json|```/g, "").trim());
      return res.json({
        success: true,
        evaluation: parsed,
        source: "NVIDIA_AI_ANALYSIS",
        modelUsed: finalModelUsed
      });
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
    }
  }

  // Emergency fallback
  const winsCount = sections.section1?.length || 0;
  const procrastinationsCount = sections.section2?.length || 0;
  const mistakesCount = sections.section3?.length || 0;

  let score = 50;
  score += winsCount * 8;
  score -= procrastinationsCount * 12;
  score -= mistakesCount * 10;
  score = Math.max(0, Math.min(100, score));

  const emergencyFallback = {
    behavioralScore: score,
    trajectory: "Stable",
    keyPattern: "API analysis failed",
    evidence: "Using emergency fallback calculation",
    blindSpot: "Cannot detect without successful API analysis",
    rootCause: "API cascade failed",
    progressSinceLastEntry: "Cannot assess",
    mostImportantAction: sections.section5?.[0] || "Review progress",
    confidenceLevel: "Low",
    repeatedSuccesses: [],
    repeatedFailures: [],
    recurringExcuses: [],
    behavioralTriggers: [],
    recommendationFollowed: false
  };

  return res.json({
    success: true,
    evaluation: emergencyFallback,
    source: "EMERGENCY_FALLBACK",
    requiresApiKey: true
  });
}
