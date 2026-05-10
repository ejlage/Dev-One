#!/bin/bash

echo "A parar serviços do Entartes..."

# Parar Frontend
if pgrep -f "vite" > /dev/null; then
    pkill -f "vite"
    echo "✓ Frontend parado"
fi

# Parar Backend
if pgrep -f "node.*server.js" > /dev/null; then
    pkill -f "node.*server.js"
    echo "✓ Backend parado"
fi

echo " todos os serviços foram parados."