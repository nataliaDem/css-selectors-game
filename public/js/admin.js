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
    if (localStorage.getItem("gameStatus") === "active") {
      $('.start-game').addClass('d-none');
      $('.wait-view p').text('Leaderboard:');
    }
  } else {
    showStartViewForAdmin();
  }

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
  axios.get(`${baseUrl}/create-game`)
    .then(res => {
      showGameViewForAdmin(res.data);
      loadLevel();
      localStorage.setItem("gameCode", res.data);
      setCodeToUrlParams(res.data);
    });
}

function startGameByAdmin() {
  const gameCode = localStorage.getItem("gameCode");
  axios.post(`${baseUrl}/start-game?code=${gameCode}`)
    .then(res => {
      $('.start-game').addClass('d-none');
      $('.wait-view p').text('Leaderboard:');
      localStorage.setItem("gameStatus", "active");
    });
}

function copyGameUrlToClipboard() {
  const copyText = $('.game-link').text();
  navigator.clipboard.writeText(copyText);
}