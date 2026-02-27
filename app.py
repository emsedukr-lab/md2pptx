import sys
import locale

sys.path.insert(0, '/Users/chungji/Documents/md2pptx')

import streamlit as st
from config import FONT_OPTIONS, DEFAULT_FONT, DEFAULT_TITLE_SIZE, DEFAULT_BODY_SIZE, DEFAULT_TABLE_SIZE, UserSettings
from parser.md_parser import parse_markdown
from parser.html_parser import parse_html
from renderer.slide_builder import create_presentation
from utils.download import create_zip_bundle, generate_zip_filename, pptx_to_bytes, get_output_filename
from utils.thumbnail import count_slides, generate_placeholder_thumbnails


st.set_page_config(
    page_title="Markdown \u2192 PPTX Converter",
    page_icon="\U0001F4CA",
    layout="centered",
)

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# v4.0 Design Token CSS — iOS Glassmorphism UI
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DESIGN_CSS = """
<style>
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');

:root {
    /* Color Tokens — iOS Glassmorphism */
    --bg-page: #F2F2F7;
    --bg-card: rgba(255,255,255,0.55);
    --bg-card-solid: rgba(255,255,255,0.85);
    --bg-upload: rgba(255,255,255,0.35);
    --bg-result-row: rgba(255,255,255,0.6);
    --border-card: rgba(255,255,255,0.6);
    --border-input: rgba(0,0,0,0.1);
    --border-focus: #007AFF;
    --border-upload: rgba(0,122,255,0.3);
    --text-heading: #1C1C1E;
    --text-primary: #3A3A3C;
    --text-secondary: #8E8E93;
    --text-tertiary: #AEAEB2;
    --text-on-button: #FFFFFF;
    --accent: #007AFF;
    --accent-hover: #0056CC;
    --accent-light: rgba(0,122,255,0.06);
    --success: rgba(52,199,89,0.82);
    --success-hover: rgba(52,199,89,0.95);
    --warning: #FF9500;
    --error: #FF3B30;
    --check-active: #007AFF;
    --check-border: rgba(0,0,0,0.1);
    --disabled-bg: rgba(142,142,147,0.4);
    /* Gap Tokens */
    --gap-xs: 6px;
    --gap-sm: 8px;
    --gap-md: 12px;
    --gap-lg: 16px;
    --gap-xl: 20px;
    --gap-2xl: 24px;
    /* Glass Tokens */
    --glass-blur: blur(40px) saturate(180%);
    --glass-blur-light: blur(30px);
    --glass-blur-heavy: blur(50px) saturate(200%);
    --glass-shadow: 0 2px 16px rgba(0,0,0,0.06), 0 0 1px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.7);
    --glass-border: 0.5px solid rgba(255,255,255,0.6);
    --transition-default: all 0.25s cubic-bezier(0.4,0,0.2,1);
}

/* ── Global ── */
*, *::before, *::after { box-sizing: border-box; }

.stApp {
    background: var(--bg-page) !important;
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', system-ui, 'Pretendard', 'Apple SD Gothic Neo', sans-serif !important;
}

.stApp *, .stApp label, .stApp p, .stApp span, .stApp h1, .stApp h2, .stApp h3 {
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', system-ui, 'Pretendard', 'Apple SD Gothic Neo', sans-serif !important;
}

/* Hide Streamlit default header & footer */
header[data-testid="stHeader"] { display: none !important; }
footer { display: none !important; }

/* ── Block Container: 680px centered ── */
.block-container {
    max-width: 680px !important;
    padding: 24px 16px 40px !important;
}

/* ── Card (Glassmorphism) ── */
.v35-card {
    background: var(--bg-card);
    -webkit-backdrop-filter: var(--glass-blur);
    backdrop-filter: var(--glass-blur);
    border: var(--glass-border);
    border-radius: 22px;
    padding: 24px;
    box-shadow: var(--glass-shadow);
    margin-bottom: 0;
    transition: var(--transition-default);
}

.v35-card-title {
    font-size: 15px;
    font-weight: 600;
    color: var(--text-heading);
    margin: 0 0 var(--gap-lg) 0;
    letter-spacing: -0.2px;
}

/* ── App Header (centered) ── */
.app-header-v35 {
    text-align: center;
    margin-bottom: var(--gap-2xl);
    padding: 16px 20px;
}
.app-header-v35 h1 {
    font-size: 20px !important;
    font-weight: 700 !important;
    color: var(--text-heading) !important;
    margin: 0 0 4px 0 !important;
    padding: 0 !important;
    letter-spacing: -0.3px !important;
}
.app-header-v35 p {
    font-size: 13px !important;
    color: var(--text-secondary) !important;
    margin: 0 !important;
}

/* ── File Uploader (CARD 1) ── */
.stApp [data-testid="stFileUploader"] {
    background: var(--bg-upload) !important;
    -webkit-backdrop-filter: var(--glass-blur-light) !important;
    backdrop-filter: var(--glass-blur-light) !important;
    border: 2px dashed var(--border-upload) !important;
    border-radius: 20px !important;
    padding: 48px 24px !important;
    min-height: 150px !important;
    transition: all 0.3s cubic-bezier(0.4,0,0.2,1) !important;
}
.stApp [data-testid="stFileUploader"]:hover {
    border-color: rgba(0,122,255,0.6) !important;
    background: rgba(0,122,255,0.06) !important;
}
.stApp [data-testid="stFileUploader"] small {
    color: var(--text-tertiary) !important;
    font-size: 12px !important;
}
.stApp [data-testid="stFileUploader"] label {
    color: var(--text-secondary) !important;
    font-size: 14px !important;
}
.stApp [data-testid="stFileUploader"] button {
    background: rgba(0,122,255,0.82) !important;
    color: var(--text-on-button) !important;
    border: 0.5px solid rgba(255,255,255,0.3) !important;
    border-radius: 14px !important;
    font-size: 13px !important;
    font-weight: 600 !important;
    -webkit-backdrop-filter: blur(20px) !important;
    backdrop-filter: blur(20px) !important;
    transition: all 0.2s cubic-bezier(0.4,0,0.2,1) !important;
}
.stApp [data-testid="stFileUploader"] button:hover {
    filter: brightness(1.05) !important;
    transform: scale(1.015) !important;
}
.stApp [data-testid="stFileUploader"] button:active {
    transform: scale(0.97) !important;
    filter: brightness(0.95) !important;
}

/* ── Selectbox ── */
.stApp [data-testid="stSelectbox"] > div > div {
    background: rgba(255,255,255,0.5) !important;
    border: 0.5px solid var(--border-input) !important;
    border-radius: 10px !important;
    color: var(--text-primary) !important;
    font-size: 13px !important;
    height: 40px !important;
    -webkit-backdrop-filter: blur(20px) !important;
    backdrop-filter: blur(20px) !important;
    transition: var(--transition-default) !important;
}
.stApp [data-testid="stSelectbox"] > div > div:focus-within {
    border-color: var(--border-focus) !important;
    box-shadow: 0 0 0 2px rgba(0,122,255,0.12) !important;
}
[data-baseweb="popover"] {
    background: var(--bg-card-solid) !important;
    -webkit-backdrop-filter: var(--glass-blur) !important;
    backdrop-filter: var(--glass-blur) !important;
    border: var(--glass-border) !important;
    border-radius: 14px !important;
    box-shadow: 0 8px 40px rgba(0,0,0,0.15), 0 0 1px rgba(0,0,0,0.1) !important;
}
[data-baseweb="popover"] li {
    color: var(--text-primary) !important;
    font-size: 13px !important;
}
[data-baseweb="popover"] li:hover {
    background: rgba(0,122,255,0.06) !important;
}

/* ── Labels ── */
.stApp label {
    color: var(--text-secondary) !important;
    font-size: 13px !important;
    font-weight: 500 !important;
}

/* ── Slider ── */
.stApp .stSlider > div > div > div {
    background: rgba(0,0,0,0.08) !important;
    height: 4px !important;
    border-radius: 2px !important;
}
.stApp .stSlider [role="slider"] {
    background: var(--accent) !important;
    border: 2px solid #FFFFFF !important;
    width: 18px !important;
    height: 18px !important;
    box-shadow: 0 1px 4px rgba(0,0,0,0.2) !important;
    transition: var(--transition-default) !important;
}
.stApp [data-testid="stSlider"] [data-testid="stThumbValue"] {
    color: var(--accent) !important;
    font-size: 13px !important;
    font-weight: 600 !important;
}

/* ── Checkbox ── */
.stApp [data-testid="stCheckbox"] label span {
    color: var(--text-primary) !important;
    font-size: 13px !important;
}
.stApp [data-testid="stCheckbox"] input[type="checkbox"] {
    accent-color: var(--accent) !important;
}

/* ── CTA Button (Glass Blue) ── */
.stApp [data-testid="stBaseButton-primary"] {
    background: rgba(0,122,255,0.82) !important;
    color: var(--text-on-button) !important;
    border: 0.5px solid rgba(255,255,255,0.3) !important;
    border-radius: 16px !important;
    font-size: 17px !important;
    font-weight: 600 !important;
    letter-spacing: -0.2px !important;
    height: 52px !important;
    box-shadow: 0 2px 12px rgba(0,122,255,0.25), inset 0 1px 0 rgba(255,255,255,0.2) !important;
    -webkit-backdrop-filter: blur(20px) !important;
    backdrop-filter: blur(20px) !important;
    transition: all 0.2s cubic-bezier(0.4,0,0.2,1) !important;
}
.stApp [data-testid="stBaseButton-primary"]:hover {
    filter: brightness(1.05) !important;
    transform: scale(1.015) !important;
}
.stApp [data-testid="stBaseButton-primary"]:active {
    transform: scale(0.97) !important;
    filter: brightness(0.95) !important;
}

/* ── Secondary Buttons (Glass) ── */
.stApp [data-testid="stBaseButton-secondary"] {
    background: rgba(255,255,255,0.45) !important;
    -webkit-backdrop-filter: blur(20px) !important;
    backdrop-filter: blur(20px) !important;
    border: 0.5px solid rgba(0,0,0,0.08) !important;
    border-radius: 12px !important;
    font-size: 13px !important;
    font-weight: 500 !important;
    color: var(--text-primary) !important;
    transition: all 0.2s cubic-bezier(0.4,0,0.2,1) !important;
}
.stApp [data-testid="stBaseButton-secondary"]:hover {
    background: rgba(255,255,255,0.65) !important;
}
.stApp [data-testid="stBaseButton-secondary"]:active {
    transform: scale(0.97) !important;
}

/* ── Download Buttons (Glass Green) ── */
.stApp [data-testid="stDownloadButton"] button {
    background: var(--success) !important;
    color: var(--text-on-button) !important;
    border: 0.5px solid rgba(255,255,255,0.3) !important;
    border-radius: 14px !important;
    font-size: 13px !important;
    font-weight: 600 !important;
    height: 36px !important;
    -webkit-backdrop-filter: blur(20px) !important;
    backdrop-filter: blur(20px) !important;
    box-shadow: 0 2px 8px rgba(52,199,89,0.2) !important;
    transition: all 0.2s cubic-bezier(0.4,0,0.2,1) !important;
}
.stApp [data-testid="stDownloadButton"] button:hover {
    filter: brightness(1.05) !important;
    transform: scale(1.015) !important;
}
.stApp [data-testid="stDownloadButton"] button:active {
    transform: scale(0.97) !important;
    filter: brightness(0.95) !important;
}

/* ── Alerts (Glass) ── */
.stApp .stSuccess {
    background: rgba(52,199,89,0.08) !important;
    border: 0.5px solid rgba(52,199,89,0.2) !important;
    border-radius: 14px !important;
    -webkit-backdrop-filter: blur(20px) !important;
    backdrop-filter: blur(20px) !important;
}
.stApp .stWarning {
    background: rgba(255,149,0,0.08) !important;
    border: 0.5px solid rgba(255,149,0,0.2) !important;
    border-radius: 14px !important;
    -webkit-backdrop-filter: blur(20px) !important;
    backdrop-filter: blur(20px) !important;
}
.stApp .stError {
    background: rgba(255,59,48,0.08) !important;
    border: 0.5px solid rgba(255,59,48,0.2) !important;
    border-radius: 14px !important;
    -webkit-backdrop-filter: blur(20px) !important;
    backdrop-filter: blur(20px) !important;
}

/* ── Progress ── */
.stApp [data-testid="stProgress"] > div {
    background: rgba(0,0,0,0.06) !important;
    border-radius: 8px !important;
}
.stApp [data-testid="stProgress"] > div > div {
    background: var(--accent) !important;
    border-radius: 8px !important;
}

/* ── Expander (Log — Glass) ── */
.stApp [data-testid="stExpander"] {
    background: var(--bg-card) !important;
    -webkit-backdrop-filter: var(--glass-blur) !important;
    backdrop-filter: var(--glass-blur) !important;
    border: var(--glass-border) !important;
    border-radius: 22px !important;
    box-shadow: var(--glass-shadow) !important;
}
.stApp [data-testid="stExpander"] summary {
    color: var(--text-secondary) !important;
    font-size: 13px !important;
    font-weight: 500 !important;
}

/* ── Log Text ── */
.stApp [data-testid="stText"] {
    color: var(--text-secondary) !important;
    font-size: 12px !important;
    font-family: 'SF Mono', 'Menlo', 'Fira Code', 'Consolas', monospace !important;
    line-height: 1.7 !important;
}

/* ── Result File Row (Glass) ── */
.result-row {
    padding: 14px 18px;
    border-bottom: 0.5px solid rgba(0,0,0,0.06);
    transition: var(--transition-default);
    border-radius: 16px;
}
.result-row:last-child { border-bottom: none; }
.result-row:hover {
    background: var(--bg-result-row);
}
.result-row.selected { background: var(--accent-light); }

.result-row-header {
    display: flex;
    align-items: center;
    gap: 10px;
}
.result-row-name {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-primary);
    flex: 1;
}
.result-row-slides {
    font-size: 13px;
    color: var(--text-secondary);
    margin-left: 8px;
}

/* ── Thumbnail Strip ── */
.thumb-strip {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding: 4px 0;
    margin-top: 10px;
    margin-left: 44px;
}
.thumb-strip::-webkit-scrollbar { height: 4px; }
.thumb-strip::-webkit-scrollbar-track { background: transparent; }
.thumb-strip::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 2px; }

.thumb-item {
    min-width: 110px;
    width: 110px;
    height: 61.9px;
    background: rgba(255,255,255,0.4);
    -webkit-backdrop-filter: blur(20px);
    backdrop-filter: blur(20px);
    border: 0.5px solid rgba(0,0,0,0.06);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    color: var(--text-tertiary);
    font-weight: 500;
    flex-shrink: 0;
    transition: var(--transition-default);
}
.thumb-item:hover {
    background: rgba(255,255,255,0.6);
}

/* ── Selection Controls ── */
.select-controls {
    display: flex;
    gap: 12px;
    align-items: center;
}
.select-controls a {
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    text-decoration: none;
}

/* ── Download Area ── */
.dl-area-divider {
    border-top: 0.5px solid rgba(0,0,0,0.06);
    margin: 16px 0;
}
.dl-area-buttons {
    display: flex;
    gap: 12px;
    align-items: center;
}
.select-count {
    font-size: 12px;
    color: var(--text-secondary);
    margin-top: 12px;
}

/* ── Settings Grid ── */
.settings-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px 20px;
}

/* ── Options Grid ── */
.options-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px 20px;
}

/* ── Empty State ── */
.empty-state-v35 {
    min-height: 200px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    color: var(--text-tertiary);
    font-size: 14px;
}
.empty-state-icon-v35 {
    font-size: 48px;
    color: rgba(0,0,0,0.12);
    line-height: 1;
    opacity: 0.6;
}

/* ── Card Gap ── */
.card-gap { height: var(--gap-lg); }

/* ── Scrollbar ── */
::-webkit-scrollbar { width: 6px; height: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.2); }

/* ── Divider ── */
.stApp hr { border-color: rgba(0,0,0,0.06) !important; }

/* ── Slide-in Animation ── */
@keyframes slideIn {
    from { opacity: 0; transform: translateY(8px) scale(0.97); }
    to { opacity: 1; transform: translateY(0) scale(1); }
}
.v35-card {
    animation: slideIn 0.3s cubic-bezier(0.4,0,0.2,1);
}

/* ── Responsive (480px) ── */
@media (max-width: 480px) {
    .block-container {
        padding: 16px 12px 32px !important;
    }
    .app-header-v35 h1 {
        font-size: 18px !important;
    }
    .settings-grid {
        grid-template-columns: 1fr;
    }
    .options-grid {
        grid-template-columns: 1fr;
    }
    .stApp [data-testid="stBaseButton-primary"] {
        height: 48px !important;
        font-size: 15px !important;
    }
    .dl-area-buttons {
        flex-wrap: wrap;
    }
    .thumb-item {
        min-width: 90px;
        width: 90px;
        height: 50.6px;
    }
    .v35-card {
        border-radius: 18px;
        padding: 20px;
    }
}
</style>
"""

