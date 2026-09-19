#!/bin/sh
# V46 guard: this worktree may only drive the isolated `characters` environment.
#
# presidium-dev parses `--env` only BEFORE the operation for `run`; anywhere after it the argument
# is passed through opaquely and the job silently lands in the shared default `main` slot. A guard
# that merely searches argv for "--env characters" is therefore unsound: it would accept
# `presidium-dev run build --env characters -- ...` and `presidium-dev run build -- echo --env
# characters`, both of which the real parser targets at main. So this accepts exactly one shape:
# the strict prefix `--env characters`, and it refuses any further environment flag in any
# position so a second one cannot reach the real parser and change the target.
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
for arg in "$@"; do
  case "$arg" in
    --env | --env=*) deny "refusing a later environment flag '$arg': the target must be unambiguous." ;;
  esac
done
exec "$target" --env characters "$@"
