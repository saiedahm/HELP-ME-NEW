export type AIMessage = { role: "user" | "assistant"; content: string };

export type AIContext = {
  botName?: string;
  knowledge?: string[];
};

export interface AIProvider {
  generateReply(input: { messages: AIMessage[]; context?: AIContext }): Promise<string>;
}
