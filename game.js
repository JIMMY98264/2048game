// 2048 简洁实现（含分数与本地排行榜）
// 作者：生成代码。注释以便后期维护。

const GRID_SIZE = 4;
const START_TILES = 2;
const STORAGE_BEST_KEY = '2048_best';
const STORAGE_LEADER_KEY = '2048_leaderboard';

let grid = [];
let score = 0;
let best = 0;
let startTime = null; // 游戏开始时间（ms timestamp）
let timerInterval = null; // 计时器定时器 id
let reached2048Time = null; // 首次出现 2048 的耗时（ms），未出现为 null

// DOM 元素
const gridEl = document.getElementById('grid');
const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');
const newGameBtn = document.getElementById('new-game');
const gameOverModal = document.getElementById('game-over');
const finalScoreEl = document.getElementById('final-score');
const playerNameInput = document.getElementById('player-name');
const saveScoreBtn = document.getElementById('save-score');
const restartBtn = document.getElementById('restart');
const showLeaderBtn = document.getElementById('show-leaderboard');
const leaderboardModal = document.getElementById('leaderboard');
const leaderListEl = document.getElementById('leader-table');
const closeLeaderBtn = document.getElementById('close-leaderboard');
const clearLeaderBtn = document.getElementById('clear-leaderboard');
const elapsedEl = document.getElementById('elapsed');

// 初始化
function init() {
  best = parseInt(localStorage.getItem(STORAGE_BEST_KEY)) || 0;
  bestEl.textContent = best;
  buildGrid();
  setupEventListeners();
  newGame();
}

// 构建网格空DOM结构（仅一次）
function buildGrid() {
  gridEl.innerHTML = '';
  const row = document.createElement('div');
  row.className = 'grid-row';
  // 创建 4x4 的空格作为背景网格
  for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    row.appendChild(cell);
  }
  gridEl.appendChild(row);
}

// 新游戏
function newGame() {
  score = 0;
  updateScore(0);
  grid = createEmptyGrid();
  for (let i = 0; i < START_TILES; i++) addRandomTile();
  render();
  hideGameOver();
  // 计时初始化
  startTime = Date.now();
  reached2048Time = null;
  startTimer();
}

function startTimer(){
  stopTimer();
  updateElapsedDisplay(0);
  timerInterval = setInterval(() => {
    const elap = Date.now() - startTime;
    updateElapsedDisplay(elap);
  }, 1000);
}

function stopTimer(){ if (timerInterval) { clearInterval(timerInterval); timerInterval = null; } }

function updateElapsedDisplay(ms){ elapsedEl.textContent = formatTime(ms); }

function formatTime(ms){
  if (!ms && ms !== 0) return '00:00';
  const total = Math.floor(ms/1000);
  const m = Math.floor(total/60).toString().padStart(2,'0');
  const s = (total%60).toString().padStart(2,'0');
  return `${m}:${s}`;
}

function createEmptyGrid() {
  const g = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    g[r] = [];
    for (let c = 0; c < GRID_SIZE; c++) g[r][c] = 0;
  }
  return g;
}

// 随机添加 2 或 4
function addRandomTile() {
  const empties = [];
  for (let r = 0; r < GRID_SIZE; r++) for (let c = 0; c < GRID_SIZE; c++) if (!grid[r][c]) empties.push([r, c]);
  if (empties.length === 0) return false;
  const [r, c] = empties[Math.floor(Math.random() * empties.length)];
  grid[r][c] = Math.random() < 0.9 ? 2 : 4;
  return true;
}

// 渲染 tile
function render() {
  // 清除之前的 tile
  const existing = gridEl.querySelectorAll('.tile');
  existing.forEach(n => n.remove());

  // 网格尺寸与单元格尺寸
  const rect = gridEl.getBoundingClientRect();
  const padding = 12; // 与 css gap 对应
  const cellSize = (rect.width - padding * 3 - 12) / GRID_SIZE; // 12来自grid内边距调整

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const val = grid[r][c];
      if (!val) continue;
      const tile = document.createElement('div');
      tile.className = `tile value-${val}`;
      tile.textContent = val;
      // 计算位置（absolute）
      const gap = 12;
      const startX = 6 + c * (cellSize + gap);
      const startY = 6 + r * (cellSize + gap);
      tile.style.width = `${cellSize}px`;
      tile.style.height = `${cellSize}px`;
      tile.style.left = `${startX}px`;
      tile.style.top = `${startY}px`;
      tile.style.fontSize = val > 512 ? '14px' : '';
      gridEl.appendChild(tile);
    }
  }
}

// 更新分数并保存最佳
function updateScore(delta) {
  if (delta > 0) showScoreGain(delta);
  score += delta;
  scoreEl.textContent = score;
  if (score > best) {
    best = score;
    bestEl.textContent = best;
    localStorage.setItem(STORAGE_BEST_KEY, best);
  }
}

