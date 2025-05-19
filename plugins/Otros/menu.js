module.exports = {
  command: "menu",
  execute: async ({ socket, from, sender, prefix }) => {
    try {
      if (!socket) {
        console.error("❌ Error: El socket no está definido.");
        return;
      }

      let menuText = `👋 *Hola @${sender.split("@")[0]}*  
      Selecciona una opción en el menú:`;

      let buttons = [
        { buttonId: `${prefix}help`, buttonText: { displayText: "📜 VER MENÚ" }, type: 1 },
        { buttonId: `${prefix}sc`, buttonText: { displayText: "📂 VER SCRIPT" }, type: 1 },
        { buttonId: `${prefix}boscogroup`, buttonText: { displayText: "🤖 BOT GROUP" }, type: 1 }
      ];

      let buttonMessage = {
        text: menuText,
        footer: "Selecciona una opción:",
        buttons: buttons,
        headerType: 1,
        mentions: [sender]
      };

      await socket.sendMessage(from, buttonMessage, { quoted: null });

      console.log("✅ Menú enviado correctamente.");
      
    } catch (error) {
      console.error("❌ Error en el comando /menu:", error);
    }
  }
};