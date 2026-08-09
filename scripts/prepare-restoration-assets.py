#!/usr/bin/env python3
"""Build 64/128 restoration quest candidates from the 14 source images.

The outputs are deterministic production candidates, not final selected gameplay
assets.  Every resolution receives the same normalized semantic regions, exact
story-critical text/symbol overlays, closed linework, and binary gameplay masks.
"""

from __future__ import annotations

import argparse
import json
import math
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont, ImageOps


ROOT = Path(__file__).resolve().parents[1]
QUEST_ROOT = ROOT / "assets" / "quests"
FONT_PATH = ROOT / "fonts" / "나눔손글씨 강부장님체.ttf"
RESOLUTIONS = (64, 128)


@dataclass(frozen=True)
class QuestSpec:
    quest_id: str
    slug: str
    title: str
    category: str
    selected_resolution: int
    restore_range: tuple[float, float]
    restore_shapes: tuple[dict[str, Any], ...]
    exclude_shapes: tuple[dict[str, Any], ...]
    corrections: tuple[str, ...] = ()


def rect(x0: float, y0: float, x1: float, y1: float) -> dict[str, Any]:
    return {"kind": "rect", "box": (x0, y0, x1, y1)}


def ellipse(x0: float, y0: float, x1: float, y1: float) -> dict[str, Any]:
    return {"kind": "ellipse", "box": (x0, y0, x1, y1)}


def polygon(*points: tuple[float, float]) -> dict[str, Any]:
    return {"kind": "polygon", "points": points}


QUESTS: tuple[QuestSpec, ...] = (
    QuestSpec(
        "Q0_MONTAGE", "q0-montage", "골목의 손", "P", 64, (0.32, 0.38),
        (
            polygon((0.08, 0.12), (0.91, 0.12), (0.84, 0.39), (0.17, 0.39)),
            ellipse(0.31, 0.31, 0.70, 0.66),
            polygon((0.22, 0.58), (0.78, 0.58), (0.72, 0.90), (0.29, 0.91)),
        ),
        (rect(0.00, 0.00, 0.05, 1.00), rect(0.95, 0.00, 1.00, 1.00)),
    ),
    QuestSpec(
        "Q1A_IDEALIZED", "q1a-idealized", "미화된 초상", "P", 128, (0.30, 0.36),
        (
            ellipse(0.28, 0.18, 0.73, 0.67),
            ellipse(0.23, 0.02, 0.78, 0.43),
            polygon((0.00, 0.02), (0.24, 0.02), (0.24, 0.83), (0.00, 0.83)),
            polygon((0.24, 0.62), (0.78, 0.62), (0.88, 1.00), (0.14, 1.00)),
        ),
        (rect(0.82, 0.00, 1.00, 0.55), rect(0.00, 0.86, 0.10, 1.00)),
    ),
    QuestSpec(
        "Q1B_TAVERN_WALL", "q1b-tavern-wall", "선술집 벽", "P", 128, (0.25, 0.31),
        (
            ellipse(0.27, 0.14, 0.74, 0.83),
            polygon((0.31, 0.59), (0.69, 0.59), (0.75, 0.91), (0.25, 0.91)),
        ),
        (rect(0.00, 0.00, 1.00, 0.10), rect(0.00, 0.88, 1.00, 1.00)),
    ),
    QuestSpec(
        "Q2A_TRUE_FACE", "q2a-true-face", "기억되지 않은 얼굴", "P", 128, (0.35, 0.41),
        (
            ellipse(0.27, 0.17, 0.74, 0.70),
            ellipse(0.22, 0.02, 0.79, 0.43),
            polygon((0.22, 0.64), (0.79, 0.64), (0.90, 1.00), (0.12, 1.00)),
        ),
        (rect(0.00, 0.00, 0.16, 0.80), rect(0.86, 0.00, 1.00, 0.58)),
    ),
    QuestSpec(
        "Q2B_CAT", "q2b-cat", "안개를 찾습니다", "P", 64, (0.30, 0.36),
        (
            ellipse(0.26, 0.17, 0.76, 0.84),
            polygon((0.27, 0.09), (0.43, 0.31), (0.24, 0.32)),
            polygon((0.58, 0.09), (0.75, 0.31), (0.56, 0.31)),
            ellipse(0.55, 0.60, 0.85, 0.87),
        ),
        (rect(0.00, 0.00, 1.00, 0.08), rect(0.00, 0.91, 1.00, 1.00)),
    ),
    QuestSpec(
        "Q2C_CHILD_ROOM", "q2c-child-room", "닫힌 방", "D", 128, (0.25, 0.31),
        (
            polygon((0.30, 0.20), (0.69, 0.20), (0.76, 0.48), (0.23, 0.48)),
            rect(0.27, 0.48, 0.75, 0.77),
            rect(0.36, 0.75, 0.65, 0.91),
        ),
        (rect(0.00, 0.00, 0.12, 1.00), rect(0.88, 0.00, 1.00, 1.00)),
        ("text-uri",),
    ),
    QuestSpec(
        "Q3A_SEAL", "q3a-seal", "봉인의 세 줄", "D", 128, (0.20, 0.26),
        (
            ellipse(0.20, 0.13, 0.80, 0.87),
            rect(0.31, 0.27, 0.69, 0.76),
        ),
        (rect(0.00, 0.00, 1.00, 0.09), rect(0.00, 0.92, 1.00, 1.00)),
        ("crest-main-3",),
    ),
    QuestSpec(
        "Q3B_TATTOO", "q3b-tattoo", "너무 새것인 닻", "P", 64, (0.15, 0.21),
        (
            polygon((0.32, 0.27), (0.62, 0.18), (0.87, 0.70), (0.53, 0.88)),
            ellipse(0.41, 0.33, 0.73, 0.70),
        ),
        (rect(0.00, 0.00, 0.22, 1.00), rect(0.90, 0.00, 1.00, 1.00)),
        ("anchor-old",),
    ),
    QuestSpec(
        "Q3C_WAREHOUSE", "q3c-warehouse", "창고의 불빛", "X", 128, (0.30, 0.36),
        (
            polygon((0.03, 0.32), (0.48, 0.18), (0.94, 0.24), (0.97, 0.90), (0.05, 0.94)),
            ellipse(0.34, 0.51, 0.75, 0.93),
        ),
        (rect(0.00, 0.00, 1.00, 0.16), rect(0.00, 0.00, 0.04, 1.00), rect(0.96, 0.00, 1.00, 1.00)),
    ),
    QuestSpec(
        "Q4A_LEDGER", "q4a-ledger", "번진 장부", "D", 128, (0.20, 0.26),
        (
            rect(0.18, 0.11, 0.90, 0.27),
            rect(0.47, 0.27, 0.91, 0.76),
            rect(0.16, 0.63, 0.91, 0.73),
            rect(0.50, 0.79, 0.86, 0.91),
        ),
        (rect(0.00, 0.00, 1.00, 0.07), rect(0.00, 0.94, 1.00, 1.00), rect(0.00, 0.00, 0.09, 1.00)),
        ("ledger-text",),
    ),
    QuestSpec(
        "Q4B_LOGBOOK", "q4b-logbook", "잃어버린 항해일지", "D", 128, (0.20, 0.26),
        (
            ellipse(0.08, 0.07, 0.47, 0.39),
            ellipse(0.51, 0.04, 0.93, 0.38),
            ellipse(0.31, 0.31, 0.70, 0.66),
            ellipse(0.03, 0.56, 0.47, 0.92),
            ellipse(0.52, 0.56, 0.96, 0.95),
        ),
        (rect(0.00, 0.00, 0.04, 1.00), rect(0.96, 0.00, 1.00, 1.00)),
        ("logbook-text",),
    ),
    QuestSpec(
        "Q4C_SQUARE_BET", "q4c-square-bet", "광장의 내기", "P", 64, (0.25, 0.31),
        (
            ellipse(0.26, 0.15, 0.74, 0.77),
            polygon((0.27, 0.61), (0.73, 0.61), (0.82, 0.95), (0.18, 0.95)),
        ),
        (rect(0.00, 0.00, 0.10, 1.00), rect(0.90, 0.00, 1.00, 1.00)),
    ),
    QuestSpec(
        "Q5A_DOCK", "q5a-dock", "안개 낀 부두", "S", 128, (0.30, 0.36),
        (
            rect(0.29, 0.28, 0.73, 0.74),
            polygon((0.00, 0.08), (0.36, 0.08), (0.34, 0.82), (0.00, 0.82)),
            polygon((0.66, 0.10), (0.99, 0.08), (0.99, 0.73), (0.65, 0.69)),
            polygon((0.06, 0.64), (0.94, 0.64), (1.00, 1.00), (0.00, 1.00)),
        ),
        (rect(0.00, 0.00, 1.00, 0.07), rect(0.00, 0.95, 1.00, 1.00)),
        ("crest-branch-4",),
    ),
    QuestSpec(
        "Q5B_SIREN", "q5b-siren", "세이렌 호의 밤", "S", 128, (0.25, 0.31),
        (
            polygon((0.12, 0.11), (0.87, 0.01), (0.98, 0.69), (0.31, 0.94)),
            polygon((0.02, 0.50), (0.99, 0.25), (0.99, 0.91), (0.00, 1.00)),
            ellipse(0.14, 0.55, 0.48, 0.91),
        ),
        (rect(0.00, 0.00, 1.00, 0.06), rect(0.94, 0.00, 1.00, 1.00)),
    ),
)


