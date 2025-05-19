const fs = require("fs");
const path = require("path");
const { downloadMediaMessage } = require("baileys");
const pdf = require("pdf-parse");

module.exports = {
  command: "pdf",
  execute: async ({ reply, socket, messageObj }) => {
    try {
      // 📌 Verificar si se respondió a un mensaje
      const contextInfo = messageObj.message?.extendedTextMessage?.contextInfo;
      if (!contextInfo?.quotedMessage) {
        return reply("❌ Debes responder a un archivo PDF para extraer su texto.");
      }

      const quotedMessage = contextInfo.quotedMessage;
      const documentMessage = quotedMessage.documentMessage;

      // 📌 Verificar si el mensaje citado contiene un PDF
      if (!documentMessage || documentMessage.mimetype !== "application/pdf") {
        return reply("❌ El mensaje citado no es un PDF.");
      }

      // 📂 Crear carpeta temporal si no existe
      const tempDir = path.join(__dirname, "../temp");
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // 📄 Definir ruta de almacenamiento temporal
      const filePath = path.join(tempDir, `documento_${Date.now()}.pdf`);

      // 📥 Descargar el PDF
      const pdfBuffer = await downloadMediaMessage(
        { message: quotedMessage, type: "buffer" },
        "buffer"
      );

      if (!pdfBuffer) {
        return reply("❌ Error al descargar el PDF.");
      }

      fs.writeFileSync(filePath, pdfBuffer);
      console.log(`✅ Archivo PDF guardado en: ${filePath}`);

      // 📌 Extraer texto con pdf-parse
      const data = await pdf(fs.readFileSync(filePath));
      const extractedText = data.text.trim();

      if (!extractedText) {
        await reply("⚠️ No se encontró texto en el PDF.");
      } else {
        await reply(`📄 *Contenido del PDF:* \n\n${extractedText}`);
      }

      // 🗑️ Eliminar el archivo después del proceso
      fs.unlinkSync(filePath);

    } catch (error) {
      console.error("❌ Error en el comando /pdf:", error);
      reply("⚠️ Ocurrió un error al procesar el PDF.");
    }
  },
};