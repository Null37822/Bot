const fs = require("fs");
const path = require("path");
const moment = require("moment");

const pluginsDir = path.join(__dirname, "plugins");
const groupsFile = path.join(__dirname, "Grupos-permitidos.txt");
const USE_ALLOWED_GROUPS = true;

const loadAllowedGroups = () => {
  if (fs.existsSync(groupsFile)) {
    return fs.readFileSync(groupsFile, "utf-8")
      .split("\n")
      .map(name => name.trim())
      .filter(name => name.length > 0);
  }
  return [];
};

const loadPlugins = () => {
  const commands = {};
  if (fs.existsSync(pluginsDir)) {
    const pluginFiles = fs.readdirSync(pluginsDir).filter(file => file.endsWith(".js"));
    for (const file of pluginFiles) {
      try {
        const plugin = require(path.join(pluginsDir, file));
        if (plugin.command && plugin.execute) {
          commands[plugin.command.toLowerCase()] = plugin.execute;
        }
      } catch (error) {
        console.error(`⚠️ Error al cargar el plugin ${file}:`, error);
      }
    }
  }
  return commands;
};

let allowedGroups = USE_ALLOWED_GROUPS ? loadAllowedGroups() : [];
let plugins = loadPlugins();

const watchPlugins = () => {
  fs.watch(pluginsDir, (eventType, filename) => {
    if (filename && filename.endsWith(".js")) {
      console.log(`🔄 Recargando plugin: ${filename}`);
      delete require.cache[require.resolve(path.join(pluginsDir, filename))];
      plugins = loadPlugins();
    }
  });
};

watchPlugins();

const loadLiteFunctions = async ({ socket, data }) => {
  if (!data?.messages?.length) return null;

  const messageObj = data.messages[0];
  if (!messageObj.message) return null;

  const messageType = Object.keys(messageObj.message)[0];
  const messageContent = messageObj.message[messageType];

  let command = "";
  if (messageType === "conversation") command = messageContent;
  else if (messageType === "extendedTextMessage") command = messageContent.text;
  else return null;

  command = command.trim();
  if (!command.startsWith("/")) return null;

  const args = command.slice(1).split(" ");
  command = args.shift().toLowerCase();
  const text = args.join(" ");

  const sender = messageObj.key.remoteJid;
  let senderNumber = sender.replace(/[@s.whatsapp.net|@g.us]/g, "");
  let groupName = "Chat Privado";
  let isGroup = sender.endsWith("@g.us");

  if (isGroup) {
    try {
      const metadata = await socket.groupMetadata(sender);
      groupName = metadata.subject.trim();
      
      // 🚨 Si el grupo no está en la lista, el bot no responde.
      if (USE_ALLOWED_GROUPS && !allowedGroups.includes(groupName)) {
        console.log(`❌ Grupo NO permitido: ${groupName}. Ignorando mensajes.`);
        return null;
      }
    } catch (error) {
      console.log("❌ Error obteniendo metadatos del grupo:", error);
      return null;
    }
  }

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`🕒 Hora: ${moment().format("h:mm A")}`);
  console.log(`📥 Comando detectado: "/${command}"`);
  console.log(`👤 Usuario: ${senderNumber}`);
  console.log(`📌 En: ${groupName}`);
  console.log(`📂 Plugins activos: [ ${Object.keys(plugins).join(", ")} ]`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  return {
    command,
    args,
    text,
    sender,
    messageObj,
    reply: async (msg) => {
      try {
        await socket.presenceSubscribe(sender);
        await socket.sendPresenceUpdate("composing", sender);
        await new Promise(resolve => setTimeout(resolve, 1000));

        await socket.sendMessage(sender, { text: msg });
        console.log(`✅ Respuesta enviada: "${msg}"`);
      } catch (error) {
        console.log("❌ Error enviando mensaje:", error);
      }
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    },
  };
};

async function runLite({ socket, data }) {
  const functions = await loadLiteFunctions({ socket, data });
  if (!functions) return;

  const { command, reply, text, args, sender, messageObj } = functions;
  if (!command) return console.log("❌ No se detectó ningún comando válido.");

  plugins = loadPlugins(); // Recargar plugins dinámicamente

  if (plugins[command]) {
    try {
      console.log(`✅ Ejecutando comando: "/${command}"`);
      await plugins[command]({ reply, args, text, socket, sender, messageObj });
    } catch (error) {
      await reply("❌ Ocurrió un error al ejecutar el comando.");
      console.log("⚠️ Error en el comando:", error);
    }
  } else {
    console.log(`❌ Comando no encontrado: "/${command}"`);
  }

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

module.exports = { runLite };