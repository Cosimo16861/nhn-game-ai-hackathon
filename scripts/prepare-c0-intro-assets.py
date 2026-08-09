"""Prepare generated C0 intro inserts for the 640×384 cutscene runtime."""

from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "cutscenes" / "c0-intro" / "source"
OUTPUT = ROOT / "assets" / "cutscenes" / "c0-intro" / "inserts"
BACKGROUNDS = ROOT / "assets" / "cutscenes" / "c0-intro" / "backgrounds"


def prepare(source_name: str, output_name: str) -> None:
    image = Image.open(SOURCE / source_name).convert("RGB")
    target_ratio = 5 / 3
    width, height = image.size
    crop_width = round(height * target_ratio)
    if crop_width <= width:
        left = (width - crop_width) // 2
        image = image.crop((left, 0, left + crop_width, height))
    else:
        crop_height = round(width / target_ratio)
        top = (height - crop_height) // 2
        image = image.crop((0, top, width, top + crop_height))
    image = image.resize((336, 216), Image.Resampling.NEAREST)
    image = image.quantize(colors=96, method=Image.Quantize.MEDIANCUT).convert("RGB")
    image.save(OUTPUT / output_name, optimize=True)


def prepare_background(source_name: str, output_name: str) -> None:
    image = Image.open(SOURCE / source_name).convert("RGB")
    target_ratio = 5 / 3
    width, height = image.size
    crop_width = round(height * target_ratio)
    left = max(0, (width - crop_width) // 2)
    image = image.crop((left, 0, min(width, left + crop_width), height))
    image = image.resize((640, 384), Image.Resampling.NEAREST)
    image = image.quantize(colors=128, method=Image.Quantize.MEDIANCUT).convert("RGB")
    image.save(BACKGROUNDS / output_name, optimize=True)


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    BACKGROUNDS.mkdir(parents=True, exist_ok=True)
    prepare("client-memory-triptych-generated.png", "client-memory-triptych.png")
    prepare("wrong-face-consequence-generated.png", "wrong-face-consequence.png")
    prepare_background("office-closed-door-generated.png", "office-closed-door.png")


if __name__ == "__main__":
    main()
