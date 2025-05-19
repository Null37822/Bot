const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

module.exports = {
  command: "ig",
  execute: async ({ reply, text, socket, sender }) => {
    try {
      if (!text || !text.startsWith("http")) {
        return reply("❌ Debes proporcionar una URL válida de Instagram.");
      }

      const tempDir = path.join(__dirname, "..", "temp");
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

      const outputFile = path.join(tempDir, "instagram_video.mp4");

      exec(`yt-dlp -f best -o "${outputFile}" "${text}"`, async (error) => {
        if (error) {
          console.error("❌ Error descargando el video de Instagram:", error);
          return reply("⚠️ Ocurrió un error descargando el video.");
        }

        console.log("✅ Video descargado correctamente.");

        await socket.sendMessage(sender, {
          video: fs.readFileSync(outputFile),
          mimetype: "video/mp4",
        });

        console.log("✅ Video enviado correctamente.");

        fs.unlinkSync(outputFile); // Eliminar archivo después de enviarlo
      });

    } catch (error) {
      console.error("❌ Error en el comando /ig:", error);
      reply("⚠️ Ocurrió un error inesperado.");
    }
  }
};