st.markdown(DESIGN_CSS, unsafe_allow_html=True)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Session State
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
if "log" not in st.session_state:
    st.session_state.log = []
if "results" not in st.session_state:
    st.session_state.results = []
if "slide_counts" not in st.session_state:
    st.session_state.slide_counts = {}
if "file_selected" not in st.session_state:
    st.session_state.file_selected = {}


def add_log(message: str) -> None:
    st.session_state.log.append(message)


def sort_results(results: list[tuple[str, bytes]]) -> list[tuple[str, bytes]]:
    try:
        return sorted(results, key=lambda x: locale.strxfrm(x[0]))
    except Exception:
        return sorted(results, key=lambda x: x[0])


def _generate_thumbnails_html(slide_count: int) -> str:
    """110x61.9px (16:9) 썸네일 스트립 HTML 생성."""
    thumbs = []
    for i in range(1, slide_count + 1):
        thumbs.append(f'<div class="thumb-item">S{i}</div>')
    return '<div class="thumb-strip">' + "".join(thumbs) + '</div>'


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Header (centered)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
st.markdown(
    '<div class="app-header-v35">'
    '<h1>Markdown \u2192 PPTX Converter</h1>'
    '<p>\ub9c8\ud06c\ub2e4\uc6b4 \ud30c\uc77c\uc744 \uc2ac\ub77c\uc774\ub4dc\ub85c \ubcc0\ud658\ud569\ub2c8\ub2e4</p>'
    '</div>',
    unsafe_allow_html=True,
)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# CARD 1 — File Upload
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
st.markdown('<div class="v35-card"><div class="v35-card-title">\ud30c\uc77c \uc5c5\ub85c\ub4dc</div>', unsafe_allow_html=True)

