"""앱 아이콘 생성 — 어두운 바탕 위의 네컷 인화지."""
from PIL import Image, ImageDraw

INK = (12, 10, 9)
PAPER = (243, 236, 228)
FRAME = (28, 24, 22)
SAFELIGHT = (255, 77, 46)


def make(size):
    s = 4  # 슈퍼샘플링
    img = Image.new("RGB", (size * s, size * s), INK)
    d = ImageDraw.Draw(img)
    S = size * s

    # 인화지: 2:3 비율로 중앙 배치
    strip_h = int(S * 0.74)
    strip_w = int(strip_h * 0.46)
    x0 = (S - strip_w) // 2
    y0 = (S - strip_h) // 2
    d.rounded_rectangle([x0, y0, x0 + strip_w, y0 + strip_h],
                        radius=int(S * 0.025), fill=PAPER)

    # 네 컷
    pad = int(strip_w * 0.12)
    gap = int(strip_h * 0.028)
    foot = int(strip_h * 0.13)          # 아래 브랜드 영역
    cell_w = strip_w - pad * 2
    cell_h = (strip_h - pad - foot - gap * 3) // 4
    for i in range(4):
        cy = y0 + pad + i * (cell_h + gap)
        d.rectangle([x0 + pad, cy, x0 + pad + cell_w, cy + cell_h], fill=FRAME)

    # 안전등 점 — 셔터가 살아 있다는 표시
    r = int(strip_w * 0.085)
    cx = x0 + strip_w // 2
    cy = y0 + strip_h - foot // 2 - int(r * 0.1)
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=SAFELIGHT)

    return img.resize((size, size), Image.Resampling.LANCZOS)


for n in (180, 512):
    make(n).save(f"/home/claude/booth/icon-{n}.png")
    print(f"icon-{n}.png")
