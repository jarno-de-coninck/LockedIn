#!/usr/bin/env bash
# Build Native Android APK for LockedIn and export to ~/Documents/LockedIn.apk

set -e

export ANDROID_HOME="/home/yaruno/Android/Sdk"
export ANDROID_SDK_ROOT="/home/yaruno/Android/Sdk"
export PATH="$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH"

echo "=========================================================="
echo "📱 1. Building React Web Assets..."
echo "=========================================================="
npm run build

echo ""
echo "=========================================================="
echo "🔄 2. Syncing with Capacitor Android..."
echo "=========================================================="
npx cap sync android

# Ensure Java 17 compatibility on generated gradle files
sed -i 's/VERSION_21/VERSION_17/g' android/app/capacitor.build.gradle 2>/dev/null || true
sed -i 's/VERSION_21/VERSION_17/g' android/capacitor-cordova-android-plugins/build.gradle 2>/dev/null || true
sed -i 's/VERSION_21/VERSION_17/g' node_modules/@capacitor/android/capacitor/build.gradle 2>/dev/null || true

echo ""
echo "=========================================================="
echo "🔨 3. Compiling Native Android APK with Gradle..."
echo "=========================================================="
cd android
./gradlew assembleDebug

echo ""
echo "=========================================================="
echo "📦 4. Exporting APK to ~/Documents/LockedIn.apk..."
echo "=========================================================="
cp app/build/outputs/apk/debug/app-debug.apk /home/yaruno/Documents/LockedIn.apk

echo ""
echo "🎉 SUCCESS! Your Android APK is ready at:"
echo "📂 /home/yaruno/Documents/LockedIn.apk"
ls -lh /home/yaruno/Documents/LockedIn.apk
