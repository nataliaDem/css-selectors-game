var level;  // Holds current level info
var currentLevel = parseInt(localStorage.currentLevel, 10) || 0; // Keeps track of the current level Number (0 is level 1)
var levelTimeout = 1000; // Delay between levels after completing
var finished = false;    // Keeps track if the game is showing the Your Rock! screen (so that tooltips can be disabled)

const baseUrl = window.location.origin;

var blankProgress = {
  totalCorrect: 0,
  percentComplete: 0,
  lastPercentEvent: 0,
  guessHistory: {}
}

// Get progress from localStorage, or start from scratch if we don't have any
var progress = JSON.parse(localStorage.getItem("progress")) || blankProgress;


$(document).ready(function () {

  // Custom scrollbar plugin
  $(".left-col, .level-menu, .leaderboard").mCustomScrollbar({
    scrollInertia: 0,
    autoHideScrollbar: true
  });

  $(".next").on("click", function () {
    nextLevel();
  });

  $(".note-toggle").on("click", function () {
    // $(this).hide();
    $(".note").slideToggle();
  });

// Resets progress and progress indicators
  $(".reset-progress").on("click", function () {
    resetProgress();
    return false;
  });

//Handle inputs from the input box on enter
  $(".editor-pane input").on("keypress", function (e) {
    e.stopPropagation();
    if (e.keyCode === 13) {
      enterHit();
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

  $(".editor").on("click", function () {
    $(".editor-pane input").focus();
  });

//Add tooltips
  $(".table").on("mouseover", "*", function (e) {
    e.stopPropagation();
    showTooltip($(this));
  });

//Shows the tooltip on the table
  $(".markup").on("mouseover", "div *", function (e) {
    el = $(this);
    var markupElements = $(".markup *");
    var index = markupElements.index(el) - 1;
    showTooltip($(".table *").eq(index));
    e.stopPropagation();
  });

// Shows the tooltip on the table
  $(".markup").on("mouseout", "*", function (e) {
    e.stopPropagation();
    hideTooltip();
  });

  $(".table").on("mouseout", "*", function (e) {
    hideTooltip();
    e.stopPropagation();
  });

  $(".enter-button").on("click", function () {
    enterHit();
  })

  $(".table-wrapper,.table-edge").css("opacity", 0);

  $(".submit").on("click", function () {
    login();
  });

  $(".create-game").on("click", function () {
    createNewGame();
  });

  $(".fetch-members").on("click", function () {
    showLeaderBoard();
  });

  buildLevelmenu();
  showLeaderBoard();

  setTimeout(function () {
    loadLevel();
    $(".table-wrapper,.table-edge").css("opacity", 1);
  }, 50);

  const urlParams = new URLSearchParams(window.location.search);
  const gameCode = urlParams.get('code');
  localStorage.setItem("gameCode", gameCode);

  $(".game-view, .wait-view").addClass('d-none');

})

function createNewGame() {
  axios.get(`${baseUrl}/create-game`)
    .then(res => {
      console.log(res.data);
      $('.game-code').text(res.data);
      $('.game-link').text(`${baseUrl}/?code=${res.data}`);
      $(".wait-view").removeClass('d-none');
      $(".create-view").addClass('d-none');
      localStorage.setItem("gameCode", res.data);
    });
}

function login() {
  const gameCode = localStorage.getItem("gameCode");
  console.log(gameCode);
  const name = $('.member-name').val();
  console.log(name);
  axios.post(`${baseUrl}/auth?code=${gameCode}`, {name: name})
    .then(res => {
      console.log(res.data);
      localStorage.setItem("userId", res.data);
      $(".wait-view").removeClass('d-none');
      $(".auth-view").addClass('d-none');
    });
}

function showLeaderBoard() {
  const gameCode = localStorage.getItem("gameCode");
  $('.leaderboard').empty();
  axios.get(`${baseUrl}/leaderboard?code=${gameCode}`)
    .then(res => {
      console.log(res.data);
      for (let member of res.data) {
        const item = document.createElement("div");
        $(item).html("<span class='member-score'>" + member.progress + "</span><span class='member-name'>" + member.name + "</span>");
        $(".leaderboard").append(item);
      }
    });
}

function updateProgress(level) {
  const gameCode = localStorage.getItem("gameCode");
  const userId = localStorage.getItem("userId")
  axios.post(`${baseUrl}/update-progress?code=${gameCode}`, {
    id: userId,
    level: level
  })
    .then(res => {
      console.log(res.data);
    });
}

function resetProgress() {
  currentLevel = 0;
  progress = blankProgress;
  localStorage.setItem("progress", JSON.stringify(progress));
  finished = false;

  $(".completed").removeClass("completed");
  loadLevel();
  $("#mCSB_2_container").css("top", 0); // Strange element to reset scroll due to scroll plugin
}

function checkCompleted(levelNumber) {
  if (progress.guessHistory[levelNumber]) {
    if (progress.guessHistory[levelNumber].correct) {
      return true;
    } else {
      return false;
    }
  } else {
    return false;
  }
}

function buildLevelmenu() {
  for (var i = 0; i < levels.length; i++) {
    var level = levels[i];
    var item = document.createElement("a");
    $(item).html("<span class='checkmark'></span><span class='level-number'>" + (i + 1) + "</span> Level: " + level.syntax);
    $(".level-menu .levels").append(item);

    if (checkCompleted(i)) {
      $(item).addClass("completed");
    }

    $(item).on("click", function () {
      finished = false;
      currentLevel = $(this).index();
      loadLevel();
      // closeMenu();
    });
  }
}

function hideTooltip() {
  $(".enhance").removeClass("enhance");
  $("[data-hovered]").removeAttr("data-hovered");
  $(".helper").hide();
}

function showTooltip(el) {
  if (finished) {
    return; // Only show tooltip if the game isn't finished yet
  }

  el.attr("data-hovered", true);
  var tableElements = $(".table *");
  var index = tableElements.index(el);
  var that = el;
  $(".markup > div *").eq(index).addClass("enhance").find("*").addClass("enhance");

  var helper = $(".helper");

  var pos = el.offset();
  helper.css("top", pos.top - 65);
  helper.css("left", pos.left + (el.width() / 2));

  var helpertext;

  var elType = el.get(0).tagName;
  elType = elType.toLowerCase();
  helpertext = '<' + elType;

  var elClass = el.attr("class");

  if (elClass) {
    if (elClass.indexOf("strobe") > -1) {
      elClass = elClass.replace("strobe", "");
    }
  }

  if (elClass) {
    helpertext = helpertext + ' class="' + elClass + '"';
  }

  var elFor = el.attr("for");

  if (elFor) {
    helpertext = helpertext + ' for="' + elFor + '"';
  }

  var id = el.attr("id");
  if (id) {
    helpertext = helpertext + ' id="' + id + '"';
  }

  helpertext = helpertext + '></' + elType + '>';
  helper.show();
  helper.text(helpertext);
}


//Animate the enter button
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

function showHelp() {

  var helpTitle = level.helpTitle || "";
  var help = level.help || "";
  var examples = level.examples || [];
  var selector = level.selector || "";
  var syntax = level.syntax || "";
  var syntaxExample = level.syntaxExample || "";
  var selectorName = level.selectorName || "";

  $(".display-help .syntax").html(syntax);
  $(".display-help .syntax-example").html(syntaxExample);
  $(".display-help .selector-name").html(selectorName);
  $(".display-help .title").html(helpTitle);
  $(".display-help .examples").html("");
  $(".display-help .examples-title").hide(); // Hide the "Examples" heading

  for (var i = 0; i < examples.length; i++) {
    var example = $("<div class='example'>" + examples[i] + "</div>");
    $(".display-help .examples").append(example);
    $(".display-help .examples-title").show(); // Show it if there are examples
  }

  $(".display-help .hint").html(help);
  $(".display-help .selector").text(selector);
}

function resetTable() {
  $(".display-help").removeClass("open-help");
  $(".clean,.strobe").removeClass("clean,strobe");
  $(".clean,.strobe").removeClass("clean,strobe");
  $(".editor-pane input").addClass("input-strobe");
  $(".table *").each(function () {
    $(this).width($(this).width());
  });

  var tableWidth = $(".table").outerWidth();
  $(".table-wrapper, .table-edge").width(tableWidth);
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
    updateProgress(currentLevel)
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

function showCode() {
  $('.check-code span').text(level.code);
}

function nextLevel() {
  var rule = $(".editor-pane input").val();
  var baseTable = $('.table');
  var ruleSelected = $(".table").find(rule).not(baseTable);

  if (Number($(".current .level-number").text()) === currentLevel + 1) {
    ruleSelected.removeClass("strobe");
    ruleSelected.addClass("clean");
    $(".editor-pane input").val("");
    $('.check-code span').text("");
    $(".input-wrapper").css("opacity", .2);
    currentLevel++;
  }
  loadLevel();
}

// Marks an individual number as completed or incompleted
// Just in the level heading though, not the level list
function updateProgressUI(levelNumber, completed) {
  if (completed) {
    $(".levels a:nth-child(" + (levelNumber + 1) + ")").addClass("completed");
    $(".level-header").addClass("completed");
  } else {
    $(".level-header").removeClass("completed");
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
  return ($(".table").html() == ruleTable.html());
}

// Returns all formatted markup within an element...

function getMarkup(el) {
  var hasChildren = el.children.length > 0 ? true : false;
  var elName = el.tagName.toLowerCase();
  var wrapperEl = $("<div/>");
  var attributeString = "";
  $.each(el.attributes, function () {
    if (this.specified) {
      attributeString = attributeString + ' ' + this.name + '="' + this.value + '"';
    }
  });
  var attributeSpace = "";
  if (attributeString.length > 0) {
    attributeSpace = " ";
  }
  if (hasChildren) {
    wrapperEl.text("<" + elName + attributeSpace + attributeString + ">");
    $(el.children).each(function (i, el) {
      wrapperEl.append(getMarkup(el));
    });
    wrapperEl.append("&lt;/" + elName + "&gt;");
  } else {
    wrapperEl.text("<" + elName + attributeSpace + attributeString + " />");
  }
  return wrapperEl;
}

//new board loader...

function loadBoard() {

  var boardString = level.board;  // just a placeholder to iterate over...
  boardMarkup = ""; // what is this
  var tableMarkup = ""; // what is this
  var editorMarkup = ""; // this is a string that represents the HTML
  showHelp();

  var markupHolder = $("<div/>")

  $(level.boardMarkup).each(function (i, el) {
    if (el.nodeType == 1) {
      var result = getMarkup(el);
      markupHolder.append(result);
    }
  });

  $(".table").html(level.boardMarkup);
  addNametags();
  $(".table *").addClass("pop");


  $(".markup").html('<div>&ltdiv class="table"&gt' + markupHolder.html() + '&lt/div&gt</div>');
}

// Adds nametags to the items on the table
function addNametags() {
  $(".nametags *").remove();
  $(".table-wrapper").css("transform", "rotateX(0)");
  $(".table-wrapper").width($(".table-wrapper").width());

  $(".table *").each(function () {
    if ($(this).attr("for")) {
      var pos = $(this).position();
      var width = $(this).width();
      var nameTag = $("<div class='nametag'>" + $(this).attr("for") + "</div>");
      $(".nametags").append(nameTag);
      var tagPos = pos.left + (width / 2) - nameTag.width() / 2 + 12;
      nameTag.css("left", tagPos);
    }
  });

  $(".table-wrapper").css("transform", "rotateX(20deg)");
}


function loadLevel() {
  // Make sure we don't load a level we don't have
  if (currentLevel < 0 || currentLevel >= levels.length) {
    currentLevel = 0;
  }

  hideTooltip();

  level = levels[currentLevel];

  $(".level-menu .current").removeClass("current");
  $(".level-menu div a").eq(currentLevel).addClass("current");

  var percent = (currentLevel + 1) / levels.length * 100;
  $(".progress").css("width", percent + "%");

  localStorage.setItem("currentLevel", currentLevel);

  if (currentLevel == levels.length - 1) {
    $(".next").addClass("d-none");
  } else {
    $(".next").removeClass("d-none");
  }

  loadBoard();
  resetTable();
  $('.check-code span').text("");

  $(".level-header .level-text").html("Level " + (currentLevel + 1) + " of " + levels.length);

  updateProgressUI(currentLevel, checkCompleted(currentLevel));

  $(".order").text(level.doThis);
  $(".editor-pane input").val("").focus();

  $(".input-wrapper").css("opacity", 1);
  $(".result").text("");

  //Strobe what's supposed to be selected
  setTimeout(function () {
    $(".table " + level.selector).addClass("strobe");
    $(".pop").removeClass("pop");
  }, 200);

}