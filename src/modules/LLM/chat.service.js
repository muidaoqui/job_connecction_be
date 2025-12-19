import Conversation from "./conversation.model.js";
import Candidate from "../candidate/candidate.model.js";
import { generateText } from "./llm.service.js";

const MAX_MESSAGES = 12; // số message trước khi tóm tắt

/* ========= Build system prompt từ Candidate ========= */
function buildCandidateContext(candidate) {
  if (!candidate) return "";

  return `
Thông tin ứng viên:
- Giới tính: ${candidate.gender || "Không rõ"}
- Ngày sinh: ${candidate.dateOfBirth || "Không rõ"}
- Địa chỉ: ${candidate.address || "Không rõ"}
- Hồ sơ: ${candidate.profileSummary || "Không có"}
Hãy trả lời phù hợp với bối cảnh ứng viên.
`;
}

/* ========= Tóm tắt hội thoại ========= */
async function summarizeConversation(messages) {
  const text = messages
    .map(m => `${m.role}: ${m.content}`)
    .join("\n");

  const prompt = `
Hãy tóm tắt ngắn gọn hội thoại sau, giữ lại thông tin quan trọng:

${text}
`;

  return await generateText(prompt, 200);
}

/* ========= Chat chính ========= */
export async function chatWithCandidate(candidateId, userMessage) {
  // 1. Load candidate
  const candidate = await Candidate.findById(candidateId).lean();
  if (!candidate) throw new Error("Candidate not found");

  // 2. Load hoặc tạo conversation
  let conversation = await Conversation.findOne({ candidateId });
  if (!conversation) {
    conversation = await Conversation.create({
      candidateId,
      messages: []
    });
  }

  // 3. Build messages cho LLM
  const messages = [];

  // system context
  const systemContext = `
Bạn là trợ lý AI tuyển dụng.
${buildCandidateContext(candidate)}
${conversation.summary ? `Tóm tắt hội thoại trước:\n${conversation.summary}` : ""}
`;

  messages.push({ role: "system", content: systemContext });

  // lịch sử gần nhất
  conversation.messages.slice(-MAX_MESSAGES).forEach(m => {
    messages.push(m);
  });

  // message mới
  messages.push({ role: "user", content: userMessage });

  // 4. Gọi LLM
  const assistantReply = await generateText(
    messages.map(m => `${m.role}: ${m.content}`).join("\n"),
    300
  );

  // 5. Lưu hội thoại
  conversation.messages.push(
    { role: "user", content: userMessage },
    { role: "assistant", content: assistantReply }
  );
  conversation.lastActiveAt = new Date();

  // 6. Tóm tắt nếu quá dài
  if (conversation.messages.length > MAX_MESSAGES * 2) {
    const summary = await summarizeConversation(conversation.messages);
    conversation.summary = summary;
    conversation.messages = conversation.messages.slice(-MAX_MESSAGES);
  }

  await conversation.save();

  return {
    reply: assistantReply,
    summary: conversation.summary
  };
}

// Lấy hội thoại theo candidateId
export async function getConversationByCandidate(candidateId) {
  return await Conversation.findOne({ candidateId }).lean();
}

export const chatController = async (req, res) => {
  try {
    const { message } = req.body;
    const candidateId = req.user.id; // lấy từ verifyToken

    if (!candidateId || !message) {
      return res.status(400).json({
        success: false,
        message: "candidateId and message are required"
      });
    }

    const result = await chatWithCandidate(candidateId, message);

    res.json({
      success: true,
      reply: result.reply,
      conversationSummary: result.summary
    });

  } catch (error) {
    // ...existing error handling...
  }
};
