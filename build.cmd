cd /d "%~dp0" 

call npm run lint
IF ERRORLEVEL 1 exit /b %ERRORLEVEL%

call npm run build
IF ERRORLEVEL 1 exit /b %ERRORLEVEL%

call npm run test
IF ERRORLEVEL 1 exit /b %ERRORLEVEL%