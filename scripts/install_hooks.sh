#!/bin/bash
# One-time setup per clone: points git at the tracked .githooks/ directory
# instead of the untracked (and not version-controlled) .git/hooks/.
# Run once after cloning: bash scripts/install_hooks.sh
set -e
cd "$(git rev-parse --show-toplevel)"
git config core.hooksPath .githooks
echo "Git hooks now point at .githooks/ (pre-commit enforces npm run release)."
