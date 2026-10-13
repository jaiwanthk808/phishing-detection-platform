"""Harmless test fixtures generated at runtime (no real phishing content)."""
from io import BytesIO

import qrcode
from PIL import Image, ImageDraw, ImageFont


def qr_png(text: str) -> bytes:
    img = qrcode.make(text).convert("RGB")
    img = img.resize((img.width * 4, img.height * 4))
    buf = BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def text_png(lines: list[str]) -> bytes:
    img = Image.new("RGB", (1100, 120 + 60 * len(lines)), "white")
    draw = ImageDraw.Draw(img)
    font = ImageFont.load_default(size=36)
    for i, line in enumerate(lines):
        draw.text((40, 40 + 60 * i), line, fill="black", font=font)
    buf = BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def blank_png() -> bytes:
    buf = BytesIO()
    Image.new("RGB", (300, 300), "white").save(buf, format="PNG")
    return buf.getvalue()