uploaded_files = st.file_uploader(
    ".md, .html \ud30c\uc77c\uc744 \ub4dc\ub798\uadf8\ud558\uac70\ub098 \ud074\ub9ad\ud558\uc5ec \ucca8\ubd80\ud558\uc138\uc694",
    type=["md", "html"],
    accept_multiple_files=True,
    help="\uc9c0\uc6d0 \ud615\uc2dd: .md, .html | \ucd5c\ub300 50MB, \ucd5c\ub300 20\uac1c",
)

st.markdown('</div>', unsafe_allow_html=True)

# ── Card gap ──
st.markdown('<div class="card-gap"></div>', unsafe_allow_html=True)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# CARD 2 — Settings (2-column grid)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
st.markdown('<div class="v35-card"><div class="v35-card-title">\ubcc0\ud658 \uc124\uc815</div>', unsafe_allow_html=True)

col_s1, col_s2 = st.columns(2)

with col_s1:
    font_display = st.selectbox(
        "\ud3f0\ud2b8",
        options=list(FONT_OPTIONS.keys()),
        index=0,
    )
    font_name = FONT_OPTIONS[font_display]

with col_s2:
    title_size = st.slider("\uc81c\ubaa9 \ud06c\uae30", 14, 36, DEFAULT_TITLE_SIZE, 1, format="%dpt")

