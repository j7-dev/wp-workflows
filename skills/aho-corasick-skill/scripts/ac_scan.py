#!/usr/bin/env python3
"""
ac_scan.py — Aho-Corasick batch file scanner
Scans multiple files (or a directory) for multiple patterns, line by line.
"""
import argparse
import json
import os
import sys

try:
    import ahocorasick_rs
except ImportError:
    print(json.dumps({"error": "ahocorasick_rs not installed. Run: pip install ahocorasick-rs --break-system-packages"}))
    sys.exit(1)


def load_patterns(patterns_str=None, patterns_file=None):
    patterns = []
    if patterns_str:
        patterns = [p.strip() for p in patterns_str.split(",") if p.strip()]
    if patterns_file:
        with open(patterns_file, encoding="utf-8") as f:
            patterns += [line.strip() for line in f if line.strip()]
    return patterns


def scan_file(ac, patterns, filepath):
    matches = []
    try:
        with open(filepath, encoding="utf-8", errors="replace") as f:
            for lineno, line in enumerate(f, 1):
                line_stripped = line.rstrip("\n")
                hits = ac.find_matches_as_strings(line_stripped)
                if hits:
                    matches.append({
                        "line": lineno,
                        "context": line_stripped[:200],  # truncate very long lines
                        "patterns_found": sorted(set(hits)),
                    })
    except OSError as e:
        return {"file": filepath, "error": str(e), "matches": []}
    return {"file": filepath, "matches": matches}


def collect_files(dir_path, ext=None):
    collected = []
    for root, _, files in os.walk(dir_path):
        for fname in files:
            if ext is None or fname.endswith(ext):
                collected.append(os.path.join(root, fname))
    return sorted(collected)


def main():
    parser = argparse.ArgumentParser(description="Aho-Corasick batch file scanner")
    parser.add_argument("--patterns", help="Comma-separated list of patterns")
    parser.add_argument("--patterns-file", help="File with one pattern per line")
    parser.add_argument("--files", nargs="+", help="List of files to scan")
    parser.add_argument("--dir", help="Directory to scan recursively")
    parser.add_argument("--ext", help="File extension filter (e.g. .txt, .py)")
    args = parser.parse_args()

    patterns = load_patterns(args.patterns, args.patterns_file)
    if not patterns:
        print(json.dumps({"error": "No patterns provided"}))
        sys.exit(1)

    files = []
    if args.dir:
        files += collect_files(args.dir, args.ext)
    if args.files:
        files += args.files
    if not files:
        print(json.dumps({"error": "No files to scan. Use --files or --dir"}))
        sys.exit(1)

    ac = ahocorasick_rs.AhoCorasick(patterns, store_patterns=True)

    results = [scan_file(ac, patterns, f) for f in files]

    files_with_matches = sum(1 for r in results if r.get("matches"))
    total_matches = sum(len(r.get("matches", [])) for r in results)

    output = {
        "summary": {
            "files_scanned": len(files),
            "files_with_matches": files_with_matches,
            "total_match_lines": total_matches,
        },
        "results": results,
    }
    print(json.dumps(output, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
