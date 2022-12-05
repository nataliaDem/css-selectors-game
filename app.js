const express = require('express');
const path = require('path');
const router = express.Router();
const {addUser, getLeaderboard, updateProgress, createGame, startGame, isGameStarted} = require('./modules/storage.js');


const app = express();

const port = 3000;
app.use("/", router);

router.use(express.json({type: '*/*'}));
router.use('/public', express.static(path.join(__dirname, 'public')));

router.get('/', async function (req, res) {
  return res.sendFile("index.html", {root: __dirname});
});

router.get('/create-game', async function (req, res) {
  const code = createGame();
  res.end(code);
});

router.get('/admin', async function (req, res) {
  return res.sendFile("admin.html", {root: __dirname});
});

router.get('/health-check', async function (req, res) {
  res.send('App is running');
});

router.post('/auth', async function(req, res) {
  const user_name = req.body.name;
  const game_code = req.query.code;
  const userId = addUser(user_name, game_code);
  res.end(userId.toString());
});

router.post('/update-progress', async function(req, res) {
  const userId = req.body.id;
  const game_code = req.query.code;
  const completedLevel = req.body.level;
  const lastAnswerTime = req.body.lastAnswerTime
  updateProgress({userId, completedLevel, lastAnswerTime}, game_code)
  res.end(userId.toString());
});

router.get('/leaderboard', async function (req, res) {
  const leaderboard = await getLeaderboard(req.query.code);
  console.log(leaderboard);
  res.json(leaderboard);
});

router.post('/start-game', async function(req, res) {
  const game_code = req.query.code;
  startGame(game_code);
  res.end("Started");
});

router.get('/check-game-started', async function(req, res) {
  const game_code = req.query.code;
  res.end(isGameStarted(game_code).toString());
});

app.listen(port, async function () {
  console.log(`I'm started on port ${port}!`);
});

