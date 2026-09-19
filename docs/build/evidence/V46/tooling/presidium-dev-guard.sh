#!/bin/sh
# V46 guard: this worktree may only drive the isolated `characters` environment.
#
# Two separate hazards, both in the real CLI's own parser:
#
# 1. `presidium-dev` parses `--env` only BEFORE the operation. Anywhere after it the argument goes
#    into an `argparse.REMAINDER` list and is passed through opaquely, so the job silently lands in
#    the shared default `main` slot. A guard that merely searches argv for "--env characters" is
#    therefore unsound: it accepts `presidium-dev run build --env characters -- ...` and
#    `presidium-dev run build -- echo --env characters`, both of which really target `main`.
#
# 2. The real parser is `argparse.ArgumentParser(prog='presidium-dev')` with `allow_abbrev` left at
#    its default of True, and `--env` is the only option starting with "e". So `--env`, `--en` and
#    `--e` are all the same flag, with or without `=`, and a later one overrides an earlier one.
#    `--env characters --en main run build` would pass a guard that only looks for the literal
#    `--env`, and would run against `main`.
#
# So this accepts exactly one shape — the strict prefix `--env characters` — and then refuses any
# later token that argparse could read as that same option, in any spelling.
target=${V46_GUARD_TARGET:-/usr/local/bin/presidium-dev}
deny() {
  echo "v46-guard: $1" >&2
  echo "v46-guard: only 'presidium-dev --env characters ...' is permitted here; presidium-dev" >&2
  echo "v46-guard: defaults to the shared main slot, which serves the user's app." >&2
  exit 64
}
[ "$#" -ge 2 ] || deny "refusing '$*': no leading --env characters."
[ "$1" = "--env" ] || deny "refusing '$*': first argument is '$1', not --env."
[ "$2" = "characters" ] || deny "refusing --env '$2': this worktree may only target 'characters'."
shift 2
# Every abbreviation argparse would accept for --env, bare or with an inline value.
for arg in "$@"; do
  case "$arg" in
    --e | --en | --env | --e=* | --en=* | --env=*)
      deny "refusing a later environment flag '$arg': argparse reads --e, --en and --env as the same option, and the last one wins." ;;
  esac
done
exec "$target" --env characters "$@"
