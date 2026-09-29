@echo off
REM Script para iniciar o desenvolvimento do LEVIA App com Expo
REM Este script limpa o cache e inicia o Metro bundler

echo.
echo ================================================
echo   LEVIA App - Expo Development Server
echo ================================================
echo.

REM Verificar se node_modules existe
if not exist "node_modules" (
    echo [!] node_modules nao encontrado
    echo [*] Instalando dependencias...
    call npm install
    if errorlevel 1 (
        echo [X] Erro ao instalar dependencias
        exit /b 1
    )
)

echo [*] Limpando cache do Metro...
call npm start --clear

REM Se por algum motivo o npm start fechar, mostrar mensagem
echo.
echo [X] Servidor encerrado
echo [*] Para reiniciar, execute este script novamente
echo.
pause
