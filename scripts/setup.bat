@echo off
echo ========================================
echo    Ent'Artes - Setup Inicial
echo ========================================
echo.
echo ATENCAO: Antes de continuar, certifica-te de que:
echo   1. O PostgreSQL esta instalado e a correr
echo   2. Criaste o utilizador e base de dados conforme
echo      o GUIA_INSTALACAO.md (Passo 2)
echo.
pause

echo.
echo [1/4] A instalar dependencias do Backend...
cd /d "%~dp0backend"
call npm install
if %errorlevel% neq 0 (
    echo.
    echo ERRO: falha ao instalar dependencias do backend.
    echo Verifica a tua ligacao a internet e que o Node.js esta instalado.
    pause
    exit /b 1
)
echo OK - Backend instalado.

echo.
echo [2/4] A criar ficheiro .env...
if not exist ".env" (
    copy .env.example .env
    echo OK - Ficheiro .env criado a partir de .env.example
) else (
    echo OK - Ficheiro .env ja existe.
)

echo.
echo [3/4] A configurar o schema da base de dados...
call npx prisma db push
if %errorlevel% neq 0 (
    echo.
    echo ERRO: falha ao configurar a base de dados.
    echo Confirma que o PostgreSQL esta ativo e que criaste o utilizador
    echo e base de dados conforme o GUIA_INSTALACAO.md (Passo 2).
    pause
    exit /b 1
)
echo OK - Schema configurado.

echo.
echo A popular a base de dados com dados de teste...
call node src/seed.js
echo OK - Seed concluido.

echo.
echo [4/4] A instalar dependencias do Frontend...
cd /d "%~dp0frontend"
call npm install
if %errorlevel% neq 0 (
    echo.
    echo ERRO: falha ao instalar dependencias do frontend.
    pause
    exit /b 1
)
echo OK - Frontend instalado.

echo.
echo ========================================
echo   Setup concluido com sucesso!
echo.
echo   Agora podes iniciar a aplicacao com:
echo   start-all.bat
echo ========================================
pause
