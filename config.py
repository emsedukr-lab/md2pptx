"""
Markdown -> PPTX Converter Configuration
All measurements in centimeters (cm), font sizes in points (pt).
"""
from dataclasses import dataclass, field
from typing import Optional


# ── Data Model ──────────────────────────────────────────
@dataclass
class SlideData:
    title: str = ""
    page_number: str = ""
    body_text: str = ""
    speaker_notes: str = ""


# ── Slide Dimensions (cm) ───────────────────────────────
SLIDE_WIDTH_CM = 33.867
SLIDE_HEIGHT_CM = 19.05

# ── Title Text Box (cm) ─────────────────────────────────
TITLE_LEFT = 1.693
TITLE_TOP = 0.338
TITLE_WIDTH = 28.787
TITLE_HEIGHT = 1.778

# ── Page Number Text Box (cm) ───────────────────────────
PAGE_NUM_LEFT = 30.480
PAGE_NUM_TOP = 0.338
PAGE_NUM_WIDTH = 1.693
PAGE_NUM_HEIGHT = 1.778

# ── Header Separator Line (cm) ──────────────────────────
SEPARATOR_LEFT = 1.693
SEPARATOR_TOP = 2.370
SEPARATOR_WIDTH = 30.480
SEPARATOR_WEIGHT_PT = 1.333

# ── Body Text Box (cm) ──────────────────────────────────
BODY_LEFT = 1.693
BODY_TOP = 3.000
BODY_WIDTH = 30.480
BODY_HEIGHT = 15.000

# ── Font Options ────────────────────────────────────────
FONT_OPTIONS = {
    "맑은 고딕": "Malgun Gothic",
    "Noto Sans KR": "Noto Sans KR",
    "KoPub돋움 Medium": "KoPubDotumMedium",
    "KoPub돋움 Light": "KoPubDotumLight",
    "KoPub돋움 Bold": "KoPubDotumBold",
}
DEFAULT_FONT = "Malgun Gothic"
CODE_FONT = "Consolas"

# ── Typography Defaults (pt) ────────────────────────────
DEFAULT_TITLE_SIZE = 22
DEFAULT_BODY_SIZE = 16
DEFAULT_TABLE_SIZE = 14
DEFAULT_PAGE_NUM_SIZE = 11
DEFAULT_CODE_BLOCK_SIZE = 14

# ── Colors (hex without #) ──────────────────────────────
COLOR_BLACK = "000000"
COLOR_GRAY_100 = "F3F4F6"
COLOR_WHITE = "FFFFFF"
COLOR_BLUE = "2563EB"

# ── Bullet Indent (cm per level) ────────────────────────
BULLET_INDENT_CM = 1.2

# ── Table Settings ──────────────────────────────────────
TABLE_ROW_HEIGHT_CM = 1.25
TABLE_EXTRA_ROW_CM = 0.95
TABLE_CELL_PADDING_CM = 0.203
TABLE_BORDER_PT = 1.0
TABLE_MAX_WIDTH_CM = 30.480

# ── Code Block ──────────────────────────────────────────
CODE_BLOCK_PADDING_CM = 0.381

# ── Line Spacing ────────────────────────────────────────
LINE_SPACING_MULTIPLIER = 1.5
PARAGRAPH_AFTER_PT = 6

# ── Line Break Rule ─────────────────────────────────────
LINE_BREAK_MAX_CHARS = 65
LINE_BREAK_AT = 58

# ── Table Text Spacing (cm) ─────────────────────────────
TABLE_TEXT_SPACING_CM = 0.847

# ── User Settings (runtime) ─────────────────────────────
@dataclass
class UserSettings:
    font_name: str = DEFAULT_FONT
    title_size: int = DEFAULT_TITLE_SIZE
    body_size: int = DEFAULT_BODY_SIZE
    table_size: int = DEFAULT_TABLE_SIZE
    code_font_separate: bool = False
    line_spacing_multiplier: float = LINE_SPACING_MULTIPLIER

    @property
    def code_font(self) -> str:
        return CODE_FONT if self.code_font_separate else self.font_name
