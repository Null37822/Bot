const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");

module.exports = {
  command: "imagen",
  execute: async ({ reply, text, socket, sender }) => {
    try {
      if (!text || text.trim() === "") {
        return reply("❌ Debes escribir un texto para buscar imágenes.");
      }

      // 🔍 Búsqueda optimizada en Bing con calidad mínima de 720p
      const searchQuery = `${text} high quality 1080p OR 720p`;
      const searchUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(searchQuery)}&qft=+filterui:imagesize-wallpaper`;

      const { data } = await axios.get(searchUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        },
      });

      const $ = cheerio.load(data);
      const imageUrls = [];

      $("img").each((i, el) => {
        const url = $(el).attr("src");
        if (url && url.startsWith("http") && (url.includes("720") || url.includes("1080"))) {
          imageUrls.push(url);
        }
      });

      if (imageUrls.length === 0) {
        return reply("❌ No se encontraron imágenes con una calidad aceptable.");
      }

      // 📸 Selecciona la mejor imagen encontrada
      const imageUrl = imageUrls[0];

      const tempDir = path.join(__dirname, "..", "temp");
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

      const imagePath = path.join(tempDir, "imagen.jpg");
      const imageResponse = await axios({ url: imageUrl, responseType: "arraybuffer" });
      fs.writeFileSync(imagePath, imageResponse.data);

      await socket.sendMessage(sender, {
        image: fs.readFileSync(imagePath),
        caption: `🔎 Resultado preciso para: *${text}*`,
      });

      console.log(`✅ Imagen de buena calidad enviada.`);
      fs.unlinkSync(imagePath);
      
    } catch (error) {
      console.error("❌ Error en el comando /imagen:", error);
      reply("⚠️ Ocurrió un error al buscar la imagen.");
    }
  },
};