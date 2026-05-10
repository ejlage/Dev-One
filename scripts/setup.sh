#!/bin/bash

echo "A iniciar setup do projeto Ent'Artes..."

# Backend
echo "Instalar dependências do backend..."
cd backend
npm install

echo "Inicializar Prisma..."
npx prisma generate
npx prisma migrate dev --name init

cd ..

# Frontend
echo "Instalar dependências do frontend..."
cd frontend
npm install

cd ..

echo "Setup concluído com sucesso!"
echo "Backend: cd backend && npm run dev"
echo "Frontend: cd frontend && npm run dev"