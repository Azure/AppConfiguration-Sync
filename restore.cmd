cd /d "%~dp0"

npm install
IF ERRORLEVEL 1 exit /b %ERRORLEVEL%