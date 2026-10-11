#!/bin/zsh
# 打包「键盘小警察」为 macOS 应用：./build.sh [--install]
set -euo pipefail
cd "$(dirname "$0")"
APP="dist/键盘小警察.app"
rm -rf "$APP" build && mkdir -p build "$APP/Contents/MacOS" "$APP/Contents/Resources"

swiftc -O -o "$APP/Contents/MacOS/KeyboardCop" App/main.swift -framework AppKit -framework WebKit
cp -R web "$APP/Contents/Resources/web"

# 图标
swift App/make_icon.swift build/icon.png
ICONSET=build/AppIcon.iconset && mkdir -p $ICONSET
for s in 16 32 128 256 512; do
  sips -z $s $s build/icon.png --out $ICONSET/icon_${s}x${s}.png >/dev/null
  sips -z $((s*2)) $((s*2)) build/icon.png --out $ICONSET/icon_${s}x${s}@2x.png >/dev/null
done
iconutil -c icns $ICONSET -o "$APP/Contents/Resources/AppIcon.icns"

cat > "$APP/Contents/Info.plist" <<'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>CFBundleName</key><string>键盘小警察</string>
  <key>CFBundleDisplayName</key><string>键盘小警察</string>
  <key>CFBundleIdentifier</key><string>local.family.keyboardcop</string>
  <key>CFBundleExecutable</key><string>KeyboardCop</string>
  <key>CFBundleIconFile</key><string>AppIcon</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleShortVersionString</key><string>1.0</string>
  <key>CFBundleVersion</key><string>1</string>
  <key>LSMinimumSystemVersion</key><string>13.3</string>
  <key>LSApplicationCategoryType</key><string>public.app-category.kids-games</string>
  <key>NSHighResolutionCapable</key><true/>
</dict></plist>
EOF

codesign --force --deep --sign - "$APP"
echo "✅ 已生成 $APP"

if [[ "${1:-}" == "--install" ]]; then
  rm -rf "/Applications/键盘小警察.app"
  cp -R "$APP" /Applications/
  echo "✅ 已安装到 /Applications"
fi
