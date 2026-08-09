"""Prepare the generated C0B source sheets for the 640×384 game canvas."""

from pathlib import Path

import cv2
import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "cutscenes" / "c0b" / "source"
OUTPUT = ROOT / "assets" / "cutscenes" / "c0b"


def quantize_rgba(image: Image.Image, colors: int) -> Image.Image:
    """Limit generated color noise while preserving a hard alpha silhouette."""
    rgba = image.convert("RGBA")
    alpha = rgba.getchannel("A").point(lambda value: 255 if value >= 48 else 0)
    rgb = rgba.convert("RGB").quantize(colors=colors, method=Image.Quantize.MEDIANCUT)
    result = rgb.convert("RGBA")
    result.putalpha(alpha)
    return result


def keep_largest_component(image: Image.Image) -> Image.Image:
    """Remove fragments from neighbouring poses that crossed a sheet boundary."""
    rgba = np.array(image.convert("RGBA"))
    mask = (rgba[:, :, 3] >= 32).astype(np.uint8)
    count, labels, stats, _ = cv2.connectedComponentsWithStats(mask, connectivity=8)
    if count <= 1:
        return image
    largest = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
    rgba[labels != largest, 3] = 0
    return Image.fromarray(rgba, "RGBA")


def prepare_background() -> None:
    source = Image.open(SOURCE / "office-night-generated.png").convert("RGB")
    target_ratio = 5 / 3
    width, height = source.size
    crop_width = round(height * target_ratio)
    if crop_width <= width:
        left = (width - crop_width) // 2
        source = source.crop((left, 0, left + crop_width, height))
    else:
        crop_height = round(width / target_ratio)
        top = (height - crop_height) // 2
        source = source.crop((0, top, width, top + crop_height))

    # Resize once with nearest-neighbour, then reduce generated micro-colour noise.
    source = source.resize((640, 384), Image.Resampling.NEAREST)
    source = source.quantize(colors=96, method=Image.Quantize.MEDIANCUT).convert("RGB")
    source.save(OUTPUT / "backgrounds" / "office-night.png", optimize=True)


def prepare_sheet(filename: str, names: tuple[str, str, str]) -> None:
    sheet = Image.open(SOURCE / filename).convert("RGBA")
    width, height = sheet.size
    cuts = (0, width // 3, (width * 2) // 3, width)

    for index, name in enumerate(names):
        section = sheet.crop((cuts[index], 0, cuts[index + 1], height))
        section = keep_largest_component(section)
        alpha_box = section.getchannel("A").point(
            lambda value: 255 if value >= 32 else 0
        ).getbbox()
        if alpha_box is None:
            raise RuntimeError(f"No opaque pixels found for {name}")

        left, top, right, bottom = alpha_box
        pad = 12
        left = max(0, left - pad)
        top = max(0, top - pad)
        right = min(section.width, right + pad)
        bottom = min(section.height, bottom + pad)
        sprite = section.crop((left, top, right, bottom))

        target_height = 320
        target_width = max(1, round(sprite.width * target_height / sprite.height))
        sprite = sprite.resize((target_width, target_height), Image.Resampling.NEAREST)
        sprite = quantize_rgba(sprite, 64)
        sprite.save(OUTPUT / "portraits" / f"{name}.png", optimize=True)


def main() -> None:
    (OUTPUT / "backgrounds").mkdir(parents=True, exist_ok=True)
    (OUTPUT / "portraits").mkdir(parents=True, exist_ok=True)
    prepare_background()
    prepare_sheet(
        "reed-poses-alpha.png",
        ("reed-calm", "reed-tense", "reed-high"),
    )
    prepare_sheet(
        "player-poses-alpha.png",
        ("player-calm", "player-thinking", "player-ready"),
    )


if __name__ == "__main__":
    main()
