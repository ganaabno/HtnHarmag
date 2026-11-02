# /// script
# dependencies = ["pymupdf", "pillow"]
# ///
"""Reproduce source-document photography. Run: uv run scripts/extract-reference-images.py"""
from pathlib import Path
import pymupdf
from PIL import Image
from io import BytesIO

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "apps/web/public/images"
OUT.mkdir(parents=True, exist_ok=True)
report = pymupdf.open(ROOT / "assets/ХХКХХ22.pdf")
photos = {
    "berries": (0, 7),
    "fields": (2, 10),
    "gobi": (3, 15),
    "nursery": (4, 5),
    "planting": (9, 3),
    "seedlings": (1, 4),
}
for name, (page, index) in photos.items():
    image = report[page].get_images()[index]
    data = report.extract_image(image[0])["image"]
    Image.open(BytesIO(data)).convert("RGB").save(OUT / f"{name}.webp", quality=88)

brochure = pymupdf.open(ROOT / "assets/Сэргээнээ гоёо танилцуулга.pdf")
image = brochure[0].get_images()[2]
base = pymupdf.Pixmap(brochure, image[0])
pixmap = pymupdf.Pixmap(base, pymupdf.Pixmap(brochure, image[1])) if image[1] else base
pixmap.save(OUT / "sergeenee.png")
for file in (ROOT / "assets").glob("*.pdf"):
    document = pymupdf.open(file)
    (ROOT / "docs" / f"{file.stem}.txt").write_text(
        "\n".join(page.get_text() for page in document), encoding="utf-8"
    )
print("Extracted actual supplied photographs and transparent pouch artwork.")
