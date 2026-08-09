"""Prepare L1→L2 review cutscene plates, portraits, and evidence inserts."""

from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "cutscenes" / "l1-l2" / "source"
OUTPUT = ROOT / "assets" / "cutscenes" / "l1-l2"
NPC = ROOT / "assets" / "게임_이미지_모음" / "07_NPC_스프라이트" / "03_표정초상화_시트"
QUESTS = ROOT / "assets" / "quests"


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
    quantize(image).save(OUTPUT / "backgrounds" / output_name, optimize=True)


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


def evidence_canvas() -> tuple[Image.Image, ImageDraw.ImageDraw]:
    canvas = Image.new("RGB", (336, 216), "#101312")
    draw = ImageDraw.Draw(canvas)
    draw.rectangle((4, 4, 331, 211), fill="#211b16", outline="#8f6e31", width=2)
    draw.rectangle((10, 10, 325, 205), fill="#b7a98b")
    return canvas, draw


def prepare_quest_insert(source_path: Path, output_name: str, size: int) -> None:
    canvas, _ = evidence_canvas()
    image = Image.open(source_path).convert("RGB").resize((size, size), Image.Resampling.NEAREST)
    left = (canvas.width - size) // 2
    top = (canvas.height - size) // 2
    canvas.paste(image, (left, top))
    quantize(canvas, 80).save(OUTPUT / "inserts" / output_name, optimize=True)


def prepare_wet_traces() -> None:
    canvas, draw = evidence_canvas()
    image = Image.open(
        QUESTS / "q2c-child-room" / "candidates" / "128" / "initial.png"
    ).convert("RGB").resize((196, 196), Image.Resampling.NEAREST)
    canvas.paste(image, (70, 10))
    # 아직 복원 전이므로 물번짐·회벽 조각으로 핵심 선의 절반 이상을 가린다.
    veil = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    veil_draw = ImageDraw.Draw(veil)
    for x, y, width, height in (
        (74, 18, 46, 176),
        (145, 9, 31, 112),
        (203, 54, 58, 145),
        (116, 138, 104, 39),
    ):
        veil_draw.rectangle((x, y, x + width, y + height), fill=(73, 80, 71, 205))
    for offset in range(0, 190, 17):
        veil_draw.line((72 + offset, 13, 92 + offset, 204), fill=(90, 106, 104, 120), width=3)
    canvas = Image.alpha_composite(canvas.convert("RGBA"), veil).convert("RGB")
    quantize(canvas, 72).save(OUTPUT / "inserts" / "wet-child-wall-traces.png", optimize=True)


def main() -> None:
    for folder in ("backgrounds", "portraits", "inserts"):
        (OUTPUT / folder).mkdir(parents=True, exist_ok=True)

    prepare_background("asherton-parlor-generated.png", "asherton-parlor-rain.png")
    prepare_background("asherton-west-hall-generated.png", "asherton-west-hall-rain.png")
    prepare_background("school-generated.png", "school-after-rain.png")
    prepare_background("tavern-generated.png", "tavern-evening.png")

    portrait_jobs = (
        ("19-resident-widow-portraits.png", 0, "eleanor-calm.png"),
        ("19-resident-widow-portraits.png", 2, "eleanor-tense.png"),
        ("19-resident-widow-portraits.png", 1, "eleanor-high.png"),
        ("14-resident-laundress-portraits.png", 3, "beth-tense.png"),
        ("04-teacher-portraits.png", 0, "holt-calm.png"),
        ("04-teacher-portraits.png", 3, "holt-tense.png"),
        ("04-teacher-portraits.png", 1, "holt-high.png"),
        ("05-merchant-portraits.png", 0, "cora-calm.png"),
        ("05-merchant-portraits.png", 3, "cora-tense.png"),
        ("05-merchant-portraits.png", 1, "cora-high.png"),
    )
    for job in portrait_jobs:
        prepare_portrait(*job)

    prepare_quest_insert(
        QUESTS / "q1a-idealized" / "candidates" / "128" / "target.png",
        "restored-idealized-portrait.png",
        196,
    )
    prepare_quest_insert(
        QUESTS / "q1b-tavern-wall" / "candidates" / "128" / "target.png",
        "restored-ferry-wall.png",
        196,
    )
    prepare_quest_insert(
        QUESTS / "q2b-cat" / "candidates" / "64" / "target.png",
        "cora-cat-memory.png",
        192,
    )
    prepare_wet_traces()


if __name__ == "__main__":
    main()