col_s3, col_s4 = st.columns(2)

with col_s3:
    body_size = st.slider("\ubcf8\ubb38 \ud06c\uae30", 10, 28, DEFAULT_BODY_SIZE, 1, format="%dpt")

with col_s4:
    line_spacing_multiplier = st.slider(
        "\uc904\uac04\uaca9 (\ubc30\uc218)",
        min_value=1.0,
        max_value=2.5,
        value=1.5,
        step=0.1,
        format="\u00d7 %.1f",
    )

col_s5, col_s6 = st.columns(2)

with col_s5:
    code_font_separate = st.checkbox(
        "\ucf54\ub4dc \ud3f0\ud2b8 \ubd84\ub9ac (Consolas)",
        value=False,
    )

with col_s6:
    st.caption("")  # spacer
    table_size = body_size - 2

st.markdown('</div>', unsafe_allow_html=True)

# ── Card gap ──
st.markdown('<div class="card-gap"></div>', unsafe_allow_html=True)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# CARD 3 — Conversion Options (checkbox grid)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
st.markdown('<div class="v35-card"><div class="v35-card-title">\ubcc0\ud658 \uc635\uc158</div>', unsafe_allow_html=True)

col_o1, col_o2 = st.columns(2)

with col_o1:
    opt_page_number = st.checkbox("\uad50\uc7ac \ud398\uc774\uc9c0 \ubc88\ud638", value=True)
    opt_key_message = st.checkbox("\ud575\uc2ec \uba54\uc2dc\uc9c0 (\ub178\ud2b8)", value=True)
    opt_layout_guide = st.checkbox("\ub808\uc774\uc544\uc6c3 \uac00\uc774\ub4dc", value=False)

