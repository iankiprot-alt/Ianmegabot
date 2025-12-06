
import fs from 'fs';- import makeWASocket, { useMultiFileAuthState, downloadContentFromMessage } from '@whiskeysockets/baileys';
+ import { makeWASocket, useMultiFileAuthState, downloadContentFromMessage } from 'baileys';
import axios from 'axios';
import ytdl from 'ytdl-core';
import { setTimeout as delay } from 'timers/promises';
import path from 'path';


// Annoyed slang responses
const slangResponses = [
    "unakera aki 😂",
    "aki wewe ni nuisance sana 😭",
    "wawili watatu utanishangaza 😭",
    "aki acha kelele 😂",
    "wewe leo unanisumbua bure 😭",
    "mbona unanizingua hivyo 😭😭",
    "usinizingue aki 😂",
    "kwani leo umeamka vibaya 😂",
];

const apiKey = 'Two2y1aDaez-FsHOAmNNB'; 

function getSlangResponse(text) {
    if (!text) return null;

    const annoyingKeywords = ["mbona", "kwani", "aki", "hee", "na wewe", "sijui", "kwani wewe", "we", "sasa"];

    if (annoyingKeywords.some(word => text.toLowerCase().startsWith(word))) {
        return slangResponses[Math.floor(Math.random() * slangResponses.length)];
    }

    return null;
}

const __dirname = path.resolve();

if (!fs.existsSync('./downloads')) {
    fs.mkdirSync('./downloads');
}

const viewedStatuses = new Set();

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth');
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true
    });

    async function downloadMedia(message, fileName) {
        const messageType = Object.keys(message)[0];
        const stream = await downloadContentFromMessage(message[messageType], messageType.split('Message')[0]);
        const filePath = `./downloads/${fileName}`;

        let buffer = Buffer.from([]);

        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        fs.writeFileSync(filePath, buffer);
        return filePath;
    }

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const sender = msg.key.remoteJid;
        const messageType = Object.keys(msg.message)[0];
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text;

        // Slang response
        if (text) {
            const response = getSlangResponse(text);
            if (response) {
                await sock.sendMessage(sender, { text: response });
                return;
            }
        }

        // YouTube Downloader
        if (text?.startsWith('.yt')) {
            const url = text.split(' ')[1];
            if (!ytdl.validateURL(url)) {
                return sock.sendMessage(sender, { text: "Invalid YouTube link 😭" });
            }

            const info = await ytdl.getInfo(url);
            const title = info.videoDetails.title.replace(/[^a-zA-Z0-9 ]/g, '');
            const filePath = `./downloads/${title}.mp4`;

            sock.sendMessage(sender, { text: "Downloading... ⏳" });

            ytdl(url, { quality: 'lowest' })
                .pipe(fs.createWriteStream(filePath))
                .on('finish', async () => {
                    await sock.sendMessage(sender, {
                        video: fs.readFileSync(filePath),
                        caption: "Here is your video 😊"
                    });
                });
        }

        // View once bypass
        if (messageType === 'viewOnceMessageV2') {
            const realMessage = msg.message.viewOnceMessageV2.message;
            const innerType = Object.keys(realMessage)[0];
            const fileName = `view_once_${Date.now()}.jpg`;

            const filePath = await downloadMedia(realMessage, fileName);
            await sock.sendMessage(sender, {
                image: fs.readFileSync(filePath),
                caption: "🫣 View-once bypassed"
            });
        }

        // Auto media & status saver
        if (['imageMessage', 'videoMessage', 'audioMessage'].includes(messageType)) {
            const fileName = `${messageType}_${Date.now()}`;
            const filePath = await downloadMedia(msg.message, fileName);

            await sock.sendMessage(sender, {
                text: `Saved: ${fileName}`
            });
        }
    });

    // Auto view status + save
    sock.ev.on('messages.update', async (updates) => {
        for (const update of updates) {
            if (update.update.messageStubType === 92) {
                const statusId = update.key.id;

                if (viewedStatuses.has(statusId)) return;
                viewedStatuses.add(statusId);

                try {
                    await delay(500);
                    await sock.readMessages([update.key]);
                } catch {}
            }
        }
    });

    // Group commands
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message) return;

        const sender = msg.key.remoteJid;
        const text = msg.message.conversation;

        if (!text) return;

        const isGroup = sender.endsWith('@g.us');
        if (!isGroup) return;

        const metadata = await sock.groupMetadata(sender);
        const admins = metadata.participants.filter(p => p.admin);
        const isAdmin = admins.some(p => p.id === msg.key.participant);

        if (!isAdmin) return;

        if (text.startsWith('.add')) {
            const number = text.split(' ')[1];
            await sock.groupParticipantsUpdate(sender, [`${number}@s.whatsapp.net`], 'add');
            await sock.sendMessage(sender, { text: "User added 😊" });
        }

        if (text.startsWith('.remove')) {
            const number = text.split(' ')[1];
            await sock.groupParticipantsUpdate(sender, [`${number}@s.whatsapp.net`], 'remove');
            await sock.sendMessage(sender, { text: "User removed 😭" });
        }

        if (text.startsWith('.all')) {
            const tags = metadata.participants.map(m => `@${m.id.split('@')[0]}`).join(' ');
            await sock.sendMessage(sender, { text: tags, mentions: metadata.participants.map(m => m.id) });
        }

        if (text.startsWith('.remove all')) {
            for (const member of metadata.participants) {
                if (member.id !== metadata.owner) {
                    await sock.groupParticipantsUpdate(sender, [member.id], 'remove');
                }
            }
            await sock.sendMessage(sender, { text: "All removed 😭" });
        }
    });

    sock.ev.on('creds.update', saveCreds);
}
// --- Download command (.download) --- 
try {
  if (text.startsWith(".download")) {
    // Get argument after command or replied message
    let arg = text.split(" ").slice(1).join(" ").trim();
    if (!arg && m.message.extendedTextMessage?.contextInfo?.quotedMessage) {
      // If user replied to message, take that text
      arg = m.message.extendedTextMessage.contextInfo.quotedMessage.conversation || '';
    }

    if (!arg) {
      await sock.sendMessage(from, { text: "Provide a name or link to download. Example: .download song name or reply to message with link" });
      return;
    }

    // Notify user that download started
    const replyMsg = await sock.sendMessage(from, { text: `⬇️ Searching & downloading: ${arg}` });

    const filePath = `./media/yt/download_${Date.now()}.mp3`;

    try {
      // If it's a valid YouTube link
      if (ytdl.validateURL(arg)) {
        const writeStream = fs.createWriteStream(filePath);
        ytdl(arg, { filter: 'audioonly' }).pipe(writeStream);
        await new Promise((resolve, reject) => {
          writeStream.on('finish', resolve);
          writeStream.on('error', reject);
        });

        // Send audio file after download
        await sock.sendMessage(from, {
          document: fs.createReadStream(filePath),
          mimetype: "audio/mpeg",
          fileName: `song_${Date.now()}.mp3`
        });

        await sock.sendMessage(from, { text: "✅ Download complete!" });
      } else {
        // Placeholder for name search or social media downloads
        await sock.sendMessage(from, { text: `🔍 Searching for "${arg}"... (feature placeholder)` });
        // Integrate your search/download API here
      }
    } catch (err) {
      console.error("Download error:", err);
      await sock.sendMessage(from, { text: "❌ Download failed" });
    } finally {
      try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch (e) {}
    }
  }
} catch (err) {
  console.error("Download handler error:", err);
}

startBot();
