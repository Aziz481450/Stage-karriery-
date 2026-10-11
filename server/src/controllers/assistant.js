import { ApiError } from '../utils/ApiError.js';
import { assistantReply } from '../services/llm.js';

const ROLES = new Set(['user', 'assistant']);
const MAX_HISTORY = 12;
const MAX_LEN = 4000;

// Assistant IA du header : reçoit l'historique conversationnel et renvoie la réponse du LLM.
export const assistantChat = async (req, res) => {
  const raw = req.body?.messages;
  if (!Array.isArray(raw) || raw.length === 0) throw new ApiError(400, 'Message manquant.');

  const messages = raw
    .filter((m) => m && ROLES.has(m.role) && typeof m.content === 'string' && m.content.trim())
    .slice(-MAX_HISTORY)
    .map((m) => ({ role: m.role, content: m.content.trim().slice(0, MAX_LEN) }));

  if (!messages.length || messages[messages.length - 1].role !== 'user') {
    throw new ApiError(400, 'Le dernier message doit être une question.');
  }

  const out = await assistantReply({ messages });
  res.json(out);
};
