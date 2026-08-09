"""Prepare the isolated L4→L5 cutscene review assets."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "cutscenes" / "l4-l5" / "source"
OUTPUT = ROOT / "assets" / "cutscenes" / "l4-l5"
NPC = SOURCE / "reference"

PALETTE = {
    "ink": "#111718",
    "paper": "#b7aa8b",
    "paper_dark": "#776b55",
    "gold": "#b38a42",
    "rust": "#8d4f3d",
    "teal": "#486f70",
    "storm": "#253940",
    "foam": "#9aaeb0",
}

SOURCE_HASHES = {
    "11-homeless-portraits.png": "9b370567ccfc3debe86faf56e73b43c43760cae7aba817a0ceda4d471395c880",
    "10-drunkard-portraits.png": "a5d43be88e01fa7f5d9773acd100c192c39ed85241977336c3dd254f1d6378c1",
}
SIREN_REFERENCE_HASH = "f452b170ebe54282c9e809282e0a3480a75d977c3cf8610d884969f910a62747"


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def crop_ratio(image: Image.Image, ratio: float) -> Image.Image:
    width, height = image.size
    current = width / height
    if current > ratio:
        crop_width = round(height * ratio)
        left = (width - crop_width) // 2
        return image.crop((left, 0, left + crop_width, height))
    crop_height = round(width / ratio)
    top = (height - crop_height) // 2
    return image.crop((0, top, width, top + crop_height))


def quantize(image: Image.Image, colors: int = 96) -> Image.Image:
    return image.convert("RGB").quantize(
        colors=colors,
        method=Image.Quantize.MEDIANCUT,
    ).convert("RGB")


def prepare_background(source_name: str, output_name: str) -> None:
    image = Image.open(SOURCE / source_name).convert("RGB")
    image = crop_ratio(image, 5 / 3)
    image = image.resize((640, 384), Image.Resampling.NEAREST)
    quantize(image, 104).save(OUTPUT / "backgrounds" / output_name, optimize=True)


def prepare_portrait(sheet_name: str, frame_index: int, output_name: str) -> None:
    source = NPC / sheet_name
    expected = SOURCE_HASHES[sheet_name]
    actual = sha256(source)
    if actual != expected:
        raise RuntimeError(f"portrait source hash changed: {sheet_name}: {actual}")

    sheet = Image.open(source).convert("RGBA")
    frame_width = sheet.width // 4
    frame = sheet.crop((frame_width * frame_index, 0, frame_width * (frame_index + 1), sheet.height))
    alpha_box = frame.getchannel("A").getbbox()
    if alpha_box:
        frame = frame.crop(alpha_box)
    target_height = 320
    target_width = round(frame.width * target_height / frame.height)
    frame = frame.resize((target_width, target_height), Image.Resampling.NEAREST)
    frame.save(OUTPUT / "portraits" / output_name, optimize=True)


def evidence_canvas(fill: str = "#161817") -> tuple[Image.Image, ImageDraw.ImageDraw]:
    canvas = Image.new("RGB", (336, 216), fill)
    draw = ImageDraw.Draw(canvas)
    draw.rectangle((3, 3, 332, 212), fill="#211c17", outline=PALETTE["gold"], width=2)
    return canvas, draw


def add_paper_texture(canvas: Image.Image, seed: int) -> Image.Image:
    """Add deterministic paper fibres, tide marks, and feathered ink bleed."""
    texture = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(texture)
    for index in range(96):
        x = 17 + ((index * 47 + seed * 13) % 300)
        y = 19 + ((index * 29 + seed * 7) % 178)
        length = 4 + ((index * 11 + seed) % 18)
        color = (79, 69, 52, 24 + index % 18)
        draw.line((x, y, min(320, x + length), y + (index % 3) - 1), fill=color, width=1)
    for index, box in enumerate(((7, 118, 101, 224), (251, -8, 347, 83), (104, 66, 232, 166))):
        inset = index * 5 + seed % 4
        draw.ellipse(
            (box[0] + inset, box[1] + inset, box[2] - inset, box[3] - inset),
            outline=(52, 74, 72, 52 - index * 8),
            width=2,
        )
    return Image.alpha_composite(canvas.convert("RGBA"), texture).convert("RGB")


def prepare_ledger() -> None:
    canvas, draw = evidence_canvas()
    draw.polygon(((24, 14), (312, 20), (303, 199), (18, 194)), fill=PALETTE["paper"], outline="#4c4032")
    draw.line((169, 18, 162, 197), fill="#6d604c", width=2)
    draw.line((25, 49, 307, 54), fill="#877a61", width=1)
    draw.line((22, 78, 305, 83), fill="#877a61", width=1)
    draw.line((21, 108, 304, 113), fill="#877a61", width=1)
    draw.line((20, 138, 303, 143), fill="#877a61", width=1)
    draw.line((19, 167, 301, 172), fill="#877a61", width=1)
    for row, seed in enumerate((0, 1, 2, 3, 4)):
        y = 59 + row * 30
        draw.line((39, y, 121 + seed * 6, y + 2), fill="#5b5041", width=2)
        draw.line((186, y + 1, 273 - seed * 4, y + 2), fill="#5b5041", width=2)
    # 번진 잉크의 아래층과 침수 얼룩. 판독 대상은 런타임 강조로 구분한다.
    bleed = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    bleed_draw = ImageDraw.Draw(bleed)
    for y in (59, 89, 119, 149, 179):
        bleed_draw.line((37, y, 146, y + 3), fill=(47, 42, 35, 105), width=4)
        bleed_draw.line((184, y + 1, 284, y + 4), fill=(47, 42, 35, 92), width=4)
    bleed = bleed.filter(ImageFilter.GaussianBlur(1.4))
    canvas = Image.alpha_composite(canvas.convert("RGBA"), bleed).convert("RGB")
    draw = ImageDraw.Draw(canvas)
    draw.ellipse((8, 126, 89, 215), fill="#676856", outline="#4c5a55", width=2)
    draw.ellipse((268, 0, 344, 71), fill="#77705b", outline="#5f6255", width=2)
    canvas = add_paper_texture(canvas, 17)
    quantize(canvas, 72).save(OUTPUT / "inserts" / "restored-ledger.png", optimize=True)


def prepare_carriage_memory() -> None:
    """Write five progressive placement plates; no door-count clue is present."""
    for step in range(1, 6):
        canvas, draw = evidence_canvas(PALETTE["storm"])
        if step >= 1:  # 가스등
            draw.line((281, 39, 281, 150), fill="#161b1b", width=4)
            draw.rectangle((271, 35, 291, 57), fill="#d0a050", outline="#6f572e", width=2)
            draw.rectangle((274, 39, 288, 53), fill="#e4bb67")
        if step >= 2:  # 마차
            draw.rectangle((140, 91, 265, 151), fill="#111314", outline="#445051", width=2)
            draw.polygon(((150, 88), (178, 66), (238, 66), (258, 91)), fill="#151819", outline="#445051")
            draw.ellipse((151, 140, 180, 169), fill="#0d1011", outline="#687070", width=2)
            draw.ellipse((229, 140, 258, 169), fill="#0d1011", outline="#687070", width=2)
            draw.rectangle((186, 78, 219, 94), fill="#283234")
            # 문짝 표식은 수를 셀 수 없는 단일 흐림 하나뿐이다.
            draw.ellipse((185, 99, 223, 132), outline="#6a706c", width=5)
        if step >= 3:  # 식별 불가 토마스 실루엣
            draw.ellipse((118, 91, 130, 104), fill="#111314")
            draw.polygon(((124, 101), (111, 140), (139, 140)), fill="#111314")
        if step >= 4:  # 정박선
            draw.polygon(((16, 112), (98, 112), (84, 145), (31, 145)), fill="#1b292c", outline="#62777a")
            draw.line((58, 47, 58, 112), fill="#758184", width=3)
            draw.line((58, 52, 28, 112), fill="#516266", width=1)
            draw.line((58, 52, 90, 112), fill="#516266", width=1)
        if step >= 5:  # 젖은 돌바닥 반사 — 이 단계가 끝나야 문짝 확대 가능
            for x, width in ((21, 78), (138, 122), (271, 42)):
                draw.line((x, 181, x + width, 181), fill="#607a7b", width=2)
                draw.line((x + 10, 191, x + width - 11, 191), fill="#3b5e61", width=1)
        quantize(canvas, 64).save(OUTPUT / "inserts" / f"carriage-layout-{step}.png", optimize=True)


def prepare_carriage_gate() -> None:
    canvas, draw = evidence_canvas("#101415")
    draw.rectangle((54, 14, 282, 202), fill="#171a1a", outline="#655541", width=4)
    draw.rectangle((70, 29, 266, 187), fill="#242726", outline="#3f4645", width=2)
    draw.arc((123, 45, 213, 125), 205, 335, fill="#bda65f", width=6)
    # 수를 셀 수 없는 불규칙 잔흔만 남긴다. 평행한 행이나 완성 가능한 선은 금지한다.
    fog = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    fog_draw = ImageDraw.Draw(fog)
    # 정확히 여섯 조각. 서로 교차하고 방향·높이가 달라 행/호/평행 파도로 대응할 수 없다.
    fragments = (
        ((101, 150), (126, 126), (141, 145)),
        ((135, 171), (159, 140), (183, 160), (176, 179)),
        ((190, 123), (207, 153), (231, 132)),
        ((114, 188), (147, 161), (172, 186)),
        ((211, 176), (194, 150), (241, 165)),
        ((151, 113), (171, 138), (145, 153)),
    )
    fog_draw.ellipse((84, 88, 270, 199), fill=(126, 145, 143, 18))
    for index, points in enumerate(fragments):
        fog_draw.line(points, fill=(118, 143, 141, 148 + index * 4), width=4 + index % 2, joint="curve")
    fog = fog.filter(ImageFilter.GaussianBlur(0.8))
    canvas = Image.alpha_composite(canvas.convert("RGBA"), fog).convert("RGB")
    quantize(canvas, 48).save(OUTPUT / "inserts" / "carriage-door-gate.png", optimize=True)


def prepare_journal() -> None:
    canvas, draw = evidence_canvas("#151918")
    # 뱅크스가 늘 들고 다닌 작고 기름 먹인 표지, 젖고 찢어진 종이 가장자리.
    draw.polygon(((82, 32), (261, 22), (278, 179), (244, 195), (72, 184)), fill="#3a2d22", outline="#7f6b4a", width=3)
    draw.polygon(((96, 42), (246, 35), (257, 169), (231, 183), (87, 171)), fill="#a89a79", outline="#625744", width=2)
    draw.line((170, 39, 168, 177), fill="#736650", width=2)
    for y, end in ((63, 145), (84, 149), (106, 141), (127, 151), (149, 139)):
        draw.line((106, y, end, y - 2), fill="#574c3c", width=2)
        draw.line((185, y - 4, 234, y - 7), fill="#574c3c", width=2)
    draw.polygon(((82, 137), (114, 146), (96, 178), (72, 184)), fill="#59645a")
    draw.polygon(((224, 25), (261, 22), (271, 91), (242, 78)), fill="#666755")
    draw.line((74, 184, 91, 171, 111, 184, 133, 173, 155, 185), fill="#d0c39e", width=2)
    bleed = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    bleed_draw = ImageDraw.Draw(bleed)
    for y, shift in ((63, 0), (84, 4), (106, -3), (127, 6), (149, 1)):
        bleed_draw.line((102, y + 2, 151 + shift, y), fill=(45, 41, 34, 110), width=4)
        bleed_draw.line((183, y - 2, 238 - shift, y - 6), fill=(45, 41, 34, 98), width=4)
    canvas = Image.alpha_composite(canvas.convert("RGBA"), bleed.filter(ImageFilter.GaussianBlur(1.3))).convert("RGB")
    canvas = add_paper_texture(canvas, 31)
    quantize(canvas, 64).save(OUTPUT / "inserts" / "restored-banks-journal.png", optimize=True)


def prepare_siren_memory() -> None:
    source = SOURCE / "siren-night-memory-reference.png"
    if sha256(source) != SIREN_REFERENCE_HASH:
        raise RuntimeError("siren memory reference hash changed")
    reference = Image.open(source).convert("RGB")

    def memory_finish(image: Image.Image, seed: int) -> Image.Image:
        image = ImageEnhance.Color(image).enhance(0.68)
        image = ImageEnhance.Brightness(image).enhance(0.76)
        veil = Image.new("RGBA", image.size, (0, 0, 0, 0))
        veil_draw = ImageDraw.Draw(veil)
        for index in range(7):
            x = -66 + ((index * 83 + seed * 19) % 420)
            y = 18 + ((index * 37 + seed * 11) % 170)
            veil_draw.ellipse((x, y, x + 122, y + 47), fill=(111, 137, 140, 33 + index * 3))
        # 미완성 기억의 가장자리 누락과 얼룩. 손·난간 중심은 남긴다.
        for x, y, width, height in ((0, 0, 54, 70), (282, 0, 54, 63), (0, 171, 76, 45), (292, 157, 44, 59)):
            veil_draw.rectangle((x, y, x + width, y + height), fill=(23, 35, 39, 145))
        veil = veil.filter(ImageFilter.GaussianBlur(3.2))
        return Image.alpha_composite(image.convert("RGBA"), veil).convert("RGB")

    wide = reference.resize((336, 216), Image.Resampling.NEAREST)
    quantize(memory_finish(wide, 13), 80).save(OUTPUT / "inserts" / "siren-memory.png", optimize=True)

    # 원본 전체 대비 약 1.8배 확대. 두 손과 난간이 640×384 검토 화면에서 읽히는 구도다.
    hands = reference.crop((110, 110, 470, 326)).resize((336, 216), Image.Resampling.NEAREST)
    quantize(memory_finish(hands, 29), 80).save(OUTPUT / "inserts" / "siren-hands-memory.png", optimize=True)


def prepare_ram_portrait() -> None:
    source = OUTPUT / "portraits" / "ram-high.png"
    portrait = Image.open(source).convert("RGBA").crop((76, 0, 351, 320))
    # 젊은 램: 짙은 머리, 정리된 눈밑, 현재와 다른 청록 조끼·단정한 목깃.
    pixels = portrait.load()
    for y in range(portrait.height):
        for x in range(portrait.width):
            red, green, blue, alpha = pixels[x, y]
            if alpha == 0:
                continue
            if y < 108 and max(red, green, blue) < 190:
                pixels[x, y] = (max(17, red * 34 // 100), max(14, green * 31 // 100), max(12, blue * 27 // 100), alpha)
            elif y > 183 and red > green * 1.08 and red > blue * 1.08:
                value = max(24, min(92, (red + green + blue) // 5))
                pixels[x, y] = (value * 2 // 3, value, min(112, value + 11), alpha)
    smooth = portrait.filter(ImageFilter.MedianFilter(5))
    smooth_mask = Image.new("L", portrait.size, 0)
    mask_draw = ImageDraw.Draw(smooth_mask)
    mask_draw.ellipse((77, 87, 131, 119), fill=185)
    mask_draw.ellipse((143, 84, 200, 118), fill=185)
    portrait = Image.composite(smooth, portrait, smooth_mask)
    attire = ImageDraw.Draw(portrait)
    attire.line((87, 203, 127, 229, 157, 204), fill=(174, 145, 83, 230), width=4)
    attire.line((127, 229, 128, 296), fill=(72, 103, 105, 235), width=5)
    portrait = ImageEnhance.Color(portrait).enhance(0.82)
    portrait = ImageEnhance.Brightness(portrait).enhance(1.04)
    target_height = 186
    target_width = round(portrait.width * target_height / portrait.height)
    portrait = portrait.resize((target_width, target_height), Image.Resampling.NEAREST)
    canvas, draw = evidence_canvas("#272018")
    draw.rectangle((73, 11, 263, 205), fill="#6d5b44", outline="#b38a42", width=3)
    canvas.paste(portrait, ((canvas.width - target_width) // 2, 18), portrait)
    for offset in range(0, 176, 19):
        draw.line((80 + offset, 18, 74 + offset, 197), fill="#7f6b4a", width=1)
    quantize(canvas, 72).save(OUTPUT / "inserts" / "ram-self-portrait.png", optimize=True)


def write_manifest() -> None:
    files = sorted(
        path
        for path in OUTPUT.rglob("*.png")
        if "source" not in path.parts
    )
    payload = {
        "contract": "l4-l5-review-v1",
        "logicalScreen": [640, 384],
        "dialogueBox": [152, 278, 336, 84],
        "portraitCrop": "portrait-crop-v1",
        "portraitSources": {
            "banks": {
                "path": str((NPC / "11-homeless-portraits.png").relative_to(ROOT)),
                "sha256": SOURCE_HASHES["11-homeless-portraits.png"],
                "identity": "elderly male survivor-sailor",
            },
            "ram": {
                "path": str((NPC / "10-drunkard-portraits.png").relative_to(ROOT)),
                "sha256": SOURCE_HASHES["10-drunkard-portraits.png"],
            },
        },
        "referenceSources": {
            "sirenMemory": {
                "path": str((SOURCE / "siren-night-memory-reference.png").relative_to(ROOT)),
                "sha256": SIREN_REFERENCE_HASH,
                "use": "fogged incomplete memory crop; not Q5B completion art",
            }
        },
        "files": [
            {
                "path": str(path.relative_to(ROOT)),
                "size": list(Image.open(path).size),
                "sha256": sha256(path),
            }
            for path in files
        ],
    }
    (OUTPUT / "cutscene-assets.json").write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def main() -> None:
    for folder in ("backgrounds", "portraits", "inserts"):
        (OUTPUT / folder).mkdir(parents=True, exist_ok=True)

    # v1 단일 합성판은 선행 배치가 한꺼번에 보이므로 사용·보존하지 않는다.
    (OUTPUT / "inserts" / "carriage-memory.png").unlink(missing_ok=True)

    prepare_background("police-station-ledger-generated.png", "police-station-ledger.png")
    prepare_background("foggy-dock-generated.png", "foggy-dock-night.png")
    prepare_background("square-painter-generated.png", "square-painter-evening.png")

    portrait_jobs = (
        ("11-homeless-portraits.png", 0, "banks-calm.png"),
        ("11-homeless-portraits.png", 1, "banks-high.png"),
        ("11-homeless-portraits.png", 3, "banks-tense.png"),
        ("10-drunkard-portraits.png", 0, "ram-calm.png"),
        ("10-drunkard-portraits.png", 1, "ram-high.png"),
        ("10-drunkard-portraits.png", 3, "ram-tense.png"),
    )
    for job in portrait_jobs:
        prepare_portrait(*job)

    prepare_ledger()
    prepare_carriage_memory()
    prepare_carriage_gate()
    prepare_journal()
    prepare_siren_memory()
    prepare_ram_portrait()
    write_manifest()


if __name__ == "__main__":
    main()
