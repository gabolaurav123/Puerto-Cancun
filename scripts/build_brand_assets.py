from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "puerto-cancun-logo-exact.png"


def fitted_symbol(size: int, padding_ratio: float = 0.08) -> Image.Image:
    source = Image.open(SOURCE).convert("RGBA")
    alpha = source.getchannel("A")
    visible_alpha = alpha.point(lambda value: 255 if value >= 48 else 0)
    bbox = visible_alpha.getbbox()
    if not bbox:
        raise RuntimeError("The logo source has no visible pixels")
    source = source.crop(bbox)
    padding = round(size * padding_ratio)
    target = size - (padding * 2)
    scale = min(target / source.width, target / source.height)
    source = source.resize(
        (max(1, round(source.width * scale)), max(1, round(source.height * scale))),
        Image.Resampling.LANCZOS,
    )
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    canvas.alpha_composite(source, ((size - source.width) // 2, (size - source.height) // 2))
    return canvas


def save_icons() -> None:
    fitted_symbol(640, 0.04).save(ROOT / "assets" / "puerto-cancun-logo.png", optimize=True)
    fitted_symbol(512).save(ROOT / "icon-512.png", optimize=True)
    fitted_symbol(192).save(ROOT / "icon-192.png", optimize=True)
    fitted_symbol(180).save(ROOT / "apple-touch-icon.png", optimize=True)
    fitted_symbol(48, 0.05).save(ROOT / "favicon.png", optimize=True)


def load_font(size: int) -> ImageFont.FreeTypeFont:
    candidates = [
        Path("C:/Windows/Fonts/georgiab.ttf"),
        Path("C:/Windows/Fonts/Georgia.ttf"),
    ]
    for candidate in candidates:
        if candidate.exists():
            return ImageFont.truetype(str(candidate), size=size)
    return ImageFont.load_default()


def save_social_card() -> None:
    width, height = 1200, 630
    card = Image.new("RGB", (width, height), "#07131b")
    draw = ImageDraw.Draw(card)
    draw.rectangle((28, 28, width - 28, height - 28), outline="#b98a32", width=2)
    symbol = fitted_symbol(470, 0.02)
    card.paste(symbol, (62, 80), symbol)
    font = load_font(58)
    draw.multiline_text((520, 205), "PUERTO\nCANCÚN CENTER", font=font, fill="#e7c76c", spacing=5)
    draw.line((525, 395, 1090, 395), fill="#b98a32", width=2)
    draw.text((525, 425), "BIENES RAÍCES EN CANCÚN", font=load_font(24), fill="#f7f3e9")
    card.save(ROOT / "assets" / "og-puerto-cancun-center.webp", "WEBP", quality=90, method=6)


if __name__ == "__main__":
    save_icons()
    save_social_card()
