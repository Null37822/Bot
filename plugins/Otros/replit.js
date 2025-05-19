const fs = require("fs");
const path = require("path");
const { downloadMediaMessage } = require("baileys");

module.exports = {
  command: "replit",
  execute: async ({ reply, socket, messageObj, args }) => {
    try {
      // Verificar si se respondió a un mensaje
      const contextInfo = messageObj.message?.extendedTextMessage?.contextInfo;
      if (!contextInfo?.quotedMessage) {
        return reply("⚠️ Debes responder a un mensaje que contenga un audio.");
      }

      // Verificar que se haya ingresado un número
      if (!args[0] || isNaN(args[0])) {
        return reply("⚠️ Debes ingresar un número de teléfono válido después de /replit.\nEjemplo: /replit 5493814599125");
      }

      const targetNumber = args[0] + "@s.whatsapp.net"; // Convertir el número al formato de WhatsApp

      // Obtener el mensaje citado y verificar si es un audio o un MP3
      const quotedMessage = contextInfo.quotedMessage;
      const audioMessage = quotedMessage.audioMessage || quotedMessage.documentMessage;

      if (!audioMessage || !audioMessage.mimetype.includes("audio")) {
        return reply("⚠️ El mensaje citado no es un audio o archivo MP3.");
      }

      // Crear carpeta temporal si no existe
      const tmpDir = path.join(__dirname, "../temp");
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }

      // Definir ruta del archivo temporal con formato .opus o .mp3
      const extension = audioMessage.mimetype.includes("mp3") ? "mp3" : "opus";
      const filePath = path.join(tmpDir, `audio_${Date.now()}.${extension}`);

      // Descargar el audio
      const audioBuffer = await downloadMediaMessage(
        { message: quotedMessage, type: "buffer" },
        "buffer"
      );

      if (!audioBuffer) {
        return reply("❌ Error al descargar el audio.");
      }

      // Guardar el archivo temporalmente
      fs.writeFileSync(filePath, audioBuffer);
      console.log(`✅ Archivo guardado en: ${filePath}`);

      // Leer el archivo guardado para enviarlo
      const audioData = fs.readFileSync(filePath);

      // 🔹 Enviar el audio al número indicado con "escuchar solo una vez"
      await socket.sendMessage(targetNumber, {
        audio: audioData,
        mimetype: "audio/ogg; codecs=opus",
        ptt: true, // Lo envía como nota de voz
        viewOnce: true, // 🔹 Escuchar solo una vez
      });

      console.log(`✅ Audio reenviado a ${targetNumber} como mensaje de una sola escucha.`);

      // Eliminar el archivo después de enviarlo
      fs.unlinkSync(filePath);
      console.log("🗑️ Archivo eliminado después del proceso.");

      // Confirmar que se envió
      reply(`✅ Audio reenviado a *${args[0]}* con opción de "escuchar una vez".`);

    } catch (error) {
      console.error("❌ Error en el comando /replit:", error);
      reply("⚠️ Ocurrió un error al reenviar el audio.");
    }
  }
};