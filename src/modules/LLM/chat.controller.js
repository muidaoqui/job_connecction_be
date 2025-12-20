import { chatWithCandidate, getConversationByCandidate } from "./chat.service.js";
import User from "../auth/auth.model.js";
export const chatController = async (req, res) => {
  try {
    const { message } = req.body;
    const candidateId = req.user.id; // hoặc req.user._id

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
    console.error("Chat error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// API: Lấy hội thoại theo candidateId
export const getConversationController = async (req, res) => {
  try {
    const candidateId = req.user.id; // hoặc req.user._id
    if (!candidateId) {
      return res.status(400).json({
        success: false,
        message: "candidateId is required"
      });
    }
    const conversation = await getConversationByCandidate(candidateId);
    const user = await User.findById(candidateId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        name: user.name,
        message: "Conversation not found"
      });
    }
    res.json({
      success: true,
      name: user.name,
      conversation
    });
  } catch (error) {
    console.error("Get conversation error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
