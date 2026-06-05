#!/usr/bin/env bash
#
# Cross-compile the Tauri app for Windows (x64) from Linux using cargo-xwin.
#
# One-time prerequisites:
#   Arch/CachyOS:  sudo pacman -S lld llvm nsis
#   Debian/Ubuntu: sudo apt-get install -y lld llvm nsis clang
#   rustup target add x86_64-pc-windows-msvc
#   cargo install cargo-xwin
#
# Output:
#   src-tauri/target/x86_64-pc-windows-msvc/release/bundle/nsis/*-setup.exe
#
set -euo pipefail
cd "$(dirname "$0")/.."

# `cargo`/`rustc` are often the system ones (no Windows std). Put the rustup
# toolchain that has the Windows std first, plus ~/.cargo/bin for cargo-xwin.
if toolchain_cargo="$(rustup which --toolchain stable cargo 2>/dev/null)"; then
  export PATH="$(dirname "$toolchain_cargo"):$PATH"
fi
export PATH="$HOME/.cargo/bin:$PATH"

missing=0
for t in cargo-xwin lld-link makensis; do
  command -v "$t" >/dev/null || { echo "missing: $t"; missing=1; }
done
rustup target list --installed | grep -qx x86_64-pc-windows-msvc \
  || { echo "missing target: rustup target add x86_64-pc-windows-msvc"; missing=1; }
[ "$missing" -eq 0 ] || { echo "Install the prerequisites above and re-run."; exit 1; }

export XWIN_ACCEPT_LICENSE=1
pnpm tauri build \
  --runner cargo-xwin \
  --target x86_64-pc-windows-msvc \
  --bundles "${BUNDLES:-nsis}" "$@"

echo
echo "Done → src-tauri/target/x86_64-pc-windows-msvc/release/bundle/"
