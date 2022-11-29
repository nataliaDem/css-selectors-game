const games = new Map();

function _getGameInfo(code) {
  return games.get(code);
}

function _getUserInfo(code, userId) {
  return _getGameInfo(code).get(userId);
}

function createGame() {
  const code = Math.floor(Math.random() * (999999 - 100000) + 100000).toString();
  if (!games.has(code)) {
    games.set(code, new Map());
  }
  return code;
}

function addUser(user_name, code) {
  const index = _getGameInfo(code).size;
  _getGameInfo(code).set(index, {name: user_name, progress: 0});
  return index;
}

function updateProgress(details, code) {
  const index = Number(details.userId);
  const userInfo = _getUserInfo(code, index);
  userInfo.progress = details.completedLevel;
  _getGameInfo(code).set(index, userInfo);
  console.log(`Updated: ${index}`);
}

function getLeaderboard(code) {
  const users = [..._getGameInfo(code).values()];
  const leaderboard = users.sort((a,b) => {
    return b.progress - a.progress;
  });
  return leaderboard;
}

module.exports = {
  updateProgress,
  getLeaderboard,
  addUser,
  createGame
}
