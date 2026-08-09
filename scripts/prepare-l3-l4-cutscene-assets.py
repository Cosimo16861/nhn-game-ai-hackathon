"""Prepare L3→L4 review backgrounds, portraits, and evidence inserts."""

from __future__ import annotations

import hashlib
import json
import shutil
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "cutscenes" / "l3-l4" / "source"
OUTPUT = ROOT / "assets" / "cutscenes" / "l3-l4"
NPC = ROOT / "assets" / "게임_이미지_모음" / "07_NPC_스프라이트" / "03_표정초상화_시트"
QUESTS = ROOT / "assets" / "quests"
C0B = ROOT / "assets" / "cutscenes" / "c0b" / "portraits"
L0L1 = ROOT / "assets" / "cutscenes" / "l0-l1"
L1L2 = ROOT / "assets" / "cutscenes" / "l1-l2" / "portraits"

RAM_SHEET = "10-drunkard-portraits.png"
RAM_SHA256 = "a5d43be88e01fa7f5d9773acd100c192c39ed85241977336c3dd254f1d6378c1"


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


def prepare_generated_background(source_name: str, output_name: str, colors: int) -> None:
    image = Image.open(SOURCE / source_name).convert("RGB")
    image = crop_ratio(image, 5 / 3).resize((640, 384), Image.Resampling.NEAREST)
    image = ImageEnhance.Contrast(image).enhance(1.04)
    quantize(image, colors).save(OUTPUT / "backgrounds" / output_name, optimize=True)


def prepare_police_background() -> None:
    image = Image.open(L0L1 / "backgrounds" / "police-station-rain.png").convert("RGB")
    image = image.resize((640, 384), Image.Resampling.NEAREST)
    quantize(image, 96).save(OUTPUT / "backgrounds" / "police-station-evening.png", optimize=True)


def copy_portrait(source: Path, output_name: str) -> None:
    shutil.copyfile(source, OUTPUT / "portraits" / output_name)


def prepare_portrait(sheet_name: str, frame_index: int, output_name: str) -> None:
    source = NPC / sheet_name
    if sheet_name == RAM_SHEET:
        digest = hashlib.sha256(source.read_bytes()).hexdigest()
        if digest != RAM_SHA256:
            raise ValueError(f"locked Ram portrait source changed: {digest}")
    sheet = Image.open(source).convert("RGBA")
    frame_width = sheet.width // 4
    frame = sheet.crop((frame_width * frame_index, 0, frame_width * (frame_index + 1), sheet.height))
    alpha_box = frame.getchannel("A").getbbox()
    if alpha_box:
        frame = frame.crop(alpha_box)
    target_height = 320
    target_width = round(frame.width * target_height / frame.height)
    frame.resize((target_width, target_height), Image.Resampling.NEAREST).save(
        OUTPUT / "portraits" / output_name,
        optimize=True,
    )


def evidence_canvas(fill: str = "#151918") -> tuple[Image.Image, ImageDraw.ImageDraw]:
    canvas = Image.new("RGB", (336, 216), fill)
    draw = ImageDraw.Draw(canvas)
    draw.rectangle((4, 4, 331, 211), fill="#211b16", outline="#8f6e31", width=2)
    draw.rectangle((10, 10, 325, 205), fill="#191d1b")
    return canvas, draw


def draw_crest(draw: ImageDraw.ImageDraw, cx: int, cy: int, waves: int, color: str) -> None:
    draw.arc((cx - 28, cy - 42, cx + 28, cy + 14), 72, 288, fill=color, width=5)
    draw.arc((cx - 17, cy - 40, cx + 29, cy + 9), 82, 278, fill="#24211b", width=7)
    for index in range(waves):
        y = cy + 25 + index * 10
        draw.line((cx - 34, y, cx - 18, y - 5, cx, y, cx + 18, y - 5, cx + 34, y), fill=color, width=3)


def prepare_seal_comparison() -> None:
    canvas, draw = evidence_canvas()
    for left in (20, 174):
        draw.rectangle((left, 25, left + 140, 180), fill="#2a261f", outline="#6d5940", width=2)
    draw_crest(draw, 90, 85, 3, "#d8a94b")
    draw_crest(draw, 244, 85, 4, "#ddd4bb")
    draw.rectangle((26, 187, 154, 190), fill="#7c563d")
    draw.rectangle((180, 187, 308, 190), fill="#5d7c79")
    quantize(canvas, 64).save(OUTPUT / "inserts" / "seal-three-vs-chalk-four.png", optimize=True)


