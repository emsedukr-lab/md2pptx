import re

MAX_CHARS = 65
BREAK_AT = 58


def apply_line_breaks(text: str, max_chars: int = 65, break_at: int = 58) -> str:
    """
    긴 줄을 어절 경계에서 분할한다.

    규칙:
    1. 한 줄이 max_chars(70)자 이상이면 분할 대상.
    2. break_at(65)자가 포함된 어절(공백 기준)의 끝까지를 윗줄에 배치.
    3. 이후 텍스트를 다음 줄로 이동 (\n 삽입).
    4. 분할된 줄도 max_chars 이상이면 재귀적으로 분할.
    5. 한글 1자 = 1자, 영문 1자 = 1자로 카운트.

    Args:
        text: 원본 텍스트 (여러 줄 가능, \n 포함)
        max_chars: 분할 기준 길이 (기본 70)
        break_at: 분할 위치 (기본 65)

    Returns:
        줄바꿈이 적용된 텍스트.
    """

    def split_line(line: str) -> list[str]:
        if len(line) < max_chars:
            return [line]

        words = re.findall(r"\S+", line)
        if not words:
            return [line]

        cumulative_len = 0
        split_index = len(words)

        for idx, word in enumerate(words):
            if idx == 0:
                cumulative_len += len(word)
            else:
                cumulative_len += len(word) + 1

            if cumulative_len > break_at:
                split_index = idx + 1
                break

        first_line = " ".join(words[:split_index]).strip()
        second_line = " ".join(words[split_index:]).strip()

        if not second_line:
            return [first_line]

        if len(second_line) >= max_chars:
            return [first_line, *split_line(second_line)]

        return [first_line, second_line]

    output_lines: list[str] = []
    for line in text.split("\n"):
        output_lines.extend(split_line(line))

    return "\n".join(output_lines)


def apply_line_breaks_for_bullet(
    text: str,
    indent_prefix: str = "",
    max_chars: int = 65,
    break_at: int = 58,
) -> list[str]:
    """
    불릿 항목 텍스트에 줄바꿈을 적용한다.
    줄바꿈 후 이어지는 줄은 indent_prefix만큼 들여쓴다.

    Returns:
        줄 리스트. 첫 줄은 원본, 이후 줄은 indent_prefix 포함.
    """

    wrapped = apply_line_breaks(text=text, max_chars=max_chars, break_at=break_at)
    lines = wrapped.split("\n")

    if not lines:
        return []

    result: list[str] = [lines[0]]
    for line in lines[1:]:
        result.append(f"{indent_prefix}{line}")

    return result


if __name__ == "__main__":
    short_text = "안녕하세요"
    long_text = (
        "병원 전 외상 처치에서 가장 중요한 것은 현장에서의 신속한 평가와 적절한 처치 방법의 "
        "선택이며 이는 환자의 생존율에 직접적인 영향을 미친다."
    )
    mixed_text = (
        "The quick brown fox jumps over the lazy dog and continues running through "
        "the forest without stopping for a moment to rest."
    )
    bullet_text = "외상성 손상의 인적 및 재정적 영향의 중대성을 인식할 수 있다."

    print("[1] 짧은 줄 (70자 미만)")
    print(apply_line_breaks(short_text))
    print()

    print("[2] 긴 줄 (70자 이상)")
    print(apply_line_breaks(long_text))
    print()

    print("[3] 영문 혼합")
    print(apply_line_breaks(mixed_text))
    print()

    print("[4] 불릿 텍스트")
    print(
        apply_line_breaks_for_bullet(
            bullet_text,
            indent_prefix="  ",
            max_chars=30,
            break_at=25,
        )
    )
