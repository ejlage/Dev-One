# Ent'Artes - Setup para Windows
# Executar no PowerShell como Administrador

$ROOT = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Ent'Artes — Setup Windows" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar Node.js
Write-Host "[1/5] A verificar Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "  OK: Node.js $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "  ERRO: Node.js não encontrado. Instala em https://nodejs.org" -ForegroundColor Red
    exit 1
}

# 2. Criar base de dados PostgreSQL
Write-Host "[2/5] A configurar PostgreSQL..." -ForegroundColor Yellow

# Verificar se PostgreSQL está instalado e running
$pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue
if (-not $pgService) {
    Write-Host "  AVISO: PostgreSQL não encontrado como serviço Windows." -ForegroundColor Yellow
    Write-Host "  Instala PostgreSQL 14+ de: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
    Write-Host "  Ou usa Docker: docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=entartes_dev_password -e POSTGRES_USER=entartes -e POSTGRES_DB=entartes postgres:14" -ForegroundColor Yellow
}

# Tentar criar utilizador e base de dados (se psql disponível)
$psqlPath = "C:\Program Files\PostgreSQL\*\bin\psql.exe"
$psql = Get-Item $psqlPath -ErrorAction SilentlyContinue | Select-Object -First 1

if ($psql) {
    & $psql -U postgres -c "CREATE USER entartes WITH PASSWORD 'entartes_dev_password';" 2>$null
    & $psql -U postgres -c "CREATE DATABASE entartes OWNER entartes;" 2>$null
    Write-Host "  OK: Base de dados configurada" -ForegroundColor Green
} else {
    Write-Host "  AVISO: Execute manualmente no pgAdmin ou psql:" -ForegroundColor Yellow
    Write-Host "  CREATE USER entartes WITH PASSWORD 'entartes_dev_password';" -ForegroundColor Gray
    Write-Host "  CREATE DATABASE entartes OWNER entartes;" -ForegroundColor Gray
}

# 3. Configurar .env
Write-Host "[3/5] A configurar variáveis de ambiente..." -ForegroundColor Yellow
$envFile = "$ROOT\backend\.env"
if (-not (Test-Path $envFile)) {
    Copy-Item "$ROOT\backend\.env.example" $envFile
    Write-Host "  OK: .env criado" -ForegroundColor Green
} else {
    Write-Host "  OK: .env já existe" -ForegroundColor Green
}

# 4. Instalar dependências
Write-Host "[4/5] A instalar dependências..." -ForegroundColor Yellow

Write-Host "  Backend..." -ForegroundColor Gray
Set-Location "$ROOT\backend"
npm install --silent

Write-Host "  Frontend..." -ForegroundColor Gray
Set-Location "$ROOT\frontend"
npm install --silent

Write-Host "  OK: Dependências instaladas" -ForegroundColor Green
Set-Location $ROOT

# 5. Base de dados - schema + seed
Write-Host "[5/5] A criar tabelas e dados de seed..." -ForegroundColor Yellow
Set-Location "$ROOT\backend"
npx prisma db push --accept-data-loss
node src/seed.js

Write-Host "  OK: Tabelas criadas e seed executado" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Setup concluído!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Para iniciar o projeto:" -ForegroundColor White
Write-Host "  Backend:  cd backend; npm run dev   (http://localhost:3000)" -ForegroundColor Green
Write-Host "  Frontend: cd frontend; npm run dev  (http://localhost:5173)" -ForegroundColor Green
Write-Host ""
Write-Host "Credenciais (password: 'password123'):" -ForegroundColor White
Write-Host "  Direção:      direcao@entartes.pt" -ForegroundColor Gray
Write-Host "  Professor:    joao.santos@entartes.pt" -ForegroundColor Gray
Write-Host "  Encarregado:  pedro.oliveira@email.pt" -ForegroundColor Gray
Write-Host "  Aluno:        miguel.silva@email.pt" -ForegroundColor Gray
Write-Host "========================================" -ForegroundColor Cyan