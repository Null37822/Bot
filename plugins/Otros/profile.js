const fs = require("fs");
const path = require("path");

let autoPfActive = false; // Estado inicial desactivado
let intervalId = null; // Para detener el intervalo cuando se desactive

module.exports = {
  command: "autopf",
  execute: async ({ reply, text, socket, sender }) => {
    const args = text ? text.split(" ") : [];

    if (!args.length) {
      return reply("📸 *Uso del comando AutoPF:*\n\n" +
        "🔹 */autopf on* - Activar el cambio automático de foto\n" +
        "🔹 */autopf off* - Desactivar el cambio automático de foto");
    }

    const command = args[0].toLowerCase();

    if (command === "on") {
      if (autoPfActive) return reply("⚠️ El cambio automático de foto ya está activado.");

      autoPfActive = true;
      reply("✅ Auto cambio de foto de perfil *activado*.");

      const images = ["null.jpg", "null2.jpg", "null3.jpg"];
      let index = 0;

      intervalId = setInterval(async () => {
        if (!autoPfActive) return;

        const imagePath = path.join(__dirname, "temp", images[index]);
        if (!fs.existsSync(imagePath)) return console.log(`❌ La imagen ${images[index]} no existe.`);

        const imageBuffer = fs.readFileSync(imagePath);
        await socket.updateProfilePicture(sender, imageBuffer);
        

        index = (index + 1) % images.length;
      }, 12000);
    }

    else if (command === "off") {
      if (!autoPfActive) return reply("⚠️ El cambio automático de foto ya está desactivado.");

      autoPfActive = false;
      clearInterval(intervalId);
      reply("❌ Auto cambio de foto de perfil *desactivado*.");
    }

    else {
      reply("⚠️ Comando inválido. Usa */autopf on* o */autopf off*.");
    }
  }
};