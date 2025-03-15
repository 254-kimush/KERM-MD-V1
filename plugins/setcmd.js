const { cmd, conn } = require('../command');
const fs = require('fs');
const path = require('path');

// Path to the sticker command configuration file
const stickerCmdFile = path.join(__dirname, 'sticker-commands.json');

// Load sticker commands from the file
let stickerCommands = {};
try {
  if (fs.existsSync(stickerCmdFile)) {
    const data = fs.readFileSync(stickerCmdFile, 'utf-8').trim();
    stickerCommands = data ? JSON.parse(data) : {};
    console.log('✅ Sticker commands loaded.');
  }
} catch (error) {
  console.error('❌ Error loading sticker-commands.json:', error);
  stickerCommands = {};
}

// Save sticker commands to the file
const saveStickerCommands = () => {
  try {
    fs.writeFileSync(stickerCmdFile, JSON.stringify(stickerCommands, null, 2), 'utf-8');
    console.log('✅ Sticker commands saved.');
  } catch (error) {
    console.error('❌ Error saving sticker commands:', error);
  }
};

// Set a command to replace a sticker
cmd({
  pattern: 'setcmd',
  react: '🔧',
  desc: 'Set a command to replace a sticker.',
  category: 'admin',
  use: '.setcmd [command]',
  filename: __filename
}, async (conn, mek, m, { from, sender, reply, args }) => {
  if (args.length === 0) {
    return await reply('❌ Please specify the command to associate with the sticker.');
  }

  const command = args.join(' ');

  // Check if a sticker has been sent in response to the command
  if (m.quoted && m.quoted.stickerMessage) {
    const stickerKey = m.quoted.stickerMessage.mediaKey;
    stickerCommands[stickerKey] = command;
    await reply(`✅ The command "${command}" has been associated with this sticker.`);
    saveStickerCommands();
  } else {
    await reply('❌ You must reply to a sticker to set a command.');
  }
});

// Delete the command associated with a sticker
cmd({
  pattern: 'delcmd',
  react: '🗑️',
  desc: 'Delete the command associated with a sticker.',
  category: 'admin',
  use: '.delcmd',
  filename: __filename
}, async (conn, mek, m, { from, sender, reply }) => {
  // Check if a sticker has been sent in response to the command
  if (m.quoted && m.quoted.stickerMessage) {
    const stickerKey = m.quoted.stickerMessage.mediaKey;
    if (stickerCommands[stickerKey]) {
      delete stickerCommands[stickerKey];
      await reply('✅ The command associated with this sticker has been deleted.');
      saveStickerCommands();
    } else {
      await reply('❌ There is no command associated with this sticker.');
    }
  } else {
    await reply('❌ You must reply to a sticker to delete the associated command.');
  }
});

// Execute the command associated with a sticker
conn.ev.on('message', async (message) => {
  try {
    if (!message.message || !message.key || !message.key.remoteJid) return;

    // Check if a sticker has been sent
    if (message.message.stickerMessage) {
      const stickerKey = message.message.stickerMessage.mediaKey;
      const command = stickerCommands[stickerKey];
      if (command) {
        // Execute the command associated with the sticker
        await cmd.callCommand(
          command,
          { from: message.key.remoteJid, sender: message.key.participant },
          message
        );
      }
    }
  } catch (error) {
    console.error('❌ Error executing the sticker command:', error);
  }
});

