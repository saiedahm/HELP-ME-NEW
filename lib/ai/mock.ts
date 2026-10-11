import type { AIProvider } from "./provider";

const normalize = (value: string) => value.trim().toLowerCase();

export const mockAI: AIProvider = {
  async generateReply({ messages, context }) {
    const latest = messages.at(-1)?.content ?? "";
    const q = normalize(latest);
    const name = context?.botName ?? "HELP-ME";

    if (!q) return "How can I help you today?";
    if (q.includes("hello") || q.includes("hi") || q.includes("مرحبا") || q.includes("مرحب")) {
      return `Hello! I’m ${name}. Tell me what you need and I’ll guide you step by step.`;
    }
    if (q.includes("price") || q.includes("plan") || q.includes("سعر") || q.includes("باقة")) {
      return "HELP-ME is designed around clear plans, usage limits, and secure business accounts. The billing layer will be connected after the foundation is verified.";
    }
    if (q.includes("help") || q.includes("مساعدة")) {
      return "Absolutely. Describe the problem, the place or service involved, and what you have already tried. I’ll help you organize the next steps.";
    }

    const hasKnowledge = Boolean(context?.knowledge?.length);
    return hasKnowledge
      ? "I found relevant information in the configured knowledge base. In the next phase, this will be used to produce grounded answers for the business."
      : "I understand. The current development environment uses a free Mock AI provider. Your message was received successfully, and the real AI layer can be connected later.";
  }
};
