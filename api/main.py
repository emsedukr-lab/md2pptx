"""
FastAPI backend for MD → PPTX conversion.
Wraps the existing Python conversion pipeline.
"""
import sys
import io
import zipfile
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from config import UserSettings
from parser.md_parser import parse_markdown
from parser.html_parser import parse_html
from renderer.slide_builder import create_presentation
from utils.download import pptx_to_bytes, get_output_filename

app = FastAPI(title="MD → PPTX API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.post("/api/convert")
async def convert(
    files: list[UploadFile] = File(...),
    font_name: str = Form("Malgun Gothic"),
    title_size: int = Form(22),
    body_size: int = Form(16),
    line_spacing_multiplier: float = Form(1.5),
    code_font_separate: bool = Form(False),
):
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")

    settings = UserSettings(
        font_name=font_name,
        title_size=title_size,
        body_size=body_size,
        table_size=max(10, body_size - 2),
        code_font_separate=code_font_separate,
        line_spacing_multiplier=line_spacing_multiplier,
    )

    results: list[tuple[str, bytes]] = []

    for file in files:
        try:
            content = (await file.read()).decode("utf-8")
            filename = file.filename or "untitled.md"

            if filename.lower().endswith((".html", ".htm")):
                slides = parse_html(content)
            else:
                slides = parse_markdown(content)

            prs = create_presentation(slides, settings)
            pptx_bytes = pptx_to_bytes(prs)
            out_name = get_output_filename(filename)
            results.append((out_name, pptx_bytes))
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error converting {file.filename}: {str(e)}")

    if len(results) == 1:
        name, data = results[0]
        return StreamingResponse(
            io.BytesIO(data),
            media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
            headers={"Content-Disposition": f'attachment; filename="{name}"'},
        )
    else:
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
            for name, data in results:
                zf.writestr(name, data)
        zip_buffer.seek(0)
        return StreamingResponse(
            zip_buffer,
            media_type="application/zip",
            headers={"Content-Disposition": 'attachment; filename="converted.zip"'},
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
