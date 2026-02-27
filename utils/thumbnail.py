"""
슬라이드 썸네일 생성 유틸리티.
python-pptx Presentation 객체로부터 슬라이드 수를 카운트하고,
플레이스홀더 썸네일 HTML을 생성한다.
"""
import base64
import io


def count_slides(pptx_bytes: bytes) -> int:
    """PPTX 바이트에서 슬라이드 수를 반환한다."""
    from pptx import Presentation
    prs = Presentation(io.BytesIO(pptx_bytes))
    return len(prs.slides)


def generate_placeholder_thumbnails(slide_count: int) -> str:
    """
    슬라이드 번호 플레이스홀더 HTML을 생성한다.
    각 썸네일은 120x67.5px (16:9 비율).
    """
    thumbs = []
    for i in range(1, slide_count + 1):
        thumbs.append(
            f'<div style="'
            f'min-width:120px;width:120px;height:67.5px;'
            f'background:#F9FAFB;border:1px solid #E5E7EB;border-radius:4px;'
            f'display:flex;align-items:center;justify-content:center;'
            f'font-size:13px;color:#6B7280;font-weight:500;'
            f'font-family:Pretendard,Apple SD Gothic Neo,Malgun Gothic,sans-serif;'
            f'flex-shrink:0;'
            f'">S{i}</div>'
        )
    return (
        '<div style="display:flex;gap:8px;overflow-x:auto;padding:4px 0;">'
        + "".join(thumbs)
        + '</div>'
    )
