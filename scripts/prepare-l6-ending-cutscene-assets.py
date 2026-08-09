"""Prepare independent L6→ending review plates, portraits, and EV_* fallbacks."""

from __future__ import annotations

import hashlib
import json
from collections import deque
from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "cutscenes" / "l6-ending" / "source"
OUTPUT = ROOT / "assets" / "cutscenes" / "l6-ending"
NPC = ROOT / "assets" / "게임_이미지_모음" / "07_NPC_스프라이트" / "03_표정초상화_시트"
QUESTS = ROOT / "assets" / "quests"
C0B = ROOT / "assets" / "cutscenes" / "c0b" / "portraits"
L1_L2 = ROOT / "assets" / "cutscenes" / "l1-l2" / "portraits"

BACKGROUND_JOBS = {
    "police-registry-generated.png": "police-registry.png",
    "asherton-parlor-dawn-generated.png": "asherton-parlor-dawn.png",
    "tavern-window-generated.png": "tavern-window.png",
    "market-square-morning-generated.png": "market-square-morning.png",
    "office-clearing-fog-generated.png": "office-clearing-fog.png",
}

EXPECTED_SHEET_SHA256 = {
    "16-resident-scholar-portraits.png": "a970eb4c19b359fc2324d0e584e0a42d6626fd78ce0bfd0a62fd5e2a26f701a7",
    "18-resident-carpenter-portraits.png": "70baff88b96e3b9c6da1523c3b0f39e33601fd31fea5494196d477ad51fe632f",
    "10-drunkard-portraits.png": "a5d43be88e01fa7f5d9773acd100c192c39ed85241977336c3dd254f1d6378c1",
}

EVIDENCE_SOURCES = {
    "EV_WANTED": QUESTS / "q0-montage" / "candidates" / "128" / "target.png",
    "EV_IDEALIZED": QUESTS / "q1a-idealized" / "candidates" / "128" / "target.png",
    "EV_TRUE_FACE": QUESTS / "q2a-true-face" / "candidates" / "128" / "target.png",
    "EV_SEAL_3": QUESTS / "q3a-seal" / "candidates" / "128" / "target.png",
    "EV_LEDGER_TC": QUESTS / "q4a-ledger" / "candidates" / "128" / "target.png",
    "EV_CARRIAGE_4": QUESTS / "q5a-dock" / "candidates" / "128" / "target.png",
    "EV_CHILD_DRAWING": QUESTS / "q2c-child-room" / "candidates" / "128" / "target.png",
    "EV_TATTOO": QUESTS / "q3b-tattoo" / "candidates" / "128" / "target.png",
    "EV_CAT": QUESTS / "q2b-cat" / "candidates" / "128" / "target.png",
    "EV_RAM": QUESTS / "q4c-square-bet" / "candidates" / "128" / "target.png",
    "EV_SIREN": QUESTS / "q5b-siren" / "candidates" / "128" / "target.png",
}


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    digest.update(path.read_bytes())
    return digest.hexdigest()


def crop_ratio(image: Image.Image, ratio: float) -> Image.Image:
    width, height = image.size
    if width / height > ratio:
        crop_width = round(height * ratio)
        left = (width - crop_width) // 2
        return image.crop((left, 0, left + crop_width, height))
    crop_height = round(width / ratio)
    top = (height - crop_height) // 2
    return image.crop((0, top, width, top + crop_height))


def quantize(image: Image.Image, colors: int = 88) -> Image.Image:
    return image.convert("RGB").quantize(
        colors=colors,
        method=Image.Quantize.MEDIANCUT,
    ).convert("RGB")


def prepare_background(source_name: str, output_name: str) -> None:
    image = Image.open(SOURCE / source_name).convert("RGB")
    image = crop_ratio(image, 5 / 3)
    # Downsample first so the final scale has intentionally chunky pixel clusters.
    image = image.resize((320, 192), Image.Resampling.BOX)
    image = quantize(image, 80).resize((640, 384), Image.Resampling.NEAREST)
    image.save(OUTPUT / "backgrounds" / output_name, optimize=True)


def prepare_portrait(sheet_name: str, frame_index: int, output_name: str) -> None:
    sheet_path = NPC / sheet_name
    expected = EXPECTED_SHEET_SHA256.get(sheet_name)
    if expected and sha256(sheet_path) != expected:
        raise ValueError(f"portrait source checksum mismatch: {sheet_name}")
    sheet = Image.open(sheet_path).convert("RGBA")
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


