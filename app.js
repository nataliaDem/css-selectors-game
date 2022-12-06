const express = require('express');
const path = require('path');
const router = express.Router();
const {addUser, getLeaderboard, updateProgress, createGame, startGame, getGameStatus} = require('./modules/storage.js');

const app = express();
const port = 3000;
app.use("/", router);

router.use(express.json({type: '*/*'}));
router.use('/public', express.static(path.join(__dirname, 'public')));

router.get('/api/health-check', async function (req, res) {
  res.send('App is running');
});

router.get('/', async function (req, res) {
  return res.sendFile("index.html", {root: __dirname});
});

router.get('/admin', async function (req, res) {
  return res.sendFile("admin.html", {root: __dirname});
});

router.get('/api/create-game', async function (req, res, next) {
  try {
    const code = createGame();
    res.json({code: code});
  } catch(err) {
    next(err);
  }
});

router.post('/api/auth', async function(req, res, next) {
  try {
    const user_name = req.body.name;
    const game_code = req.query.code;
    const userId = addUser(user_name, game_code);
    res.json({userId: userId});
  } catch(err) {
    next(err);
  }
});

router.post('/api/update-progress', async function(req, res, next) {
  try {
    const userId = req.body.id;
    const game_code = req.query.code;
    const completedLevel = req.body.level;
    const lastAnswerTime = req.body.lastAnswerTime
    updateProgress({userId, completedLevel, lastAnswerTime}, game_code)
    res.json({userId: userId});
  } catch(err) {
    next(err);
  }
});

router.get('/api/leaderboard', async function (req, res, next) {
  try {
    const leaderboard = await getLeaderboard(req.query.code);
    console.log(leaderboard);
    res.json(leaderboard);
  } catch(err) {
    next(err);
  }
});

router.post('/api/start-game', async function(req, res, next) {
  try {
    const game_code = req.query.code;
    const status = startGame(game_code);
    res.json({status: status});
  } catch(err) {
    next(err);
  }
});

router.get('/api/check-game-status', async function(req, res, next) {
  try {
    const game_code = req.query.code;
    const status = getGameStatus(game_code)
    res.json({status: status});
  } catch(err) {
    next(err);
  }
});

router.use(errorHandler);

app.listen(port, async function () {
  console.log(`I'm started on port ${port}!`);
});

function errorHandler (err, req, res, next) {
  console.error(err.stack)
  res.status(500)
  res.json({ error: err.stack })
}
