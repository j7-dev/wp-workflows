#!/usr/bin/env python3
"""
ac_search.py — Aho-Corasick multi-pattern search
Finds all occurrences of patterns in text or a file, returns JSON.
"""
import argparse
import json
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


def search(patterns, text, overlapping=False):
    if not patterns:
        return {"error": "No patterns provided", "matches": [], "total": 0}

    ac = ahocorasick_rs.AhoCorasick(patterns, store_patterns=True)
    raw = ac.find_matches_as_indexes(text, overlapping=overlapping)
    matches = [
        {"pattern": patterns[idx], "start": start, "end": end}
        for idx, start, end in raw
    ]
    return {"matches": matches, "total": len(matches)}


def main():
    parser = argparse.ArgumentParser(description="Aho-Corasick multi-pattern search")
    parser.add_argument("--patterns", help="Comma-separated list of patterns")
    parser.add_argument("--patterns-file", help="File with one pattern per line")
    parser.add_argument("--text", help="Text string to search in")
    parser.add_argument("--file", help="File path to search in")
    parser.add_argument("--overlapping", action="store_true", help="Allow overlapping matches")
    args = parser.parse_args()

    patterns = load_patterns(args.patterns, args.patterns_file)

    if args.file:
        with open(args.file, encoding="utf-8") as f:
            text = f.read()
    elif args.text:
        text = args.text
    else:
        print(json.dumps({"error": "Provide --text or --file"}))
        sys.exit(1)

    result = search(patterns, text, overlapping=args.overlapping)
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
