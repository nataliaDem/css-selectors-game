let currentLevel = parseInt(localStorage.currentLevel, 10) || 0;
const levelTimeout = 1000;
let checkGameStarted;

$(document).ready(function () {

  $(".editor-pane input").on("keypress", function (e) {
    e.stopPropagation();
    if (e.keyCode === 13) {
      enterHit();
      return false;
    }
  });

  $(".member-name").on("keypress", function (e) {
    e.stopPropagation();
    if (e.keyCode === 13) {
      login();
      return false;
    }
  });

  $(".editor-pane input").on("keyup", function (e) {
    e.stopPropagation();
    var length = $(this).val().length;
    if (length > 0) {
      $(".editor-pane input").removeClass("input-strobe");
    } else {
      $(".editor-pane input").addClass("input-strobe");
    }
  });

  $(".enter-button").on("click", function () {
    enterHit();
  });

  $(".submit-login").on("click", function () {
    login();
  });

  if (Number(localStorage.getItem("gameCode"))) {
    if (localStorage.getItem("gameStatus") === STATUSES.ACTIVE) {
      showGameViewForPlayer();
    } else if (localStorage.getItem("userIsLogged")) {
      showWaitViewForPlayer();
      checkGameStarted = setInterval(function() {
        startGameForPlayer()
      }, intervalTimeout);
    } else {
      showAuthViewForPlayer();
    }
  } else {
    showGameCodeView();
  }

  $(".reset-progress").on("click", function () {
    showGameCodeView();
  });

});

function showAuthViewForPlayer() {
  $(".player-game-view, .player-wait-view, .player-start-view").addClass('d-none');
  $(".auth-view").removeClass('d-none');
}

function showWaitViewForPlayer() {
  $(".auth-view, .player-game-view, .player-start-view").addClass('d-none');
  $(".player-wait-view").removeClass('d-none');
}

function showGameViewForPlayer() {
  $(".auth-view, .player-wait-view, .player-start-view").addClass('d-none');
  $(".player-game-view").removeClass('d-none');
  loadLevel();
}

function showGameCodeView() {
  $(".player-game-view, .player-wait-view").addClass('d-none');
  $(".player-start-view").removeClass('d-none');
}

function startGameForPlayer() {
  const gameCode = localStorage.getItem("gameCode");
  getGameStatus(gameCode)
    .then(res => {
      console.log(res);
      if (res === STATUSES.ACTIVE) {
        showGameViewForPlayer();
        localStorage.setItem("gameStatus", STATUSES.ACTIVE);
        clearInterval(checkGameStarted);
      }
    });
}

function login() {
  const gameCode = localStorage.getItem("gameCode");
  console.log(gameCode);
  const name = $('.member-name').val();
  console.log(name);
  axios.post(`${baseUrl}/api/auth?code=${gameCode}`, {name: name})
    .then(res => {
      console.log(res.data);
      localStorage.setItem("userIsLogged", true);
      localStorage.setItem("userId", res.data.userId);
      showWaitViewForPlayer();
      checkGameStarted = setInterval(function() {
        startGameForPlayer()
      }, intervalTimeout);
    });
}

function updateProgress(level, timestamp) {
  const gameCode = localStorage.getItem("gameCode");
  const userId = localStorage.getItem("userId")
  axios.post(`${baseUrl}/api/update-progress?code=${gameCode}`, {
    id: userId,
    level: level + 1,
    lastAnswerTime: timestamp
  })
    .then(res => {
      console.log(res.data);
    });
}

function enterHit() {
  $(".enter-button").removeClass("enterhit");
  $(".enter-button").width($(".enter-button").width());
  $(".enter-button").addClass("enterhit");
  var value = $(".editor-pane input").val();
  handleInput(value);
}

function handleInput(text) {
  if (parseInt(text, 10) > 0 && parseInt(text, 10) < levels.length + 1) {
    currentLevel = parseInt(text, 10) - 1;
    loadLevel();
    return;
  }
  console.log(text)
  fireRule(text);
}

function fireRule(rule) {

  if (rule === ".strobe") {
    rule = null;
  }

  $(".shake").removeClass("shake");

  $(".strobe,.clean,.shake").each(function () {
    $(this).width($(this).width());
    $(this).removeAttr("style");
  });

  // var baseTable = $('.table-wrapper > .table, .table-wrapper > .nametags, .table-wrapper > .table-surface');
  var baseTable = $('.table');

  // Check if jQuery will throw an error trying the mystery rule
  // If it errors out, change the rule to null so the wrong-guess animation will work
  try {
    $(".table").find(rule).not(baseTable);
  } catch (err) {
    rule = null;
  }

  var ruleSelected = $(".table").find(rule).not(baseTable);            // What the correct rule finds
  var levelSelected = $(".table").find(level.selector).not(baseTable); // What the person finds

  var win = false;

  // If nothing is selected
  if (ruleSelected.length == 0) {
    $(".editor").addClass("shake");
  }

  if (ruleSelected.length == levelSelected.length && ruleSelected.length > 0) {
    win = checkResults(ruleSelected, levelSelected, rule);
  }

  if (win) {
    ruleSelected.removeClass("strobe");
    ruleSelected.addClass("clean");
    $(".editor-pane input").val("");
    $(".input-wrapper").css("opacity", .2);
    const timestamp = Date.now();
    updateProgress(currentLevel, timestamp)
    updateProgressUI(currentLevel, true);
    currentLevel++;

    if (currentLevel >= levels.length) {
      winGame();
    } else {
      setTimeout(function () {
        loadLevel();
        showLeaderBoard();
        // showCode();
      }, levelTimeout);
    }
  } else {
    ruleSelected.removeClass("strobe");
    ruleSelected.addClass("shake");

    setTimeout(function () {
      $(".shake").removeClass("shake");
      $(".strobe").removeClass("strobe");
      levelSelected.addClass("strobe");
    }, 500);

    $(".result").fadeOut();
  }

  // If answer is correct, let's track progress

  if (win) {
    trackProgress(currentLevel - 1, "correct");
  } else {
    trackProgress(currentLevel, "incorrect");
  }
}

function trackProgress(levelNumber, type) {
  if (!progress.guessHistory[levelNumber]) {
    progress.guessHistory[levelNumber] = {
      correct: false,
      incorrectCount: 0,
      gaSent: false
    };
  }

  var levelStats = progress.guessHistory[levelNumber];

  if (type == "incorrect") {
    if (levelStats.correct == false) {
      levelStats.incorrectCount++; // Only update the incorrect count until it is guessed correctly
    }
  } else {
    if (levelStats.correct == false) {
      levelStats.correct = true;
      progress.totalCorrect++;
      progress.percentComplete = progress.totalCorrect / levels.length;
      levelStats.gaSent = true;
    }
  }

  // Increments the completion percentage by 10%, and sends an event every time
  var increment = .1;
  if (progress.percentComplete >= progress.lastPercentEvent + increment) {
    progress.lastPercentEvent = progress.lastPercentEvent + increment;
  }

  localStorage.setItem("progress", JSON.stringify(progress));
}

function winGame() {
  $(".table").html('<span class="winner"><strong>You did it!</strong><br>You rock at CSS.</span>');
  addNametags();
  finished = true;
  resetTable();
}

function checkResults(ruleSelected, levelSelected, rule) {
  var ruleTable = $(".table").clone();
  ruleTable.find(".strobe").removeClass("strobe");
  ruleTable.find(rule).addClass("strobe");
  return ($(".table").html() === ruleTable.html());
}