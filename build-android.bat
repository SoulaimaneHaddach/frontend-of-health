@echo off
REM Build Script for Android Deployment (Windows)

echo ========================================
echo    HealthConnect Android Build Script
echo ========================================
echo.

REM Check if EAS CLI is installed
where eas >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] EAS CLI not found
    echo Installing EAS CLI globally...
    call npm install -g eas-cli
)

echo [OK] EAS CLI installed
echo.

REM Check if user is logged in
echo Checking Expo login status...
call eas whoami >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Not logged in to Expo
    echo Please login:
    call eas login
) else (
    echo [OK] Logged in to Expo
)

echo.
echo ========================================
echo   Please choose build type:
echo ========================================
echo 1) Development Build (APK - for testing)
echo 2) Preview Build (APK - for internal distribution)
echo 3) Production Build (APK - for release)
echo 4) Production Build (AAB - for Google Play Store)
echo 5) Configure EAS only (no build)
echo.
set /p choice="Enter your choice (1-5): "

if "%choice%"=="1" (
    echo Building Development APK...
    call eas build --platform android --profile development
) else if "%choice%"=="2" (
    echo Building Preview APK...
    call eas build --platform android --profile preview
) else if "%choice%"=="3" (
    echo Building Production APK...
    call eas build --platform android --profile production
) else if "%choice%"=="4" (
    echo Building Production AAB for Play Store...
    echo [WARNING] Please update eas.json production profile:
    echo   "production": { "android": { "buildType": "app-bundle" } }
    echo.
    pause
    call eas build --platform android --profile production
) else if "%choice%"=="5" (
    echo Configuring EAS...
    call eas build:configure
) else (
    echo [ERROR] Invalid choice
    exit /b 1
)

echo.
echo ========================================
echo   Build process initiated!
echo ========================================
echo.
echo Next steps:
echo 1. Wait for build to complete (check EAS dashboard)
echo 2. Download APK/AAB from provided link
echo 3. Test on Android device
echo.
pause
