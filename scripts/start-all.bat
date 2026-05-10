@echo off
echo ========================================
echo    Ent'Artes - Iniciar Servicos
echo ========================================
echo.
echo A iniciar Backend (porta 3000)...
start "Backend - Ent'Artes" cmd /k "cd /d "%~dp0backend" && npm run dev"
echo A aguardar 4 segundos antes de iniciar o Frontend...
timeout /t 4 /nobreak >nul
echo A iniciar Frontend (porta 5173)...
start "Frontend - Ent'Artes" cmd /k "cd /d "%~dp0frontend" && npm run dev"
echo.
echo ========================================
echo   Servicos a iniciar...
echo   Aguarda cerca de 10 segundos e depois
echo   abre o browser em:
echo.
echo   http://localhost:5173
echo.
echo   Backend API:  http://localhost:3000
echo   Swagger docs: http://localhost:3000/docs
echo ========================================
echo.
echo Podes fechar esta janela.
pause
