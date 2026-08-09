import json
import unittest
from pathlib import Path

import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
QUEST_ROOT = ROOT / "assets" / "quests"
RESOLUTIONS = (64, 128)
QUESTS = (
    "q0-montage",
    "q1a-idealized",
    "q1b-tavern-wall",
    "q2a-true-face",
    "q2b-cat",
    "q2c-child-room",
    "q3a-seal",
    "q3b-tattoo",
    "q3c-warehouse",
    "q4a-ledger",
    "q4b-logbook",
    "q4c-square-bet",
    "q5a-dock",
    "q5b-siren",
)


class RestorationAssetTests(unittest.TestCase):
    def test_all_28_candidate_sets_exist_and_pass_manifest_qa(self):
        count = 0
        for quest in QUESTS:
            for resolution in RESOLUTIONS:
                count += 1
                candidate = QUEST_ROOT / quest / "candidates" / str(resolution)
                manifest = json.loads((candidate / "manifest.json").read_text(encoding="utf-8"))
                self.assertEqual(manifest["resolution"], resolution)
                qa = manifest["qa"]
                self.assertTrue(qa["dimensions_ok"])
                self.assertTrue(qa["restore_ratio_ok"])
                self.assertTrue(qa["binary_masks_ok"])
                self.assertEqual(qa["restore_exclude_overlap"], 0)
                self.assertEqual(qa["restore_locked_overlap"], 0)
                self.assertEqual(qa["fill_leaks_4way"], 0)
                self.assertEqual(qa["fill_leaks_8way"], 0)
                for filename in (
                    "target.png",
                    "line.png",
                    "initial.png",
                    "mask-overlay.png",
                    "fill-regions.png",
                ):
                    with Image.open(candidate / filename) as image:
                        self.assertEqual(image.size, (resolution, resolution))
                for mask_name in ("initial", "locked", "restore", "exclude", "line"):
                    with Image.open(candidate / "masks" / f"{mask_name}.png") as image:
                        self.assertEqual(image.size, (resolution, resolution))
                        self.assertLessEqual(set(np.unique(np.asarray(image)).tolist()), {0, 255})
        self.assertEqual(count, 28)

    def test_story_critical_corrections_are_declared(self):
        expected = {
            "q2c-child-room": "우리",
            "q3a-seal": "SYM_CREST_MAIN_3",
            "q3b-tattoo": "SYM_ANCHOR_OLD",
            "q4a-ledger": "T.C. 4 MONTHS",
            "q4b-logbook": "두 번째 기둥 옆",
            "q5a-dock": "SYM_CREST_BRANCH_4",
        }
        for quest, correction in expected.items():
            for resolution in RESOLUTIONS:
                manifest_path = QUEST_ROOT / quest / "candidates" / str(resolution) / "manifest.json"
                manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
                self.assertIn(correction, manifest["corrections"])

    def test_secret_crest_lines_are_not_fully_visible_on_entry(self):
        regions = {
            "q3a-seal": (0.29, 0.29, 0.71, 0.75),
            "q5a-dock": (0.49, 0.35, 0.65, 0.61),
        }
        for quest, (x0, y0, x1, y1) in regions.items():
            for resolution in RESOLUTIONS:
                masks = QUEST_ROOT / quest / "candidates" / str(resolution) / "masks"
                line = np.asarray(Image.open(masks / "line.png")) > 0
                initial = np.asarray(Image.open(masks / "initial.png")) > 0
                box = np.zeros_like(line)
                box[
                    round(y0 * (resolution - 1)):round(y1 * (resolution - 1)) + 1,
                    round(x0 * (resolution - 1)):round(x1 * (resolution - 1)) + 1,
                ] = True
                secret_line = line & box
                self.assertGreater(secret_line.sum(), 0)
                visible_fraction = (secret_line & initial).sum() / secret_line.sum()
                self.assertLess(visible_fraction, 0.75)

    def test_shared_canonical_symbols_exist(self):
        for resolution in RESOLUTIONS:
            directory = QUEST_ROOT / "shared" / "symbols" / str(resolution)
            for symbol in ("crest-main-3.png", "crest-branch-4.png", "anchor-old.png"):
                self.assertTrue((directory / symbol).is_file())


if __name__ == "__main__":
    unittest.main()
