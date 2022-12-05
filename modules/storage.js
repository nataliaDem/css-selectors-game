const games = new Map();

function _getGameInfo(code) {
  return games.get(code);
}

function _getUserInfo(code, userId) {
  return _getGameInfo(code).players.get(userId);
}

function createGame() {
  const code = Math.floor(Math.random() * (999999 - 100000) + 100000).toString();
  if (!games.has(code)) {
    const gameInfo = {
      status: "new",
      players: new Map()
    }
    games.set(code, gameInfo);
  }
  return code;
}

function addUser(user_name, code) {
  const index = _getGameInfo(code).players.size;
  _getGameInfo(code).players.set(index, {name: user_name, progress: 0, lastAnswerTime: 0});
  return index;
}

function updateProgress(details, code) {
  const index = Number(details.userId);
  const userInfo = _getUserInfo(code, index);
  userInfo.progress = details.completedLevel;
  userInfo.lastAnswerTime = details.lastAnswerTime;
  _getGameInfo(code).players.set(index, userInfo);
  console.log(`Updated: ${index}`);
}

function startGame(code) {
  _getGameInfo(code).status = "started";
}

function isGameStarted(code) {
  if ( _getGameInfo(code)) {
    return _getGameInfo(code).status === "started";
  } else {
    return false;
  }
}

function getLeaderboard(code) {
  if (_getGameInfo(code)) {
    const users = [..._getGameInfo(code).players.values()];
    const leaderboard = users.sort((a,b) => {
      if (b.progress === a.progress) {
        return a.lastAnswerTime - b.lastAnswerTime;
      } else {
        return b.progress - a.progress;
      }
    });
    return leaderboard;
  } else {
    return [];
  }
}

module.exports = {
  updateProgress,
  getLeaderboard,
  addUser,
  createGame,
  startGame,
  isGameStarted
}
