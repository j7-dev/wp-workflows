#!/usr/bin/env bash
set -euo pipefail

# Check if skill-creator:skill-creator plugin is installed and enabled.
# Exit 0 = ready, Exit 1 = not found or not enabled.

PLUGIN_DIR="$HOME/.claude/plugins/marketplaces/claude-plugins-official/plugins/skill-creator"
SETTINGS_FILE="$HOME/.claude/settings.json"
SKILL_MD="$PLUGIN_DIR/skills/skill-creator/SKILL.md"

errors=()

if [ ! -d "$PLUGIN_DIR" ]; then
  errors+=("plugin directory not found: $PLUGIN_DIR")
fi

if [ ! -f "$SKILL_MD" ]; then
  errors+=("SKILL.md not found: $SKILL_MD")
fi

if [ -f "$SETTINGS_FILE" ]; then
  if ! grep -q '"skill-creator@claude-plugins-official"' "$SETTINGS_FILE" 2>/dev/null; then
    errors+=("plugin not registered in settings.json")
  fi
else
  errors+=("settings.json not found: $SETTINGS_FILE")
fi

if [ ${#errors[@]} -gt 0 ]; then
  echo "FAIL: /skill-creator:skill-creator is NOT available."
  for e in "${errors[@]}"; do
    echo "  - $e"
  done
  echo ""
  echo "To install: run '/install-plugin skill-creator' or install the 'skill-creator' plugin from the Claude Code official marketplace."
  exit 1
fi

echo "OK: /skill-creator:skill-creator is installed and enabled."
exit 0
