import re
from dataclasses import dataclass
from bs4 import BeautifulSoup


@dataclass
class SlideData:
    title: str = ""
    page_number: str = ""
    body_text: str = ""
    speaker_notes: str = ""


_TITLE_PREFIX_RE = re.compile(r"^\[?\d+\]?\s*[:\.\)]\s*")
_PAGE_REF_RE = re.compile(r"\((?:교재\s*)?p\.(\d+(?:[~,]\d+)*)\)")
_SECTION_TOKEN_RE = re.compile(
    r"\*\*\[(핵심 메시지|본문|레이아웃 가이드)\]\*\*|\[(핵심 메시지|본문|레이아웃 가이드)\]"
)


def _normalize_whitespace(text: str) -> str:
    text = re.sub(r"[\t\r\f\v]+", " ", text)
    text = re.sub(r"\s*\n\s*", "\n", text)
    text = re.sub(r"[ ]{2,}", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def _extract_plain_text(element) -> str:
    if element is None:
        return ""

    if hasattr(element, "get_text"):
        text = element.get_text(" ", strip=True)
    else:
        text = str(element).strip()

    return re.sub(r"\s+", " ", text).strip()


def _parse_title_and_page(h1_text: str) -> tuple[str, str]:
    title = _TITLE_PREFIX_RE.sub("", h1_text.strip()).strip()

    page_number = ""
    page_match = _PAGE_REF_RE.search(title)
    if page_match:
        page_raw = page_match.group(1).replace(",", "~")
        page_number = f"p.{page_raw}"
        title = _PAGE_REF_RE.sub("", title).strip()

    return title, page_number


def _format_speaker_notes(text: str) -> str:
    notes = text.strip()
    if not notes:
        return ""

    notes = re.sub(r"([\.。])(?:\s+|$)", r"\1\n", notes)
    notes = re.sub(r"\n{2,}", "\n", notes)
    return notes.strip()


def _section_from_text(text: str) -> tuple[str, str]:
    match = _SECTION_TOKEN_RE.search(text)
    if not match:
        return "", text

    label = match.group(1) or match.group(2) or ""
    remaining = (text[: match.start()] + text[match.end() :]).strip()

    if label == "핵심 메시지":
        return "core", remaining
    if label == "본문":
        return "body", remaining
    if label == "레이아웃 가이드":
        return "layout", remaining
    return "", remaining


def html_to_markdown(element) -> str:
    def render_inline(node) -> str:
        name = getattr(node, "name", None)
        if name is None:
            return str(node)

        tag = name.lower()

        if tag == "br":
            return "\n"

        inner = "".join(render_inline(child) for child in node.children)

        if tag in ("strong", "b"):
            inner = _normalize_whitespace(inner)
            return f"**{inner}**" if inner else ""
        if tag in ("em", "i"):
            inner = _normalize_whitespace(inner)
            return f"*{inner}*" if inner else ""
        if tag == "code" and getattr(getattr(node, "parent", None), "name", "") != "pre":
            inner = node.get_text(strip=True)
            return f"`{inner}`" if inner else ""
        if tag in ("del", "s"):
            inner = _normalize_whitespace(inner)
            return f"~~{inner}~~" if inner else ""

        return inner

    def render_list_item(li_node, indent: int, ordered: bool) -> str:
        indent_str = "  " * indent
        prefix = f"{indent_str}{'1. ' if ordered else '- '}"

        text_parts: list[str] = []
        nested_parts: list[str] = []

        for child in li_node.children:
            child_name = getattr(child, "name", None)
            child_tag = child_name.lower() if child_name else ""

            if child_tag in ("ul", "ol"):
                nested_md = render_block(child, indent + 1)
                if nested_md:
                    nested_parts.append(nested_md)
            else:
                text_parts.append(render_inline(child))

        line_text = _normalize_whitespace("".join(text_parts))
        line = f"{prefix}{line_text}".rstrip()

        parts = [line] if line else []
        parts.extend(part for part in nested_parts if part.strip())
        return "\n".join(parts).rstrip()

    def render_table(table_node) -> str:
        rows: list[list[str]] = []

        for tr in table_node.find_all("tr"):
            cells = tr.find_all(["th", "td"], recursive=False)
            if not cells:
                cells = tr.find_all(["th", "td"])

            row: list[str] = []
            for cell in cells:
                cell_text = _normalize_whitespace(
                    " ".join(render_inline(child) for child in cell.children)
                )
                cell_text = cell_text.replace("|", "\\|").replace("\n", "<br>")
                row.append(cell_text)

            if row:
                rows.append(row)

        if not rows:
            return ""

        col_count = max(len(row) for row in rows)
        normalized_rows = [row + [""] * (col_count - len(row)) for row in rows]

        header = normalized_rows[0]
        body = normalized_rows[1:]

        lines = [
            f"| {' | '.join(header)} |",
            f"| {' | '.join(['---'] * col_count)} |",
        ]

        for row in body:
            lines.append(f"| {' | '.join(row)} |")

        return "\n".join(lines)

    def render_block(node, indent: int = 0) -> str:
        name = getattr(node, "name", None)
        if name is None:
            return _normalize_whitespace(str(node))

        tag = name.lower()

        if tag == "ul":
            lines = [
                render_list_item(li, indent, ordered=False)
                for li in node.find_all("li", recursive=False)
            ]
            return "\n".join(line for line in lines if line.strip())

        if tag == "ol":
            lines = [
                render_list_item(li, indent, ordered=True)
                for li in node.find_all("li", recursive=False)
            ]
            return "\n".join(line for line in lines if line.strip())

        if tag == "pre":
            code_node = node.find("code")
            code_text = code_node.get_text() if code_node else node.get_text()
            code_text = code_text.strip("\n")
            return f"```\n{code_text}\n```" if code_text else ""

        if tag == "code":
            text = node.get_text(strip=True)
            return f"`{text}`" if text else ""

        if tag == "table":
            return render_table(node)

        if tag == "p":
            return _normalize_whitespace("".join(render_inline(child) for child in node.children))

        if tag == "br":
            return "\n"

        if tag in ("strong", "b", "em", "i", "del", "s"):
            return _normalize_whitespace(render_inline(node))

        parts: list[str] = []
        for child in node.children:
            child_name = getattr(child, "name", None)
            if child_name and child_name.lower() in ("ul", "ol", "pre", "table", "p"):
                rendered = render_block(child, indent)
            else:
                rendered = render_inline(child)
            if rendered:
                parts.append(rendered)

        return _normalize_whitespace("\n".join(parts))

    try:
        markdown = render_block(element)
        markdown = re.sub(r"\n{3,}", "\n\n", markdown)
        return markdown.strip()
    except Exception as error:
        print(f"WARNING: html_to_markdown failed: {error}")
        return ""


def parse_html(content: str) -> list[SlideData]:
    slides: list[SlideData] = []

    try:
        if not isinstance(content, str):
            print("WARNING: content is not a string; returning empty slide list.")
            return slides

        soup = BeautifulSoup(content, "lxml")
        h1_tags = soup.find_all("h1")

        for idx, h1 in enumerate(h1_tags, start=1):
            try:
                title, page_number = _parse_title_and_page(_extract_plain_text(h1))

                elements = []
                for sibling in h1.next_siblings:
                    sibling_name = getattr(sibling, "name", None)
                    if sibling_name and sibling_name.lower() == "h1":
                        break
                    if isinstance(sibling, str) and not sibling.strip():
                        continue
                    elements.append(sibling)

                body_parts: list[str] = []
                note_parts: list[str] = []
                fallback_parts: list[str] = []

                current_section = ""
                has_section_headers = False

                for element in elements:
                    plain_text = _extract_plain_text(element)
                    section_name, remaining_text = _section_from_text(plain_text)

                    if section_name:
                        has_section_headers = True
                        current_section = section_name
                        if remaining_text:
                            if current_section == "core":
                                note_parts.append(remaining_text)
                            elif current_section == "body":
                                body_parts.append(remaining_text)
                        continue

                    if current_section == "core":
                        if plain_text:
                            note_parts.append(plain_text)
                    elif current_section == "body":
                        markdown = html_to_markdown(element)
                        if markdown:
                            body_parts.append(markdown)
                    elif current_section == "layout":
                        continue
                    else:
                        markdown = html_to_markdown(element)
                        if markdown:
                            fallback_parts.append(markdown)

                if not has_section_headers and fallback_parts:
                    print(
                        "WARNING: section headers not found; treating all post-H1 HTML as body_text."
                    )
                    body_parts = fallback_parts

                body_text = re.sub(
                    r"\n{3,}",
                    "\n\n",
                    "\n".join(part.strip() for part in body_parts if part.strip()),
                ).strip()
                speaker_notes = _format_speaker_notes(" ".join(note_parts))

                slide = SlideData(
                    title=title,
                    page_number=page_number,
                    body_text=body_text,
                    speaker_notes=speaker_notes,
                )

                if slide.title or slide.body_text:
                    slides.append(slide)
            except Exception as block_error:
                print(f"WARNING: failed to parse slide block {idx}: {block_error}")
                continue
    except Exception as error:
        print(f"WARNING: parse_html failed: {error}")

    return slides


if __name__ == "__main__":
    test_html = """
<html><body>
<h1>[1]: 학습목표 (교재 p.3)</h1>
<p><strong>[핵심 메시지]</strong></p>
<p>본 장은 외상 처치의 역사를 다룬다. 세 단계를 학습한다.</p>
<p>[본문]</p>
<ul>
  <li>병원 전 외상 처치의 역사와 발전</li>
  <li>외상 처치의 세 가지 단계
    <ul>
      <li>1차 평가</li>
      <li>2차 평가</li>
    </ul>
  </li>
</ul>
<p>[레이아웃 가이드]</p>
<p>유형: 개념</p>

<h1>[5]: 분류 (p.102,103)</h1>
<p>[본문]</p>
<table>
  <tr><th>구분</th><th>설명</th></tr>
  <tr><td>둔상</td><td>내부 손상</td></tr>
</table>
</body></html>
"""
    slides = parse_html(test_html)
    for i, s in enumerate(slides):
        print(f"--- Slide {i+1} ---")
        print(f"Title: {s.title}")
        print(f"PageNo: {s.page_number}")
        print(f"Notes: {s.speaker_notes[:50]}...")
        print(f"Body:\n{s.body_text[:120]}...")
        print()
