let currentLevel = 0;
levels = levels.slice(0,1);

localStorage.setItem("userRole", "admin");

$(document).ready(function () {

  $(".game-code, .game-link").on("click", function () {
    copyGameUrlToClipboard();
  });

  $(".create-game").on("click", function () {
    createNewGame();
  });

  $(".start-game").on("click", function () {
    startGameByAdmin();
  });

  if (Number(localStorage.getItem("gameCode"))) {
    showGameViewForAdmin(gameCode);
    if (localStorage.getItem("gameStatus") === STATUSES.ACTIVE) {
      $('.start-game').addClass('d-none');
      $('.wait-view p').text('Leaderboard:');
    }
  } else {
    showStartViewForAdmin();
  }

  $(".reset-progress").on("click", function () {
    showStartViewForAdmin();
  });

});

function showStartViewForAdmin() {
  $(".game-view, .wait-view").addClass('d-none');
  $(".create-view").removeClass('d-none');
}

function showGameViewForAdmin(code) {
  $('.game-code').text(code);
  $('.game-link').text(`${baseUrl}/?code=${code}`);
  $(".create-view").addClass('d-none');
  $(".wait-view, .game-view").removeClass('d-none');
}

function createNewGame() {
  axios.get(`${baseUrl}/api/create-game`)
    .then(res => {
      showGameViewForAdmin(res.data.code);
      $('.start-game').removeClass('d-none');
      loadLevel();
      localStorage.setItem("gameCode", res.data.code);
      setCodeToUrlParams(res.data.code);
    });
}

function startGameByAdmin() {
  const gameCode = localStorage.getItem("gameCode");
  axios.post(`${baseUrl}/api/start-game?code=${gameCode}`)
    .then(res => {
      $('.start-game').addClass('d-none');
      $('.wait-view p').text('Leaderboard:');
      localStorage.setItem("gameStatus", res.data.status);
    });
}

function copyGameUrlToClipboard() {
  const copyText = $('.game-link').text();
  navigator.clipboard.writeText(copyText);
}