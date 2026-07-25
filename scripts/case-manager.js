(function () {
  "use strict";

  function cleanText(value, maximumLength) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, maximumLength);
  }

  function fileNameWithoutExtension(fileName) {
    const cleaned = cleanText(fileName, 100);
    return cleaned.replace(/\.[^.]+$/, "") || "미확인 이미지";
  }

  function createCase({ title, witnesses, fileName }) {
    const normalizedTitle =
      cleanText(title, 60) ||
      `${fileNameWithoutExtension(fileName)} 복원 사건`;
    const normalizedWitnesses = witnesses
      .map((witness) => cleanText(witness, 120))
      .filter(Boolean)
      .slice(0, 3);

    if (normalizedWitnesses.length === 0) {
      normalizedWitnesses.push(
        "목격 기록이 없습니다. 남아 있는 영역을 단서로 이미지를 복원하세요.",
      );
    }

    return Object.freeze({
      title: normalizedTitle,
      witnesses: Object.freeze(normalizedWitnesses),
    });
  }

  window.CaseManager = Object.freeze({
    createCase,
  });
})();
