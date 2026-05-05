"""Regenerate PWA icons from the real Juvibox logo (logo-square.png)."""
from PIL import Image
import os

ROOT = "."
SRC = os.path.join(ROOT, "public", "logo-square.png")
OUT = os.path.join(ROOT, "public", "icons")
os.makedirs(OUT, exist_ok=True)

# Logo principal cuadrado (origen)
logo = Image.open(SRC).convert("RGBA")
print(f"Source logo: {logo.size}")

PINK = (236, 72, 153, 255)  # #ec4899

def resize(img: Image.Image, size: int) -> Image.Image:
    return img.resize((size, size), Image.LANCZOS)

def maskable(size: int) -> Image.Image:
    """Maskable icon: pink background + logo at ~78% (safe area)."""
    bg = Image.new("RGBA", (size, size), PINK)
    inner = int(size * 0.78)
    scaled = logo.resize((inner, inner), Image.LANCZOS)
    off = (size - inner) // 2
    bg.paste(scaled, (off, off), scaled)
    return bg.convert("RGBA")

def save(img: Image.Image, name: str):
    p = os.path.join(OUT, name)
    img.save(p, "PNG", optimize=True)
    print(f"  ✓ {name} ({img.size[0]}x{img.size[1]})")

print("\nRegenerating icons with real logo:")
save(resize(logo, 192), "icon-192.png")
save(resize(logo, 512), "icon-512.png")
save(resize(logo, 180), "apple-touch-icon.png")
save(resize(logo, 32),  "favicon-32.png")
save(resize(logo, 16),  "favicon-16.png")
save(maskable(192),     "icon-maskable-192.png")
save(maskable(512),     "icon-maskable-512.png")
print("Done.")
