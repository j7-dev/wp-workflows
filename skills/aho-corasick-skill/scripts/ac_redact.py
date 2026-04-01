#!/usr/bin/env python3
"""
ac_redact.py — Aho-Corasick pattern redaction / replacement
Replaces all matched patterns in text with a replacement string.
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


def redact(patterns, text, replacement="***"):
    if not patterns:
        return {"error": "No patterns provided", "redacted_text": text, "replacements_made": 0}

    ac = ahocorasick_rs.AhoCorasick(patterns)
    # Collect all non-overlapping matches and replace from right to left
    # to preserve offsets
    matches = ac.find_matches_as_indexes(text, overlapping=False)
    if not matches:
        return {"redacted_text": text, "replacements_made": 0}

    # Build redacted string by processing matches left to right
    result = []
    prev_end = 0
    for _, start, end in matches:
        result.append(text[prev_end:start])
        result.append(replacement)
        prev_end = end
    result.append(text[prev_end:])

    return {
        "redacted_text": "".join(result),
        "replacements_made": len(matches),
    }


def main():
    parser = argparse.ArgumentParser(description="Aho-Corasick pattern redaction")
    parser.add_argument("--patterns", help="Comma-separated list of patterns")
    parser.add_argument("--patterns-file", help="File with one pattern per line")
    parser.add_argument("--text", help="Text string to redact")
    parser.add_argument("--file", help="Input file to redact")
    parser.add_argument("--output", help="Output file (default: print to stdout)")
    parser.add_argument("--replacement", default="***", help="Replacement string (default: ***)")
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

    result = redact(patterns, text, replacement=args.replacement)

    if args.output and "redacted_text" in result:
        with open(args.output, "w", encoding="utf-8") as f:
            f.write(result["redacted_text"])
        result["output_file"] = args.output

    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
