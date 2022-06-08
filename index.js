const mongoose = require("mongoose");
require("mongoose-long")(mongoose);

const ethers = require("ethers");
const TelegramBot = require("node-telegram-bot-api");
const { ChatHistoryModel } = require("./models/chat-history.model");
const { FaucetHistoryModel } = require("./models/faucet-history.model");

require("dotenv").config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);

    const token = process.env.TELEGRAM_TOKEN;
    const bot = new TelegramBot(token, { polling: true });

    const provider = new ethers.providers.getDefaultProvider(
      process.env.BSC_TESTNET
    );
    const abi = require("./abi.json");

    const bftContract = new ethers.Contract(
      process.env.BFT_SMCT,
      abi,
      provider
    );
    const signer = new ethers.Wallet(process.env.PRIVATE_KEY_WALLET, provider);
    const bftWithSigner = bftContract.connect(signer);
    const SEND_AMOUNT = ethers.utils.parseUnits("100.0", 18);

    bot.onText(/\/start/, async (msg) => {
      bot.sendMessage(msg.chat.id, "Welcome", {
        reply_markup: {
          keyboard: [
            ["/faucet 💵", "/donate 🎁"],
            ["/explore 🚀"],
            ["/partnership 👨‍💻"],
          ],
        },
      });

      await saveChatHistory(msg);
    });

    bot.onText(/\/faucet/, async (msg) => {
      bot.sendMessage(
        msg.chat.id,
        "Please enter your wallet address, you will recieve BFT on BSC testnet, " +
          msg.from.first_name
      );

      await saveChatHistory(msg);
    });

    bot.on("message", async (msg) => {
      const balance = await bftContract.balanceOf(process.env.WALLET_ADDRESS);

      if (ethers.utils.isAddress(msg.text)) {
        const lText = await getLatestChatHistory(msg.chat.id);

        // handle faucet
        if (lText.startsWith("/faucet")) {
          console.log(
            `[FAUCET]---Address---${msg.text}---${SEND_AMOUNT.toString()}`
          );
          bot.sendMessage(msg.chat.id, "Please wait a moment, thank you!");
          if (balance.gt(SEND_AMOUNT)) {
            const tx = await bftWithSigner.transfer(msg.text, SEND_AMOUNT);
            saveFaucetHistory({
              chatId: msg.chat.id,
              walletAddress: msg.text,
              amount: SEND_AMOUNT,
            });

            bot.sendMessage(
              msg.chat.id,
              "100 BFT were sent to your wallet,\n" +
                "Check transaction at link \n" +
                `https://testnet.bscscan.com/tx/${tx.hash}`
            );
          } else {
            bot.sendMessage(msg.chat.id, "We dont have enough BFT token");
          }
        }
        await saveChatHistory(msg);
      }
    });

    bot.onText(/\/donate/, async (msg) => {
      bot.sendMessage(
        msg.chat.id,
        `Please send your BFT token to address:\n0x6b94e555b41613ed40f05478eec7bb5fa94f5647`
      );

      await saveChatHistory(msg);
    });

    bot.onText(/\/explore/, async (msg) => {
      bot.sendMessage(
        msg.chat.id,
        `Explore project at lint:\nhttps://landing.battlefi.io/`
      );

      await saveChatHistory(msg);
    });

    bot.onText(/\/partnership/, async (msg) => {
      bot.sendMessage(
        msg.chat.id,
        `Send message to me via:\nhttps://t.me/rintran720`
      );

      await saveChatHistory(msg);
    });
  } catch (err) {
    console.error(`[BOT_ERROR]---${err}`);
  }

  const saveChatHistory = async (msg) => {
    console.log(msg);
    await ChatHistoryModel.create({
      chatId: msg.chat.id,
      isBot: msg.from.is_bot || false,
      username: msg.from.username,
      text: msg.text,
    });
  };

  const getLatestChatHistory = async (chatId) => {
    const latestChatHistory = await ChatHistoryModel.findOne({ chatId }).sort({
      createdAt: -1,
    });
    return latestChatHistory ? latestChatHistory.text : "";
  };

  const saveFaucetHistory = async ({ chatId, walletAddress, amount = 0 }) => {
    await ChatHistoryModel.create({
      chatId,
      walletAddress,
      amount,
    });
  };
})();
