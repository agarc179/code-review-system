#!/bin/bash

set -e

TARGET_DIR="$HOME/.codex/skills"

echo "Installing skills to $TARGET_DIR..."

mkdir -p "$TARGET_DIR"

cp -r skills/* "$TARGET_DIR"

echo "✅ Installation complete"
echo "Restart Codex to load new skills"