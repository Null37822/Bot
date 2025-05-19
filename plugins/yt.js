const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const MAX_FILESIZE_MB = 400; // Límite de tamaño en MB

module.exports = {
  command: "yt",
  execute: async ({ reply, text, socket, sender }) => {
    try {
      if (!text || text.trim() === "") {
        return reply("❌ Debes proporcionar un nombre o URL para buscar o descargar un video.");
      }

      const query = text.trim();
      const outputFile = path.join(__dirname, "..", "temp", `yt_${Date.now()}.mp4`);

      // Enviar mensaje inicial
      const statusMessage = await reply("⏳ *Descargando el video, por favor espera...*");

      // Crear carpeta temporal si no existe
      const tempDir = path.join(__dirname, "..", "temp");
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

      await new Promise((resolve, reject) => {
        const ytProcess = spawn("yt-dlp", [
          "-f", "best[ext=mp4][height<=720]", // Mejor calidad en MP4 con resolución <=720p
          "--max-filesize", `${MAX_FILESIZE_MB}M`, // Límite de tamaño
          "-o", outputFile, // Ruta de salida
          `ytsearch1:${query}`, // Buscar en YouTube (primer resultado)
        ]);

        ytProcess.stderr.on("data", async (data) => {
          const output = data.toString();
          const progressMatch = output.match(/download\s+(\d+(\.\d+)?)%/);
          if (progressMatch) {
            const progress = parseFloat(progressMatch[1]);
            const progressBar = generateProgressBar(progress, 100);
            await socket.sendMessage(sender, {
              text: `⏳ *Descargando:*\n${progressBar} (${progress.toFixed(2)}%)`,
            });
          }
        });

        ytProcess.on("error", (err) => reject(`Error al ejecutar yt-dlp: ${err.message}`));
        ytProcess.on("close", (code) => {
          if (code === 0 && fs.existsSync(outputFile)) resolve();
          else reject("No se pudo descargar el video. Verifica la URL o el tamaño del archivo.");
        });
      });

      // Verificar tamaño del archivo
      const stats = fs.statSync(outputFile);
      const fileSizeMB = stats.size / (1024 * 1024);
      if (fileSizeMB > MAX_FILESIZE_MB) {
        throw new Error(`El archivo descargado (${fileSizeMB.toFixed(2)} MB) excede el límite permitido.`);
      }

      // Enviar el video
      await socket.sendMessage(sender, {
        video: fs.readFileSync(outputFile),
        caption: `✅ *Aquí está tu video en 720p (o la mejor calidad disponible):*\n\n${query}`,
        mimetype: "video/mp4",
        fileName: path.basename(outputFile),
      });

      console.log(`✅ Video enviado correctamente.`);

      // Eliminar archivo temporal
      fs.unlinkSync(outputFile);
    } catch (error) {
      console.error("❌ Error en el comando /yt:", error);
      reply(`⚠️ Ocurrió un error: ${error.message}`);
    }
  },
};

// Generador de barra de progreso estética
function generateProgressBar(current, total) {
  const progressBarLength = 20;
  const filledLength = Math.round((current / total) * progressBarLength);
  const emptyLength = progressBarLength - filledLength;
  return `[${"=".repeat(filledLength)}${" ".repeat(emptyLength)}]`;
}