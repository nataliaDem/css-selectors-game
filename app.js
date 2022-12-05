const express = require('express');
const path = require('path');
const router = express.Router();
const {addUser, getLeaderboard, updateProgress, createGame, startGame, getGameStatus} = require('./modules/storage.js');


const app = express();

const port = 3000;
app.use("/", router);

router.use(express.json({type: '*/*'}));
router.use('/public', express.static(path.join(__dirname, 'public')));

router.get('/', async function (req, res) {
  return res.sendFile("index.html", {root: __dirname});
});

router.get('/api/create-game', async function (req, res) {
  const code = createGame();
  res.json({code: code});
});

router.get('/admin', async function (req, res) {
  return res.sendFile("admin.html", {root: __dirname});
});

router.get('/api/health-check', async function (req, res) {
  res.send('App is running');
});

router.post('/api/auth', async function(req, res) {
  const user_name = req.body.name;
  const game_code = req.query.code;
  const userId = addUser(user_name, game_code);
  res.json({userId: userId});
});

router.post('/api/update-progress', async function(req, res) {
  const userId = req.body.id;
  const game_code = req.query.code;
  const completedLevel = req.body.level;
  const lastAnswerTime = req.body.lastAnswerTime
  updateProgress({userId, completedLevel, lastAnswerTime}, game_code)
  res.json({userId: userId});
});

router.get('/api/leaderboard', async function (req, res) {
  const leaderboard = await getLeaderboard(req.query.code);
  console.log(leaderboard);
  res.json(leaderboard);
});

router.post('/api/start-game', async function(req, res) {
  const game_code = req.query.code;
  const status = startGame(game_code);
  res.json({status: status});
});

router.get('/api/check-game-status', async function(req, res) {
  const game_code = req.query.code;
  const status = getGameStatus(game_code)
  res.json({status: status});
});

app.listen(port, async function () {
  console.log(`I'm started on port ${port}!`);
});

