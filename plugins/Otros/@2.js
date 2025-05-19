async function execute({ socket, sender, reply, msg }) {
    try {
        // Obtener el nombre con el que el remitente te tiene guardado
        let name = msg.pushName || "Sin nombre guardado";

        // Enviar el mensaje con el nombre guardado
        await socket.sendMessage(sender, {
            text: `Así te tiene agendado: *${name}*`
        });

    } catch (error) {
        reply("❌ Ocurrió un error al obtener el nombre.");
        console.error("Error en /@2:", error);
    }
}

module.exports = {
    command: "@2",
    execute
};