require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const User = require('./models/user');
const Exercise = require('./models/exercise');

const app = express();

app.use(cors());
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// connect DB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB conectado correctamente"))
  .catch(err => console.error("Error conectando a MongoDB:", err));


// ---------------- ROUTES ----------------

// CREATE USER
app.post('/api/users', async (req, res) => {
  try {
    const user = new User({ username: req.body.username });
    await user.save();
    res.json({ username: user.username, _id: user._id });
  } catch (err) {
    res.json({ error: err.message });
  }
});

// GET ALL USERS
app.get('/api/users', async (req, res) => {
  const users = await User.find({}, 'username _id').exec();
  res.json(users);
});

// ADD EXERCISE
app.post('/api/users/:_id/exercises', async (req, res) => {
  try {
    const user = await User.findById(req.params._id).exec();
    if (!user) return res.json({ error: 'user not found' });

    const date = req.body.date ? new Date(req.body.date) : new Date();

    const exercise = new Exercise({
      userId: user._id,
      description: req.body.description,
      duration: Number(req.body.duration),
      date: date
    });

    await exercise.save();

    res.json({
      username: user.username,
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date.toDateString(),
      _id: user._id
    });

  } catch (err) {
    res.json({ error: err.message });
  }
});

// GET LOGS
app.get('/api/users/:_id/logs', async (req, res) => {
  try {
    const { from, to, limit } = req.query;
    const user = await User.findById(req.params._id).exec();
    if (!user) return res.json({ error: 'user not found' });

    let filter = { userId: user._id };

    if (from) filter.date = { ...filter.date, $gte: new Date(from) };
    if (to) filter.date = { ...filter.date, $lte: new Date(to) };

    let query = Exercise.find(filter);

    if (limit) query = query.limit(Number(limit));

    const exercises = await query.exec();

    const log = exercises.map(ex => ({
      description: ex.description,
      duration: ex.duration,
      date: ex.date.toDateString()
    }));

    res.json({
      username: user.username,
      _id: user._id,
      count: log.length,
      log: log
    });

  } catch (err) {
    res.json({ error: err.message });
  }
});

// ----------------------------------------

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
