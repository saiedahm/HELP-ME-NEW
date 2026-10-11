import type { AIProvider } from "./provider";
import { mockAI } from "./mock";

const apiKey = process.env.OPENAI_API_KEY;
const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

export const aiProvider: AIProvider = {
  async generateReply(input) {
    if (!apiKey) return mockAI.generateReply(input);

    const knowledge = input.context?.knowledge ?? [];
    const system = [
      `You are ${input.context?.botName ?? "HELP-ME"}, a helpful business support assistant.`,
      "Answer clearly and honestly. Use the supplied business knowledge when relevant.",
      "If the knowledge does not contain the answer, say so and ask a useful follow-up question.",
      "Do not claim to have performed actions you have not performed.",
      knowledge.length ? `Business knowledge:\n${knowledge.join("\n\n")}` : "No business knowledge has been configured yet."
    ].join("\n\n");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: system },
          ...input.messages.slice(-12).map(message => ({ role: message.role, content: message.content }))
        ],
        temperature: 0.3
      }),
      signal: AbortSignal.timeout(25000)
    });

    if (!response.ok) {
      console.error("AI provider returned status:", response.status);
      throw new Error("AI provider request failed");
    }
    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content;
    if (typeof reply !== "string" || !reply.trim()) throw new Error("AI provider returned an empty reply");
    return reply.trim();
  }
};
