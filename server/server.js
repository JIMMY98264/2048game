const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'leaderboard.json');

app.use(bodyParser.json());
app.use((req, res, next) => {
  // 简单允许跨域，方便前端本地调试
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

function readList() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (e) {
    return [];
  }
}

function writeList(list) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2), 'utf8');
}

app.get('/leaderboard', (req, res) => {
  const list = readList();
  res.json(list);
});

app.post('/leaderboard', (req, res) => {
  const { name, score, time } = req.body || {};
  const { timeTo2048 } = req.body || {};
  if (!name || typeof score !== 'number') return res.status(400).json({ error: 'invalid' });
  const list = readList();
  const entry = { name: String(name).slice(0, 20), score: Number(score), time: time || Date.now() };
  if (timeTo2048 !== undefined && timeTo2048 !== null) entry.timeTo2048 = Number(timeTo2048);
  list.push(entry);
  list.sort((a, b) => b.score - a.score);
  const top = list.slice(0, 10);
  writeList(top);
  res.json({ ok: true, top });
});

app.listen(PORT, () => console.log(`Leaderboard server running on http://localhost:${PORT}`));
