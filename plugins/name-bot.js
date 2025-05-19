const MAX_NAME_LENGTH = 100; // Límite de caracteres en WhatsApp.

async function execute({ socket, text, reply }) {
    if (!text) return reply("⚠️ Debes escribir un nombre después de `/name`.");

    let newName = text.trim();

    // Si el nombre supera el límite, lo recorta automáticamente.
    if (newName.length > MAX_NAME_LENGTH) {
        newName = newName.slice(0, MAX_NAME_LENGTH);
        reply(`⚠️ El nombre era demasiado largo y fue ajustado a:\n*${newName}*`);
    }

    try {
        await socket.updateProfileName(newName);

        // 🔹 Formatear texto para que se muestre en vertical
        const formattedName = "```\n" + newName.split("").join("\n") + "\n```";

        reply(`✅ Nombre cambiado a:\n${formattedName}`);

    } catch (error) {
        reply("❌ No se pudo cambiar el nombre. Intenta de nuevo.");
        console.error("Error cambiando el nombre:", error);
    }
}

module.exports = {
    command: "name",
    execute
};