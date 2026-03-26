import Anthropic from "@anthropic-ai/sdk";

export async function callClaude(
  prompt: string,
  options: { maxTokens?: number } = {}
): Promise<{ content: string }> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      content: JSON.stringify({
        forecast: [],
        insights: ["Anthropic API key not configured; returning fallback insight."]
      })
    };
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const response = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL ?? "claude-3-5-sonnet-latest",
    max_tokens: options.maxTokens ?? 400,
    messages: [{ role: "user", content: prompt }]
  });

  const content = response.content
    .filter((item) => item.type === "text")
    .map((item) => item.text)
    .join("\n");

  return { content };
}