def copy_approved_portrait(source_name: str, output_name: str) -> None:
    image = Image.open(C0B / source_name).convert("RGBA")
    image.save(OUTPUT / "portraits" / output_name, optimize=True)


def copy_l1_l2_portrait(source_name: str, output_name: str) -> None:
    image = Image.open(L1_L2 / source_name).convert("RGBA")
    image.save(OUTPUT / "portraits" / output_name, optimize=True)


def evidence_canvas() -> tuple[Image.Image, ImageDraw.ImageDraw]:
    canvas = Image.new("RGB", (336, 216), "#0d1112")
    draw = ImageDraw.Draw(canvas)
    draw.rectangle((3, 3, 332, 212), fill="#1c1815", outline="#8f6e31", width=2)
    draw.rectangle((10, 10, 325, 205), fill="#a99a7f")
    return canvas, draw


def prepare_evidence(key: str, source_path: Path) -> None:
    canvas, draw = evidence_canvas()
    if key in {"EV_SEAL_3", "EV_LEDGER_TC", "EV_CARRIAGE_4"}:
        prepare_neutral_exact_fact_fallback(key, canvas, draw)
        return
    image = Image.open(source_path).convert("RGB").resize((184, 184), Image.Resampling.NEAREST)
    canvas.paste(image, (76, 16))
    draw.line((21, 25, 21, 190), fill="#5c4935", width=2)
    draw.line((314, 25, 314, 190), fill="#5c4935", width=2)
    # The fallback is deliberately neutral; exact facts are always runtime overlays.
    draw.rectangle((72, 12, 263, 203), outline="#342a22", width=2)
    quantize(canvas, 72).save(OUTPUT / "evidence" / f"{key}.png", optimize=True)


def prepare_neutral_exact_fact_fallback(
    key: str,
    canvas: Image.Image,
    draw: ImageDraw.ImageDraw,
) -> None:
    """Draw only an object category; exact text and line counts belong to runtime overlays."""
    if key == "EV_SEAL_3":
        draw.rectangle((76, 26, 260, 194), fill="#b8aa8e", outline="#5f503e", width=3)
        draw.ellipse((117, 48, 219, 150), fill="#7c302b", outline="#4d221f", width=4)
        draw.ellipse((143, 74, 193, 124), outline="#a95849", width=3)
    elif key == "EV_LEDGER_TC":
        draw.rectangle((50, 26, 286, 190), fill="#c1b493", outline="#5f503e", width=3)
        draw.line((168, 30, 168, 186), fill="#76664d", width=2)
        for y in range(49, 176, 22):
            draw.line((61, y, 275, y), fill="#8a795b", width=2)
            draw.rectangle((72, y - 12, 132, y - 8), fill="#a59474")
            draw.rectangle((188, y - 12, 254, y - 8), fill="#a59474")
    else:
        draw.rectangle((54, 25, 282, 191), fill="#40362f", outline="#191817", width=4)
        draw.rectangle((77, 42, 259, 176), fill="#684c35", outline="#aa8151", width=3)
        draw.ellipse((91, 158, 126, 193), outline="#171515", width=5)
        draw.ellipse((220, 158, 255, 193), outline="#171515", width=5)
    quantize(canvas, 56).save(OUTPUT / "evidence" / f"{key}.png", optimize=True)


def prepare_chalk_fallback() -> None:
    canvas, draw = evidence_canvas()
    draw.rectangle((36, 22, 300, 194), fill="#26332f", outline="#526b61", width=3)
    for index in range(17):
        x = 43 + (index * 37) % 245
        y = 31 + (index * 53) % 151
        draw.point((x, y), fill="#78867d")
    draw.rectangle((45, 170, 286, 174), fill="#59645e")
    quantize(canvas, 48).save(OUTPUT / "evidence" / "EV_CARVER_CHALK_4.png", optimize=True)


