#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const mode = process.argv[2];
if (!['on', 'off', 'status'].includes(mode)) {
	console.error('Usage: ide-toggle.mjs <on|off|status>');
	process.exit(1);
}

const IDE_PATTERNS = [
	'mcp__ide__*',
	'mcp__ide__executeCode',
	'mcp__ide__getDiagnostics',
];

const settingsPath = join(homedir(), '.claude', 'settings.json');
const raw = readFileSync(settingsPath, 'utf8');
const data = JSON.parse(raw);

data.permissions = data.permissions || {};
const deny = new Set(data.permissions.deny || []);

if (mode === 'status') {
	const blocked = IDE_PATTERNS.filter((p) => deny.has(p));
	console.log(blocked.length > 0 ? `IDE MCP: OFF (denied: ${blocked.join(', ')})` : 'IDE MCP: ON (no deny rules)');
	process.exit(0);
}

if (mode === 'off') {
	IDE_PATTERNS.forEach((p) => deny.add(p));
} else {
	IDE_PATTERNS.forEach((p) => deny.delete(p));
}

data.permissions.deny = [...deny];
writeFileSync(settingsPath, JSON.stringify(data, null, '\t') + '\n');
console.log(`IDE MCP -> ${mode.toUpperCase()}. Restart Claude Code session to take effect.`);
