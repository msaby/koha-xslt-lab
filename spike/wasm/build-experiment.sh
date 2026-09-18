#!/usr/bin/env bash
# Rebuild identical upstream sources twice, changing only the dependency loader.
set -euo pipefail
REPO=$(cd "$(dirname "$0")/../.." && pwd)
BUILD=${1:-$HOME/koha-wasm-dictionary-build}
mkdir -p "$BUILD"
echo "Build directory: $BUILD"
cd "$BUILD"
PREFIX="$BUILD/install"
export PKG_CONFIG_PATH="$PREFIX/lib/pkgconfig"
if [ ! -f "$PREFIX/lib/libexslt.a" ]; then
for spec in 'libxml2 c34742f3017f6d39f3e4ccae4f70172238160ef8' 'libxslt 923903c59d668af42e3144bc623c9190a0f65988'; do
  read -r project revision <<< "$spec"
  curl --fail --location --retry 3 "https://codeload.github.com/GNOME/$project/tar.gz/$revision" -o "$project.tar.gz"
  mkdir "$project"
  tar -xzf "$project.tar.gz" --strip-components=1 -C "$project"
done
cd "$BUILD/libxml2"
NOCONFIGURE=1 ./autogen.sh
emconfigure ./configure --host=wasm32-unknown-emscripten --prefix="$PREFIX" \
  --with-output --with-writer --with-html --with-reader --with-sax1 \
  --with-legacy=no --with-c14n=no --with-schemas=no --with-schematron=no \
  --without-debug --without-modules --without-push --without-regexps \
  --without-valid --without-xptr --without-xinclude --with-xpath \
  --without-threads --without-catalog --without-http --without-ftp \
  --without-python --without-zlib --without-lzma --disable-shared --enable-static \
  CC='emcc -Os' LDFLAGS=-Os
emmake make -j4
emmake make install
cd "$BUILD/libxslt"
NOCONFIGURE=1 ./autogen.sh
emconfigure ./configure --host=wasm32-unknown-emscripten --prefix="$PREFIX" \
  --with-libxml-prefix="$PREFIX" --without-python --without-debugger \
  --without-profiler --without-plugins --with-crypto=no --disable-shared --enable-static \
  CC='emcc -Os' LDFLAGS=-Os
emmake make -j4
emmake make install
fi
cd "$BUILD"
cp "$REPO/spike/wasm/vendor/transform.c" original.c
python3 "$REPO/spike/wasm/patch-loader.py" original.c patched.c
mkdir -p "$REPO/spike/wasm/experimental"
for variant in original patched; do
  emcc -Os -include stdlib.h "$variant.c" -o "$REPO/spike/wasm/experimental/$variant.js" \
    $(pkg-config --cflags libxml-2.0 libxslt libexslt) \
    -s MODULARIZE -s SINGLE_FILE -s ALLOW_MEMORY_GROWTH -s INITIAL_MEMORY=16777216 \
    -s TOTAL_STACK=2097152 -s EXPORT_NAME=createXSLTTransformModule \
    -s 'EXPORTED_FUNCTIONS=["_transform","_malloc","_free"]' \
    -s 'EXPORTED_RUNTIME_METHODS=["cwrap","UTF8ToString","stringToNewUTF8"]' \
    -s 'DEFAULT_LIBRARY_FUNCS_TO_INCLUDE=["$stringToNewUTF8"]' \
    -s WASM_ASYNC_COMPILATION=0 -s ASYNCIFY \
    -s 'ASYNCIFY_IMPORTS=["fetch_and_load_document"]' -s ASYNCIFY_STACK_SIZE=262144 \
    $(pkg-config --libs libxml-2.0 libxslt libexslt)
done
emcc --version > "$REPO/spike/wasm/experimental/compiler.txt"
echo 'Both experimental engines built.'
