# Flowchart Hệ Thống Chatbot Tuyển Dụng
<img width="1024" height="1024" alt="image" src="https://github.com/user-attachments/assets/19fa1077-f91e-47ce-aa13-b3a2a0d1768a" />


## 1. Luồng Chính - Chat với Candidate

```
┌─────────────────────────────────────────────────────────────┐
│  START: User gửi message qua API                            │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  Xác thực Token (verifyToken middleware)                    │
└──────────────────┬──────────────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
        ▼                     ▼
   ❌ Thất bại          ✅ Thành công
   Return 401          Lấy candidateId
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Load Candidate từ Database (findById)                      │
└──────────────────┬──────────────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
        ▼                     ▼
   ❌ Not Found         ✅ Found
   Throw Error         Continue
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Kiểm tra Conversation tồn tại? (findOne)                   │
└──────────────────┬──────────────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
        ▼                     ▼
   Không tồn tại         Tồn tại
   Tạo mới              Load existing
   Conversation         Conversation
        │                     │
        └──────────┬──────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  BUILD CONTEXT CHO LLM                                       │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 1. System Prompt                                      │  │
│  │    - Role: "Trợ lý AI tuyển dụng"                    │  │
│  │    - Thông tin Candidate:                            │  │
│  │      • Giới tính                                      │  │
│  │      • Ngày sinh                                      │  │
│  │      • Địa chỉ                                        │  │
│  │      • Hồ sơ (profileSummary)                        │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  Có Summary hội thoại trước?                                │
└──────────────────┬──────────────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
        ▼                     ▼
      Có                   Không
   Thêm summary          Bỏ qua
   vào context
        │                     │
        └──────────┬──────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  Lấy 12 messages gần nhất từ conversation.messages          │
│  (slice(-MAX_MESSAGES))                                     │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  Thêm user message mới vào messages array                   │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  🤖 GỌI LLM API - generateText()                            │
│  Input: Formatted messages (role: content)                  │
│  Max tokens: 300                                            │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  Nhận assistant reply từ LLM                                │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  LƯU DỮ LIỆU VÀO DATABASE                                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 1. Push user message vào conversation.messages       │  │
│  │ 2. Push assistant reply vào conversation.messages    │  │
│  │ 3. Cập nhật conversation.lastActiveAt = now()        │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  Kiểm tra: messages.length > 24?                            │
│  (MAX_MESSAGES * 2)                                         │
└──────────────────┬──────────────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
        ▼                     ▼
      Có                   Không
   Cần tóm tắt           Bỏ qua
        │                     │
        ▼                     │
┌──────────────────────────┐  │
│  SUMMARIZATION PROCESS   │  │
│  ┌────────────────────┐  │  │
│  │ 1. Gọi LLM để     │  │  │
│  │    tóm tắt toàn   │  │  │
│  │    bộ messages    │  │  │
│  │                   │  │  │
│  │ 2. Lưu summary    │  │  │
│  │    vào DB         │  │  │
│  │                   │  │  │
│  │ 3. Chỉ giữ lại   │  │  │
│  │    12 messages    │  │  │
│  │    mới nhất       │  │  │
│  │                   │  │  │
│  │ 4. Xóa messages   │  │  │
│  │    cũ             │  │  │
│  └────────────────────┘  │  │
└──────────┬───────────────┘  │
           │                  │
           └────────┬─────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│  conversation.save() - Lưu vào MongoDB                      │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  RESPONSE trả về Client                                     │
│  {                                                           │
│    success: true,                                           │
│    reply: "AI response...",                                 │
│    conversationSummary: "summary..." (nếu có)               │
│  }                                                           │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
                 END
```

---

## 2. Luồng Phụ - Lấy Lịch Sử Conversation

```
┌─────────────────────────────────────────────────────────────┐
│  START: GET /api/conversation                               │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  Xác thực Token → Lấy candidateId                           │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  Query: Conversation.findOne({ candidateId })               │
└──────────────────┬──────────────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
        ▼                     ▼
   ❌ Not Found          ✅ Found
   Return 404           Return conversation
                        với toàn bộ messages
```

---

## 3. Các Thành Phần Chính

### 3.1 Models

**Conversation Model:**
```
{
  candidateId: ObjectId,
  messages: [
    {
      role: "user" | "assistant",
      content: String
    }
  ],
  summary: String,
  lastActiveAt: Date
}
```

**Candidate Model:**
```
{
  gender: String,
  dateOfBirth: Date,
  address: String,
  profileSummary: String
}
```

### 3.2 Services

**chatWithCandidate(candidateId, userMessage)**
- Load candidate & conversation
- Build context với candidate info
- Quản lý lịch sử messages (max 12)
- Gọi LLM
- Lưu & tóm tắt nếu cần

**summarizeConversation(messages)**
- Format messages thành text
- Gọi LLM để tóm tắt
- Return summary string

**generateText(prompt, maxTokens)**
- Wrapper cho LLM API call

### 3.3 Controllers

**chatController**
- Validate input (candidateId, message)
- Call chatWithCandidate service
- Return response

**getConversationController**
- Validate candidateId
- Query conversation từ DB
- Return full conversation history

---

## 4. Quy Trình Quản Lý Memory

```
Messages Timeline:

Initial: [M1, M2, M3, ... M20]
           ↓
When > 24 messages:
           ↓
Step 1: Summarize ALL
   Summary: "Ứng viên hỏi về vị trí, mức lương..."
           ↓
Step 2: Keep only last 12
   [M13, M14, M15, ... M24]
           ↓
Next conversation uses:
   System Prompt
   + Summary
   + Last 12 messages
   + New message
```

---

## 5. Error Handling Flow

```
Error Type                    →  Response
──────────────────────────────────────────────────
No candidateId/message        →  400 Bad Request
Candidate not found          →  500 Error
Conversation not found (GET) →  404 Not Found
LLM API failure             →  500 Error
Database error              →  500 Error
```

---

## 6. Điểm Mạnh & Điểm Cần Cải Thiện

### ✅ Điểm Mạnh:
- **Context Management**: Giữ 12 messages + summary → tiết kiệm token
- **Personalization**: Tích hợp thông tin candidate
- **Auto Summarization**: Tự động tóm tắt khi conversation dài
- **Stateful**: Lưu trữ lịch sử đầy đủ

### ⚠️ Điểm Cần Cải Thiện:
- **LLM Integration**: `generateText` đang format messages thủ công, nên dùng proper message format
- **Concurrency**: Không xử lý concurrent requests từ cùng candidate
- **Error Recovery**: Nếu summarization fail, toàn bộ flow bị block
- **Prompt Engineering**: System prompt đơn giản, có thể optimize thêm
