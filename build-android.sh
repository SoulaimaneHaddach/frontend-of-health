#!/bin/bash
# Build Script for Android Deployment

echo "🚀 HealthConnect Android Build Script"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null
then
    echo -e "${RED}❌ EAS CLI not found${NC}"
    echo "Installing EAS CLI globally..."
    npm install -g eas-cli
fi

echo -e "${GREEN}✅ EAS CLI installed${NC}"
echo ""

# Check if user is logged in
echo "Checking Expo login status..."
if ! eas whoami &> /dev/null
then
    echo -e "${YELLOW}⚠️  Not logged in to Expo${NC}"
    echo "Please login:"
    eas login
else
    echo -e "${GREEN}✅ Logged in to Expo${NC}"
fi

echo ""
echo "======================================"
echo "Please choose build type:"
echo "======================================"
echo "1) Development Build (APK - for testing)"
echo "2) Preview Build (APK - for internal distribution)"
echo "3) Production Build (APK - for release)"
echo "4) Production Build (AAB - for Google Play Store)"
echo "5) Configure EAS only (no build)"
echo ""
read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        echo -e "${YELLOW}Building Development APK...${NC}"
        eas build --platform android --profile development
        ;;
    2)
        echo -e "${YELLOW}Building Preview APK...${NC}"
        eas build --platform android --profile preview
        ;;
    3)
        echo -e "${YELLOW}Building Production APK...${NC}"
        eas build --platform android --profile production
        ;;
    4)
        echo -e "${YELLOW}Building Production AAB for Play Store...${NC}"
        # Update eas.json temporarily for AAB build
        echo "Updating eas.json for AAB build..."
        # Note: Manual edit required or use jq to modify JSON
        echo -e "${RED}⚠️  Please update eas.json production profile:${NC}"
        echo '  "production": { "android": { "buildType": "app-bundle" } }'
        echo ""
        read -p "Press Enter after updating eas.json..."
        eas build --platform android --profile production
        ;;
    5)
        echo -e "${YELLOW}Configuring EAS...${NC}"
        eas build:configure
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}======================================"
echo "Build process initiated!"
echo "======================================${NC}"
echo ""
echo "Next steps:"
echo "1. Wait for build to complete (check EAS dashboard)"
echo "2. Download APK/AAB from provided link"
echo "3. Test on Android device"
echo ""