def prepare_cat_sprite() -> None:
    source = Image.open(EVIDENCE_SOURCES["EV_CAT"]).convert("RGBA").crop((28, 5, 106, 123))
    pixels = source.load()
    width, height = source.size
    background: set[tuple[int, int]] = set()
    queue: deque[tuple[int, int]] = deque()
    for x in range(width):
        for y in (0, height - 1):
            background.add((x, y))
            queue.append((x, y))
    for y in range(height):
        for x in (0, width - 1):
            background.add((x, y))
            queue.append((x, y))
    # The parchment varies gradually; flood only similar neighboring colors and stop at Mist's dark outline.
    while queue:
        x, y = queue.popleft()
        red, green, blue, _ = pixels[x, y]
        for next_x, next_y in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if not (0 <= next_x < width and 0 <= next_y < height):
                continue
            if (next_x, next_y) in background:
                continue
            next_red, next_green, next_blue, _ = pixels[next_x, next_y]
            distance = (
                (next_red - red) ** 2
                + (next_green - green) ** 2
                + (next_blue - blue) ** 2
            )
            if distance < 30 ** 2:
                background.add((next_x, next_y))
                queue.append((next_x, next_y))
    for x, y in background:
        red, green, blue, _ = pixels[x, y]
        pixels[x, y] = (red, green, blue, 0)
    alpha_box = source.getchannel("A").getbbox()
    if alpha_box:
        source = source.crop(alpha_box)
    target_height = 104
    target_width = round(source.width * target_height / source.height)
    source.resize((target_width, target_height), Image.Resampling.NEAREST).save(
        OUTPUT / "sprites" / "mist-cat.png",
        optimize=True,
    )


def validate_outputs() -> dict[str, object]:
    manifest_path = OUTPUT / "cutscene-assets.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    errors: list[str] = []
    for key, relative in manifest["evidence"].items():
        path = OUTPUT / relative
        if not key.startswith("EV_"):
            errors.append(f"non-EV evidence key: {key}")
        if ".." in Path(relative).parts or path.is_symlink() or not path.is_file():
            errors.append(f"invalid evidence path: {key} -> {relative}")
        elif Image.open(path).size != (336, 216):
            errors.append(f"wrong evidence size: {key}")
    for relative in manifest["backgrounds"].values():
        path = OUTPUT / relative
        if path.is_symlink() or not path.is_file() or Image.open(path).size != (640, 384):
            errors.append(f"invalid background: {relative}")
    for relative in manifest["sprites"].values():
        path = OUTPUT / relative
        if path.is_symlink() or not path.is_file() or Image.open(path).mode != "RGBA":
            errors.append(f"invalid sprite: {relative}")
    if errors:
        raise ValueError("; ".join(errors))
    return {
        "backgrounds": len(manifest["backgrounds"]),
        "portraits": len(manifest["portraits"]),
        "evidence": len(manifest["evidence"]),
        "sprites": len(manifest["sprites"]),
        "errors": errors,
    }


def main() -> None:
    for folder in ("backgrounds", "portraits", "evidence", "sprites"):
        (OUTPUT / folder).mkdir(parents=True, exist_ok=True)

    for source_name, output_name in BACKGROUND_JOBS.items():
        prepare_background(source_name, output_name)

    copy_approved_portrait("player-calm.png", "player-calm.png")
    copy_approved_portrait("player-thinking.png", "player-thinking.png")
    copy_approved_portrait("player-ready.png", "player-ready.png")
    copy_approved_portrait("reed-calm.png", "reed-calm.png")
    copy_approved_portrait("reed-high.png", "reed-high.png")
    copy_approved_portrait("reed-tense.png", "reed-tense.png")

    portrait_jobs = (
        ("16-resident-scholar-portraits.png", 0, "julian-calm.png"),
        ("16-resident-scholar-portraits.png", 1, "julian-high.png"),
        ("16-resident-scholar-portraits.png", 3, "julian-tense.png"),
        ("18-resident-carpenter-portraits.png", 0, "carver-calm.png"),
        ("18-resident-carpenter-portraits.png", 1, "carver-high.png"),
        ("18-resident-carpenter-portraits.png", 3, "carver-tense.png"),
        ("10-drunkard-portraits.png", 0, "ram-calm.png"),
        ("10-drunkard-portraits.png", 1, "ram-high.png"),
    )
    for job in portrait_jobs:
        prepare_portrait(*job)

    for approved_name in (
        "eleanor-calm.png",
        "eleanor-high.png",
        "eleanor-tense.png",
        "cora-calm.png",
        "cora-high.png",
    ):
        copy_l1_l2_portrait(approved_name, approved_name)

    for key, source_path in EVIDENCE_SOURCES.items():
        prepare_evidence(key, source_path)
    prepare_chalk_fallback()
    prepare_cat_sprite()

    print(json.dumps(validate_outputs(), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
