(function () {
  "use strict";

  function evaluate(question, selectedIndex) {
    if (
      !question ||
      !Array.isArray(question.options) ||
      !Number.isInteger(question.answerIndex) ||
      !Number.isInteger(selectedIndex) ||
      selectedIndex < 0 ||
      selectedIndex >= question.options.length
    ) {
      throw new Error("최종 추리 답안 정보가 올바르지 않습니다.");
    }
    const correct = selectedIndex === question.answerIndex;
    return Object.freeze({
      correct,
      selectedIndex,
      answerIndex: question.answerIndex,
      selectedAnswer: question.options[selectedIndex],
      correctAnswer: question.options[question.answerIndex],
      message: correct
        ? question.explanation ||
          "모든 증거와 일치하는 결론입니다."
        : "복원된 네 조각과 목격담을 다시 비교해 보세요.",
    });
  }

  window.DeductionManager = Object.freeze({ evaluate });
})();
