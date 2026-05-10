#!/bin/bash
cd /home/ugrt/Documents/Opencode/Entartes/backend
nohup node src/server.js > /tmp/backend.log 2>&1 &
echo "Backend started: $!"

cd /home/ugrt/Documents/Opencode/Entartes/frontend
nohup npm run dev -- --host > /tmp/frontend.log 2>&1 &
echo "Frontend started: $!"

sleep 3

echo ""
echo "=== STATUS ==="
curl -s -o /dev/null -w "Backend (3000): %{http_code}\n" http://localhost:3000/api/auth/login -X POST -H "Content-Type: application/json" -d '{"email":"direcao@entartes.pt","password":"password123"}'
curl -s -o /dev/null -w "Frontend (5173): %{http_code}\n" http://localhost:5173