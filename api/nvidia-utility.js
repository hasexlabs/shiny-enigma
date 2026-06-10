export async function callNvidiaChatModel(
  model,
  messages,
  apiKey,
  options = {}
) {
  // Map simulated/custom/legacy names to fully active NVIDIA NIM model paths to prevent 404s
  let targetModel = model;
  if (model === "nvidia/gpt-oss-20b" || model === "llama-3.1-8b-instruct") {
    targetModel = "meta/llama-3.1-8b-instruct";
  } else if (model === "nvidia/gpt-oss-120b" || model === "llama-3.3-70b-instruct") {
    targetModel = "meta/llama-3.3-70b-instruct";
  } else if (model === "qwen/qwen3-coder-72b-instruct" || model === "qwen3.5-122b-a10b") {
    targetModel = "qwen/qwen2.5-coder-72b-instruct";
  } else if (model === "nvidia/nemotron-nano-12b" || model === "llama-3.2-1b-instruct" || model === "nemotron-mini-4b-instruct") {
    targetModel = "meta/llama-3.1-8b-instruct";
  } else if (model === "llama-3.2-3b-instruct") {
    targetModel = "meta/llama-3.2-3b-instruct";
  } else if (model === "deepseek-v4-flash") {
    targetModel = "meta/llama-3.1-8b-instruct";
  } else if (model === "deepseek-v4-pro") {
    targetModel = "meta/llama-3.3-70b-instruct";
  } else if (model === "nemotron-3-super-120b-a12b" || model === "nemotron-3-ultra-550b-a55b") {
    targetModel = "nvidia/llama-3.1-nemotron-70b-instruct";
  } else if (model === "glm-5.1" || model === "kimi-k2.6") {
    targetModel = "meta/llama-3.3-70b-instruct";
  }

  const formatType = options.responseFormat === "json" ? "json_object" : options.responseFormat;

  const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: targetModel,
      messages: messages,
      temperature: options.temperature ?? 0.5,
      max_tokens: 1024,
      response_format: formatType ? { type: formatType } : undefined
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`NVIDIA model ${targetModel} (requested as ${model}) failed with status ${response.status}: ${errorText}`);
  }

  const resJson = await response.json();
  return resJson.choices?.[0]?.message?.content || "";
}
