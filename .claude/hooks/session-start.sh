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
# Registered as a SessionStart hook in .claude/settings.json. The timeout there
# has to stay comfortably above the worst cold-start total -- a cold image
# downloads a Node tarball before npm even starts -- so bump both together if
# the `done total=` line below creeps toward it.
#
# Each stage prints `[session-start] <step> elapsed=Ns`, and an ERR trap names
# the step on the way out, so a hang or a nonzero exit is visible in the session
# banner instead of silent.

set -eEuo pipefail

cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}"

script_start=$SECONDS
current_step="startup"
step_t0=$SECONDS
trap 'echo "[session-start] FAILED step=${current_step} elapsed=$((SECONDS - script_start))s exit=$?"' ERR

step_start() {
    current_step="$1"
    step_t0=$SECONDS
}

step_done() {
    echo "[session-start] ${current_step} elapsed=$((SECONDS - step_t0))s"
}

# A developer on their own machine manages their own Node; this is only for the
# cloud image, whose default is the one that cannot run the project.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
    echo "Not a remote session, leaving Node and dependencies alone."
    exit 0
fi

step_start "node-select"

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
step_done

# install rather than ci: the container image is cached after this hook, and
# install can reuse what is already unpacked there. The `prepare` script it
# triggers finds Chromium already present via PLAYWRIGHT_BROWSERS_PATH.
step_start "npm-install"
npm install --no-audit --no-fund
step_done

echo "[session-start] done total=$((SECONDS - script_start))s"
echo "Session ready: npm test, npm run lint and npm run check should all work."