def normalized_box(box: Iterable[float], size: int) -> tuple[int, int, int, int]:
    x0, y0, x1, y1 = box
    return (
        max(0, min(size - 1, round(x0 * (size - 1)))),
        max(0, min(size - 1, round(y0 * (size - 1)))),
        max(0, min(size - 1, round(x1 * (size - 1)))),
        max(0, min(size - 1, round(y1 * (size - 1)))),
    )


def rasterize_shapes(shapes: Iterable[dict[str, Any]], size: int) -> np.ndarray:
    canvas = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(canvas)
    for shape in shapes:
        if shape["kind"] == "rect":
            draw.rectangle(normalized_box(shape["box"], size), fill=255)
        elif shape["kind"] == "ellipse":
            draw.ellipse(normalized_box(shape["box"], size), fill=255)
        elif shape["kind"] == "polygon":
            points = [
                (round(x * (size - 1)), round(y * (size - 1)))
                for x, y in shape["points"]
            ]
            draw.polygon(points, fill=255)
        else:
            raise ValueError(f"Unknown shape kind: {shape['kind']}")
    return np.asarray(canvas, dtype=np.uint8) > 0


def fit_mask_area(mask: np.ndarray, target_count: int, forbidden: np.ndarray) -> np.ndarray:
    """Grow or erode a semantic mask to an exact area while preserving its shape."""
    result = mask.copy() & ~forbidden
    allowed = ~forbidden
    target_count = max(1, min(int(target_count), int(allowed.sum())))
    current = int(result.sum())
    if current == target_count:
        return result

    if current < target_count:
        outside = (~result & allowed).astype(np.uint8)
        distance = cv2.distanceTransform(outside, cv2.DIST_L2, 5)
        ys, xs = np.where(outside > 0)
        order = np.argsort(distance[ys, xs], kind="stable")
        take = min(target_count - current, len(order))
        result[ys[order[:take]], xs[order[:take]]] = True
    else:
        inside = result.astype(np.uint8)
        distance = cv2.distanceTransform(inside, cv2.DIST_L2, 5)
        ys, xs = np.where(inside > 0)
        order = np.argsort(distance[ys, xs], kind="stable")
        take = min(current - target_count, len(order) - 1)
        result[ys[order[:take]], xs[order[:take]]] = False
    return result


