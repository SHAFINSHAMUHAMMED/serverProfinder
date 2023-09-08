  import mongoose from "mongoose";

  const chatSchema = new mongoose.Schema(
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true,
      },
      professional: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "professionals",
        required: true,
      },
      messages: [
        {
          text: {
            type: String,
            required: true,
          },
          senderType: {
            type: String,
            enum: ["user", "pro"],
            required: true,
          },
          senderId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            refPath: "messages.senderType", // Corrected 'message' to 'messages'
          },
          is_read: {
            type: Boolean,
            default: false
        },
        read_at: {
            type: Date
        },
        timestamp: {
            type: Date,
            default: Date.now
        }

        },
      ],
    },
  );

  const ChatModel = mongoose.model("Chat", chatSchema);

  export default ChatModel