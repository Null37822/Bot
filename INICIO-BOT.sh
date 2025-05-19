#!/bin/bash

echo "🚀 Iniciando el bot con optimización de recursos en Replit..."

# ✅ Limitar el uso de memoria RAM del bot (ajustable si es necesario)
export NODE_OPTIONS="--max-old-space-size=32"

# ✅ Reducir prioridad del proceso para evitar alto consumo de CPU
renice -n 10 -p $$ > /dev/null 2>&1

# ✅ Desactivar el SWAP para evitar que el bot use memoria virtual en exceso
if [ -f "/proc/sys/vm/swappiness" ]; then
    echo 10 | sudo tee /proc/sys/vm/swappiness > /dev/null
fi

# ✅ Limpiar archivos de logs antiguos para liberar espacio
rm -f bot.log nohup.out

# ✅ Iniciar el bot con "npm start" y asegurarse de que siga en ejecución
while true; do
    echo "🔄 Ejecutando el bot..."
    npm start --silent > logs/bot.log 2>&1
    
    echo "⚠️ El bot se cerró inesperadamente. Reiniciando en 5 segundos..."
    sleep 5
done