const { default: makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion, isJidBroadcast, isJidStatusBroadcast, isJidNewsletter, } = require("baileys");

const pino = require("pino"); const fs = require("fs"); const readline = require("readline"); const { runLite } = require("./index"); // Usa la lógica original para los comandos

const SESSION_DIR = "./session"; if (!fs.existsSync(SESSION_DIR)) fs.mkdirSync(SESSION_DIR, { recursive: true });

let botReady = false; let botStartTime = Date.now(); // Marca de tiempo de inicio

async function askQuestion(question) { const rl = readline.createInterface({ input: process.stdin, output: process.stdout, }); return new Promise((resolve) => rl.question(question, (ans) => { rl.close(); resolve(ans.trim()); })); }

async function startBot() { console.log("🚀 Iniciando bot...");

const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR); const { version } = await fetchLatestBaileysVersion();

const socket = makeWASocket({ version, logger: pino({ level: "silent" }), auth: state, keepAliveIntervalMs: 60 * 1000, shouldIgnoreJid: (jid) => isJidBroadcast(jid) || isJidStatusBroadcast(jid) || isJidNewsletter(jid), });

if (!socket.authState.creds.registered) { console.log("📱 No hay sesión guardada. Se requiere vinculación."); const phoneNumber = await askQuestion("📞 Ingresa tu número de WhatsApp (ej: 5491123456789): ");

if (!phoneNumber) {
  console.error("❌ Número inválido. Reinicia el bot e intenta nuevamente.");
  process.exit(1);
}

const code = await socket.requestPairingCode(phoneNumber);
console.log(`✅ Código de vinculación enviado: ${code}`);

}

socket.ev.on("creds.update", saveCreds);

socket.ev.on("connection.update", (update) => { const { connection, lastDisconnect } = update;

if (connection === "close") {
  const reason = lastDisconnect?.error?.output?.statusCode;
  if (reason === DisconnectReason.loggedOut) {
    console.error("❌ Se eliminó la sesión. Reinicia para vincular nuevamente.");
    process.exit(1);
  } else {
    console.log("🔄 Reconectando...");
    startBot();
  }
} else if (connection === "open") {
  console.log("✅ Bot conectado exitosamente.");
  setTimeout(() => {
    botReady = true;
    botStartTime = Date.now(); // Se actualiza la marca de tiempo cuando el bot está listo
    console.log("📩 Bot listo para recibir comandos.");
  }, 3000);
}

});

socket.ev.on("messages.upsert", (data) => { if (!botReady) return; // Evita procesar mensajes antes de estar listo

const newMessages = data.messages.filter(msg => msg.messageTimestamp * 1000 > botStartTime);
if (newMessages.length === 0) return; // Si todos los mensajes son antiguos, no hace nada

runLite({ socket, data: { messages: newMessages } });

});

return socket; }

startBot();

