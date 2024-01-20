const telegramBot = require("node-telegram-bot-api");
const { scrapper } = require ("./scrapper");
require("dotenv").config();

scrapper("https://web.telegram.org/a/#-1001398805942");




// const TOKEN = process.env.TOKEN;

// const bot = new telegramBot(TOKEN, { polling: true });

// bot.onText(/\/start/, (msg) => {
//   const chatId = msg.chat.id;
//   console.log(msg.text);
//   bot.sendMessage(chatId, "Welcome! Send me a URL to scrape images.");
// });

// bot.onText(/\/scrape/, async (msg) => {
    
//   const chatId = msg.chat.id;
//     console.log(msg.text)
//   const urlMatch = msg.text.match(/\bhttps?:\/\/\S+/);
//   const url = urlMatch ? urlMatch[0] : null;
  

//   // Call the scrapper function
//   try {
//     await scrapper(url);
//     bot.sendMessage(
//       chatId,
//       "Scraping in progress. Check for images in the specified directory."
//     );
//   } catch (error) {
//     console.log(error)
//     bot.sendMessage(chatId, `Error during scraping: ${error.message}`);
//   }
// });