// 显示分数增加的浮动动画（自动移除）
function showScoreGain(delta) {
  const rect = scoreEl.getBoundingClientRect();
  const el = document.createElement('div');
  el.className = 'score-float';
  el.textContent = `+${delta}`;
  document.body.appendChild(el);
  // 初始位置放到 score 元素右上方
  el.style.left = `${rect.left + rect.width + 6}px`;
  el.style.top = `${rect.top - 4}px`;
  // 强制重绘以触发 CSS 动画
  void el.offsetWidth;
  el.classList.add('animate');
  setTimeout(() => el.remove(), 900);
}

// 方向移动接口：'left','right','up','down'
function move(dir) {
  let moved = false;
  // 将任意方向的移动转化为向左移动，方法：旋转矩阵
  let rotated = rotateGridForDirection(grid, dir);
  for (let r = 0; r < GRID_SIZE; r++) {
    const {newRow, gained, changed} = compressAndMerge(rotated[r]);
    rotated[r] = newRow;
    if (gained) updateScore(gained);
    if (changed) moved = true;
  }
  // 反向旋转回原始朝向
  grid = rotateGridBack(rotated, dir);
  if (moved) {
    addRandomTile();
    render();
    // 检查是否首次出现 2048
    checkReached2048();
    if (isGameOver()) showGameOver();
  }
}

// 将每行压缩向左并合并，返回新行、得分增量、是否发生变化
function compressAndMerge(row) {
  const original = row.slice();
  const tight = row.filter(v => v !== 0);
  let gained = 0;
  for (let i = 0; i < tight.length - 1; i++) {
    if (tight[i] === tight[i + 1]) {
      tight[i] *= 2;
      gained += tight[i];
      tight.splice(i + 1, 1);
    }
  }
  while (tight.length < GRID_SIZE) tight.push(0);
  const changed = tight.some((v, i) => v !== original[i]);
  return { newRow: tight, gained, changed };
}

// 每次渲染后或移动后检查首个2048出现时间
function checkReached2048(){
  if (reached2048Time !== null) return;
  for (let r=0; r<GRID_SIZE; r++) for (let c=0; c<GRID_SIZE; c++) if (grid[r][c] === 2048) {
    reached2048Time = Date.now() - startTime;
    return;
  }
}

// 旋转辅助函数：把任意方向的移动转换成向左移动的情况
function rotateGridForDirection(g, dir) {
  // 深拷贝
  let m = g.map(row => row.slice());
  if (dir === 'left') return m;
  if (dir === 'right') return m.map(row => row.slice().reverse());
  if (dir === 'up') return transpose(m);
  if (dir === 'down') return transpose(m).map(row => row.slice().reverse());
  return m;
}

function rotateGridBack(m, dir) {
  if (dir === 'left') return m;
  if (dir === 'right') return m.map(row => row.slice().reverse());
  if (dir === 'up') return transpose(m);
  if (dir === 'down') return transpose(m.map(row => row.slice().reverse()));
  return m;
}

function transpose(m) {
  const res = createEmptyGrid();
  for (let r = 0; r < GRID_SIZE; r++) for (let c = 0; c < GRID_SIZE; c++) res[r][c] = m[c][r];
  return res;
}

// 检查是否无路可走
function isGameOver() {
  // 有空格即未结束
  for (let r = 0; r < GRID_SIZE; r++) for (let c = 0; c < GRID_SIZE; c++) if (grid[r][c] === 0) return false;
  // 检查相邻可合并
  for (let r = 0; r < GRID_SIZE; r++) for (let c = 0; c < GRID_SIZE - 1; c++) if (grid[r][c] === grid[r][c + 1]) return false;
  for (let c = 0; c < GRID_SIZE; c++) for (let r = 0; r < GRID_SIZE - 1; r++) if (grid[r][c] === grid[r + 1][c]) return false;
  return true;
}

// 显示游戏结束弹窗
function showGameOver() {
  finalScoreEl.textContent = score;
  gameOverModal.classList.remove('hidden');
  stopTimer();
  // 在模态中显示首个2048用时（若有）
  const finalTimeEl = document.getElementById('final-time2048');
  finalTimeEl.textContent = reached2048Time != null ? formatTime(reached2048Time) : '✖';
}
function hideGameOver() { gameOverModal.classList.add('hidden'); }

