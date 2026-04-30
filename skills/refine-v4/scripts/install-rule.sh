#!/usr/bin/env bash
set -euo pipefail

# Install refine-v4 rule into the current project's .claude/rules/ directory.
# Usage: bash scripts/install-rule.sh [project-dir]
#   project-dir: target project root (defaults to current working directory)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(dirname "$SCRIPT_DIR")"
RULE_SOURCE="$SKILL_DIR/rule.md"

PROJECT_DIR="${1:-.}"
PROJECT_DIR="$(cd "$PROJECT_DIR" && pwd)"
RULES_DIR="$PROJECT_DIR/.claude/rules"
RULE_TARGET="$RULES_DIR/refine-v4.rule.md"

if [ ! -f "$RULE_SOURCE" ]; then
  echo "ERROR: rule.md not found at $RULE_SOURCE"
  exit 1
fi

mkdir -p "$RULES_DIR"

cp "$RULE_SOURCE" "$RULE_TARGET"
echo "OK: refine-v4 rule installed to $RULE_TARGET"
