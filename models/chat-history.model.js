const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const ChatHistorySchema = new Schema(
  {
    chatId: {
      type: Number,
      required: true,
    },
    isBot: { type: Boolean, required: true },
    username: { type: String, required: true },
    text: { type: String, required: true },
  },
  { timestamps: true }
);

const ChatHistoryModel = model("chat-history", ChatHistorySchema);
module.exports = { ChatHistoryModel };