// 事件绑定
function setupEventListeners() {
  window.addEventListener('keydown', e => {
    const keyMap = {
      ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
      a: 'left', d: 'right', w: 'up', s: 'down'
    };
    const dir = keyMap[e.key];
    if (dir) { e.preventDefault(); move(dir); }
  });

  // 移动端触摸：简单实现
  let touchStart = null;
  window.addEventListener('touchstart', e => { if (e.touches.length === 1) touchStart = [e.touches[0].clientX, e.touches[0].clientY]; });
  window.addEventListener('touchend', e => {
    if (!touchStart) return;
    const dx = e.changedTouches[0].clientX - touchStart[0];
    const dy = e.changedTouches[0].clientY - touchStart[1];
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 20) move('right'); else if (dx < -20) move('left');
    } else {
      if (dy > 20) move('down'); else if (dy < -20) move('up');
    }
    touchStart = null;
  });

  newGameBtn.addEventListener('click', () => newGame());

  saveScoreBtn.addEventListener('click', async () => {
      const name = (playerNameInput.value || '匿名').slice(0, 20);
      const timeTo2048 = reached2048Time !== null ? reached2048Time : null;
      await saveScoreToLeaderboard(name, score, timeTo2048);
      playerNameInput.value = '';
      hideGameOver();
      await renderLeaderboard();
      leaderboardModal.classList.remove('hidden');
    });

  restartBtn.addEventListener('click', () => { hideGameOver(); newGame(); });

  showLeaderBtn.addEventListener('click', () => { renderLeaderboard(); leaderboardModal.classList.remove('hidden'); });
  closeLeaderBtn.addEventListener('click', () => leaderboardModal.classList.add('hidden'));
  clearLeaderBtn.addEventListener('click', () => { localStorage.removeItem(STORAGE_LEADER_KEY); renderLeaderboard(); });
}

// 排行榜：将分数保存到本地（保持前 10）
async function saveScoreToLeaderboard(name, sc, timeTo2048=null) {
  // 先尝试发送到服务器；失败时回退到本地保存
  try {
    const res = await saveScoreToServer(name, sc);
    if (res && res.ok) return true;
  } catch (e) {
    // 忽略，回退到本地
  }
  // 本地回退（保持兼容）
  const list = getLeaderboardLocal();
  list.push({ name, score: sc, time: Date.now(), timeTo2048 });
  list.sort((a, b) => b.score - a.score);
  const top = list.slice(0, 10);
  localStorage.setItem(STORAGE_LEADER_KEY, JSON.stringify(top));
  return false;
}

function getLeaderboardLocal() {
  try { return JSON.parse(localStorage.getItem(STORAGE_LEADER_KEY)) || []; } catch (e) { return []; }
}

// 渲染排行榜：优先从后端获取，失败时回退到本地数据
async function renderLeaderboard() {
  // 不要清空整个表格（会丢失 thead/tbody），渲染时由 renderLeaderTable 清理 tbody
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 2000);
    const res = await fetch('http://localhost:3000/leaderboard', { signal: controller.signal });
    clearTimeout(id);
    if (res.ok) {
      const list = await res.json();
      renderLeaderTable(list, 'server');
      return;
    }
  } catch (e) {
    // 网络/跨域/未启动服务器等问题，回退到本地
  }
  // 本地回退
  const list = getLeaderboardLocal();
  renderLeaderTable(list, 'local');
}

function renderLeaderTable(list, source) {
  const tbody = leaderListEl.querySelector('tbody');
  tbody.innerHTML = '';
  if (!list || list.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td'); td.colSpan = 6; td.textContent = '还没有记录'; tr.appendChild(td); tbody.appendChild(tr); return;
  }
  list.forEach((item, idx) => {
    const tr = document.createElement('tr');
    const rankTd = document.createElement('td'); rankTd.textContent = idx + 1; tr.appendChild(rankTd);
    const nameTd = document.createElement('td'); nameTd.textContent = item.name; tr.appendChild(nameTd);
    const scoreTd = document.createElement('td'); scoreTd.textContent = item.score; tr.appendChild(scoreTd);
    const dateTd = document.createElement('td'); dateTd.textContent = new Date(item.time).toLocaleString(); tr.appendChild(dateTd);
    const t2048Td = document.createElement('td'); t2048Td.textContent = item.timeTo2048 != null ? formatTime(item.timeTo2048) : '✖'; tr.appendChild(t2048Td);
    const srcTd = document.createElement('td');
    const badge = document.createElement('span'); badge.className = `badge ${source==='server'?'server':'local'}`;
    badge.textContent = source === 'server' ? '服务器' : '本地'; srcTd.appendChild(badge); tr.appendChild(srcTd);
    tbody.appendChild(tr);
  });
}

// 将分数发送到后端服务（需在本地运行 server）
async function saveScoreToServer(name, sc) {
  // 发送额外字段 timeTo2048（若有）
  const body = { name, score: sc, time: Date.now(), timeTo2048: reached2048Time !== null ? reached2048Time : null };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);
  try {
    const res = await fetch('http://localhost:3000/leaderboard', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: controller.signal
    });
    clearTimeout(timeout);
    return res;
  } catch (e) {
    clearTimeout(timeout);
    throw e;
  }
}

// 首次渲染及窗口 resize 时重绘（保证 tile 大小正确）
window.addEventListener('resize', () => render());

// 启动
init();
