#!/usr/bin/env bash
# ============================================================================
# release.sh - Claude Code Plugin one-command release script
#
# Can be triggered automatically via .git/hooks/pre-push on master,
# or run manually from the command line.
#
# Usage:
#   ./scripts/release.sh           # Auto-detect bump type from commits
#   ./scripts/release.sh patch     # Force patch bump  (1.0.0 -> 1.0.1)
#   ./scripts/release.sh minor     # Force minor bump  (1.0.0 -> 1.1.0)
#   ./scripts/release.sh major     # Force major bump  (1.0.0 -> 2.0.0)
#   ./scripts/release.sh 1.2.3     # Force exact version
# ============================================================================
set -euo pipefail

# --- Config ---
PLUGIN_JSON=".claude-plugin/plugin.json"
REMOTE="origin"
BRANCH="master"

# --- Colors ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

info()  { echo -e "${CYAN}[INFO]${NC} $*"; }
ok()    { echo -e "${GREEN}[OK]${NC} $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*" >&2; exit 1; }

# --- Navigate to repo root ---
cd "$(git rev-parse --show-toplevel)" || error "Not inside a git repository"

# ============================================================================
# 1. Safety checks
# ============================================================================
info "Running safety checks..."

# Clean working tree
if [ -n "$(git status --porcelain)" ]; then
  error "Working tree is dirty. Commit or stash your changes first."
fi

# Correct branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "$BRANCH" ]; then
  error "Must be on '$BRANCH' branch (currently on '$CURRENT_BRANCH')"
fi

# plugin.json exists
if [ ! -f "$PLUGIN_JSON" ]; then
  error "$PLUGIN_JSON not found"
fi

# gh CLI available
if ! command -v gh &> /dev/null; then
  warn "gh CLI not found. Will skip GitHub Release creation."
  HAS_GH=false
else
  HAS_GH=true
fi

ok "All checks passed"

# ============================================================================
# 2. Read current version
# ============================================================================
CURRENT_VERSION=$(grep -o '"version"[[:space:]]*:[[:space:]]*"[^"]*"' "$PLUGIN_JSON" | head -1 | grep -o '[0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*')

if [ -z "$CURRENT_VERSION" ]; then
  error "Could not read version from $PLUGIN_JSON"
fi

IFS='.' read -r CUR_MAJOR CUR_MINOR CUR_PATCH <<< "$CURRENT_VERSION"
info "Current version: ${CYAN}v${CURRENT_VERSION}${NC}"

# ============================================================================
# 3. Determine new version
# ============================================================================
LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")

determine_bump_from_commits() {
  local range
  if [ -z "$LAST_TAG" ]; then
    range="HEAD"
  else
    range="${LAST_TAG}..HEAD"
  fi

  local commits
  commits=$(git log "$range" --pretty=format:"%s" 2>/dev/null || echo "")

  if [ -z "$commits" ]; then
    echo "patch"
    return
  fi

  # Check for breaking changes (highest priority)
  if echo "$commits" | grep -qiE '(BREAKING CHANGE|^[a-z]+(\(.+\))?!:)'; then
    echo "major"
    return
  fi

  # Check for features
  if echo "$commits" | grep -qE '^feat(\(.+\))?:'; then
    echo "minor"
    return
  fi

  # Default to patch
  echo "patch"
}

ARG="${1:-auto}"

case "$ARG" in
  auto)
    if [ -z "$LAST_TAG" ]; then
      # First release: use current version from plugin.json
      NEW_VERSION="$CURRENT_VERSION"
      info "First release detected. Using version from plugin.json."
    else
      BUMP_TYPE=$(determine_bump_from_commits)
      info "Auto-detected bump type: ${YELLOW}${BUMP_TYPE}${NC}"
      case "$BUMP_TYPE" in
        major) NEW_VERSION="$((CUR_MAJOR + 1)).0.0" ;;
        minor) NEW_VERSION="${CUR_MAJOR}.$((CUR_MINOR + 1)).0" ;;
        patch) NEW_VERSION="${CUR_MAJOR}.${CUR_MINOR}.$((CUR_PATCH + 1))" ;;
      esac
    fi
    ;;
  patch)
    NEW_VERSION="${CUR_MAJOR}.${CUR_MINOR}.$((CUR_PATCH + 1))"
    ;;
  minor)
    NEW_VERSION="${CUR_MAJOR}.$((CUR_MINOR + 1)).0"
    ;;
  major)
    NEW_VERSION="$((CUR_MAJOR + 1)).0.0"
    ;;
  [0-9]*)
    # Validate semver format
    if ! echo "$ARG" | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+$'; then
      error "Invalid version format: '$ARG'. Expected X.Y.Z"
    fi
    NEW_VERSION="$ARG"
    ;;
  *)
    error "Unknown argument: '$ARG'. Use: patch|minor|major|X.Y.Z or no argument for auto"
    ;;
esac

# Check if tag already exists
if git rev-parse "v${NEW_VERSION}" &>/dev/null; then
  error "Tag v${NEW_VERSION} already exists"
fi

info "New version: ${GREEN}v${NEW_VERSION}${NC}"

# ============================================================================
# 4. Update plugin.json
# ============================================================================

# Skip update if version is unchanged (first release)
if [ "$CURRENT_VERSION" != "$NEW_VERSION" ]; then
  info "Updating $PLUGIN_JSON..."
  sed -i "s/\"version\"[[:space:]]*:[[:space:]]*\"${CURRENT_VERSION}\"/\"version\": \"${NEW_VERSION}\"/" "$PLUGIN_JSON"
  ok "Version updated in $PLUGIN_JSON"
fi

# ============================================================================
# 5. Git commit + tag
# ============================================================================
info "Creating git commit and tag..."

if [ -n "$(git status --porcelain)" ]; then
  git add "$PLUGIN_JSON"
  git commit -m "chore(release): v${NEW_VERSION}"
  ok "Committed version bump"
else
  info "No changes to commit (first release with existing version)"
fi

git tag "v${NEW_VERSION}"
ok "Tagged v${NEW_VERSION}"

# ============================================================================
# 6. Push to remote
# ============================================================================
info "Pushing to ${REMOTE}/${BRANCH}..."
RELEASING=1 git push "$REMOTE" "$BRANCH" --tags
ok "Pushed to remote"

# ============================================================================
# 7. Create GitHub Release
# ============================================================================
if [ "$HAS_GH" = true ]; then
  info "Creating GitHub Release..."
  if [ -z "$LAST_TAG" ]; then
    gh release create "v${NEW_VERSION}" \
      --title "v${NEW_VERSION}" \
      --notes "Initial release" \
      2>/dev/null && ok "GitHub Release created" || warn "Failed to create GitHub Release"
  else
    gh release create "v${NEW_VERSION}" \
      --generate-notes \
      2>/dev/null && ok "GitHub Release created" || warn "Failed to create GitHub Release"
  fi
else
  warn "Skipped GitHub Release (gh CLI not found)"
fi

# ============================================================================
# 8. Done!
# ============================================================================
echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  Released v${NEW_VERSION}${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "Users can update with:"
echo -e "  ${CYAN}claude plugin update wp-workflows@wp-workflows${NC}"
echo ""
