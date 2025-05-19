const googleTTS = require("@sefinek/google-tts-api");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { exec } = require("child_process");

module.exports = {
  command: "tts",
  execute: async ({ reply, text, socket, sender }) => {
    try {
      if (!text || text.trim() === "") {
        return reply("❌ Debes escribir un texto para convertir en audio.");
      }

      let lang = "es";
      let message = text.trim();
      const charLimit = 200; // Límite de caracteres por fragmento

      const firstWord = message.split(" ")[0].toLowerCase();
      const supportedLangs = ["en", "es", "fr", "de", "pt", "it", "ru", "ja", "zh", "hi"];

      if (supportedLangs.includes(firstWord)) {
        lang = firstWord;
        message = message.split(" ").slice(1).join(" ");
      }

      if (!message) {
        return reply("❌ Debes escribir un texto después del idioma.");
      }

      console.log(`✅ Comando /tts ejecutado con idioma "${lang}" y texto: "${message}"`);

      // Dividir el texto en fragmentos de máximo 200 caracteres
      const textChunks = message.match(new RegExp(`.{1,${charLimit}}`, "g"));

      

      const audioFiles = [];
      const tempDir = path.join(__dirname, "..", "temp");
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

      // Descargar cada fragmento de audio
      for (let i = 0; i < textChunks.length; i++) {
        const chunk = textChunks[i];
        const audioUrl = googleTTS.getAudioUrl(chunk, { lang, slow: false });
        const audioPath = path.join(tempDir, `part_${i}.mp3`);
        const response = await axios({ url: audioUrl, responseType: "arraybuffer" });
        fs.writeFileSync(audioPath, response.data);
        audioFiles.push(audioPath);
        console.log(`✅ Fragmento ${i + 1} descargado.`);
      }

      // Unir audios con FFmpeg
      const outputAudio = path.join(tempDir, "final_tts.mp3");
      const concatFile = path.join(tempDir, "concat.txt");
      fs.writeFileSync(concatFile, audioFiles.map(file => `file '${file}'`).join("\n"));

      await new Promise((resolve, reject) => {
        exec(`ffmpeg -f concat -safe 0 -i "${concatFile}" -c copy "${outputAudio}"`, (err) => {
          if (err) return reject(err);
          resolve();
        });
      });

      console.log("✅ Audio final generado correctamente.");

      // Enviar el audio unificado
      await socket.sendMessage(sender, {
        audio: fs.readFileSync(outputAudio),
        mimetype: "audio/mpeg",
        ptt: true,
      });

      console.log(`✅ Audio enviado correctamente.`);
      
      // Eliminar archivos temporales
      fs.unlinkSync(outputAudio);
      fs.unlinkSync(concatFile);
      audioFiles.forEach(file => fs.unlinkSync(file));
      
    } catch (error) {
      console.error("❌ Error en el comando /tts:", error);
      reply("⚠️ Ocurrió un error generando el audio.");
    }
  }
};