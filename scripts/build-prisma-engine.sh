#!/usr/bin/env bash
# Alternativa para ambientes que permitem GitHub/crates.io, mas bloqueiam
# o host dos binários do Prisma. Não altera o código do Prisma nem checksums.
set -euo pipefail
prisma_tools_dir="${1:-/workspace/tooling}"
prisma_engine_ref=d1b3f377ca835d73fd50954a5e22128b9ebdd6b8
prisma_rust_version=1.97.1
mkdir -p "$prisma_tools_dir"
export RUSTUP_HOME="$prisma_tools_dir/rustup"
export CARGO_HOME="$prisma_tools_dir/cargo"
export PATH="$CARGO_HOME/bin:$prisma_tools_dir/cmake/cmake/data/bin:$PATH"

if [ ! -x "$CARGO_HOME/bin/rustup" ]; then
  curl --fail --silent --show-error --location https://sh.rustup.rs --output "$prisma_tools_dir/rustup-init.sh"
  sh "$prisma_tools_dir/rustup-init.sh" -y --no-modify-path --profile minimal --default-toolchain "$prisma_rust_version"
fi
rustup toolchain install "$prisma_rust_version" --profile minimal
if [ ! -x "$prisma_tools_dir/cmake/cmake/data/bin/cmake" ]; then
  python -m pip install --target "$prisma_tools_dir/cmake" cmake==4.4.4
fi
if [ ! -d "$prisma_tools_dir/prisma-engines" ]; then
  git clone --filter=blob:none --no-checkout https://github.com/prisma/prisma-engines.git "$prisma_tools_dir/prisma-engines"
  git -C "$prisma_tools_dir/prisma-engines" checkout --detach "$prisma_engine_ref"
fi
cd "$prisma_tools_dir/prisma-engines"
if [ "$(git rev-parse HEAD)" != "$prisma_engine_ref" ] || [ -n "$(git status --porcelain)" ]; then
  echo 'O cache de código oficial está em outra revisão ou contém alterações; preserve-o e use outro diretório.' >&2
  exit 1
fi
export CARGO_NET_GIT_FETCH_WITH_CLI=true
export CARGO_PROFILE_RELEASE_LTO=false
export CARGO_PROFILE_RELEASE_CODEGEN_UNITS=16
export CARGO_PROFILE_RELEASE_OPT_LEVEL=1
cargo +"$prisma_rust_version" build --locked --release -p schema-engine-cli -j 3
test "$(target/release/schema-engine --version)" = "schema-engine-cli $prisma_engine_ref"
sha256sum target/release/schema-engine
