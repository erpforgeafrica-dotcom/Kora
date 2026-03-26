import { Router } from "express";
import { AIClientFactory } from "../../services/aiClient.js";
import { getRequiredOrganizationId } from "../../shared/http.js";
import { respondSuccess, respondError } from "../../shared/response.js";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface ChatSession {
  id: string;
  organizationId: string;
  userId: string;
  role: "client" | "business" | "operations" | "staff" | "admin";
  department?: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

// In-memory sessions store (replace with database in production)
const chatSessions = new Map<string, ChatSession>();

export const chatbotRoutes = Router();

/**
 * Create a new chat session
 * POST /api/chatbot/sessions
 */
chatbotRoutes.post("/sessions", async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    if (!organizationId) {
      return respondError(res, "MISSING_ORGANIZATION_ID", "Missing organization id", 400);
    }

    const { role = "client", department } = req.body;
    const userId = res.locals.auth?.userId ?? "anonymous";

    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const session: ChatSession = {
      id: sessionId,
      organizationId,
      userId,
      role,
      department,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    chatSessions.set(sessionId, session);

    return respondSuccess(res, {
      sessionId,
      message: "Chat session created",
      role,
      department: department || undefined
    });
  } catch (err) {
    return next(err);
  }
});

/**
 * Send a message in a chat session
 * POST /api/chatbot/sessions/:sessionId/messages
 */
chatbotRoutes.post("/sessions/:sessionId/messages", async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    if (!organizationId) {
      return respondError(res, "MISSING_ORGANIZATION_ID", "Missing organization id", 400);
    }

    const { sessionId } = req.params;
    const { content } = req.body;
    const userId = res.locals.auth?.userId ?? "anonymous";

    if (!content || typeof content !== "string") {
      return respondError(res, "CONTENT_REQUIRED_STRING", "content is required and must be a string", 400);
    }

    const session = chatSessions.get(sessionId);
    if (!session) {
      return respondError(res, "SESSION_NOT_FOUND", "Session not found", 404);
    }

    if (session.organizationId !== organizationId) {
      return respondError(res, "UNAUTHORIZED", "Unauthorized", 403);
    }

    // Add user message
    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_user`,
      role: "user",
      content,
      timestamp: new Date().toISOString()
    };

    session.messages.push(userMessage);

    try {
      const aiClient = await AIClientFactory.createClient(organizationId);

      // Build conversation history for context
      const conversationHistory = session.messages
        .map((msg) => `${msg.role}: ${msg.content}`)
        .slice(-10)
        .join("\n");

      const result = await aiClient.executeTask({
        organizationId,
        userId,
        taskType: "fallback",
        prompt: conversationHistory || content,
        maxTokens: 800
      });

      const assistantContent = result.content || "I apologize, I couldn't generate a response.";
      const assistantMessage: ChatMessage = {
        id: `msg_${Date.now()}_assistant`,
        role: "assistant",
        content: assistantContent,
        timestamp: new Date().toISOString()
      };

      session.messages.push(assistantMessage);
      session.updatedAt = new Date().toISOString();

      return res.status(200).json({
        sessionId,
        userMessage,
        assistantMessage,
        messageCount: session.messages.length
      });
    } catch (aiErr) {
      // Fallback response if AI fails
      const fallbackMessage: ChatMessage = {
        id: `msg_${Date.now()}_assistant`,
        role: "assistant",
        content: "I'm currently processing your request. Please try again in a moment.",
        timestamp: new Date().toISOString()
      };

      session.messages.push(fallbackMessage);
      session.updatedAt = new Date().toISOString();

      return res.status(200).json({
        sessionId,
        userMessage,
        assistantMessage: fallbackMessage,
        messageCount: session.messages.length,
        warning: "Response generated with fallback logic"
      });
    }
  } catch (err) {
    return next(err);
  }
});

/**
 * Get chat session history
 * GET /api/chatbot/sessions/:sessionId
 */
chatbotRoutes.get("/sessions/:sessionId", async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    if (!organizationId) {
      return respondError(res, "MISSING_ORGANIZATION_ID", "Missing organization id", 400);
    }

    const { sessionId } = req.params;
    const session = chatSessions.get(sessionId);

    if (!session) {
      return respondError(res, "SESSION_NOT_FOUND", "Session not found", 404);
    }

    if (session.organizationId !== organizationId) {
      return respondError(res, "UNAUTHORIZED", "Unauthorized", 403);
    }

    return respondSuccess(res, {
      sessionId,
      role: session.role,
      department: session.department,
      messages: session.messages,
      messageCount: session.messages.length,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt
    });
  } catch (err) {
    return next(err);
  }
});

/**
 * Close a chat session
 * DELETE /api/chatbot/sessions/:sessionId
 */
chatbotRoutes.delete("/sessions/:sessionId", async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    if (!organizationId) {
      return respondError(res, "MISSING_ORGANIZATION_ID", "Missing organization id", 400);
    }

    const { sessionId } = req.params;
    const session = chatSessions.get(sessionId);

    if (!session) {
      return respondError(res, "SESSION_NOT_FOUND", "Session not found", 404);
    }

    if (session.organizationId !== organizationId) {
      return respondError(res, "UNAUTHORIZED", "Unauthorized", 403);
    }

    chatSessions.delete(sessionId);

    return respondSuccess(res, {
      sessionId,
      message: "Chat session closed",
      messageCount: session.messages.length
    });
  } catch (err) {
    return next(err);
  }
});

/**
 * Get chatbot status
 * GET /api/chatbot/status
 */
chatbotRoutes.get("/status", (_req, res) => {
  res.json({
    module: "chatbot",
    status: "ok",
    activeSessions: chatSessions.size,
    models: ["claude-3-5-sonnet-20241022"],
    providers: {
      anthropic: Boolean(process.env.ANTHROPIC_API_KEY)
    }
  });
});

