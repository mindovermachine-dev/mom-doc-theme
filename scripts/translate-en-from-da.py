#!/usr/bin/env python3
import json
import re
import time
import urllib.parse
import urllib.request
from pathlib import Path

SRC_ROOT = Path("astro/src/content/docs/da")
DST_ROOT = Path("astro/src/content/docs/en")

cache: dict[str, str] = {}


def translate_text(text: str) -> str:
    if not text.strip():
        return text
    if text in cache:
        return cache[text]

    chunks = []
    max_len = 2200
    current = ""
    for part in re.split(r"(\n\n+)", text):
        if len(current) + len(part) > max_len and current:
            chunks.append(current)
            current = part
        else:
            current += part
    if current:
        chunks.append(current)

    translated_parts = []
    for chunk in chunks:
        url = (
            "https://translate.googleapis.com/translate_a/single"
            "?client=gtx&sl=da&tl=en&dt=t&q=" + urllib.parse.quote(chunk)
        )
        result = chunk
        for attempt in range(4):
            try:
                with urllib.request.urlopen(url, timeout=30) as response:
                    data = json.loads(response.read().decode("utf-8"))
                result = "".join(piece[0] for piece in data[0])
                break
            except Exception:
                if attempt == 3:
                    result = chunk
                time.sleep(0.6)
        translated_parts.append(result)

    out = "".join(translated_parts)
    cache[text] = out
    return out


def protect_urls(text: str):
    tokens: list[str] = []

    def repl(match: re.Match[str]) -> str:
        tokens.append(match.group(0).replace("/da/", "/en/"))
        return f"URLTOKEN{len(tokens) - 1}TOKENURL"

    protected = re.sub(r"https?://[^\s)]+|/da/[^\s)\"']*|/en/[^\s)\"']*", repl, text)
    return protected, tokens


def restore_urls(text: str, tokens: list[str]) -> str:
    out = text
    for i, token in enumerate(tokens):
        out = out.replace(f"URLTOKEN{i}TOKENURL", token)
    return out


def translate_block(text: str) -> str:
    t = text.replace("/da/", "/en/")
    protected, tokens = protect_urls(t)
    translated = translate_text(protected)
    restored = restore_urls(translated, tokens)
    return restored


def translate_frontmatter_line(line: str) -> str:
    m = re.match(r"^(\s*[A-Za-z0-9_-]+\s*:\s*)(.*)$", line)
    if not m:
        return line.replace("/da/", "/en/")

    prefix, value = m.group(1), m.group(2)
    value = value.replace("/da/", "/en/")

    if value.startswith(("http://", "https://", "/", "[", "{")):
        return prefix + value
    if value in {"true", "false", "null"}:
        return prefix + value

    quote = ""
    raw = value
    if (raw.startswith('"') and raw.endswith('"')) or (raw.startswith("'") and raw.endswith("'")):
        quote = raw[0]
        raw = raw[1:-1]

    translated = translate_block(raw)
    if quote:
        translated = quote + translated + quote
    return prefix + translated


def process_file(src_path: Path, dst_path: Path) -> None:
    src = src_path.read_text(encoding="utf-8")
    lines = src.splitlines()
    out_lines: list[str] = []

    in_frontmatter = False

    i = 0
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()

        if i == 0 and stripped == "---":
            in_frontmatter = True
            out_lines.append(line)
            i += 1
            continue

        if in_frontmatter and stripped == "---":
            in_frontmatter = False
            out_lines.append(line)
            i += 1
            continue

        if in_frontmatter:
            out_lines.append(translate_frontmatter_line(line))
            i += 1
            continue

        if stripped == "":
            out_lines.append(line)
            i += 1
            continue

        if stripped.startswith("import ") or stripped.startswith("export "):
            out_lines.append(line)
            i += 1
            continue

        if stripped.startswith("<") and stripped.endswith(">"):
            out_lines.append(line.replace("/da/", "/en/"))
            i += 1
            continue

        j = i
        block_lines: list[str] = []
        while j < len(lines) and lines[j].strip() != "":
            if lines[j].strip().startswith("import ") or lines[j].strip().startswith("export "):
                break
            block_lines.append(lines[j])
            j += 1

        block = "\n".join(block_lines)
        translated_block = translate_block(block)
        out_lines.append(translated_block)
        i = j

    out = "\n".join(out_lines)
    if src.endswith("\n"):
        out += "\n"

    out = out.replace("/da/", "/en/")
    out = re.sub(r"URLTOKEN\d+TOKENURL", "/en/", out)

    dst_path.parent.mkdir(parents=True, exist_ok=True)
    dst_path.write_text(out, encoding="utf-8")


if __name__ == "__main__":
    files = sorted(SRC_ROOT.rglob("*.mdx"))
    for src_file in files:
        rel = src_file.relative_to(SRC_ROOT)
        dst_file = DST_ROOT / rel
        process_file(src_file, dst_file)
    print(f"translated={len(files)}")
