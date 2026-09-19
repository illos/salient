#!/bin/sh
# V46 sibling-worktree broker shim: presidium-ssh must be launched from the canonical
# managed project directory, while presidium-dev resolves its source from the worktree cwd.
# This changes only the subprocess working directory; arguments and stdin pass through.
cd /srv/presidium/projects/salient/code || exit 1
exec /usr/local/bin/presidium-ssh "$@"
