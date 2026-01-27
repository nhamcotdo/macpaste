#!/bin/bash
SRC="$1"
DEST="build/icons.iconset"

# Ensure destination exists
mkdir -p "$DEST"

# 1. Resize to various sizes for .icns
sips -s format png -z 16 16     "$SRC" --out "${DEST}/icon_16x16.png"
sips -s format png -z 32 32     "$SRC" --out "${DEST}/icon_16x16@2x.png"
sips -s format png -z 32 32     "$SRC" --out "${DEST}/icon_32x32.png"
sips -s format png -z 64 64     "$SRC" --out "${DEST}/icon_32x32@2x.png"
sips -s format png -z 128 128   "$SRC" --out "${DEST}/icon_128x128.png"
sips -s format png -z 256 256   "$SRC" --out "${DEST}/icon_128x128@2x.png"
sips -s format png -z 256 256   "$SRC" --out "${DEST}/icon_256x256.png"
sips -s format png -z 512 512   "$SRC" --out "${DEST}/icon_256x256@2x.png"
sips -s format png -z 512 512   "$SRC" --out "${DEST}/icon_512x512.png"
sips -s format png -z 1024 1024 "$SRC" --out "${DEST}/icon_512x512@2x.png"

# 2. Create .icns
echo "Creating icon.icns..."
iconutil -c icns "$DEST" -o build/icon.icns

# 3. Create .png (512x512) for Linux
echo "Creating icon.png..."
cp "${DEST}/icon_512x512.png" build/icon.png

# 4. Create .ico (using ffmpeg if available)
if command -v ffmpeg &> /dev/null; then
    echo "Creating icon.ico..."
    ffmpeg -y -i "$SRC" -vf scale=256:256 build/icon.ico
else
    echo "ffmpeg not found, skipping .ico generation."
fi

# Cleanup
rm -rf "$DEST"
echo "Done."