def quantize_source(source: Image.Image, size: int) -> Image.Image:
    palette_size = {64: 16, 128: 24}[size]
    source = ImageOps.fit(source.convert("RGB"), (size, size), Image.Resampling.LANCZOS)
    source = ImageEnhance.Contrast(source).enhance(1.06)
    source = ImageEnhance.Color(source).enhance(0.94)
    if size == 64:
        source = source.filter(ImageFilter.MedianFilter(3))
    quantized = source.quantize(
        colors=palette_size,
        method=Image.Quantize.MEDIANCUT,
        dither=Image.Dither.NONE,
    )
    return quantized.convert("RGB")


def load_font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    try:
        return ImageFont.truetype(str(FONT_PATH), max(5, size))
    except OSError:
        return ImageFont.load_default()


def draw_pixel_text(
    image: Image.Image,
    position: tuple[float, float],
    text: str,
    font_ratio: float,
    fill: tuple[int, int, int],
    anchor: str = "mm",
    background: tuple[int, int, int] | None = None,
    box: tuple[float, float, float, float] | None = None,
) -> None:
    size = image.width
    if box and background:
        ImageDraw.Draw(image).rectangle(normalized_box(box, size), fill=background)
    font = load_font(round(size * font_ratio))
    mask = Image.new("L", image.size, 0)
    draw = ImageDraw.Draw(mask)
    xy = (round(position[0] * size), round(position[1] * size))
    draw.text(xy, text, font=font, fill=255, anchor=anchor, stroke_width=0)
    mask = mask.point(lambda p: 255 if p >= 96 else 0, mode="1").convert("L")
    ink = Image.new("RGB", image.size, fill)
    image.paste(ink, mask=mask)


