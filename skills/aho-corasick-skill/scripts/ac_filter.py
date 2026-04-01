#!/usr/bin/env python3
"""
ac_filter.py — Aho-Corasick keyword/sensitive-word filter
Returns whether text contains any pattern, plus the matched list.
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


def filter_text(patterns, text):
    if not patterns:
        return {"error": "No patterns provided", "flagged": False, "matched_patterns": [], "count": 0}

    ac = ahocorasick_rs.AhoCorasick(patterns, store_patterns=True)
    matched = ac.find_matches_as_strings(text)
    unique_matched = sorted(set(matched))
    return {
        "flagged": len(unique_matched) > 0,
        "matched_patterns": unique_matched,
        "count": len(unique_matched),
    }


def main():
    parser = argparse.ArgumentParser(description="Aho-Corasick keyword/sensitive-word filter")
    parser.add_argument("--patterns", help="Comma-separated list of patterns")
    parser.add_argument("--patterns-file", help="File with one pattern per line")
    parser.add_argument("--text", help="Text string to filter")
    parser.add_argument("--file", help="File path to filter")
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

    result = filter_text(patterns, text)
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
