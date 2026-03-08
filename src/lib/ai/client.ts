// AI client — direct browser-to-provider API calls
// Never proxied through our server; the API key goes straight from the browser

import type { AIConfig } from "./config";

/** Error thrown when AI request fails */
export class AIError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly provider?: string
  ) {
    super(message);
    this.name = "AIError";
  }
}

/**
 * Send a message to the configured AI provider and return the response.
 * Supports streaming via the onChunk callback for real-time text display.
 */
export async function sendAIMessage(
  config: AIConfig,
  systemPrompt: string,
  userMessage: string,
  onChunk?: (text: string) => void
): Promise<string> {
  if (!config.apiKey) {
    throw new AIError("No API key configured. Add your key in AI Settings.");
  }

  if (config.provider === "anthropic") {
    return sendAnthropicMessage(config, systemPrompt, userMessage, onChunk);
  } else if (config.provider === "openai") {
    return sendOpenAIMessage(config, systemPrompt, userMessage, onChunk);
  }

  throw new AIError(`Unsupported provider: ${config.provider}`);
}

/** Send request to Anthropic Messages API with streaming */
async function sendAnthropicMessage(
  config: AIConfig,
  systemPrompt: string,
  userMessage: string,
  onChunk?: (text: string) => void
): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
      stream: !!onChunk,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "Unknown error");
    throw new AIError(
      `Anthropic API error: ${response.status} — ${errorBody}`,
      response.status,
      "anthropic"
    );
  }

  // Non-streaming response
  if (!onChunk) {
    const data = await response.json();
    return data.content?.[0]?.text ?? "";
  }

  // Streaming response via SSE
  return streamAnthropicResponse(response, onChunk);
}

/** Parse Anthropic SSE stream and accumulate text */
async function streamAnthropicResponse(
  response: Response,
  onChunk: (text: string) => void
): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) throw new AIError("No response body for streaming");

  const decoder = new TextDecoder();
  let fullText = "";
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    // Keep the last incomplete line in the buffer
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (data === "[DONE]") break;

      try {
        const event = JSON.parse(data);
        if (event.type === "content_block_delta" && event.delta?.text) {
          fullText += event.delta.text;
          onChunk(event.delta.text);
        }
      } catch {
        // Skip malformed SSE lines
      }
    }
  }

  return fullText;
}

/** Send request to OpenAI Chat Completions API with streaming */
async function sendOpenAIMessage(
  config: AIConfig,
  systemPrompt: string,
  userMessage: string,
  onChunk?: (text: string) => void
): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: 2048,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      stream: !!onChunk,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "Unknown error");
    throw new AIError(
      `OpenAI API error: ${response.status} — ${errorBody}`,
      response.status,
      "openai"
    );
  }

  // Non-streaming response
  if (!onChunk) {
    const data = await response.json();
    return data.choices?.[0]?.message?.content ?? "";
  }

  // Streaming response via SSE
  return streamOpenAIResponse(response, onChunk);
}

/** Parse OpenAI SSE stream and accumulate text */
async function streamOpenAIResponse(
  response: Response,
  onChunk: (text: string) => void
): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) throw new AIError("No response body for streaming");

  const decoder = new TextDecoder();
  let fullText = "";
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (data === "[DONE]") break;

      try {
        const event = JSON.parse(data);
        const delta = event.choices?.[0]?.delta?.content;
        if (delta) {
          fullText += delta;
          onChunk(delta);
        }
      } catch {
        // Skip malformed SSE lines
      }
    }
  }

  return fullText;
}

/**
 * Test the AI connection with a simple ping message.
 * Returns true if the provider responds successfully.
 */
export async function testAIConnection(config: AIConfig): Promise<{ success: boolean; message: string }> {
  try {
    const response = await sendAIMessage(
      config,
      "You are a connection test. Respond with exactly: CONNECTION_OK",
      "Test connection. Respond with exactly: CONNECTION_OK"
    );
    const success = response.includes("CONNECTION_OK");
    return {
      success,
      message: success ? "Connection successful" : "Unexpected response from provider",
    };
  } catch (error) {
    const msg = error instanceof AIError ? error.message : "Connection failed";
    return { success: false, message: msg };
  }
}
