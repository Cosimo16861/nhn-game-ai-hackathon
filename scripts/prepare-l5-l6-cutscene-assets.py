"""Prepare L5→L6 review backgrounds, Siren memory insert, and Banks portraits."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "cutscenes" / "l5-l6" / "source"
OUTPUT = ROOT / "assets" / "cutscenes" / "l5-l6"
NPC = ROOT / "assets" / "게임_이미지_모음" / "07_NPC_스프라이트" / "03_표정초상화_시트"
BANKS_SHEET = NPC / "11-homeless-portraits.png"
BANKS_SHA256 = "9b370567ccfc3debe86faf56e73b43c43760cae7aba817a0ceda4d471395c880"
EVIDENCE_NAMES = (
    "EV_WANTED.png",
    "EV_IDEALIZED.png",
    "EV_TRUE_FACE.png",
    "EV_SEAL_3.png",
    "EV_LEDGER_TC.png",
    "EV_CARRIAGE_4.png",
)


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
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


def prepare_plate(source_name: str, folder: str, output_name: str, colors: int) -> None:
    image = Image.open(SOURCE / source_name).convert("RGB")
    image = crop_ratio(image, 5 / 3)
    image = image.resize((640, 384), Image.Resampling.NEAREST)
    quantize(image, colors).save(OUTPUT / folder / output_name, optimize=True)


def prepare_portrait(frame_index: int, output_name: str) -> None:
    sheet = Image.open(BANKS_SHEET).convert("RGBA")
    frame_width = sheet.width // 4
    frame = sheet.crop((frame_width * frame_index, 0, frame_width * (frame_index + 1), sheet.height))
    alpha_box = frame.getchannel("A").getbbox()
    if alpha_box:
        frame = frame.crop(alpha_box)
    target_height = 320
    target_width = round(frame.width * target_height / frame.height)
    frame = frame.resize((target_width, target_height), Image.Resampling.NEAREST)
    frame.save(OUTPUT / "portraits" / output_name, optimize=True)


def prepare_evidence(source_name: str) -> None:
    image = Image.open(SOURCE / "evidence" / source_name).convert("RGB")
    if image.size != (336, 216):
        raise RuntimeError(f"Evidence source size mismatch for {source_name}: {image.size}")
    image.save(OUTPUT / "evidence" / source_name, optimize=True)


def main() -> None:
    actual_sha = sha256(BANKS_SHEET)
    if actual_sha != BANKS_SHA256:
        raise RuntimeError(f"Banks source hash mismatch: {actual_sha}")

    for folder in ("backgrounds", "evidence", "inserts", "portraits"):
        (OUTPUT / folder).mkdir(parents=True, exist_ok=True)

    prepare_plate(
        "police-evidence-room-generated.png",
        "backgrounds",
        "police-evidence-room-night.png",
        96,
    )
    prepare_plate(
        "office-evidence-wall-generated.png",
        "backgrounds",
        "office-evidence-wall-dawn.png",
        96,
    )
    prepare_plate(
        "siren-memory-generated.png",
        "inserts",
        "siren-night-memory.png",
        80,
    )

    for frame_index, output_name in (
        (0, "banks-calm.png"),
        (1, "banks-high.png"),
        (3, "banks-tense.png"),
    ):
        prepare_portrait(frame_index, output_name)

    for source_name in EVIDENCE_NAMES:
        prepare_evidence(source_name)

    manifest = {
        "version": 1,
        "cropRule": "portrait-crop-v1",
        "logicalSize": [640, 384],
        "dialogueBox": [152, 278, 336, 84],
        "sourceHashes": {"11-homeless-portraits.png": actual_sha},
        "backgrounds": [
            "backgrounds/police-evidence-room-night.png",
            "backgrounds/office-evidence-wall-dawn.png",
        ],
        "inserts": ["inserts/siren-night-memory.png"],
        "evidence": [f"evidence/{name}" for name in EVIDENCE_NAMES],
        "portraits": [
            "portraits/banks-calm.png",
            "portraits/banks-high.png",
            "portraits/banks-tense.png",
        ],
    }
    (OUTPUT / "cutscene-assets.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