def draw_bitmap_text(
    image: Image.Image,
    box: tuple[float, float, float, float],
    glyphs: tuple[tuple[str, ...], ...],
    fill: tuple[int, int, int],
    background: tuple[int, int, int],
    gap: int = 1,
) -> None:
    """Draw exact integer-grid glyphs without font rasterization."""
    size = image.width
    x0, y0, x1, y1 = normalized_box(box, size)
    ImageDraw.Draw(image).rectangle((x0, y0, x1, y1), fill=background)
    glyph_widths = [len(rows[0]) for rows in glyphs]
    rows = max(len(pattern) for pattern in glyphs)
    columns = sum(glyph_widths) + gap * (len(glyphs) - 1)
    scale = max(1, min((x1 - x0 + 1) // columns, (y1 - y0 + 1) // rows))
    rendered_width = columns * scale
    rendered_height = rows * scale
    cursor_x = x0 + max(0, (x1 - x0 + 1 - rendered_width) // 2)
    origin_y = y0 + max(0, (y1 - y0 + 1 - rendered_height) // 2)
    draw = ImageDraw.Draw(image)
    for pattern, glyph_width in zip(glyphs, glyph_widths):
        for row, bits in enumerate(pattern):
            for column, bit in enumerate(bits):
                if bit == "1":
                    px = cursor_x + column * scale
                    py = origin_y + row * scale
                    draw.rectangle((px, py, px + scale - 1, py + scale - 1), fill=fill)
        cursor_x += (glyph_width + gap) * scale


URI_GLYPHS: tuple[tuple[str, ...], ...] = (
    (
        "0111000",
        "1000100",
        "1000100",
        "0111000",
        "0000000",
        "1111110",
        "0010000",
        "0010000",
        "0000000",
    ),
    (
        "1111101",
        "0000101",
        "1111101",
        "1000001",
        "1111101",
        "0000001",
        "0000001",
        "0000001",
        "0000000",
    ),
)


ASCII_5X7: dict[str, tuple[str, ...]] = {
    "T": ("11111", "00100", "00100", "00100", "00100", "00100", "00100"),
    "C": ("01111", "10000", "10000", "10000", "10000", "10000", "01111"),
    "X": ("10001", "01010", "00100", "00100", "00100", "01010", "10001"),
    "4": ("00110", "01010", "10010", "11111", "00010", "00010", "00010"),
    ".": ("00000", "00000", "00000", "00000", "00000", "00110", "00110"),
}


def draw_crest(
    image: Image.Image,
    box: tuple[float, float, float, float],
    waves: int,
    panel: bool = True,
) -> None:
    size = image.width
    x0, y0, x1, y1 = normalized_box(box, size)
    width = max(1, x1 - x0)
    height = max(1, y1 - y0)
    line_width = max(1, round(size / 128))
    gold = (205, 151, 78)
    dark = (74, 24, 25) if waves == 3 else (21, 31, 31)
    draw = ImageDraw.Draw(image)
    if panel:
        draw.rounded_rectangle((x0, y0, x1, y1), radius=max(1, width // 9), fill=dark, outline=gold, width=line_width)
    else:
        draw.ellipse((x0, y0, x1, y1), fill=dark, outline=gold, width=line_width)

    cx = x0 + width // 2
    moon_top = y0 + round(height * 0.10)
    moon_bottom = y0 + round(height * 0.43)
    moon_w = max(4, round(width * 0.30))
    moon_box = (cx - moon_w // 2, moon_top, cx + moon_w // 2, moon_bottom)
    draw.ellipse(moon_box, fill=gold)
    shift = max(1, round(moon_w * 0.30))
    inner = (moon_box[0] + shift, moon_box[1], moon_box[2] + shift, moon_box[3])
    draw.ellipse(inner, fill=dark)

    wave_top = y0 + round(height * 0.53)
    wave_gap = max(2, round(height * 0.10))
    left = x0 + round(width * 0.17)
    right = x1 - round(width * 0.17)
    amplitude = max(1, round(height * 0.025))
    for row in range(waves):
        y = wave_top + row * wave_gap
        points: list[tuple[int, int]] = []
        segments = 6
        for i in range(segments + 1):
            x = round(left + (right - left) * i / segments)
            offset = -amplitude if i % 2 == 0 else amplitude
            points.append((x, y + offset))
        draw.line(points, fill=gold, width=line_width, joint="curve")


def draw_anchor(
    image: Image.Image,
    box: tuple[float, float, float, float],
    inflammation: bool = False,
) -> None:
    size = image.width
    x0, y0, x1, y1 = normalized_box(box, size)
    width = max(1, x1 - x0)
    height = max(1, y1 - y0)
    ink = (29, 48, 58)
    red = (167, 68, 61)
    lw = max(1, round(size / 96))
    if inflammation:
        inflammation_draw = ImageDraw.Draw(image)
        inflammation_draw.ellipse((x0, y0, x1, y1), outline=red, width=max(1, lw))
        step = max(3, round(size / 28))
        cx = (x0 + x1) / 2
        cy = (y0 + y1) / 2
        rx = max(1.0, (x1 - x0) / 2)
        ry = max(1.0, (y1 - y0) / 2)
        for y in range(y0 + 1, y1, step):
            for x in range(x0 + 1, x1, step):
                if ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 0.86:
                    inflammation_draw.point((x, y), fill=red)
    draw = ImageDraw.Draw(image)
    cx = (x0 + x1) // 2
    top = y0 + round(height * 0.13)
    bottom = y0 + round(height * 0.76)
    ring = max(2, round(width * 0.13))
    draw.ellipse((cx - ring, top - ring, cx + ring, top + ring), outline=ink, width=lw)
    draw.line((cx, top + ring, cx, bottom), fill=ink, width=lw)
    arm_y = y0 + round(height * 0.42)
    draw.line((x0 + round(width * 0.25), arm_y, x1 - round(width * 0.25), arm_y), fill=ink, width=lw)
    draw.arc((x0 + round(width * 0.12), y0 + round(height * 0.40), x1 - round(width * 0.12), y1 - round(height * 0.07)), 15, 165, fill=ink, width=lw)
    draw.polygon(((x0 + round(width * 0.14), bottom), (x0 + round(width * 0.31), bottom - lw), (x0 + round(width * 0.20), bottom - round(height * 0.13))), fill=ink)
    draw.polygon(((x1 - round(width * 0.14), bottom), (x1 - round(width * 0.31), bottom - lw), (x1 - round(width * 0.20), bottom - round(height * 0.13))), fill=ink)


def apply_corrections(image: Image.Image, spec: QuestSpec) -> dict[str, Any]:
    applied: list[str] = []
    for correction in spec.corrections:
        if correction == "text-uri":
            draw_bitmap_text(
                image, (0.36, 0.74, 0.64, 0.90), URI_GLYPHS,
                fill=(103, 55, 46), background=(211, 185, 135),
            )
            applied.append("우리")
        elif correction == "crest-main-3":
            draw_crest(image, (0.27, 0.18, 0.73, 0.81), 3, panel=False)
            applied.append("SYM_CREST_MAIN_3")
        elif correction == "anchor-old":
            draw_anchor(image, (0.40, 0.31, 0.73, 0.72), inflammation=True)
            applied.append("SYM_ANCHOR_OLD")
        elif correction == "ledger-text":
            paper = (188, 168, 123)
            ink = (54, 54, 49)
            draw_pixel_text(image, (0.68, 0.855), "J. ASHERTON", 0.038, ink, background=paper, box=(0.51, 0.80, 0.86, 0.90))
            tc_text = "T.C." if image.width == 64 else "T.C.X4"
            draw_bitmap_text(
                image,
                (0.53, 0.62, 0.91, 0.74),
                tuple(ASCII_5X7[char] for char in tc_text),
                fill=ink,
                background=(158, 169, 157),
            )
            applied.extend(("J. ASHERTON", "T.C. 4 MONTHS"))
        elif correction == "logbook-text":
            ink = (67, 59, 52)
            paper = (190, 173, 132)
            entries = (
                ((0.27, 0.22), "자정", (0.12, 0.16, 0.42, 0.27)),
                ((0.72, 0.20), "검은 마차", (0.55, 0.14, 0.89, 0.27)),
                ((0.50, 0.49), "두 번째 기둥 옆", (0.34, 0.43, 0.67, 0.55)),
                ((0.25, 0.73), "토마스가 탔다", (0.08, 0.66, 0.43, 0.79)),
                ((0.74, 0.75), "사흘째 같은 자리", (0.56, 0.68, 0.91, 0.82)),
            )
            for position, text, text_box in entries:
                draw_pixel_text(image, position, text, 0.039, ink, background=paper, box=text_box)
            applied.extend(text for _, text, _ in entries)
        elif correction == "crest-branch-4":
            draw_crest(image, (0.49, 0.35, 0.65, 0.61), 4)
            applied.append("SYM_CREST_BRANCH_4")
        else:
            raise ValueError(f"Unknown correction: {correction}")
    return {"applied": applied}


def remove_small_components(mask: np.ndarray, min_area: int) -> np.ndarray:
    count, labels, stats, _ = cv2.connectedComponentsWithStats(mask.astype(np.uint8), 8)
    result = np.zeros_like(mask, dtype=bool)
    for label in range(1, count):
        if stats[label, cv2.CC_STAT_AREA] >= min_area:
            result |= labels == label
    return result


def close_diagonal_gaps(mask: np.ndarray) -> np.ndarray:
    result = mask.copy()
    for _ in range(2):
        a = result[:-1, :-1]
        b = result[:-1, 1:]
        c = result[1:, :-1]
        d = result[1:, 1:]
        diag_ad = a & d & ~b & ~c
        diag_bc = b & c & ~a & ~d
        additions = np.zeros_like(result)
        additions[:-1, 1:] |= diag_ad
        additions[1:, :-1] |= diag_ad
        additions[:-1, :-1] |= diag_bc
        additions[1:, 1:] |= diag_bc
        result |= additions
    return result


def semantic_boundary(mask: np.ndarray) -> np.ndarray:
    kernel = np.ones((3, 3), np.uint8)
    dilated = cv2.dilate(mask.astype(np.uint8), kernel, iterations=1) > 0
    eroded = cv2.erode(mask.astype(np.uint8), kernel, iterations=1) > 0
    return dilated ^ eroded


def build_closed_linework(
    target: Image.Image,
    restore_semantic: np.ndarray,
    spec: QuestSpec,
) -> np.ndarray:
    rgb = np.asarray(target.convert("RGB"), dtype=np.uint8)
    gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
    size = target.width
    line = np.zeros((size, size), dtype=np.uint8)
    if size == 128:
        gray = cv2.GaussianBlur(gray, (3, 3), 0)
    levels = np.digitize(gray, bins=(45, 82, 120, 158, 198)).astype(np.uint8)
    min_area = {64: 10, 128: 60}[size]
    for level in range(6):
        level_mask = (levels == level).astype(np.uint8)
        count, labels, stats, _ = cv2.connectedComponentsWithStats(level_mask, 8)
        for label in range(1, count):
            if stats[label, cv2.CC_STAT_AREA] < min_area:
                continue
            component = (labels == label).astype(np.uint8)
            contours, _ = cv2.findContours(component, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            cv2.drawContours(line, contours, -1, 255, 1, lineType=cv2.LINE_8)

    line = remove_small_components(line > 0, 3)
    correction_ink = {
        "text-uri": ((103, 55, 46),),
        "crest-main-3": ((205, 151, 78),),
        "anchor-old": ((29, 48, 58), (167, 68, 61)),
        "ledger-text": ((54, 54, 49),),
        "logbook-text": ((67, 59, 52),),
        "crest-branch-4": ((205, 151, 78),),
    }
    for correction in spec.corrections:
        for color in correction_ink.get(correction, ()):
            line |= np.all(rgb == np.asarray(color, dtype=np.uint8), axis=2)
    line |= semantic_boundary(restore_semantic)
    line[0, :] = True
    line[-1, :] = True
    line[:, 0] = True
    line[:, -1] = True
    line = close_diagonal_gaps(line)
    return line


def build_masks(target: Image.Image, spec: QuestSpec) -> dict[str, np.ndarray]:
    size = target.width
    exclude = rasterize_shapes(spec.exclude_shapes, size)
    restore_seed = rasterize_shapes(spec.restore_shapes, size) & ~exclude
    midpoint = (spec.restore_range[0] + spec.restore_range[1]) / 2
    semantic_target = round(size * size * min(midpoint + 0.065, 0.52))
    semantic = fit_mask_area(restore_seed, semantic_target, exclude)

    line = build_closed_linework(target, semantic, spec)
    for _ in range(4):
        restore = semantic & ~line & ~exclude
        target_count = round(size * size * midpoint)
        error = target_count - int(restore.sum())
        if abs(error) <= max(2, round(size * size * 0.002)):
            break
        semantic = fit_mask_area(semantic, int(semantic.sum()) + error, exclude)
        line = build_closed_linework(target, semantic, spec)

    restore = semantic & ~line & ~exclude
    locked = ~restore

    rgb = np.asarray(target.convert("RGB"), dtype=np.uint8)
    gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
    canny = cv2.Canny(gray, 45, 110) > 0
    anchors = cv2.dilate(canny.astype(np.uint8), np.ones((3, 3), np.uint8), iterations=1) > 0
    initial = locked | (restore & anchors)

    if "crest-main-3" in spec.corrections or "crest-branch-4" in spec.corrections:
        if "crest-main-3" in spec.corrections:
            secret = rasterize_shapes((rect(0.29, 0.29, 0.71, 0.75),), size)
            period = max(5, round(size / 12))
            visible_width = max(1, round(period * 0.34))
        else:
            secret = rasterize_shapes((rect(0.49, 0.35, 0.65, 0.61),), size)
            period = max(6, round(size / 10))
            visible_width = max(1, round(period * 0.22))
        yy, xx = np.indices((size, size))
        fragments = ((xx + 2 * yy) % period) < visible_width
        initial[secret & line] = fragments[secret & line]

    return {
        "initial": initial,
        "locked": locked,
        "restore": restore,
        "exclude": exclude,
        "line": line,
    }


def binary_image(mask: np.ndarray) -> Image.Image:
    return Image.fromarray(np.where(mask, 255, 0).astype(np.uint8), mode="L")


def line_rgba(mask: np.ndarray) -> Image.Image:
    size = mask.shape[0]
    rgba = np.zeros((size, size, 4), dtype=np.uint8)
    rgba[mask, :3] = (33, 29, 27)
    rgba[mask, 3] = 255
    return Image.fromarray(rgba, mode="RGBA")


def initial_canvas(target: Image.Image, masks: dict[str, np.ndarray]) -> Image.Image:
    rgb = np.asarray(target.convert("RGB"), dtype=np.uint8)
    gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
    parchment = np.stack((gray * 0.36 + 154, gray * 0.31 + 137, gray * 0.22 + 111), axis=-1)
    parchment = np.clip(parchment, 0, 255).astype(np.uint8)
    result = parchment
    result[masks["initial"]] = rgb[masks["initial"]]
    result[masks["line"] & masks["initial"]] = (33, 29, 27)
    return Image.fromarray(result, mode="RGB")


def mask_overlay(target: Image.Image, masks: dict[str, np.ndarray]) -> Image.Image:
    base = np.asarray(target.convert("RGB"), dtype=np.float32) * 0.36
    overlay = np.zeros_like(base)
    overlay[masks["locked"]] = (60, 106, 145)
    overlay[masks["restore"]] = (218, 91, 77)
    overlay[masks["exclude"]] = (75, 68, 67)
    mixed = np.clip(base + overlay * 0.64, 0, 255).astype(np.uint8)
    mixed[masks["line"]] = (20, 18, 18)
    return Image.fromarray(mixed, mode="RGB")


def fill_region_map(line: np.ndarray) -> tuple[Image.Image, np.ndarray]:
    free = (~line).astype(np.uint8)
    count, labels = cv2.connectedComponents(free, connectivity=4)
    colors = np.zeros((*line.shape, 3), dtype=np.uint8)
    for label in range(1, count):
        colors[labels == label] = (
            55 + (label * 73) % 190,
            55 + (label * 109) % 190,
            55 + (label * 151) % 190,
        )
    colors[line] = (20, 18, 18)
    return Image.fromarray(colors, mode="RGB"), labels


def count_leaks(line: np.ndarray, restore: np.ndarray, connectivity: int) -> int:
    free = (~line).astype(np.uint8)
    count, labels = cv2.connectedComponents(free, connectivity=connectivity)
    locked = ~restore
    leaks = 0
    for label in range(1, count):
        component = labels == label
        if np.any(component & restore) and np.any(component & locked):
            leaks += 1
    return leaks


def count_restore_fill_regions(line: np.ndarray, restore: np.ndarray) -> int:
    free = (~line).astype(np.uint8)
    count, labels = cv2.connectedComponents(free, connectivity=4)
    regions = 0
    for label in range(1, count):
        if np.any((labels == label) & restore):
            regions += 1
    return regions


def save_shared_symbol_assets(size: int) -> None:
    shared = QUEST_ROOT / "shared" / "symbols" / str(size)
    shared.mkdir(parents=True, exist_ok=True)
    symbol_size = max(16, round(size * 0.28))
    for name, waves in (("crest-main-3", 3), ("crest-branch-4", 4)):
        image = Image.new("RGB", (symbol_size, symbol_size), (74, 24, 25) if waves == 3 else (21, 31, 31))
        draw_crest(image, (0.02, 0.02, 0.98, 0.98), waves)
        image.save(shared / f"{name}.png", optimize=True)
    anchor = Image.new("RGB", (symbol_size, symbol_size), (184, 132, 114))
    draw_anchor(anchor, (0.08, 0.04, 0.92, 0.96))
    anchor.save(shared / "anchor-old.png", optimize=True)


def qa_candidate(target: Image.Image, masks: dict[str, np.ndarray], spec: QuestSpec, correction_data: dict[str, Any]) -> dict[str, Any]:
    rgb = np.asarray(target.convert("RGB"))
    palette_count = int(len(np.unique(rgb.reshape(-1, 3), axis=0)))
    restore_ratio = float(masks["restore"].mean())
    binary_masks = all(set(np.unique(mask).tolist()) <= {False, True} for mask in masks.values())
    return {
        "quest": spec.quest_id,
        "resolution": target.width,
        "dimensions_ok": target.size == (target.width, target.width),
        "palette_colors": palette_count,
        "palette_limit": {64: 16, 128: 24}[target.width] + 12,
        "restore_ratio": round(restore_ratio, 5),
        "restore_range": list(spec.restore_range),
        "restore_ratio_ok": spec.restore_range[0] <= restore_ratio <= spec.restore_range[1],
        "binary_masks_ok": binary_masks,
        "restore_exclude_overlap": int(np.count_nonzero(masks["restore"] & masks["exclude"])),
        "restore_locked_overlap": int(np.count_nonzero(masks["restore"] & masks["locked"])),
        "fill_leaks_4way": count_leaks(masks["line"], masks["restore"], 4),
        "fill_leaks_8way": count_leaks(masks["line"], masks["restore"], 8),
        "fill_regions_4way": count_restore_fill_regions(masks["line"], masks["restore"]),
        "line_pixels": int(masks["line"].sum()),
        "corrections": correction_data["applied"],
    }


def write_candidate(spec: QuestSpec, size: int) -> dict[str, Any]:
    source_path = QUEST_ROOT / spec.slug / "source" / "generated-original.png"
    output = QUEST_ROOT / spec.slug / "candidates" / str(size)
    masks_dir = output / "masks"
    masks_dir.mkdir(parents=True, exist_ok=True)

    with Image.open(source_path) as source:
        target = quantize_source(source, size)
    correction_data = apply_corrections(target, spec)
    masks = build_masks(target, spec)

    target.save(output / "target.png", optimize=True)
    line_rgba(masks["line"]).save(output / "line.png", optimize=True)
    initial_canvas(target, masks).save(output / "initial.png", optimize=True)
    mask_overlay(target, masks).save(output / "mask-overlay.png", optimize=True)
    region_map, _ = fill_region_map(masks["line"])
    region_map.save(output / "fill-regions.png", optimize=True)
    for name in ("initial", "locked", "restore", "exclude", "line"):
        binary_image(masks[name]).save(masks_dir / f"{name}.png", optimize=True)

    qa = qa_candidate(target, masks, spec, correction_data)
    manifest = {
        "quest": spec.quest_id,
        "title": spec.title,
        "category": spec.category,
        "resolution": size,
        "currently_specified_resolution": spec.selected_resolution,
        "source": str(source_path.relative_to(ROOT)),
        "restore_range": list(spec.restore_range),
        "mask_contract": {
            "initial": "pixels visible on entry; may overlap locked pixels",
            "locked": "non-editable pixels, including all closed linework",
            "restore": "editable aggregate scoring candidate pixels; per-feature required masks are pending",
            "exclude": "decorative or story-unsafe pixels omitted from scoring",
            "line": "closed fill-tool barrier; always non-editable",
        },
        "corrections": correction_data["applied"],
        "qa": qa,
    }
    (output / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return qa


def nearest_preview(image: Image.Image, cell: int = 256) -> Image.Image:
    return image.resize((cell, cell), Image.Resampling.NEAREST)


def label_cell(text: str, width: int, height: int) -> Image.Image:
    cell = Image.new("RGB", (width, height), (30, 27, 26))
    draw = ImageDraw.Draw(cell)
    draw.text((8, height // 2), text, fill=(231, 218, 190), anchor="lm", font=load_font(max(11, height - 8)))
    return cell


def make_quest_comparison(spec: QuestSpec) -> None:
    cell = 256
    label_h = 30
    rows = ("target.png", "initial.png", "line.png", "mask-overlay.png")
    canvas = Image.new("RGB", (cell * len(RESOLUTIONS), label_h + (cell + label_h) * len(rows)), (24, 22, 21))
    draw = ImageDraw.Draw(canvas)
    draw.text((10, label_h // 2), f"{spec.quest_id} / {spec.title}", fill=(240, 224, 192), anchor="lm", font=load_font(18))
    y = label_h
    for row_name in rows:
        for col, size in enumerate(RESOLUTIONS):
            path = QUEST_ROOT / spec.slug / "candidates" / str(size) / row_name
            with Image.open(path) as image:
                if image.mode == "RGBA":
                    bg = Image.new("RGBA", image.size, (211, 197, 166, 255))
                    image = Image.alpha_composite(bg, image.convert("RGBA")).convert("RGB")
                else:
                    image = image.convert("RGB")
                preview = nearest_preview(image, cell)
            canvas.paste(preview, (col * cell, y))
            label = f"{row_name.removesuffix('.png')} / {size}x{size}"
            canvas.paste(label_cell(label, cell, label_h), (col * cell, y + cell))
        y += cell + label_h
    canvas.save(QUEST_ROOT / spec.slug / "resolution-comparison.png", optimize=True)


def make_global_contact_sheet(specs: Iterable[QuestSpec]) -> None:
    specs = tuple(specs)
    cell = 256
    label_h = 28
    canvas = Image.new("RGB", (cell * len(RESOLUTIONS), len(specs) * (cell + label_h)), (24, 22, 21))
    for row, spec in enumerate(specs):
        y = row * (cell + label_h)
        for col, size in enumerate(RESOLUTIONS):
            path = QUEST_ROOT / spec.slug / "candidates" / str(size) / "target.png"
            with Image.open(path) as image:
                preview = nearest_preview(image.convert("RGB"), cell)
            canvas.paste(preview, (col * cell, y))
            label = f"{spec.quest_id}  {size}x{size}"
            canvas.paste(label_cell(label, cell, label_h), (col * cell, y + cell))
    canvas.save(QUEST_ROOT / "resolution-contact-sheet.png", optimize=True)


def text_risk(spec: QuestSpec, resolution: int) -> str:
    if not any(item in spec.corrections for item in ("text-uri", "ledger-text", "logbook-text")):
        return "해당 없음"
    if resolution == 64:
        return "높음"
    if resolution == 128 and "logbook-text" in spec.corrections:
        return "중간"
    return "낮음"


def write_qa_report(all_qa: list[dict[str, Any]], specs: Iterable[QuestSpec]) -> None:
    specs = tuple(specs)
    by_key = {(entry["quest"], entry["resolution"]): entry for entry in all_qa}
    lines = [
        "# 복원 퀘스트 픽셀 정본 후보 QA",
        "",
        "> 상태: **64×64·128×128 비교 후보 생성 완료**",
        "> 생성 방식: 결정론적 Pillow/OpenCV 파이프라인 + 수동 정본 문자·문양 합성",
        "> 정본 영역 계약: `docs/RESTORATION_QUEST_SPEC.md` 2.4절",
        "",
        "## 산출물",
        "",
        "각 퀘스트의 `assets/quests/<quest>/candidates/<resolution>/`에 `target.png`,",
        "`line.png`, `initial.png`, `mask-overlay.png`, `fill-regions.png`, `manifest.json`,",
        "그리고 `masks/initial.png`, `locked.png`, `restore.png`, `exclude.png`, `line.png`가 있다.",
        "사용 가능한 해상도는 64×64와 128×128 두 종류이며, 두 후보의 육안 비교 뒤 최종 선택한다.",
        "",
        "![28개 목표 후보](../assets/quests/resolution-contact-sheet.png)",
        "",
        "## 복원 위치의 확정 수준",
        "",
        "- `masks/restore.png`의 흰 픽셀은 플레이어가 수정하고 전체 유사도 채점에 사용할 복원 영역 합집합이다.",
        "- `initial`, `locked`, `exclude`, `line`도 픽셀 단위로 확정돼 복원 영역과 분리돼 있다.",
        "- 모자·점·목도리처럼 하드 게이트마다 나뉜 `masks/required/<feature>.png`는 아직 제작하지 않았다.",
        "- 따라서 현재 후보는 전체 복원 위치까지 확정된 상태이며, 세부 단서별 채점과 게임 런타임 연결은 후속 단계다.",
        "",
        "## 자동 검증 결과",
        "",
        "| 퀘스트 | 해상도 | 팔레트색 | 복원 비율 | 비율 | 폐쇄 구획 | 4방향 누출 | 8방향 누출 | 문자 위험 |",
        "| --- | ---: | ---: | ---: | :--: | ---: | ---: | ---: | :--: |",
    ]
    for spec in specs:
        for size in RESOLUTIONS:
            qa = by_key[(spec.quest_id, size)]
            lines.append(
                f"| {spec.quest_id} | {size} | {qa['palette_colors']} | "
                f"{qa['restore_ratio'] * 100:.1f}% | {'통과' if qa['restore_ratio_ok'] else '실패'} | "
                f"{qa['fill_regions_4way']} | {qa['fill_leaks_4way']} | {qa['fill_leaks_8way']} | {text_risk(spec, size)} |"
            )
    lines.extend((
        "",
        "## 폐쇄 윤곽 계약",
        "",
        "- 모든 복원 의미 영역의 외곽선을 `line` 마스크에 강제로 합성했다.",
        "- 순수 대각선 1픽셀 틈을 직교 픽셀로 메운 뒤 4방향·8방향 채우기를 각각 검사한다.",
        "- `fill_leaks_4way`와 `fill_leaks_8way`가 0이 아니면 후보를 게임에 사용할 수 없다.",
        "- 선 픽셀은 `locked`이며 `restore`·`exclude`와 겹치지 않는다.",
        "",
        "## 수동 정본 보정",
        "",
        "- Q2C: `우리`를 직접 정의한 이진 비트맵 획으로 다시 합성했다.",
        "- Q3A: 초승달 하나와 파도 정확히 세 줄인 `SYM_CREST_MAIN_3`를 합성했다.",
        "- Q3B: 재사용 가능한 `SYM_ANCHOR_OLD` 닻을 합성했다.",
        "- Q4A: 관리 서명과 `T.C. 4 MONTHS` 행을 임의 생성 획 대신 정본 문자로 합성했다.",
        "- Q4B: `자정`, `검은 마차`, `두 번째 기둥 옆`, `토마스가 탔다`, `사흘째 같은 자리`를 정확히 합성했다.",
        "- Q5A: 초승달 하나와 파도 정확히 네 줄인 `SYM_CREST_BRANCH_4`를 합성했다.",
        "- 공유 문양은 `assets/quests/shared/symbols/<resolution>/`에도 저장했다.",
        "",
        "## 육안 선택 시 확인할 것",
        "",
        "1. 64×64에서 핵심 단서 개수가 보이지만 인물 정체성이나 문서 문구가 뭉개지는지 확인한다.",
        "2. 128×128이 단서와 플레이 시간 사이의 균형을 제공하는지 확인한다.",
        "3. Q1A와 Q2A는 반드시 같은 128×128 해상도와 크롭을 유지한다.",
        "4. 문서·현장형 Q3C·Q4A·Q5A는 128×128을 기본값으로 유지한다.",
        "",
    ))
    (ROOT / "docs" / "RESTORATION_PIXEL_QA.md").write_text("\n".join(lines), encoding="utf-8")


def validate_qa(all_qa: Iterable[dict[str, Any]]) -> list[str]:
    failures: list[str] = []
    for qa in all_qa:
        key = f"{qa['quest']}@{qa['resolution']}"
        if not qa["dimensions_ok"]:
            failures.append(f"{key}: dimensions")
        if not qa["restore_ratio_ok"]:
            failures.append(f"{key}: restore ratio {qa['restore_ratio']}")
        if not qa["binary_masks_ok"]:
            failures.append(f"{key}: non-binary mask")
        if qa["restore_exclude_overlap"]:
            failures.append(f"{key}: restore/exclude overlap")
        if qa["restore_locked_overlap"]:
            failures.append(f"{key}: restore/locked overlap")
        if qa["fill_leaks_4way"] or qa["fill_leaks_8way"]:
            failures.append(f"{key}: fill leak")
    return failures


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--quests", nargs="*", help="Quest IDs or slugs; default is all 14")
    parser.add_argument("--resolutions", nargs="*", type=int, choices=RESOLUTIONS, default=list(RESOLUTIONS))
    parser.add_argument("--skip-contact-sheets", action="store_true")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    requested = set(args.quests or [])
    specs = tuple(
        spec for spec in QUESTS
        if not requested or spec.quest_id in requested or spec.slug in requested
    )
    if not specs:
        raise SystemExit("No matching quest IDs or slugs")

    all_qa: list[dict[str, Any]] = []
    for size in args.resolutions:
        save_shared_symbol_assets(size)
    for spec in specs:
        for size in args.resolutions:
            qa = write_candidate(spec, size)
            all_qa.append(qa)
            print(
                f"{spec.quest_id}@{size}: palette={qa['palette_colors']} "
                f"restore={qa['restore_ratio']:.3f} leaks={qa['fill_leaks_4way']}/{qa['fill_leaks_8way']}"
            )

    full_run = len(specs) == len(QUESTS) and tuple(args.resolutions) == RESOLUTIONS
    if not args.skip_contact_sheets and tuple(args.resolutions) == RESOLUTIONS:
        for spec in specs:
            make_quest_comparison(spec)
        if full_run:
            make_global_contact_sheet(specs)
    if full_run:
        write_qa_report(all_qa, specs)

    failures = validate_qa(all_qa)
    if failures:
        print("QA failures:")
        for failure in failures:
            print(f"- {failure}")
        return 1
    print(f"QA passed for {len(all_qa)} candidate sets")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
