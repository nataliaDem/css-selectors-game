let level;
let finished = false;
const intervalTimeout = 1000;
const baseUrl = window.location.origin;
const showHelpTimeout = 3000;

var blankProgress = {
  totalCorrect: 0,
  percentComplete: 0,
  lastPercentEvent: 0,
  guessHistory: {}
}

const urlParams = new URLSearchParams(window.location.search);
const gameCode = urlParams.get("code") || localStorage.getItem("gameCode") || null;
let progress = JSON.parse(localStorage.getItem("progress")) || blankProgress;
if (gameCode) {
  localStorage.setItem("gameCode", gameCode);
  setCodeToUrlParams(gameCode);
}

$(document).ready(function () {

  // Custom scrollbar plugin
  $(".left-col, .level-menu, .leaderboard").mCustomScrollbar({
    scrollInertia: 0,
    autoHideScrollbar: true
  });

  $(".note-toggle").on("click", function () {
    if(!$(".note-toggle").hasClass('disabled')) {
      $(".note").slideToggle();
    }
  });

  $(".reset-progress").on("click", function () {
    resetProgress();
  });

  $(".editor").on("click", function () {
    $(".editor-pane input").focus();
  });

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

  $(".table-wrapper,.table-edge").css("opacity", 0);

  showLeaderBoard();

  setTimeout(function () {
    loadLevel();
    $(".table-wrapper,.table-edge").css("opacity", 1);
  }, 50);

  setInterval(function() {
    showLeaderBoard();
  }, intervalTimeout);

});

async function getGameStatus(gameCode) {
  return axios.get(`${baseUrl}/api/check-game-status?code=${gameCode}`)
    .then(res => {
      return res.data.status;
    });
}

function showLeaderBoard() {
  const gameCode = localStorage.getItem("gameCode");
  const userId = localStorage.getItem("userId");
  if (gameCode) {
    axios.get(`${baseUrl}/api/leaderboard?code=${gameCode}`)
      .then(res => {
        console.log(res.data);
        $('.leaderboard').empty();
        for (let [i, member] of res.data.entries()) {
          const item = document.createElement("div");
          if (i === 0) {
            $(item).addClass('leader');
          }
          if (i === 1) {
            $(item).addClass('second');
          }
          if (i === 2) {
            $(item).addClass('third');
          }
          $(item).html("<div><span class='member-rank'>" + (i + 1) + "</span>" +
            "<span class='member-name'>" + (userId && member.id === Number(userId) ? "> " : "") + member.name + "</span></div>" +
            "<div class='time'>" + formatTime(member.lastAnswerTime) +
            "<span class='member-score'>" + member.progress + "</span></div>");
          $(".leaderboard").append(item);
        }
      });
  }
}

function padTo2Digits(num) {
  return num.toString().padStart(2, '0');
}

function formatTime(timestamp) {
  if (!timestamp) {
    return "";
  }
  const date = new Date(timestamp)
  return [
    padTo2Digits(date.getHours()),
      padTo2Digits(date.getMinutes()),
      padTo2Digits(date.getSeconds()),
    ].join(':')
}

function resetProgress() {
  currentLevel = 0;
  progress = blankProgress;
  localStorage.setItem("progress", JSON.stringify(progress));
  localStorage.removeItem("gameCode");
  localStorage.removeItem("gameUser");
  localStorage.removeItem("gameStatus");
  localStorage.removeItem("userId");
  localStorage.removeItem("userIsLogged");
  finished = false;
  urlParams.delete("code");
  history.replaceState(null, null, "?"+urlParams.toString());

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

function updateProgressUI(levelNumber, completed) {
  if (completed) {
    $(".levels a:nth-child(" + (levelNumber + 1) + ")").addClass("completed");
    $(".level-header").addClass("completed");
  } else {
    $(".level-header").removeClass("completed");
  }
}

function getMarkup(el) {
  var hasChildren = el.children.length > 0;
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

function loadBoard() {

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

  $('.note-toggle').addClass('disabled');
  setTimeout(function () {
    $('.note-toggle').removeClass('disabled');
    showHelp();
  }, showHelpTimeout);

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

function setCodeToUrlParams(gameCode) {
  if (gameCode) {
    urlParams.set("code", gameCode);
    history.replaceState(null, null, "?"+urlParams.toString());
  }
}