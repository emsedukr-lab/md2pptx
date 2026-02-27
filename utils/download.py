import io
import zipfile
from datetime import datetime
from pathlib import Path
from typing import Union


def create_zip_bundle(
    files: list[tuple[str, bytes]],
) -> bytes:
    """
    여러 파일을 ZIP으로 묶어 bytes로 반환한다.

    Args:
        files: [(파일명, 파일내용bytes), ...] 형태의 리스트.
               예: [("lecture1.pptx", b"..."), ("lecture2.pptx", b"...")]

    Returns:
        ZIP 파일의 bytes.
    """
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
        for filename, content in files:
            zf.writestr(filename, content)
    return zip_buffer.getvalue()


def generate_zip_filename() -> str:
    """
    ZIP 파일명을 생성한다.
    형식: slides_YYYYMMDD_HHMMSS.zip
    """
    now = datetime.now()
    return f"slides_{now.strftime('%Y%m%d_%H%M%S')}.zip"


def pptx_to_bytes(presentation) -> bytes:
    """
    python-pptx Presentation 객체를 bytes로 변환한다.

    Args:
        presentation: pptx.Presentation 객체

    Returns:
        PPTX 파일의 bytes.
    """
    buffer = io.BytesIO()
    presentation.save(buffer)
    return buffer.getvalue()


def get_output_filename(input_filename: str) -> str:
    """
    입력 파일명에서 출력 PPTX 파일명을 생성한다.
    확장자를 .pptx로 변경.

    Args:
        input_filename: 원본 파일명 (예: "lecture1.md", "notes.html")

    Returns:
        출력 파일명 (예: "lecture1.pptx", "notes.pptx")
    """
    stem = Path(input_filename).stem
    return f"{stem}.pptx"


if __name__ == "__main__":
    # 테스트 1: ZIP 생성
    test_files = [
        ("test1.pptx", b"fake pptx content 1"),
        ("test2.pptx", b"fake pptx content 2"),
    ]
    zip_bytes = create_zip_bundle(test_files)
    print(f"ZIP size: {len(zip_bytes)} bytes")

    # 테스트 2: 파일명 생성
    zip_name = generate_zip_filename()
    print(f"ZIP filename: {zip_name}")

    # 테스트 3: 출력 파일명
    print(get_output_filename("lecture1.md"))    # lecture1.pptx
    print(get_output_filename("notes.html"))     # notes.pptx

    # 테스트 4: ZIP 내용 검증
    import zipfile
    import io
    with zipfile.ZipFile(io.BytesIO(zip_bytes), 'r') as zf:
        for name in zf.namelist():
            print(f"  ZIP entry: {name}")
