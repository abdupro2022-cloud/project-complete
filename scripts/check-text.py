#!/usr/bin/env python3
"""
Text-integrity guard for the Arabic source files.

The generator occasionally emits stray CJK/Cyrillic glyphs or Latin words glued
to Arabic inside user-facing strings. Those are invisible in a terminal because
of bidi reordering, so they are checked by codepoint rather than by eye.

Usage: python3 scripts/check-text.py
Exit code 0 = clean, 1 = issues found.
"""
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent / "src"

# Codepoints that have no business in this codebase.
BANNED = re.compile("[\u4E00-\u9FFF\u3400-\u4DBF\u0400-\u04FF\uFFFD]")

# Latin words allowed to sit directly against Arabic letters (identifiers and
# product names that are intentionally Latin).
ALLOWED_LATIN = {
    "vexa", "script", "shorts", "titles", "thumbnail", "thumbnails", "hook",
    "hooks", "seo", "cta", "markdown", "json", "api", "ai", "notion", "youtube",
    "gemini", "deepseek", "openrouter", "tavily", "firecrawl", "endpoint",
    "model", "fallback", "compatible", "video", "text", "id", "url", "test",
    "live", "data", "web", "cloud", "demo", "default", "spreadsheet", "database",
}

# Latin glued to an Arabic letter with no separator.
GLUED = re.compile("[\u0600-\u06FF][A-Za-z]{2,}")


def main() -> int:
    issues: list[str] = []
    for path in sorted(ROOT.rglob("*.ts*")):
        for n, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
            rel = path.relative_to(ROOT)
            if BANNED.search(line):
                marks = sorted({f"U+{ord(c):04X}" for c in line if BANNED.match(c)})
                issues.append(f"{rel}:{n} banned-codepoint {','.join(marks)}\n    {line.strip()[:120]}")
            for m in GLUED.finditer(line):
                word = m.group()[1:]
                if word.lower() not in ALLOWED_LATIN:
                    issues.append(
                        f"{rel}:{n} latin-glued-to-arabic {word!r}\n    {line.strip()[:120]}"
                    )
    if issues:
        print("TEXT INTEGRITY: %d issue(s)\n" % len(issues))
        print("\n".join(issues))
        return 1
    print("TEXT INTEGRITY: clean")
    return 0


if __name__ == "__main__":
    sys.exit(main())
