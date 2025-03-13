const { cmd } = require('../command');
const config = require('../config');
const axios = require('axios');
const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, sleep, fetchJson, empiretourl } = require('../lib/functions');
const ffmpeg = require('fluent-ffmpeg');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const fs = require('fs');
const path = require('path');
const { sms, downloadMediaMessage } = require('../lib/msg');

cmd({
    pattern: "tomp3",
    desc: "Convert video to MP3.",
    category: "converter",
    react: "🎵",
    filename: __filename
}, async (conn, mek, m, { from, quoted, reply }) => {
    try {
        if (!quoted) return reply("❌ Reply to a video to convert it to MP3!");
        if (quoted.type !== "videoMessage") return reply("❌ Reply to a video message!");

        reply("⏳ Converting to MP3...");
        let inputFile = `/tmp/${Date.now()}.mp4`;
        let outputFile = inputFile.replace(".mp4", ".mp3");

        fs.writeFileSync(inputFile, await downloadMediaMessage(quoted, inputFile));

        exec(`ffmpeg -i ${inputFile} -q:a 0 -map a ${outputFile}`, async (err) => {
            if (err) {
                console.error(err);
                return reply("❌ Error converting video to MP3!");
            }

            let audioBuffer = fs.readFileSync(outputFile);
            await conn.sendMessage(from, { audio: audioBuffer, mimetype: "audio/mpeg" }, { quoted: m });

            fs.unlinkSync(inputFile);
            fs.unlinkSync(outputFile);
        });

    } catch (e) {
        console.error(e);
        reply("❌ Error processing the request!");
    }
});

cmd({
  pattern: "photo",
  alias: ["toimage", "photo"],
  desc: "Convert a sticker to an image.",
  category: "tools",
  filename: __filename,
}, async (conn, mek, m, { reply }) => {
  try {
    // Vérifier si l'utilisateur a répondu à un message
    if (!m.quoted) {
      return reply("*📛 ᴘʟᴇᴀsᴇ ʀᴇᴘʟʏ ᴛᴏ ᴀ sᴛɪᴄᴋᴇʀ ᴛᴏ ᴄᴏɴᴠᴇʀᴛ ɪᴛ ᴛᴏ ᴀɴ ɪᴍᴀɢᴇ.*");
    }

    // Vérifier si le message cité est un sticker
    if (m.quoted.mtype !== "stickerMessage") {
      return reply("❌ The replied message is not a sticker.");
    }

    // Télécharger le sticker
    let media = await m.quoted.download();

    // Vérifier si le téléchargement a réussi
    if (!media) {
      return reply("❌ Failed to download the sticker.");
    }

    // Envoyer l'image convertie
    await conn.sendMessage(m.chat, { image: media, caption: "*✅ HERE IS YOUR IMAGE.*" }, { quoted: m });

  } catch (error) {
    reply("❌ An error occurred while converting the sticker to an image.");
    console.error(error);
  }
});