export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  metadata?: {
    confidence?: number;
    sources?: string[];
    actionTaken?: string;
  };
}

export interface ChatSession {
  id: string;
  userId: string;
  startedAt: Date;
  lastMessageAt: Date;
  messages: ChatMessage[];
  context: {
    role: "client" | "business" | "operations" | "staff" | "admin";
    department?: string;
    location?: string;
  };
  isActive: boolean;
}

export interface ChatbotCapability {
  id: string;
  name: string;
  description: string;
  role: string[];
  examples: string[];
}

export interface ChatbotResponse {
  message: ChatMessage;
  suggestions?: string[];
  actions?: ChatbotAction[];
  confidence: number;
}

export interface ChatbotAction {
  id: string;
  type: "navigate" | "create" | "view" | "call" | "share";
  label: string;
  target: string;
  params?: Record<string, any>;
}

export class ChatbotService {
  private baseUrl = "/api/chatbot";
  private sessionId: string | null = null;

  async createSession(
    role: "client" | "business" | "operations" | "staff" | "admin",
    department?: string
  ): Promise<ChatSession> {
    const response = await fetch(`${this.baseUrl}/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, department })
    });
    if (!response.ok) throw new Error("Failed to create session");
    const session = await response.json();
    this.sessionId = session.id;
    return session;
  }

  async sendMessage(content: string): Promise<ChatbotResponse> {
    if (!this.sessionId) {
      throw new Error("No active session. Call createSession first.");
    }

    const response = await fetch(`${this.baseUrl}/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: this.sessionId,
        content
      })
    });
    if (!response.ok) throw new Error("Failed to send message");
    return response.json();
  }

  async streamMessage(
    content: string,
    onChunk: (chunk: string) => void,
    onDone?: (fullResponse: ChatMessage) => void
  ): Promise<void> {
    if (!this.sessionId) {
      throw new Error("No active session. Call createSession first.");
    }

    const response = await fetch(`${this.baseUrl}/message/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: this.sessionId,
        content
      })
    });

    if (!response.ok) throw new Error("Failed to stream message");

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullContent = "";

    if (!reader) return;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullContent += chunk;
        onChunk(chunk);
      }

      if (onDone) {
        onDone({
          id: `msg-${Date.now()}`,
          role: "assistant",
          content: fullContent,
          timestamp: new Date()
        });
      }
    } finally {
      reader.releaseLock();
    }
  }

  async getSession(): Promise<ChatSession> {
    if (!this.sessionId) {
      throw new Error("No active session");
    }
    const response = await fetch(`${this.baseUrl}/session/${this.sessionId}`);
    if (!response.ok) throw new Error("Failed to get session");
    return response.json();
  }

  async endSession(): Promise<void> {
    if (!this.sessionId) return;
    const response = await fetch(`${this.baseUrl}/session/${this.sessionId}`, {
      method: "DELETE"
    });
    if (!response.ok) throw new Error("Failed to end session");
    this.sessionId = null;
  }

  async clearHistory(): Promise<void> {
    if (!this.sessionId) return;
    const response = await fetch(`${this.baseUrl}/session/${this.sessionId}/history`, {
      method: "DELETE"
    });
    if (!response.ok) throw new Error("Failed to clear history");
  }

  async getSessions(limit: number = 10): Promise<ChatSession[]> {
    const response = await fetch(`${this.baseUrl}/sessions?limit=${limit}`);
    if (!response.ok) throw new Error("Failed to get sessions");
    return response.json();
  }

  async getCapabilities(role?: string): Promise<ChatbotCapability[]> {
    const url = role ? `${this.baseUrl}/capabilities?role=${role}` : `${this.baseUrl}/capabilities`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to get capabilities");
    return response.json();
  }

  async provideRating(messageId: string, rating: 1 | 2 | 3 | 4 | 5): Promise<void> {
    const response = await fetch(`${this.baseUrl}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messageId,
        rating,
        timestamp: new Date()
      })
    });
    if (!response.ok) throw new Error("Failed to submit feedback");
  }

  async provideFeedback(
    messageId: string,
    feedback: "helpful" | "not_helpful" | "incorrect",
    comment?: string
  ): Promise<void> {
    const response = await fetch(`${this.baseUrl}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messageId,
        feedback,
        comment,
        timestamp: new Date()
      })
    });
    if (!response.ok) throw new Error("Failed to submit feedback");
  }

  async getSuggestions(
    context: string,
    limit: number = 3
  ): Promise<string[]> {
    const response = await fetch(`${this.baseUrl}/suggestions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ context, limit })
    });
    if (!response.ok) throw new Error("Failed to get suggestions");
    const data = await response.json();
    return data.suggestions;
  }

  async getCommandsForRole(role: string): Promise<ChatbotAction[]> {
    const response = await fetch(`${this.baseUrl}/commands?role=${role}`);
    if (!response.ok) throw new Error("Failed to get commands");
    return response.json();
  }
}

export const chatbotService = new ChatbotService();
