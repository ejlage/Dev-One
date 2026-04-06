@echo off
echo A iniciar setup do projeto Ent'Artes...

REM Backend
echo Instalar dependências do backend...
cd backend
call npm install

echo Inicializar Prisma...
call npx prisma generate
call npx prisma migrate dev --name init

cd ..

REM Frontend
echo Instalar dependências do frontend...
cd frontend
call npm install

cd ..

echo Setup concluído com sucesso!
echo Backend: cd backend && npm run dev
echo Frontend: cd frontend && npm run dev
pause