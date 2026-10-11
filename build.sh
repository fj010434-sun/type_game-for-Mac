#!/bin/zsh
# 打包「键盘小警察」为 macOS 应用：./build.sh [--install] [--release]
set -euo pipefail
cd "$(dirname "$0")"
VERSION="1.0.0"
APP="dist/键盘小警察.app"
rm -rf "$APP" build && mkdir -p build "$APP/Contents/MacOS" "$APP/Contents/Resources"

# 通用二进制：Apple 芯片和 Intel Mac 都能运行
for arch in arm64 x86_64; do
  swiftc -O -target $arch-apple-macos13.3 -o build/KeyboardCop-$arch App/main.swift -framework AppKit -framework WebKit
done
lipo -create build/KeyboardCop-arm64 build/KeyboardCop-x86_64 -output "$APP/Contents/MacOS/KeyboardCop"
cp -R web "$APP/Contents/Resources/web"

# 图标
swift App/make_icon.swift build/icon.png
ICONSET=build/AppIcon.iconset && mkdir -p $ICONSET
for s in 16 32 128 256 512; do
  sips -z $s $s build/icon.png --out $ICONSET/icon_${s}x${s}.png >/dev/null
  sips -z $((s*2)) $((s*2)) build/icon.png --out $ICONSET/icon_${s}x${s}@2x.png >/dev/null
done
iconutil -c icns $ICONSET -o "$APP/Contents/Resources/AppIcon.icns"

cat > "$APP/Contents/Info.plist" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>CFBundleName</key><string>键盘小警察</string>
  <key>CFBundleDisplayName</key><string>键盘小警察</string>
  <key>CFBundleIdentifier</key><string>local.family.keyboardcop</string>
  <key>CFBundleExecutable</key><string>KeyboardCop</string>
  <key>CFBundleIconFile</key><string>AppIcon</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleShortVersionString</key><string>$VERSION</string>
  <key>CFBundleVersion</key><string>1</string>
  <key>LSMinimumSystemVersion</key><string>13.3</string>
  <key>LSApplicationCategoryType</key><string>public.app-category.kids-games</string>
  <key>NSHighResolutionCapable</key><true/>
</dict></plist>
EOF

codesign --force --deep --sign - "$APP"
echo "✅ 已生成 $APP"

if [[ " $* " == *" --install "* ]]; then
  rm -rf "/Applications/键盘小警察.app"
  cp -R "$APP" /Applications/
  echo "✅ 已安装到 /Applications"
fi

if [[ " $* " == *" --release "* ]]; then
  # 发布包：App + 中英文说明 + 许可证，用 ditto 保留签名和中文文件名
  STAGE=build/release/KeyboardCop-$VERSION && rm -rf build/release && mkdir -p "$STAGE"
  cp -R "$APP" "$STAGE/"
  cp README.md LICENSE "$STAGE/"
  ZIP="dist/KeyboardCop-$VERSION-macos-universal.zip"
  rm -f "$ZIP"
  ditto -c -k --sequesterRsrc --keepParent "$STAGE" "$ZIP"
  echo "✅ 发布包 $ZIP"
fi
