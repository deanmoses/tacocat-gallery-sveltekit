#!/usr/bin/env bash
# Prepare a Claude Code on the web session: select the Node version .nvmrc pins,
# then install dependencies.
#
# The Node version is the point. package.json sets engines.node >=24 with
# engineStrict, and the cloud image ships an older Node, so `npm ci` refuses to
# run at all. Forcing it through with --engine-strict=false is worse than it
# looks: the npm bundled with Node 22 rewrites package-lock.json, stripping the
# `libc` fields that newer npm records for optional platform-specific packages,
# so an unrelated change arrives with a few dozen lines of lockfile churn.
#
# Registered as a SessionStart hook in .claude/settings.json.

set -euo pipefail

cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}"

# A developer on their own machine manages their own Node; this is only for the
# cloud image, whose default is the one that cannot run the project.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
    echo "Not a remote session, leaving Node and dependencies alone."
    exit 0
fi

# nvm installs itself somewhere different in every image, and it is a shell
# function rather than a binary, so it has to be sourced before it exists.
nvm_dir=""
for candidate in "${NVM_DIR:-}" /opt/nvm "$HOME/.nvm" /usr/local/nvm; do
    if [ -n "$candidate" ] && [ -s "$candidate/nvm.sh" ]; then
        nvm_dir="$candidate"
        break
    fi
done

if [ -z "$nvm_dir" ]; then
    echo "No nvm found, so the Node version is whatever the image provides:"
    echo "  node $(node --version), npm $(npm --version)"
    echo "If dependency installs fail on the engine check, this is why."
else
    export NVM_DIR="$nvm_dir"
    # nvm.sh is not written to survive `set -u`, and returns non-zero on a
    # version it has not installed yet
    set +eu
    # shellcheck disable=SC1091 # sourced from the image at runtime
    . "$NVM_DIR/nvm.sh"
    # Reads .nvmrc, so the pinned version lives in one place
    nvm install
    nvm use
    set -eu

    # A hook runs in its own shell, so the PATH it sets is gone by the time the
    # session starts. CLAUDE_ENV_FILE is what carries it across.
    if [ -n "${CLAUDE_ENV_FILE:-}" ]; then
        node_bin="$(dirname "$(nvm which current)")"
        {
            echo "export NVM_DIR=\"$NVM_DIR\""
            echo "export PATH=\"$node_bin:\$PATH\""
        } >>"$CLAUDE_ENV_FILE"
    fi
fi

echo "Using node $(node --version), npm $(npm --version)"

# install rather than ci: the container image is cached after this hook, and
# install can reuse what is already unpacked there. The `prepare` script it
# triggers finds Chromium already present via PLAYWRIGHT_BROWSERS_PATH.
npm install --no-audit --no-fund

echo "Session ready: npm test, npm run lint and npm run check should all work."
