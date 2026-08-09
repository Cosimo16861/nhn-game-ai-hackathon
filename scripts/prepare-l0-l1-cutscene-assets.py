"""Prepare generated L0→L1 cutscene plates for the 640×384 review player."""

from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "cutscenes" / "l0-l1" / "source"
OUTPUT = ROOT / "assets" / "cutscenes" / "l0-l1"


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


def quantize(image: Image.Image, colors: int) -> Image.Image:
    return image.convert("RGB").quantize(
        colors=colors,
        method=Image.Quantize.MEDIANCUT,
    ).convert("RGB")


def prepare_background() -> None:
    image = Image.open(SOURCE / "police-station-generated.png").convert("RGB")
    image = crop_ratio(image, 5 / 3)
    image = image.resize((640, 384), Image.Resampling.NEAREST)
    quantize(image, 96).save(
        OUTPUT / "backgrounds" / "police-station-rain.png",
        optimize=True,
    )


def prepare_insert(source_name: str, output_name: str, fit: bool = False) -> None:
    image = Image.open(SOURCE / source_name).convert("RGB")
    canvas = Image.new("RGB", (336, 216), "#0b0e0f")
    if fit:
        image.thumbnail((328, 208), Image.Resampling.NEAREST)
        left = (canvas.width - image.width) // 2
        top = (canvas.height - image.height) // 2
        canvas.paste(image, (left, top))
    else:
        image = crop_ratio(image, canvas.width / canvas.height)
        image = image.resize(canvas.size, Image.Resampling.NEAREST)
        canvas.paste(image, (0, 0))
    quantize(canvas, 80).save(OUTPUT / "inserts" / output_name, optimize=True)


def main() -> None:
    (OUTPUT / "backgrounds").mkdir(parents=True, exist_ok=True)
    (OUTPUT / "inserts").mkdir(parents=True, exist_ok=True)
    prepare_background()
    prepare_insert(
        "damaged-portrait-generated.png",
        "damaged-edmund-portrait.png",
        fit=True,
    )
    prepare_insert(
        "tavern-wall-layers-generated.png",
        "tavern-wall-layers.png",
    )


if __name__ == "__main__":
    main()