with col_o2:
    opt_body = st.checkbox("\ubcf8\ubb38", value=True)
    opt_slide_number = st.checkbox("\uc2ac\ub77c\uc774\ub4dc \ubc88\ud638", value=False)

st.markdown('</div>', unsafe_allow_html=True)

# ── Card gap ──
st.markdown('<div class="card-gap"></div>', unsafe_allow_html=True)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# CTA Button
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
convert_button = st.button("\U0001F680 \uc2ac\ub77c\uc774\ub4dc \uc0dd\uc131", type="primary", use_container_width=True)

# ── Card gap ──
st.markdown('<div class="card-gap"></div>', unsafe_allow_html=True)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Convert Logic
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
if convert_button:
    st.session_state.log = []
    st.session_state.results = []
    st.session_state.slide_counts = {}
    st.session_state.file_selected = {}
    add_log("\ubcc0\ud658 \uc791\uc5c5 \uc2dc\uc791")

    settings = UserSettings(
        font_name=font_name,
        title_size=title_size,
        body_size=body_size,
        table_size=table_size,
        code_font_separate=code_font_separate,
        line_spacing_multiplier=line_spacing_multiplier,
    )

    results: list[tuple[str, bytes]] = []

    if uploaded_files:
        total = len(uploaded_files)
        progress = st.progress(0, text="\ubcc0\ud658 \uc911...")
        try:
            for i, file in enumerate(uploaded_files):
                filename = file.name
                try:
                    add_log(f"[{i+1}/{total}] \ud30c\uc77c \ucc98\ub9ac: {filename}")
                    content = file.read().decode("utf-8")

                    if filename.lower().endswith((".html", ".htm")):
                        slides = parse_html(content)
                        add_log(f"[{i+1}/{total}] HTML \ud30c\uc2f1: {len(slides)}\uac1c \uc2ac\ub77c\uc774\ub4dc")
                    else:
                        slides = parse_markdown(content)
                        add_log(f"[{i+1}/{total}] MD \ud30c\uc2f1: {len(slides)}\uac1c \uc2ac\ub77c\uc774\ub4dc")

                    prs = create_presentation(slides, settings)
                    pptx_bytes = pptx_to_bytes(prs)
                    out_name = get_output_filename(filename)
                    results.append((out_name, pptx_bytes))

                    sc = count_slides(pptx_bytes)
                    st.session_state.slide_counts[out_name] = sc
                    add_log(f"[{i+1}/{total}] \uc644\ub8cc: {out_name} ({sc}\uc2ac\ub77c\uc774\ub4dc)")
                except Exception as e:
                    add_log(f"[{i+1}/{total}] \uc2e4\ud328: {filename} - {e}")
                    st.error(f"\ubcc0\ud658 \uc624\ub958: {filename} ({e})")
                finally:
                    progress.progress((i + 1) / total, text=f"\ubcc0\ud658 \uc911... {i+1}/{total}")
        finally:
            progress.empty()
    else:
        st.warning("\ud30c\uc77c\uc744 \uc5c5\ub85c\ub4dc\ud574\uc8fc\uc138\uc694.")
        add_log("\uc785\ub825 \uc5c6\uc74c")

    if results:
        st.session_state.results = results
        # Default: all files selected
        for fname, _ in results:
            st.session_state.file_selected[fname] = True
        add_log(f"\ucd5c\uc885 \uc644\ub8cc: {len(results)}\uac1c \ud30c\uc77c")
        st.rerun()


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# CARD 4 — Results (with multi-select + ZIP)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
if st.session_state.results:
    sorted_results = sort_results(st.session_state.results)
    total_count = len(sorted_results)

    # Ensure file_selected keys exist for all results
    for fname, _ in sorted_results:
        if fname not in st.session_state.file_selected:
            st.session_state.file_selected[fname] = True

    st.markdown('<div class="v35-card">', unsafe_allow_html=True)

    # ── Title row with select controls ──
    title_col, ctrl_col = st.columns([3, 2])
    with title_col:
        st.markdown(
            f'<div class="v35-card-title" style="margin-bottom:0;">'
            f'\ubcc0\ud658 \uacb0\uacfc ({total_count}\uac1c \ud30c\uc77c)</div>',
            unsafe_allow_html=True,
        )
    with ctrl_col:
        sc1, sc2 = st.columns(2)
        with sc1:
            if st.button("\uc804\uccb4 \uc120\ud0dd", key="select_all", use_container_width=True):
                for fname, _ in sorted_results:
                    st.session_state.file_selected[fname] = True
                st.rerun()
        with sc2:
            if st.button("\uc120\ud0dd \ud574\uc81c", key="deselect_all", use_container_width=True):
                for fname, _ in sorted_results:
                    st.session_state.file_selected[fname] = False
                st.rerun()

    st.markdown("---")

    # ── File rows with checkboxes ──
    for idx, (fname, fbytes) in enumerate(sorted_results):
        sc = st.session_state.slide_counts.get(fname, 0)
        is_selected = st.session_state.file_selected.get(fname, True)

        # Checkbox + file info row
        chk_col, info_col, dl_col = st.columns([1, 6, 2])

        with chk_col:
            new_val = st.checkbox(
                label=fname,
                value=is_selected,
                key=f"chk_{fname}",
                label_visibility="collapsed",
            )
            if new_val != is_selected:
                st.session_state.file_selected[fname] = new_val
                st.rerun()

        with info_col:
            slide_text = f"{sc}\uc7a5" if isinstance(sc, int) else "?\uc7a5"
            st.markdown(
                f'<div class="result-row-header">'
                f'<span style="font-size:16px;">\U0001F4C4</span>'
                f'<span class="result-row-name">{fname}</span>'
                f'<span class="result-row-slides">{slide_text}</span>'
                f'</div>',
                unsafe_allow_html=True,
            )

        with dl_col:
            st.download_button(
                label="\u2b07 \ub2e4\uc6b4\ub85c\ub4dc",
                data=fbytes,
                file_name=fname,
                mime="application/vnd.openxmlformats-officedocument.presentationml.presentation",
                key=f"dl_{fname}",
                use_container_width=True,
            )

        # Thumbnail strip
        if isinstance(sc, int) and sc > 0:
            thumbs_html = _generate_thumbnails_html(sc)
            st.markdown(thumbs_html, unsafe_allow_html=True)

        if idx < total_count - 1:
            st.markdown('<hr style="margin:4px 0;border-color:#F1F5F9;">', unsafe_allow_html=True)

    # ── Selection count ──
    selected_count = sum(1 for fname, _ in sorted_results if st.session_state.file_selected.get(fname, False))
    st.markdown(
        f'<div class="select-count">{selected_count}\uac1c \ud30c\uc77c \uc120\ud0dd\ub428</div>',
        unsafe_allow_html=True,
    )

    # ── Download area ──
    st.markdown('<div class="dl-area-divider"></div>', unsafe_allow_html=True)

    dl_c1, dl_c2 = st.columns([3, 1])

    with dl_c1:
        # Selected files ZIP download
        if selected_count >= 2:
            selected_files = [(f, b) for f, b in sorted_results if st.session_state.file_selected.get(f, False)]
            zip_bytes = create_zip_bundle(selected_files)
            zip_name = generate_zip_filename()
            st.download_button(
                label=f"\U0001F4E6 \uc120\ud0dd \ud30c\uc77c ZIP \ub2e4\uc6b4\ub85c\ub4dc ({selected_count}\uac1c)",
                data=zip_bytes,
                file_name=zip_name,
                mime="application/zip",
                key="dl_selected_zip",
                use_container_width=True,
            )
        else:
            st.markdown(
                '<div style="height:32px;display:flex;align-items:center;'
                'color:var(--text-tertiary);font-size:13px;">'
                '2\uac1c \uc774\uc0c1 \uc120\ud0dd \uc2dc ZIP \ub2e4\uc6b4\ub85c\ub4dc \uac00\ub2a5</div>',
                unsafe_allow_html=True,
            )

    with dl_c2:
        # Full ZIP download (always if 2+ files)
        if total_count >= 2:
            all_zip_bytes = create_zip_bundle(sorted_results)
            all_zip_name = generate_zip_filename()
            st.download_button(
                label="\uc804\uccb4 \ub2e4\uc6b4\ub85c\ub4dc",
                data=all_zip_bytes,
                file_name=all_zip_name,
                mime="application/zip",
                key="dl_all_zip",
                use_container_width=True,
            )

    st.markdown('</div>', unsafe_allow_html=True)

