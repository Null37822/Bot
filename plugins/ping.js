module.exports = {
  command: "ping",
  execute: async ({ reply }) => {
    console.log("✅ Comando /ping ejecutado"); // 👈 Verifica si el comando se está ejecutando
    await reply("🏓 Pong!");
  }
};