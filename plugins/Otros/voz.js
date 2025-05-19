const fs = require("fs");
const path = require("path");
const { downloadMediaMessage } = require("baileys");

module.exports = {
  command: "voz",
  execute: async ({ reply, socket, messageObj }) => {
    try {
      // Verificar si se respondió a un mensaje
      const contextInfo = messageObj.message?.extendedTextMessage?.contextInfo;
      if (!contextInfo?.quotedMessage) {
        return reply("⚠️ Debes responder a un mensaje que contenga un audio.");
      }

      const quotedMessage = contextInfo.quotedMessage;
      const audioMessage = quotedMessage.audioMessage;

      // Verificar si el mensaje citado contiene un audio
      if (!audioMessage || !audioMessage.mimetype.includes("audio")) {
        return reply("⚠️ El mensaje citado no es un audio.");
      }

      // Crear carpeta temporal si no existe
      const tmpDir = path.join(__dirname, "../temp");
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }

      // Definir ruta del archivo temporal con formato .opus
      const filePath = path.join(tmpDir, `audio_${Date.now()}.opus`);

      // Descargar el audio
      const audioBuffer = await downloadMediaMessage(
        { message: quotedMessage, type: "buffer" },
        "buffer"
      );

      if (!audioBuffer) {
        return reply("❌ Error al descargar el audio.");
      }

      // Guardar el archivo en formato OPUS
      fs.writeFileSync(filePath, audioBuffer);
      console.log(`✅ Archivo guardado en: ${filePath}`);

      // Leer el archivo guardado para enviarlo como nota de voz
      const audioData = fs.readFileSync(filePath);

      // 🔹 Forzar WhatsApp a reconocerlo como nota de voz en todos los chats
      await socket.sendMessage(messageObj.key.remoteJid, {
        audio: audioData,
        mimetype: "audio/ogg; codecs=opus",
        ptt: true, // 🔹 Esto indica que es una nota de voz
      });

      console.log("✅ Audio enviado como nota de voz.");

      // Eliminar el archivo después de enviarlo
      fs.unlinkSync(filePath);
      console.log("🗑️ Archivo eliminado después del proceso.");

    } catch (error) {
      console.error("❌ Error en el comando /voz:", error);
      reply("⚠️ Ocurrió un error al convertir el audio en nota de voz.");
    }
  }
};