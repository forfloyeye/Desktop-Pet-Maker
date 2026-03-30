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