const fs = require("fs");
const path = require("path");
const { downloadMediaMessage } = require("baileys");

// Ruta del archivo de grupos permitidos
const groupsFile = path.join(__dirname, "../Grupos-permitidos.txt");

// Función para cargar los grupos permitidos
const loadAllowedGroups = () => {
  if (fs.existsSync(groupsFile)) {
    return fs.readFileSync(groupsFile, "utf-8")
      .split("\n")
      .map(name => name.trim())
      .filter(name => name.length > 0);
  }
  return [];
};

module.exports = {
  command: "replit1",
  execute: async ({ reply, socket, messageObj, args }) => {
    try {
      let allowedGroups = loadAllowedGroups();
      if (allowedGroups.length === 0) {
        return reply("⚠️ No hay grupos permitidos configurados.");
      }

      // Si no se envió un número, mostrar la lista de grupos
      if (!args[0]) {
        let lista = allowedGroups.map((name, i) => `${i + 1}) ${name}`).join("\n");
        return reply(`📌 *Grupos permitidos:*\n\n${lista}\n\nEnvía */replit1 número* para elegir un grupo.`);
      }

      // Obtener el índice del grupo
      const index = parseInt(args[0]) - 1;
      if (isNaN(index) || index < 0 || index >= allowedGroups.length) {
        return reply("⚠️ Número de grupo inválido. Usa */replit1* para ver la lista.");
      }

      const groupName = allowedGroups[index];

      // Obtener los metadatos del grupo para obtener su ID
      let groupId;
      try {
        const allGroups = await socket.groupFetchAllParticipating();
        const foundGroup = Object.values(allGroups).find(g => g.subject === groupName);
        if (!foundGroup) {
          return reply("⚠️ No se encontró el grupo en la lista de chats del bot.");
        }
        groupId = foundGroup.id;
      } catch (error) {
        console.log("❌ Error obteniendo los grupos:", error);
        return reply("⚠️ No se pudo obtener la lista de grupos.");
      }

      // Verificar si se respondió a un mensaje
      const contextInfo = messageObj.message?.extendedTextMessage?.contextInfo;
      if (!contextInfo?.quotedMessage) {
        return reply("⚠️ Debes responder a un mensaje que contenga un audio.");
      }

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

      // 🔹 Enviar el audio al grupo seleccionado con "escuchar solo una vez"
      await socket.sendMessage(groupId, {
        audio: audioData,
        mimetype: "audio/ogg; codecs=opus",
        ptt: true, // Lo envía como nota de voz
        viewOnce: true, // 🔹 Escuchar solo una vez
      });

      console.log(`✅ Audio reenviado al grupo ${groupName}.`);

      // Eliminar el archivo después de enviarlo
      fs.unlinkSync(filePath);
      console.log("🗑️ Archivo eliminado después del proceso.");

      // Confirmar que se envió
      reply(`✅ Audio enviado a *${groupName}* con opción de "escuchar una vez".`);

    } catch (error) {
      console.error("❌ Error en el comando /replit1:", error);
      reply("⚠️ Ocurrió un error al reenviar el audio.");
    }
  }
};