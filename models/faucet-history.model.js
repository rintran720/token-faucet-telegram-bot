const mongoose = require("mongoose");
const { Schema, model } = mongoose;
const SchemaTypes = mongoose.Schema.Types;

const FaucetHistorySchema = new Schema(
  {
    walletAddress: {
      type: String,
      required: true,
    },
    amount: { type: SchemaTypes.Long, required: true, default: 0 },
    chatId: { type: Number, required: true },
  },
  { timestamps: true }
);

const FaucetHistoryModel = model("faucet-history", FaucetHistorySchema);
module.exports = { FaucetHistoryModel };
