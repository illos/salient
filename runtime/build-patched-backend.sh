#!/usr/bin/env bash
# Run only inside a bounded, disposable dev-guest builder with Rust/Cargo available.
set -euo pipefail
if [[ ${SALIENT_BOUNDED_BUILDER:-} != 1 ]]; then
  echo 'Run in a bounded remote build container; see docs/remote-development.md.' >&2
  exit 1
fi
revision=157eb19fd30d085cdb5ec785fdb3574f84cabfda
patch_path=$(realpath "${1:?path to convex-instance-secret-env.patch}")
output_dir=$(realpath "${2:?protected output directory}")
if [[ $# -gt 3 || ( $# -eq 3 && $3 != --setup-only ) ]]; then
  echo 'Usage: build-patched-backend.sh PATCH OUTPUT [--setup-only]' >&2
  exit 1
fi
# Rust build.rs invokes npm and repository-local pnpm/turbo, so bootstrap all of them
# before Cargo. Use an immutable Node release and architecture-specific published checksum.
tool_root=/build/js-toolchain
case $(uname -m) in
  x86_64) node_arch=x64; node_sha=e798599612f4bb71333a3397ab0d095fd62214e115aea45aa858a145fc72d67e ;;
  aarch64) node_arch=arm64; node_sha=aa881151bd0f9f154a0424dd60a72e9ce10672619121658c278a24327ef46831 ;;
  *) echo 'Unsupported Node builder architecture' >&2; exit 1 ;;
esac
node_name=node-v24.13.0-linux-$node_arch
mkdir -p "$tool_root"
node_archive="$tool_root/$node_name.tar.xz"
if ! printf '%s  %s\n' "$node_sha" "$node_archive" | sha256sum --check --status 2>/dev/null; then
  curl --fail --location --retry 3 "https://nodejs.org/dist/v24.13.0/$node_name.tar.xz" --output "$node_archive.part"
  printf '%s  %s\n' "$node_sha" "$node_archive.part" | sha256sum --check --status
  mv "$node_archive.part" "$node_archive"
fi
# Re-extract the verified archive so a partial earlier setup cannot masquerade as complete.
tar -xJf "$node_archive" -C "$tool_root"
export PATH="$tool_root/$node_name/bin:$PATH"
[[ $(node --version) == v24.13.0 ]]
if [[ ! -x "$tool_root/npm/node_modules/.bin/npm" ]] || [[ $("$tool_root/npm/node_modules/.bin/npm" --version) != 11.11.0 ]]; then
  npm install --prefix "$tool_root/npm" --ignore-scripts --no-audit --no-fund npm@11.11.0
fi
export PATH="$tool_root/npm/node_modules/.bin:$PATH"
[[ $(npm --version) == 11.11.0 ]]

mkdir -p /build/convex-backend
cd /build/convex-backend
git init
if ! git cat-file -e "$revision^{commit}" 2>/dev/null; then
  git fetch --depth=1 https://github.com/get-convex/convex-backend.git "$revision"
fi
git checkout --detach "$revision"
[[ $(git rev-parse HEAD) == "$revision" ]]
if git apply --reverse --check "$patch_path" 2>/dev/null; then
  printf '%s\n' 'Pinned source already carries the exact compatibility patch; reusing it.'
else
  git apply --check "$patch_path"
  git apply "$patch_path"
fi
# Upstream pins pnpm/turbo in scripts/package-lock.json. Do not substitute Salient's
# application pnpm version or rely on a globally installed tool.
npm ci --prefix scripts --ignore-scripts --no-audit --no-fund
export PATH="/build/convex-backend/scripts/node_modules/.bin:$PATH"
[[ $(pnpm --version) == 11.15.1 ]]
[[ $(turbo --version) == 2.10.5 ]]
printf 'Builder tools: Node %s; npm %s; pnpm %s; turbo %s\n' "$(node --version)" "$(npm --version)" "$(pnpm --version)" "$(turbo --version)"
if [[ ${3:-} == --setup-only ]]; then
  printf '%s\n' 'JavaScript tooling setup verified; Cargo was not started.'
  exit 0
fi
# Pinned repository toolchain is nightly-2026-06-28. Fail rather than substitute stable.
rustup toolchain install nightly-2026-06-28 --profile minimal
export CARGO_BUILD_JOBS=2
cargo +nightly-2026-06-28 build --locked --release -p local_backend --bin convex-local-backend
install -m 0755 target/release/convex-local-backend "$output_dir/convex-local-backend"
sha256sum "$output_dir/convex-local-backend" | cut -d ' ' -f1 > "$output_dir/convex-local-backend.sha256"
chmod 0600 "$output_dir/convex-local-backend.sha256"
# Functional env-only keygen probe. Clap reads the secret env in both parsers, so
# provide the nonsecret instance name at top level AND inside the keygen subcommand.
CONVEX_INSTANCE_SECRET=$(openssl rand -hex 32) "$output_dir/convex-local-backend" \
  --instance-name anonymous-runtime-patch-check \
  keygen admin-key --instance-name anonymous-runtime-patch-check >/dev/null
"$output_dir/convex-local-backend" --help | grep -q CONVEX_INSTANCE_SECRET
printf '%s\n' 'Patched backend built; run disposable runtime verification before migrating development data.'
