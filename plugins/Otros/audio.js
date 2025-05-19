const fs = require("fs");
const path = require("path");
const { downloadMediaMessage } = require("baileys");

// Ruta temporal para guardar audios
const tmpDir = path.join(__dirname, "../temp");
if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir, { recursive: true });
}

// Diccionario de textos personalizados según duración
const durationLabels = {
  5000: "⏳ Esperando...",
  10000: "🎶 Reproduciendo...",
  30000: "🔥 Modo épico activado...",
  60000: "🚀 El más largo del día...",
  999999: "🏆 El más largo del mundo",
};

module.exports = {
  command: "audio",
  execute: async ({ reply, socket, messageObj, args }) => {
    try {
      // Verificar si se respondió a un mensaje
      const contextInfo = messageObj.message?.extendedTextMessage?.contextInfo;
      if (!contextInfo?.quotedMessage) {
        return reply("⚠️ Debes responder a un audio.");
      }

      // Obtener la duración ingresada
      if (!args[0] || isNaN(args[0])) {
        return reply("⚠️ Debes ingresar una duración en milisegundos.\nEjemplo: */audio 5000*");
      }

      const newDuration = parseInt(args[0]); // Duración en milisegundos
      const customLabel = durationLabels[newDuration] || `🎧 ${newDuration}ms`;

      // Obtener el mensaje citado y verificar si es un audio
      const quotedMessage = contextInfo.quotedMessage;
      const audioMessage = quotedMessage.audioMessage || quotedMessage.documentMessage;

      if (!audioMessage || !audioMessage.mimetype.includes("audio")) {
        return reply("⚠️ El mensaje citado no es un audio.");
      }

      // Definir la extensión del archivo
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

      // Guardar el audio temporalmente
      fs.writeFileSync(filePath, audioBuffer);
      console.log(`✅ Archivo guardado en: ${filePath}`);

      // Leer el archivo guardado para enviarlo
      const audioData = fs.readFileSync(filePath);

      // Enviar el audio modificado con la nueva duración y etiqueta personalizada
      await socket.sendMessage(messageObj.key.remoteJid, {
        audio: audioData,
        mimetype: "audio/ogg; codecs=opus",
        ptt: true, // Lo envía como nota de voz
        seconds: newDuration / 1000, // Ajusta la duración
        caption: customLabel, // Agrega el texto personalizado
      });

      console.log(`✅ Audio reenviado con duración modificada a ${newDuration}ms (${customLabel}).`);

      // Eliminar el archivo después de enviarlo
      fs.unlinkSync(filePath);
      console.log("🗑️ Archivo eliminado después del proceso.");

      // Confirmar que se envió
      reply(`✅ Audio reenviado con duración de *${customLabel}*.`);

    } catch (error) {
      console.error("❌ Error en el comando /audio:", error);
      reply("⚠️ Ocurrió un error al modificar el audio.");
    }
  }
};