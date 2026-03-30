const fs = require('fs');
const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');

app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');
app.commandLine.appendSwitch('disable-http-cache');

let petWindow;
let petConfig;
let dragState = null;
let movementState = {
  enabled: true,
  speed: 1.8,
  floorOffset: 24,
  velocity: {
    x: 1,
    y: -0.25,
  },
  changeDirectionAt: 0,
};
let animationTimer;
const ownThinkApiBaseUrl = 'https://api.ownthink.com/bot?spoken=';
const qingyunkeApiBaseUrl = 'http://api.qingyunke.com/api.php?key=free&appid=0&msg=';
const wikipediaSearchApiBaseUrl = 'https://zh.wikipedia.org/w/api.php?action=query&list=search&format=json&utf8=1&srsearch=';
const wikipediaSummaryApiBaseUrl = 'https://zh.wikipedia.org/api/rest_v1/page/summary/';
const comfortRules = [
  {
    keywords: ['累', '困', '疲惫', '辛苦', '好忙', '加班'],
    prefix: '抱抱你，先别太绷着。',
    suffix: '慢一点也没关系，我陪你。',
  },
  {
    keywords: ['难过', '伤心', '委屈', '烦', '压力', '崩溃'],
    prefix: '我在呢，你先缓一口气。',
    suffix: '不用急着把自己撑住，我会陪着你。',
  },
  {
    keywords: ['开心', '高兴', '顺利', '好耶', '不错', '成功'],
    prefix: '听起来真好呀。',
    suffix: '这份开心我也替你记下了。',
  },
  {
    keywords: ['饿', '吃', '奶茶', '甜点', '饭'],
    prefix: '先照顾好自己最重要。',
    suffix: '想吃什么就去吃一点吧。',
  },
  {
    keywords: ['工作', '上班', '学习', '写代码', '作业'],
    prefix: '别着急，我们一点点来。',
    suffix: '先做眼前这一小步就已经很好了。',
  },
];
const gentlePrefixes = ['嗯，我在呢。', '我有在认真听。', '没事，我陪着你。'];

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getWorkArea() {
  const display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
  return display.workArea;
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function chooseRandomVelocity(preferCurrentHorizontalDirection = false) {
  const angle = randomBetween(-Math.PI, Math.PI);
  const horizontalBias = preferCurrentHorizontalDirection && movementState.velocity.x !== 0 ? Math.sign(movementState.velocity.x) : 0;
  let velocityX = Math.cos(angle);
  let velocityY = Math.sin(angle);

  if (Math.abs(velocityX) < 0.25) {
    velocityX = horizontalBias || (Math.random() > 0.5 ? 0.4 : -0.4);
  }

  const length = Math.hypot(velocityX, velocityY) || 1;
  movementState.velocity = {
    x: velocityX / length,
    y: velocityY / length,
  };
  movementState.changeDirectionAt = Date.now() + randomBetween(1800, 4200);
}

function syncFacingDirection() {
  if (!petWindow || petWindow.isDestroyed()) {
    return;
  }

  petWindow.webContents.send('pet:direction', movementState.velocity.x < 0 ? 'left' : 'right');
}

function getDefaultPetConfig() {
  return {
    skin: {
      mode: 'image',
      width: 150,
      height: 150,
      showBuiltInProps: false,
      images: {
        walk: 'assets/skins/mocha/walk.svg',
        dessert: 'assets/skins/mocha/dessert.svg',
        book: 'assets/skins/mocha/book.svg',
        rest: 'assets/skins/mocha/rest.svg',
      },
    },
  };
}

function loadPetConfig() {
  const configPath = path.join(__dirname, 'pet.config.json');
  const defaults = getDefaultPetConfig();

  try {
    if (!fs.existsSync(configPath)) {
      return defaults;
    }

    const parsed = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    return {
      ...defaults,
      ...parsed,
      skin: {
        ...defaults.skin,
        ...(parsed.skin || {}),
        images: {
          ...defaults.skin.images,
          ...((parsed.skin && parsed.skin.images) || {}),
        },
      },
    };
  } catch (error) {
    console.error('Failed to load pet config:', error);
    return defaults;
  }
}

function normalizeRemoteReply(reply) {
  return String(reply || '')
    .replace(/\{br\}/g, '\n')
    .replace(/菲菲|主人/g, '馒头')
    .replace(/我会认真扮演好?温柔桌宠的角色[，。！!]?/g, '')
    .replace(/我会扮演好?温柔桌宠的角色[，。！!]?/g, '')
    .replace(/我会以温柔的态度和你聊天[，。！!]?/g, '')
    .replace(/让你感到舒适和放松[，。！!]?/g, '')
    .replace(/请告诉我你想聊什么话题呢[，。！!]?/g, '')
    .replace(/我会尽力回答你的问题并与你进行交流[，。！!]?/g, '')
    .replace(/你应该/g, '你可以试试')
    .replace(/必须/g, '可以先')
    .replace(/不行/g, '可能不太合适')
    .replace(/自己想办法/g, '我们再想想办法')
    .replace(/\r/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function looksLikeKnowledgeQuestion(message) {
  const normalized = String(message || '').trim();
  if (!normalized) {
    return false;
  }

  return /什么是|什么意思|谁是|是谁|为什么|怎么|如何|哪一年|哪年|哪里|介绍一下|科普一下|原理|定义|作用|用途|区别|历史|由来|发明|发现|是什么|为什么|怎么/.test(normalized);
}

async function fetchWikipediaSummary(message, signal) {
  const searchResponse = await fetch(`${wikipediaSearchApiBaseUrl}${encodeURIComponent(message)}`, {
    signal,
    headers: {
      Accept: 'application/json',
    },
  });

  if (!searchResponse.ok) {
    throw new Error(`Wikipedia search failed: ${searchResponse.status}`);
  }

  const searchPayload = await searchResponse.json();
  const firstResult = searchPayload && searchPayload.query && Array.isArray(searchPayload.query.search)
    ? searchPayload.query.search[0]
    : null;

  if (!firstResult || !firstResult.title) {
    return '';
  }

  const summaryResponse = await fetch(`${wikipediaSummaryApiBaseUrl}${encodeURIComponent(firstResult.title)}`, {
    signal,
    headers: {
      Accept: 'application/json',
    },
  });

  if (!summaryResponse.ok) {
    throw new Error(`Wikipedia summary failed: ${summaryResponse.status}`);
  }

  const summaryPayload = await summaryResponse.json();
  const extract = normalizeRemoteReply(summaryPayload.extract || '');

  if (!extract) {
    return '';
  }

  const intro = `我帮你查了一下，${firstResult.title}是这样的：`;
  return `${intro}${extract}`;
}

function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function softenChatReply(message, reply) {
  const normalizedMessage = String(message || '').toLowerCase();
  let softened = normalizeRemoteReply(reply);

  if (!softened) {
    return softened;
  }

  const matchedRule = comfortRules.find((rule) =>
    rule.keywords.some((keyword) => normalizedMessage.includes(keyword))
  );

  if (matchedRule) {
    if (!softened.includes(matchedRule.prefix)) {
      softened = `${matchedRule.prefix}${softened}`;
    }
    if (!softened.includes(matchedRule.suffix)) {
      softened = `${softened}${/[。！？!?]$/.test(softened) ? '' : '。'}${matchedRule.suffix}`;
    }
  } else if (!/^嗯|^好呀|^别急|^没事|^抱抱你|^我在/.test(softened)) {
    softened = `${pickRandom(gentlePrefixes)}${softened}`;
  }

  return softened
    .replace(/([。！？!?])\1+/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchOwnThinkReply(message, signal) {
  const response = await fetch(`${ownThinkApiBaseUrl}${encodeURIComponent(message)}`, {
    signal,
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`OwnThink request failed: ${response.status}`);
  }

  const payload = await response.json();
  const content = payload && payload.data && payload.data.info ? payload.data.info.text : '';
  const normalized = normalizeRemoteReply(content);

  if (payload.status !== 0 || !normalized) {
    throw new Error('OwnThink returned an empty reply.');
  }

  return softenChatReply(message, normalized);
}

async function fetchQingyunkeReply(message, signal) {
  const response = await fetch(`${qingyunkeApiBaseUrl}${encodeURIComponent(message)}`, {
    signal,
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Qingyunke request failed: ${response.status}`);
  }

  const payload = await response.json();
  const normalized = normalizeRemoteReply(payload.content);

  if (payload.result !== 0 || !normalized) {
    throw new Error('Qingyunke returned an empty reply.');
  }

  return softenChatReply(message, normalized);
}

async function fetchChatReply(message) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    if (looksLikeKnowledgeQuestion(message)) {
      try {
        const wikiReply = await fetchWikipediaSummary(message, controller.signal);
        if (wikiReply) {
          return wikiReply;
        }
      } catch (error) {
        console.warn('Failed to fetch Wikipedia summary:', error);
      }
    }

    try {
      return await fetchOwnThinkReply(message, controller.signal);
    } catch (error) {
      console.warn('Failed to fetch OwnThink reply:', error);
    }

    return await fetchQingyunkeReply(message, controller.signal);
  } finally {
    clearTimeout(timeoutId);
  }
}

function moveToFloor(x) {
  if (!petWindow || petWindow.isDestroyed()) {
    return;
  }

  const bounds = petWindow.getBounds();
  const workArea = getWorkArea();
  const nextX = clamp(x, workArea.x, workArea.x + workArea.width - bounds.width);
  const nextY = workArea.y + workArea.height - bounds.height - movementState.floorOffset;

  petWindow.setBounds({
    x: Math.round(nextX),
    y: Math.round(nextY),
    width: bounds.width,
    height: bounds.height,
  });
}

function tickMovement() {
  if (!petWindow || petWindow.isDestroyed() || !movementState.enabled) {
    return;
  }

  const bounds = petWindow.getBounds();
  const workArea = getWorkArea();
  const minX = workArea.x;
  const maxX = workArea.x + workArea.width - bounds.width;
  const minY = workArea.y;
  const maxY = workArea.y + workArea.height - bounds.height;

  if (Date.now() >= movementState.changeDirectionAt) {
    chooseRandomVelocity(true);
    syncFacingDirection();
  }

  let nextX = bounds.x + movementState.velocity.x * movementState.speed;
  let nextY = bounds.y + movementState.velocity.y * movementState.speed;
  let bounced = false;

  if (nextX <= minX || nextX >= maxX) {
    movementState.velocity.x *= -1;
    nextX = clamp(nextX, minX, maxX);
    bounced = true;
  }

  if (nextY <= minY || nextY >= maxY) {
    movementState.velocity.y *= -1;
    nextY = clamp(nextY, minY, maxY);
    bounced = true;
  }

  if (bounced) {
    movementState.changeDirectionAt = Date.now() + randomBetween(900, 2200);
    syncFacingDirection();
  }

  petWindow.setPosition(Math.round(nextX), Math.round(nextY));
}

function createWindow() {
  petConfig = loadPetConfig();
  const petWidth = petConfig.skin.width || 150;
  const petHeight = petConfig.skin.height || 150;
  const bubbleWidthPadding = 180;
  const bubbleHeightPadding = 310;
  const windowWidth = Math.max(260, petWidth + bubbleWidthPadding);
  const windowHeight = Math.max(300, petHeight + bubbleHeightPadding);

  petWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    frame: false,
    transparent: true,
    resizable: false,
    hasShadow: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  petWindow.setAlwaysOnTop(true, 'screen-saver');
  petWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  petWindow.setMenuBarVisibility(false);
  petWindow.loadFile('index.html');

  const workArea = screen.getPrimaryDisplay().workArea;
  petWindow.setPosition(
    workArea.x + Math.round(workArea.width * 0.2),
    workArea.y + workArea.height - windowHeight - movementState.floorOffset
  );

  petWindow.webContents.once('did-finish-load', () => {
    petWindow.webContents.send('pet:config', petConfig);
    chooseRandomVelocity();
    syncFacingDirection();
  });

  petWindow.on('closed', () => {
    petWindow = null;
    dragState = null;
  });
}

app.whenReady().then(() => {
  createWindow();
  animationTimer = setInterval(tickMovement, 16);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

ipcMain.handle('pet:get-screen-size', () => {
  return getWorkArea();
});

ipcMain.handle('pet:get-config', () => {
  return petConfig || loadPetConfig();
});

ipcMain.handle('pet:chat', async (_event, message) => {
  const normalized = String(message || '').trim();
  if (!normalized) {
    return '';
  }

  try {
    return await fetchChatReply(normalized);
  } catch (error) {
    console.warn('Failed to fetch remote chat reply:', error);
    return '';
  }
});

ipcMain.on('pet:set-walking', (_event, enabled) => {
  movementState.enabled = Boolean(enabled);
  if (movementState.enabled) {
    chooseRandomVelocity(true);
    syncFacingDirection();
  }
});

ipcMain.on('pet:set-speed', (_event, speed) => {
  const numericSpeed = Number(speed);
  if (!Number.isNaN(numericSpeed)) {
    movementState.speed = clamp(numericSpeed, 0.8, 5);
  }
});

ipcMain.on('pet:set-direction', (_event, direction) => {
  movementState.velocity.x = Math.abs(movementState.velocity.x || 1) * (direction === 'left' ? -1 : 1);
  syncFacingDirection();
});

ipcMain.on('pet:start-drag', (_event, cursorPoint) => {
  if (!petWindow || petWindow.isDestroyed()) {
    return;
  }

  dragState = {
    startCursor: {
      x: Number(cursorPoint && cursorPoint.x) || 0,
      y: Number(cursorPoint && cursorPoint.y) || 0,
    },
    startBounds: petWindow.getBounds(),
  };
});

ipcMain.on('pet:update-drag', (_event, cursorPoint) => {
  if (!petWindow || petWindow.isDestroyed() || !dragState) {
    return;
  }

  const workArea = getWorkArea();
  const bounds = dragState.startBounds;
  const currentX = Number(cursorPoint && cursorPoint.x) || dragState.startCursor.x;
  const currentY = Number(cursorPoint && cursorPoint.y) || dragState.startCursor.y;
  const nextX = clamp(
    dragState.startBounds.x + (currentX - dragState.startCursor.x),
    workArea.x,
    workArea.x + workArea.width - bounds.width
  );
  const nextY = clamp(
    dragState.startBounds.y + (currentY - dragState.startCursor.y),
    workArea.y,
    workArea.y + workArea.height - bounds.height
  );
  petWindow.setPosition(Math.round(nextX), Math.round(nextY));
});

ipcMain.on('pet:end-drag', () => {
  dragState = null;
});

ipcMain.on('pet:snap-to-floor', () => {
  if (!petWindow || petWindow.isDestroyed()) {
    return;
  }

  moveToFloor(petWindow.getBounds().x);
});

ipcMain.on('pet:quit', () => {
  app.quit();
});

app.on('window-all-closed', () => {
  if (animationTimer) {
    clearInterval(animationTimer);
  }

  if (process.platform !== 'darwin') {
    app.quit();
  }
});