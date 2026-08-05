@echo off
cd /d "%~dp0"
echo Starting Salita Quest...
if "%OPENAI_API_KEY%"=="" (
  echo.
  echo Natural voice is not enabled because OPENAI_API_KEY is not set.
  echo The app will still work with your browser voice.
  echo.
)
python server.py
pause
