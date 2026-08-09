"""Prepare L2→L3 review cutscene plates, locked portraits, and evidence inserts."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "cutscenes" / "l2-l3" / "source"
OUTPUT = ROOT / "assets" / "cutscenes" / "l2-l3"
NPC = ROOT / "assets" / "게임_이미지_모음" / "07_NPC_스프라이트" / "03_표정초상화_시트"
QUESTS = ROOT / "assets" / "quests"
POLICE_SOURCE = ROOT / "assets" / "cutscenes" / "l0-l1" / "backgrounds" / "police-station-rain.png"
ANCHOR_REFERENCE = SOURCE / "fresh-anchor-record-reference.png"
ANCHOR_REFERENCE_SHA256 = "e748d2a1d006d79d49894929958897c7204b932955683c8b54f549eda411d0bd"

PORTRAIT_SOURCES = {
    "18-resident-carpenter-portraits.png": "70baff88b96e3b9c6da1523c3b0f39e33601fd31fea5494196d477ad51fe632f",
    "16-resident-scholar-portraits.png": "a970eb4c19b359fc2324d0e584e0a42d6626fd78ce0bfd0a62fd5e2a26f701a7",
    "13-resident-dockworker-portraits.png": "d9f5bdea4fe3b5e8a42c8f0cc0ea3446f876d556e02c219e50ba7719115c3e65",
}


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(65536), b""):
            digest.update(block)
    return digest.hexdigest()


def validate_sources() -> None:
    for filename, expected in PORTRAIT_SOURCES.items():
        actual = sha256(NPC / filename)
        if actual != expected:
            raise RuntimeError(f"portrait source changed: {filename}: {actual}")
    anchor_actual = sha256(ANCHOR_REFERENCE)
    if anchor_actual != ANCHOR_REFERENCE_SHA256:
        raise RuntimeError(f"anchor reference changed: {anchor_actual}")


def crop_ratio(image: Image.Image, ratio: float) -> Image.Image:
    width, height = image.size
    if width / height > ratio:
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


def prepare_background(source: Path, output_name: str) -> None:
    image = Image.open(source).convert("RGB")
    image = crop_ratio(image, 5 / 3).resize((640, 384), Image.Resampling.NEAREST)
    quantize(image, 96).save(OUTPUT / "backgrounds" / output_name, optimize=True)


def prepare_portrait(sheet_name: str, frame_index: int, output_name: str) -> None:
    sheet = Image.open(NPC / sheet_name).convert("RGBA")
    frame_width = sheet.width // 4
    frame = sheet.crop((frame_width * frame_index, 0, frame_width * (frame_index + 1), sheet.height))
    alpha_box = frame.getchannel("A").getbbox()
    if alpha_box:
        frame = frame.crop(alpha_box)
    target_height = 320
    target_width = round(frame.width * target_height / frame.height)
    frame = frame.resize((target_width, target_height), Image.Resampling.NEAREST)
    frame.save(OUTPUT / "portraits" / output_name, optimize=True)


def evidence_canvas(fill: str = "#171713") -> tuple[Image.Image, ImageDraw.ImageDraw]:
    canvas = Image.new("RGB", (336, 216), "#0c1011")
    draw = ImageDraw.Draw(canvas)
    draw.rectangle((4, 4, 331, 211), fill="#211b16", outline="#8f6e31", width=2)
    draw.rectangle((10, 10, 325, 205), fill=fill)
    return canvas, draw


def paste_quest_art(source: Path, output_name: str, size: int = 190) -> None:
    canvas, _ = evidence_canvas("#a99570")
    image = Image.open(source).convert("RGB").resize((size, size), Image.Resampling.NEAREST)
    left = (canvas.width - size) // 2
    top = (canvas.height - size) // 2
    canvas.paste(image, (left, top))
    quantize(canvas, 80).save(OUTPUT / "inserts" / output_name, optimize=True)


def prepare_flyer() -> None:
    canvas, draw = evidence_canvas("#c7b589")
    cat = Image.open(QUESTS / "q2b-cat" / "candidates" / "128" / "target.png").convert("RGB")
    cat = cat.resize((152, 152), Image.Resampling.NEAREST)
    canvas.paste(cat, (92, 31))
    draw.rectangle((36, 20, 300, 196), outline="#5c4631", width=3)
    draw.line((54, 43, 78, 43), fill="#73563a", width=3)
    draw.line((258, 43, 282, 43), fill="#73563a", width=3)
    for y, length in ((178, 55), (186, 79)):
        draw.line((128, y, 128 + length, y), fill="#72553b", width=2)
    quantize(canvas, 72).save(OUTPUT / "inserts" / "completed-cat-flyer.png", optimize=True)


def prepare_letter_and_wax() -> None:
    canvas, draw = evidence_canvas("#bca77f")
    draw.polygon(((45, 32), (271, 26), (291, 182), (62, 192)), fill="#d0bc92", outline="#72533b")
    for index, width in enumerate((136, 172, 154, 119, 165)):
        y = 55 + index * 20
        draw.line((82, y, 82 + width, y + (index % 2)), fill="#705d48", width=2)
    # The broken impression remains deliberately incomplete: no countable wave lines.
    draw.pieslice((194, 125, 264, 195), 205, 25, fill="#6f302b", outline="#3c1d1c", width=2)
    draw.polygon(((207, 145), (223, 131), (236, 153), (221, 173)), fill="#ad5542", outline="#4f2923")
    draw.arc((216, 139, 249, 173), 198, 316, fill="#d3926f", width=3)
    draw.line((232, 154, 245, 164), fill="#4e2924", width=3)
    quantize(canvas, 76).save(OUTPUT / "inserts" / "letter-and-broken-wax.png", optimize=True)


def prepare_anchor_wrist() -> None:
    image = Image.open(ANCHOR_REFERENCE).convert("RGB")
    if image.size != (336, 216):
        raise RuntimeError(f"invalid anchor reference size: {image.size}")
    image.save(OUTPUT / "inserts" / "fresh-anchor-wrist.png", optimize=True)


def validate_outputs() -> dict[str, dict[str, object]]:
    result: dict[str, dict[str, object]] = {}
    for folder, expected_size in (("backgrounds", (640, 384)), ("inserts", (336, 216))):
        for path in sorted((OUTPUT / folder).glob("*.png")):
            with Image.open(path) as image:
                if image.size != expected_size:
                    raise RuntimeError(f"wrong size: {path}: {image.size}")
                result[str(path.relative_to(OUTPUT))] = {"size": list(image.size), "mode": image.mode, "sha256": sha256(path)}
    for path in sorted((OUTPUT / "portraits").glob("*.png")):
        with Image.open(path) as image:
            if image.mode != "RGBA" or image.height != 320:
                raise RuntimeError(f"invalid portrait: {path}: {image.mode} {image.size}")
            result[str(path.relative_to(OUTPUT))] = {"size": list(image.size), "mode": image.mode, "sha256": sha256(path)}
    return result


def main() -> None:
    validate_sources()
    for folder in ("backgrounds", "portraits", "inserts"):
        (OUTPUT / folder).mkdir(parents=True, exist_ok=True)

    prepare_background(POLICE_SOURCE, "police-station-rain.png")
    prepare_background(SOURCE / "dock-warehouse-exterior-generated.png", "dock-warehouse-dusk.png")
    prepare_background(SOURCE / "open-child-room-generated.png", "open-child-room.png")

    for job in (
        ("18-resident-carpenter-portraits.png", 0, "carver-calm.png"),
        ("18-resident-carpenter-portraits.png", 1, "carver-high.png"),
        ("18-resident-carpenter-portraits.png", 3, "carver-tense.png"),
        ("16-resident-scholar-portraits.png", 0, "julian-calm.png"),
        ("16-resident-scholar-portraits.png", 1, "julian-high.png"),
        ("16-resident-scholar-portraits.png", 3, "julian-tense.png"),
        ("13-resident-dockworker-portraits.png", 0, "dockworker-calm.png"),
    ):
        prepare_portrait(*job)

    paste_quest_art(QUESTS / "q2a-true-face" / "candidates" / "128" / "target.png", "restored-true-face.png")
    paste_quest_art(QUESTS / "q2c-child-room" / "candidates" / "128" / "target.png", "transferred-child-drawing.png")
    prepare_flyer()
    prepare_letter_and_wax()
    prepare_anchor_wrist()

    manifest = {
        "logicalSize": [640, 384],
        "dialogueBox": {"x": 152, "y": 278, "width": 336, "height": 84},
        "cropRule": "portrait-crop-v1",
        "generatedSources": {
            "dockWarehouse": "source/dock-warehouse-exterior-generated.png",
            "openChildRoom": "source/open-child-room-generated.png",
        },
        "canonicalReferences": {
            "freshAnchorRecord": {
                "path": "source/fresh-anchor-record-reference.png",
                "sha256": ANCHOR_REFERENCE_SHA256,
            },
        },
        "assets": validate_outputs(),
        "forbiddenFactAudit": {
            "authenticSealThreeWavesPresent": False,
            "julianTaughtCarverConclusionPresent": False,
        },
    }
    (OUTPUT / "cutscene-assets.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"prepared {len(manifest['assets'])} assets")


if __name__ == "__main__":
    main()
