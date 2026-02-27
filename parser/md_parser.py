import re
from dataclasses import dataclass, field


@dataclass
class SlideData:
    title: str = ""
    page_number: str = ""
    body_text: str = ""
    speaker_notes: str = ""


_TITLE_PREFIX_RE = re.compile(r"^\[?\d+\]?\s*[:\.\)]\s*")
_PAGE_REF_RE = re.compile(r"\((?:교재\s*)?p\.(\d+(?:[~,]\d+)*)\)")
_SECTION_HEADER_RE = re.compile(
    r"(?m)^\s*(\*\*\[핵심 메시지\]\*\*|\[핵심 메시지\]|\[본문\]|\[레이아웃 가이드\])\s*$"
)


def _split_h1_blocks(content: str) -> list[str]:
    starts = [m.start() for m in re.finditer(r"(?m)^# ", content)]
    if not starts:
        return []

    blocks: list[str] = []
    for i, start in enumerate(starts):
        end = starts[i + 1] if i + 1 < len(starts) else len(content)
        blocks.append(content[start:end].rstrip())
    return blocks


def _parse_title_and_page(h1_line: str) -> tuple[str, str]:
    title_line = h1_line[2:].strip() if h1_line.startswith("# ") else h1_line.strip()
    title_line = _TITLE_PREFIX_RE.sub("", title_line).strip()

    page_number = ""
    page_match = _PAGE_REF_RE.search(title_line)
    if page_match:
        page_raw = page_match.group(1).replace(",", "~")
        page_number = f"p.{page_raw}"
        title_line = _PAGE_REF_RE.sub("", title_line).strip()

    return title_line, page_number


def _format_speaker_notes(text: str) -> str:
    notes = text.strip()
    if not notes:
        return ""

    notes = re.sub(r"([\.。])(?:\s+|$)", r"\1\n", notes)
    notes = re.sub(r"\n{2,}", "\n", notes)
    return notes.strip()


def _normalize_section_name(header: str) -> str:
    token = header.strip().replace("**", "")
    if token == "[핵심 메시지]":
        return "core"
    if token == "[본문]":
        return "body"
    if token == "[레이아웃 가이드]":
        return "layout"
    return "unknown"


def _route_sections(body: str) -> tuple[str, str, bool]:
    body_text = ""
    speaker_notes = ""
    has_section_headers = False

    matches = list(_SECTION_HEADER_RE.finditer(body))
    if not matches:
        fallback_body = body.strip()
        if fallback_body:
            print("WARNING: section headers not found; treating all post-H1 text as body_text.")
        return fallback_body, speaker_notes, False

    has_section_headers = True

    for i, match in enumerate(matches):
        section_name = _normalize_section_name(match.group(1))
        section_start = match.end()
        section_end = matches[i + 1].start() if i + 1 < len(matches) else len(body)
        section_text = body[section_start:section_end].strip()

        if section_name == "core":
            speaker_notes = _format_speaker_notes(section_text)
        elif section_name == "body":
            body_text = section_text
        elif section_name == "layout":
            continue

    return body_text, speaker_notes, has_section_headers


def parse_markdown(content: str) -> list[SlideData]:
    slides: list[SlideData] = []

    try:
        if not isinstance(content, str):
            print("WARNING: content is not a string; returning empty slide list.")
            return slides

        for idx, block in enumerate(_split_h1_blocks(content), start=1):
            try:
                lines = block.splitlines()
                if not lines:
                    continue

                h1_line = lines[0]
                title, page_number = _parse_title_and_page(h1_line)

                body_after_h1 = "\n".join(lines[1:]).strip()
                body_text = ""
                speaker_notes = ""

                if body_after_h1:
                    body_text, speaker_notes, _ = _route_sections(body_after_h1)

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
        print(f"WARNING: parse_markdown failed: {error}")

    return slides


if __name__ == "__main__":
    test_md = """# [1]: 학습목표 (교재 p.3)

**[핵심 메시지]**
본 장은 병원 전 외상 처치의 역사를 다룬다. 외상 처치의 세 단계를 학습한다.

[본문]
- 병원 전 외상 처치의 역사와 발전을 이해할 수 있다.
  - 고대부터 현대까지의 발전 과정
    - 나폴레옹 시대의 군의관 체계
- 외상 처치의 세 가지 단계를 이해할 수 있다.

[레이아웃 가이드]
- 유형: 개념

# [5]: 외상의 분류 (교재 p.102~103)

**[핵심 메시지]**
외상은 둔상과 관통상으로 분류된다.

[본문]
- 둔상(blunt trauma): 표면 손상 없이 내부 장기 손상
- 관통상(penetrating trauma): 피부를 뚫고 들어가는 손상

# [8]: 평가 기준 (p.45,46)

[본문]
- 1차 평가
- 2차 평가
"""
    slides = parse_markdown(test_md)
    for i, s in enumerate(slides):
        print(f"--- Slide {i+1} ---")
        print(f"Title: {s.title}")
        print(f"PageNo: {s.page_number}")
        print(f"Notes: {s.speaker_notes[:50]}...")
        print(f"Body: {s.body_text[:80]}...")
        print()