else:
    # ── Empty state (before conversion) ──
    st.markdown(
        '<div class="v35-card">'
        '<div class="empty-state-v35">'
        '<div class="empty-state-icon-v35">\u2b06</div>'
        '\ud30c\uc77c\uc744 \uc5c5\ub85c\ub4dc\ud558\uace0 \uc2ac\ub77c\uc774\ub4dc \uc0dd\uc131 \ubc84\ud2bc\uc744 \ub20c\ub7ec\uc8fc\uc138\uc694'
        '</div>'
        '</div>',
        unsafe_allow_html=True,
    )


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Log (collapsible, after CARD 4)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
st.markdown('<div class="card-gap"></div>', unsafe_allow_html=True)

with st.expander("\ubcc0\ud658 \ub85c\uadf8", expanded=False):
    if st.session_state.log:
        for msg in st.session_state.log:
            if "WARNING" in msg:
                st.markdown(f'<span style="color:var(--warning);font-size:12px;font-family:monospace;">{msg}</span>', unsafe_allow_html=True)
            elif "ERROR" in msg or "\uc2e4\ud328" in msg:
                st.markdown(f'<span style="color:var(--error);font-size:12px;font-family:monospace;">{msg}</span>', unsafe_allow_html=True)
            else:
                st.text(msg)
    else:
        st.text("\ubcc0\ud658 \ub85c\uadf8\uac00 \uc5ec\uae30\uc5d0 \ud45c\uc2dc\ub429\ub2c8\ub2e4.")
