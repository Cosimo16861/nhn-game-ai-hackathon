(function (global) {
  "use strict";

  const ROOT = "output/questimage";
  const RESOLUTION = 1254;

  const palette = (...entries) => Object.freeze(entries.map(([name, hex]) =>
    Object.freeze({ name, hex }),
  ));
  const notes = (...entries) => Object.freeze(entries.map(([speaker, text]) =>
    Object.freeze({ speaker, text }),
  ));

  const QUESTS = Object.freeze([
    Object.freeze({
      id: "Q0_MONTAGE",
      title: "골목의 손",
      resolution: RESOLUTION,
      targetSource: `${ROOT}/Q0_MONTAGE__골목의-손__완성이미지.png`,
      outlineSource: `${ROOT}/Q0_MONTAGE__골목의-손__윤곽선.png`,
      palette: palette(
        ["밤색 배경", "#18162C"], ["모자 그림자", "#36353D"],
        ["모자 회색", "#727474"], ["목도리 초록", "#2E7558"],
        ["피부", "#CE955F"], ["코트 자주색", "#4D274C"],
      ),
      witnessNotes: notes(
        ["마르타", "회색 모자를 아주 깊게 눌러써서 눈이 전혀 보이지 않았어요."],
        ["마르타", "초록 목도리와 짙은 자주색 코트가 먼저 눈에 들어왔어요."],
        ["현장 기록", "얼굴 아래쪽에 짧고 굽은 흔적이 남아 있다."],
      ),
      clipPrompts: Object.freeze([
        "a wanted portrait with a wide gray hat hiding the eyes",
        "a green scarf over a dark purple coat",
        "a faceless nighttime suspect portrait",
      ]),
    }),
    Object.freeze({
      id: "Q1A_IDEALIZED",
      title: "미화된 초상",
      resolution: RESOLUTION,
      targetSource: `${ROOT}/Q1A_IDEALIZED__미화된-초상__완성이미지.png`,
      outlineSource: `${ROOT}/Q1A_IDEALIZED__미화된-초상__윤곽선.png`,
      palette: palette(
        ["짙은 머리·배경", "#291F1D"], ["청록 코트", "#045165"],
        ["코트 그림자", "#033B4A"], ["따뜻한 피부", "#EDAF74"],
        ["피부 그림자", "#B2946D"], ["크림 셔츠", "#E4CBA4"],
        ["창틀 갈색", "#664632"], ["창가 빛", "#F2D49B"],
      ),
      witnessNotes: notes(
        ["엘리너", "열여덟 살 무렵엔 짙고 부드러운 머리칼이 이마로 내려왔어요."],
        ["엘리너", "응접실 창가에서 청록색 코트를 입고 그린 초상이었죠."],
        ["현장 기록", "화면 왼쪽 창에서 들어온 빛이 얼굴과 크림색 셔츠에 남아 있다."],
      ),
      clipPrompts: Object.freeze([
        "a young man with dark wavy hair",
        "a calm symmetrical portrait with a soft jaw",
        "a teal blue coat and cream shirt",
        "warm window light from the left",
      ]),
      clipRegions: Object.freeze([1, 5, 10, 4]),
      scoring: Object.freeze({
        passingScore: 60,
        weights: Object.freeze({ color: 0.70, coverage: 0.15, clip: 0.15 }),
        fallbackWeights: Object.freeze({ color: 0.82, coverage: 0.18 }),
      }),
    }),
    Object.freeze({
      id: "Q1B_TAVERN_WALL",
      title: "선술집 벽",
      resolution: RESOLUTION,
      targetSource: `${ROOT}/Q1B_TAVERN_WALL__선술집-벽__완성이미지.png`,
      outlineSource: `${ROOT}/Q1B_TAVERN_WALL__선술집-벽__윤곽선.png`,
      palette: palette(
        ["남색 모자·코트", "#17222D"], ["벽돌빛", "#9B5737"],
        ["피부 그늘", "#4A454A"], ["피부", "#CE8B4D"],
        ["흰 수염", "#C1C1BF"], ["낡은 회색", "#777D84"],
      ),
      witnessNotes: notes(
        ["코라", "벽 아래층에는 남색 모자를 쓴 늙은 선원의 얼굴이 남아 있어요."],
        ["현장 기록", "굵은 코와 꺼진 볼, 흰 수염이 벽돌색 흔적 사이로 이어진다."],
      ),
      clipPrompts: Object.freeze([
        "an old sailor with a white beard and navy cap",
        "a portrait emerging from a damaged brick tavern wall",
      ]),
    }),
    Object.freeze({
      id: "Q2A_TRUE_FACE",
      title: "기억되지 않은 얼굴",
      resolution: RESOLUTION,
      targetSource: `${ROOT}/Q2A_TRUE_FACE__기억되지-않은-얼굴__완성이미지.png`,
      outlineSource: `${ROOT}/Q2A_TRUE_FACE__기억되지-않은-얼굴__윤곽선.png`,
      palette: palette(
        ["짙은 머리·배경", "#281D19"], ["청록 코트", "#063948"],
        ["피부", "#EBA96A"], ["피부 그늘", "#905B3A"],
        ["셔츠", "#EBCFA8"], ["창틀", "#4F4537"],
      ),
      witnessNotes: notes(
        ["홀트", "턱은 초상보다 각졌고, 왼쪽 눈썹이 더 높이 올라갔습니다."],
        ["홀트", "인물의 왼쪽 관자놀이, 보는 사람에겐 오른쪽에 작은 흉터가 있었어요."],
        ["현장 기록", "Q1A와 같은 창·코트·크롭을 기준으로 차이를 복원한다."],
      ),
      clipPrompts: Object.freeze([
        "an angular jaw and one raised eyebrow",
        "a small scar on the left temple of a young man",
        "a dark haired man in a teal coat",
      ]),
    }),
    Object.freeze({
      id: "Q2B_CAT",
      title: "안개를 찾습니다",
      resolution: RESOLUTION,
      targetSource: `${ROOT}/Q2B_CAT__안개를-찾습니다__완성이미지.png`,
      outlineSource: `${ROOT}/Q2B_CAT__안개를-찾습니다__윤곽선.png`,
      palette: palette(
        ["전단 종이", "#DAC195"], ["옅은 회색 털", "#8A8F91"],
        ["검은 선", "#171717"], ["붉은 리본", "#9A6247"],
        ["짙은 털", "#5C5A59"], ["흰 귀", "#F4EEE2"],
      ),
      witnessNotes: notes(
        ["코라", "몸은 옅은 회색이고 귀는 한쪽만 하얘요."],
        ["코라", "목에는 붉은 리본을 매 줬고 꼬리는 둥글게 말려요."],
      ),
      clipPrompts: Object.freeze([
        "a light gray sitting cat with exactly one white ear",
        "a cat wearing a red ribbon",
      ]),
    }),
    Object.freeze({
      id: "Q2C_CHILD_ROOM",
      title: "닫힌 방",
      resolution: RESOLUTION,
      targetSource: `${ROOT}/Q2C_CHILD_ROOM__닫힌-방__완성이미지.png`,
      outlineSource: `${ROOT}/Q2C_CHILD_ROOM__닫힌-방__윤곽선.png`,
      palette: palette(
        ["젖은 종이", "#EBD9BA"], ["푸른 번짐", "#93A3B0"],
        ["밝은 종이", "#F4E3C3"], ["짙은 크레용", "#544135"],
        ["붉은 옷", "#B54E4E"], ["초록 옷", "#4A8A58"],
        ["파란 옷", "#527AA3"],
      ),
      witnessNotes: notes(
        ["베스", "위쪽에는 배 한 척, 아래에는 키가 다른 사람 셋이 남아 있어요."],
        ["현장 기록", "푸른 물 번짐이 배와 세 사람을 둘러싸고 있다."],
      ),
      clipPrompts: Object.freeze([
        "a childlike drawing of one boat",
        "three family figures of different heights",
        "blue water damage around a crayon drawing",
      ]),
    }),
    Object.freeze({
      id: "Q3A_SEAL",
      title: "봉인의 세 줄",
      resolution: RESOLUTION,
      targetSource: `${ROOT}/Q3A_SEAL__봉인의-세-줄__완성이미지.png`,
      outlineSource: `${ROOT}/Q3A_SEAL__봉인의-세-줄__윤곽선.png`,
      palette: palette(
        ["붉은 밀랍", "#6C1828"], ["봉투 종이", "#EAD4AD"],
        ["밀랍 빛", "#9B4E44"], ["짙은 홈", "#350C14"],
        ["봉투 그늘", "#B8966B"],
      ),
      witnessNotes: notes(
        ["엘리너", "어두운 붉은 밀랍이었고 가운데에는 초승달이 하나 있었어요."],
        ["현장 기록", "깨진 조각을 이으면 초승달 아래 굵은 파도 세 줄이 나타난다."],
      ),
      clipPrompts: Object.freeze([
        "a broken red wax seal with one crescent moon",
        "exactly three horizontal wave lines inside a wax seal",
      ]),
    }),
    Object.freeze({
      id: "Q3B_TATTOO",
      title: "너무 새것인 닻",
      resolution: RESOLUTION,
      targetSource: `${ROOT}/Q3B_TATTOO__너무-새것인-닻__완성이미지.png`,
      outlineSource: `${ROOT}/Q3B_TATTOO__너무-새것인-닻__윤곽선.png`,
      palette: palette(
        ["소매·잉크", "#212327"], ["피부", "#AA8261"],
        ["붉은 피부", "#9E6B55"], ["피부 빛", "#C09570"],
      ),
      witnessNotes: notes(
        ["리드", "걷힌 소매 아래 닻 하나가 손목 한가운데 선명하게 보였소."],
        ["현장 기록", "짙은 잉크 주위 피부가 넓게 붉어 아직 아물지 않았다."],
      ),
      clipPrompts: Object.freeze([
        "a fresh black anchor tattoo on a wrist",
        "red irritated skin around a new tattoo",
      ]),
    }),
    Object.freeze({
      id: "Q3C_WAREHOUSE",
      title: "창고의 불빛",
      resolution: RESOLUTION,
      targetSource: `${ROOT}/Q3C_WAREHOUSE__창고의-불빛__완성이미지.png`,
      outlineSource: `${ROOT}/Q3C_WAREHOUSE__창고의-불빛__윤곽선.png`,
      palette: palette(
        ["창고 암부", "#091526"], ["젖은 돌바닥", "#182C44"],
        ["나무 상자", "#4F3424"], ["상자 그림자", "#181C25"],
        ["등불", "#D7A74F"], ["고양이 회색", "#5F6264"],
        ["붉은 리본", "#9E3F3F"],
      ),
      witnessNotes: notes(
        ["부두 인부", "양쪽 상자 사이의 빈 통로 끝에서 회색 고양이를 봤소."],
        ["현장 기록", "두 등불의 반사가 젖은 돌바닥을 따라 중앙 통로로 이어진다."],
        ["현장 기록", "고양이 오른쪽에 작은 젖은 종이 뭉치가 놓여 있다."],
      ),
      clipPrompts: Object.freeze([
        "a dark warehouse aisle between wooden crates",
        "two lanterns reflected on a wet stone floor",
        "a gray cat with a red collar beside a small paper bundle",
      ]),
    }),
    Object.freeze({
      id: "Q4A_LEDGER",
      title: "번진 장부",
      resolution: RESOLUTION,
      targetSource: `${ROOT}/Q4A_LEDGER__번진-장부__완성이미지.png`,
      outlineSource: `${ROOT}/Q4A_LEDGER__번진-장부__윤곽선.png`,
      palette: palette(
        ["장부 종이", "#F0DAB6"], ["장부 선", "#553B29"],
        ["푸른 물 번짐", "#7890A9"], ["젖은 회색", "#828380"],
        ["종이 그늘", "#D1BC9C"], ["가죽 테두리", "#896747"],
      ),
      witnessNotes: notes(
        ["리드", "글자를 억지로 읽지 말고, 끊어진 장부의 행과 열부터 맞춰 주시오."],
        ["현장 기록", "오른쪽과 아래쪽의 푸른 침수 경계, 중앙 가로 띠, 하단 기입 칸을 복원한다."],
        ["수사 메모", "격자가 맞으면 완료 뒤 측광으로 눌린 지급 기록을 판독한다."],
      ),
      clipPrompts: Object.freeze([
        "a water damaged blank accounting ledger grid",
        "blue flood damage along the right and lower edges",
        "a reconstructed ledger page with rows and columns",
      ]),
    }),
    Object.freeze({
      id: "Q4B_LOGBOOK",
      title: "잃어버린 항해일지",
      resolution: RESOLUTION,
      targetSource: `${ROOT}/Q4B_LOGBOOK__잃어버린-항해일지__완성이미지.png`,
      outlineSource: `${ROOT}/Q4B_LOGBOOK__잃어버린-항해일지__윤곽선.png`,
      palette: palette(
        ["젖은 남색 바탕", "#2A3C54"], ["일지 종이", "#F2DAAC"],
        ["푸른 침수", "#667B93"], ["젖은 그늘", "#43505E"],
        ["낡은 종이", "#AEA793"],
      ),
      witnessNotes: notes(
        ["뱅크스", "종이는 다섯 조각이오. 찢어진 면과 젖은 귀퉁이를 맞춰 주시오."],
        ["현장 기록", "위쪽 세 조각에 남은 짙은 가로 띠가 같은 줄로 이어진다."],
        ["수사 메모", "조각을 맞춘 뒤 뒷면 눌림을 탁본해 기록을 읽는다."],
      ),
      clipPrompts: Object.freeze([
        "five torn pieces of a water damaged logbook page",
        "three dark ink bands aligned across upper paper fragments",
        "blue gray wet edges on old paper",
      ]),
    }),
    Object.freeze({
      id: "Q4C_SQUARE_BET",
      title: "광장의 내기",
      resolution: RESOLUTION,
      targetSource: `${ROOT}/Q4C_SQUARE_BET__광장의-내기__완성이미지.png`,
      outlineSource: `${ROOT}/Q4C_SQUARE_BET__광장의-내기__윤곽선.png`,
      palette: palette(
        ["붉은 배경", "#6C3326"], ["검은 머리·선", "#191513"],
        ["피부", "#CA8B51"], ["피부 빛", "#E1BD8C"],
        ["피부 그늘", "#9B5D39"], ["갈색 코트", "#6A5136"],
      ),
      witnessNotes: notes(
        ["램", "옆얼굴이오. 굽은 코와 두꺼운 눈썹, 네모난 턱을 흐리지 마시오."],
        ["현장 기록", "검은 머리와 갈색 코트가 붉은 배경 앞에서 분리된다."],
      ),
      clipPrompts: Object.freeze([
        "a side profile portrait with a crooked nose",
        "a thick eyebrow and square jaw",
        "a dark haired man in a brown coat on a red background",
      ]),
    }),
    Object.freeze({
      id: "Q5A_DOCK",
      title: "안개 낀 부두",
      resolution: RESOLUTION,
      targetSource: `${ROOT}/Q5A_DOCK__안개-낀-부두__완성이미지.png`,
      outlineSource: `${ROOT}/Q5A_DOCK__안개-낀-부두__윤곽선.png`,
      palette: palette(
        ["검은 마차·밤", "#181D1F"], ["안개 남색", "#2B3E52"],
        ["먼 안개", "#657B91"], ["부두 회색", "#475F76"],
        ["젖은 바닥", "#47413B"], ["가스등", "#A07236"],
      ),
      witnessNotes: notes(
        ["뱅크스", "검은 마차가 두 가스등 사이에 섰고, 사람이 문 옆에 있었소."],
        ["뱅크스", "오른쪽에는 정박한 배, 앞쪽에는 젖은 바닥의 불빛이 보였소."],
        ["현장 기록", "마차 문에는 초승달 하나와 노란 파도 네 줄이 있다."],
      ),
      clipPrompts: Object.freeze([
        "a black carriage between gas lamps at a foggy dock",
        "a person beside the carriage and a moored boat on the right",
        "one crescent moon and four gold wave lines on the carriage door",
      ]),
    }),
    Object.freeze({
      id: "Q5B_SIREN",
      title: "세이렌 호의 밤",
      resolution: RESOLUTION,
      targetSource: `${ROOT}/Q5B_SIREN__세이렌-호의-밤__완성이미지.png`,
      outlineSource: `${ROOT}/Q5B_SIREN__세이렌-호의-밤__윤곽선.png`,
      palette: palette(
        ["깊은 바다", "#10334B"], ["폭풍 암부", "#1D1D22"],
        ["파도 남색", "#304D67"], ["비구름", "#5D7188"],
        ["배·돛대", "#4F2F21"], ["빗빛", "#A1A6AC"],
        ["젖은 셔츠", "#6F3148"],
      ),
      witnessNotes: notes(
        ["뱅크스", "배는 오른쪽으로 크게 기울었고 돛대 하나가 부러져 있었소."],
        ["뱅크스", "젊은 선원은 왼쪽 난간을 두 손으로 붙들고 몸을 낮췄소."],
        ["현장 기록", "큰 파도와 비가 인물의 얼굴을 가려 신원은 드러나지 않는다."],
      ),
      clipPrompts: Object.freeze([
        "a storm damaged ship leaning dangerously to the right",
        "a young sailor gripping the left railing with both hands",
        "a broken mast in heavy rain and waves",
      ]),
    }),
  ]);

  const byId = new Map(QUESTS.map((quest) => [quest.id, quest]));

  const api = Object.freeze({
    resolution: RESOLUTION,
    list: () => QUESTS,
    get: (id) => byId.get(id) || null,
  });

  global.QuestImageContracts = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