def prepare_unread_ledger() -> None:
    canvas, draw = evidence_canvas("#121716")
    draw.rectangle((42, 19, 294, 198), fill="#b5a681", outline="#625344", width=3)
    for x in (58, 151, 214, 279):
        draw.line((x, 35, x, 184), fill="#766a55", width=1)
    for y in range(43, 181, 17):
        draw.line((50, y, 286, y), fill="#81735a", width=1)
        for start, length in ((66, 22), (161, 16), (223, 27)):
            if (y // 17 + start) % 3:
                draw.line((start, y - 5, start + length, y - 5), fill="#514838", width=2)
    stain = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    stain_draw = ImageDraw.Draw(stain)
    for box in ((35, 13, 126, 86), (197, 29, 314, 127), (104, 126, 255, 212)):
        stain_draw.ellipse(box, fill=(45, 84, 88, 105), outline=(31, 60, 64, 130), width=4)
    stain = stain.filter(ImageFilter.GaussianBlur(4))
    canvas = Image.alpha_composite(canvas.convert("RGBA"), stain).convert("RGB")
    quantize(canvas, 64).save(OUTPUT / "inserts" / "waterlogged-ledger-unread.png", optimize=True)


def prepare_tattoo_record() -> None:
    canvas, _ = evidence_canvas()
    image = Image.open(QUESTS / "q3b-tattoo" / "candidates" / "128" / "target.png").convert("RGB")
    image = image.resize((196, 196), Image.Resampling.NEAREST)
    canvas.paste(image, (70, 10))
    quantize(canvas, 80).save(OUTPUT / "inserts" / "fresh-anchor-record.png", optimize=True)


def prepare_overpainted_portrait() -> None:
    canvas, draw = evidence_canvas()
    # The source portrait is deliberately reduced to a few surviving strokes. It must not read as a
    # completed face before Q4C, while the three contracted brush clues remain visible.
    draw.rectangle((70, 10, 266, 205), fill="#654633", outline="#3b2b24", width=3)
    for y, color, width in (
        (26, "#342a25", 24),
        (59, "#4b372d", 28),
        (96, "#2f2926", 27),
        (134, "#4a342c", 30),
        (173, "#332925", 27),
    ):
        draw.line((77, y + 9, 132, y - 5, 193, y + 12, 260, y - 2), fill=color, width=width, joint="curve")
    # Deterministic paper fibers and dry-brush bristles keep the plate tactile without adding identity.
    for index in range(84):
        x = 75 + (index * 37) % 184
        y = 14 + (index * 53) % 186
        length = 2 + index % 8
        color = "#7b5942" if index % 3 else "#3d302a"
        draw.line((x, y, min(261, x + length), y + (index % 3) - 1), fill=color, width=1)
    for y, color in ((35, "#71604b"), (68, "#2b2522"), (105, "#74543e"), (143, "#2b2522"), (182, "#6f4d3a")):
        for offset in (-6, 0, 7):
            draw.line((79, y + offset, 132, y - 8 + offset, 193, y + 7 + offset, 258, y - 4 + offset), fill=color, width=1)
    trace = "#b69a6a"
    # Crooked nose: one broken surviving stroke.
    draw.line((167, 77, 161, 100, 171, 110, 160, 117), fill=trace, width=3)
    # Unusually thick right eyebrow: short, isolated stroke only.
    draw.line((173, 72, 199, 68), fill=trace, width=5)
    # Square jaw: two corners and the lower closing stroke, not a full face contour.
    draw.line((132, 130, 139, 153, 164, 169, 198, 164, 211, 139), fill=trace, width=3)
    draw.line((140, 154, 165, 170, 197, 165), fill="#d0b47d", width=2)
    quantize(canvas, 72).save(OUTPUT / "inserts" / "overpainted-young-man.png", optimize=True)


def prepare_torn_logbook() -> None:
    canvas, draw = evidence_canvas("#101716")
    pieces = (
        ((49, 31), (83, 27), (101, 34), (145, 38), (141, 61), (133, 93), (91, 88), (72, 91), (42, 84)),
        ((174, 25), (218, 29), (237, 26), (286, 36), (281, 61), (286, 75), (278, 88), (224, 83), (205, 86), (184, 80)),
        ((62, 117), (91, 114), (111, 108), (158, 105), (160, 137), (168, 151), (168, 179), (119, 182), (98, 178), (48, 188)),
        ((186, 111), (221, 113), (247, 107), (292, 103), (293, 130), (300, 146), (300, 181), (253, 184), (225, 181), (176, 190)),
    )
    for index, polygon in enumerate(pieces):
        draw.polygon(polygon, fill="#aa9b78", outline="#40372d")
        draw.line(tuple(polygon) + (polygon[0],), fill="#d0bd91", width=1, joint="curve")
        y0 = 51 if index < 2 else 132
        for row in range(3):
            x0 = 61 if index % 2 == 0 else 195
            end = x0 + 44 + (row % 2) * 18
            # Soft bleed under a crisp surviving ink stroke.
            draw.line((x0 - 1, y0 + row * 11, end + 2, y0 + row * 11), fill="#536a64", width=4)
            draw.line((x0, y0 + row * 11, end, y0 + row * 11), fill="#33443f", width=1)
        min_x = min(point[0] for point in polygon)
        max_x = max(point[0] for point in polygon)
        min_y = min(point[1] for point in polygon)
        max_y = max(point[1] for point in polygon)
        for fiber in range(17):
            x = min_x + 7 + (fiber * 19 + index * 11) % max(8, max_x - min_x - 16)
            y = min_y + 7 + (fiber * 23 + index * 17) % max(8, max_y - min_y - 14)
            draw.line((x, y, min(max_x - 4, x + 3 + fiber % 7), y), fill="#756a53", width=1)
    # Small feathered blotches sell water and ink absorption without obscuring fragment boundaries.
    wet = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    wet_draw = ImageDraw.Draw(wet)
    for box in ((72, 42, 112, 68), (203, 43, 254, 72), (86, 139, 132, 170), (210, 132, 267, 169)):
        wet_draw.ellipse(box, fill=(42, 83, 84, 66))
    wet = wet.filter(ImageFilter.GaussianBlur(3))
    canvas = Image.alpha_composite(canvas.convert("RGBA"), wet).convert("RGB")
    # Reassert torn silhouettes after the translucent stains.
    draw = ImageDraw.Draw(canvas)
    for polygon in pieces:
        draw.line(tuple(polygon) + (polygon[0],), fill="#3f352c", width=2, joint="curve")
    quantize(canvas, 72).save(OUTPUT / "inserts" / "torn-waterlogged-logbook.png", optimize=True)


def prepare_cat() -> None:
    canvas, _ = evidence_canvas()
    image = Image.open(QUESTS / "q2b-cat" / "candidates" / "128" / "target.png").convert("RGB")
    image = image.resize((196, 196), Image.Resampling.NEAREST)
    canvas.paste(image, (70, 10))
    quantize(canvas, 80).save(OUTPUT / "inserts" / "mist-found.png", optimize=True)


def write_manifest() -> None:
    manifest = {
        "logicalSize": [640, 384],
        "dialogueBox": {"x": 152, "y": 278, "width": 336, "height": 84},
        "backgrounds": {
            "police": "backgrounds/police-station-evening.png",
            "square": "backgrounds/harbor-square-dusk.png",
            "warehouse": "backgrounds/windowless-warehouse.png",
        },
        "inserts": {
            "sealComparison": "inserts/seal-three-vs-chalk-four.png",
            "ledgerUnread": "inserts/waterlogged-ledger-unread.png",
            "tattooRecord": "inserts/fresh-anchor-record.png",
            "overpaintedPortrait": "inserts/overpainted-young-man.png",
            "tornLogbook": "inserts/torn-waterlogged-logbook.png",
            "mistFound": "inserts/mist-found.png",
        },
        "generatedSources": {
            "square": "source/harbor-square-generated.png",
            "warehouse": "source/windowless-warehouse-generated.png",
        },
        "portraitCropRule": "portrait-crop-v1",
    }
    (OUTPUT / "cutscene-assets.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def main() -> None:
    for folder in ("backgrounds", "portraits", "inserts"):
        (OUTPUT / folder).mkdir(parents=True, exist_ok=True)

    prepare_police_background()
    prepare_generated_background("harbor-square-generated.png", "harbor-square-dusk.png", 96)
    prepare_generated_background("windowless-warehouse-generated.png", "windowless-warehouse.png", 80)

    for name in ("player-calm.png", "player-thinking.png", "player-ready.png", "reed-calm.png", "reed-high.png", "reed-tense.png"):
        copy_portrait(C0B / name, name)
    for name in ("holt-calm.png", "holt-high.png", "holt-tense.png", "cora-calm.png", "cora-high.png", "cora-tense.png"):
        copy_portrait(L1L2 / name, name)
    for frame, mood in ((0, "calm"), (1, "high"), (3, "tense")):
        prepare_portrait(RAM_SHEET, frame, f"ram-{mood}.png")

    prepare_seal_comparison()
    prepare_unread_ledger()
    prepare_tattoo_record()
    prepare_overpainted_portrait()
    prepare_torn_logbook()
    prepare_cat()
    write_manifest()


if __name__ == "__main__":
    main()
