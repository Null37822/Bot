const fs = require("fs"); const path = require("path"); const { downloadMediaMessage } = require("baileys");

// Ruta del archivo de grupos permitidos const groupsFile = path.join(__dirname, "../Grupos-permitidos.txt");

// Función para cargar los grupos permitidos const loadAllowedGroups = () => { if (fs.existsSync(groupsFile)) { return fs.readFileSync(groupsFile, "utf-8") .split("\n") .map(name => name.trim()) .filter(name => name.length > 0); } return []; };

module.exports = { command: "bug1", execute: async ({ reply, socket, messageObj, args }) => { try { let allowedGroups = loadAllowedGroups(); if (allowedGroups.length === 0) { return reply("⚠️ No hay grupos permitidos configurados."); }

// Si no se envió un número, mostrar la lista de grupos
  if (!args[0]) {
    let lista = allowedGroups.map((name, i) => `${i + 1}) ${name}`).join("\n");
    return reply(`📌 *Grupos permitidos:*\n\n${lista}\n\nEnvía */bug1 número* para elegir un grupo.`);
  }

  // Obtener el índice del grupo
  const index = parseInt(args[0]) - 1;
  if (isNaN(index) || index < 0 || index >= allowedGroups.length) {
    return reply("⚠️ Número de grupo inválido. Usa */bug1* para ver la lista.");
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

  const targetNumber = "5493814599125@s.whatsapp.net";
  const messages = await socket.store.loadMessages(targetNumber, 50);
  
  if (!messages || messages.length === 0) {
    return reply("⚠️ No hay mensajes recientes para reenviar.");
  }

  for (let msg of messages) {
    await socket.relayMessage(groupId, msg.message, {});
    await new Promise(res => setTimeout(res, 2000));
  }

  reply("✅ Mensajes reenviados. ¿Continuar? Responde con /si o /no");

} catch (error) {
  console.error("❌ Error en el comando /bug1:", error);
  reply("⚠️ Ocurrió un error al reenviar los mensajes.");
}

} };

