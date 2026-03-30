const petShell = document.getElementById('pet-shell');
const pet = document.getElementById('pet');
const menu = document.getElementById('menu');
const live2dContainer = document.getElementById('pet-live2d');
const petSprite = document.getElementById('pet-sprite');
const speech = document.getElementById('speech');
const chatPanel = document.getElementById('chat-panel');
const chatInput = document.getElementById('chat-input');
const chatSend = document.getElementById('chat-send');
const menuViewportPadding = 4;

const defaultSpeech = '可以给我一个馒头吗？';
const restPrompt = '需要我陪你聊聊天吗？';
const maxChatInputLength = 24;
const maxReplyLength = 18;
const dessertSuggestions = [
  '今日甜点：桂花糖蒸栗糕，软糯清甜，闻起来像秋天。',
  '今日甜点：杨枝甘露，芒果香很足，冰冰凉凉正合适。',
  '今日甜点：奶油泡芙，一口咬开会有很满足的香草味。',
  '今日甜点：红豆双皮奶，奶香顺滑，收尾还有淡淡豆香。',
  '今日甜点：焦糖布丁，入口细腻，焦糖层微苦不腻。',
  '今日甜点：芋泥麻薯盒子，芋香很厚，麻薯拉丝也很稳。',
  '今日甜点：草莓大福，外皮柔软，咬下去先是果香。',
  '今日甜点：巴斯克芝士蛋糕，边缘微焦，中心很绵密。',
  '今日甜点：椰香西米露，清甜顺口，夏天吃刚刚好。',
  '今日甜点：抹茶千层，茶味清苦，奶香压得很舒服。',
  '今日甜点：杏仁豆腐，口感嫩滑，尾调有很轻的杏仁香。',
  '今日甜点：酒酿小圆子，软糯温热，甜味很柔和。',
  '今日甜点：可露丽，外壳焦脆，里面却是柔软湿润的。',
  '今日甜点：提拉米苏，咖啡味和奶香层次很完整。',
  '今日甜点：豆乳盒子，豆香自然，吃起来很轻盈。',
  '今日甜点：柚子慕斯，酸甜清爽，香气比较干净。',
  '今日甜点：蜜桃果冻杯，口感透明轻快，不会太甜。',
];
const readingQuotes = [
  {
    text: '路虽远，行则将至；事虽难，做则必成。',
    source: '《荀子·修身》',
  },
  {
    text: '山重水复疑无路，柳暗花明又一村。',
    source: '陆游《游山西村》',
  },
  {
    text: '长风破浪会有时，直挂云帆济沧海。',
    source: '李白《行路难》',
  },
  {
    text: '千里之行，始于足下。',
    source: '《道德经》',
  },
  {
    text: '纸上得来终觉浅，绝知此事要躬行。',
    source: '陆游《冬夜读书示子聿》',
  },
  {
    text: '欲穷千里目，更上一层楼。',
    source: '王之涣《登鹳雀楼》',
  },
  {
    text: '不积跬步，无以至千里。',
    source: '《荀子·劝学》',
  },
  {
    text: '会当凌绝顶，一览众山小。',
    source: '杜甫《望岳》',
  },
  {
    text: '海内存知己，天涯若比邻。',
    source: '王勃《送杜少府之任蜀州》',
  },
  {
    text: '落霞与孤鹜齐飞，秋水共长天一色。',
    source: '王勃《滕王阁序》',
  },
  {
    text: '博观而约取，厚积而薄发。',
    source: '苏轼《稼说送张琥》',
  },
  {
    text: '人生自有诗意，且以欢喜过生活。',
    source: '汪曾祺语',
  },
  {
    text: '少年辛苦终身事，莫向光阴惰寸功。',
    source: '杜荀鹤《题弟侄书堂》',
  },
  {
    text: '沉舟侧畔千帆过，病树前头万木春。',
    source: '刘禹锡《酬乐天扬州初逢席上见赠》',
  },
  {
    text: '山高自有客行路，水深自有渡船人。',
    source: '《增广贤文》',
  },
  {
    text: '读书不觉已春深，一寸光阴一寸金。',
    source: '王贞白《白鹿洞二首》',
  },
  {
    text: '凡心所向，素履以往。',
    source: '木心《从前慢》',
  },
  {
    text: '行到水穷处，坐看云起时。',
    source: '王维《终南别业》',
  },
  {
    text: '且将新火试新茶，诗酒趁年华。',
    source: '苏轼《望江南·超然台作》',
  },
  {
    text: '星光不问赶路人，时光不负有心人。',
    source: '网络常引句',
  },
];
const bubblePresets = {
  topCenter: { left: '50%', top: '132px', shiftX: '-50%', tailLeft: '50%' },
  topLeft: { left: '34%', top: '126px', shiftX: '-50%', tailLeft: '68%' },
  topRight: { left: '66%', top: '126px', shiftX: '-50%', tailLeft: '32%' },
  upperLeft: { left: '26%', top: '112px', shiftX: '-50%', tailLeft: '78%' },
  upperRight: { left: '74%', top: '112px', shiftX: '-50%', tailLeft: '22%' },
};
const restReplyRules = [
  {
    keywords: ['累', '困', '疲惫', '好忙', '辛苦'],
    replies: ['先歇一小会儿吧。', '抱抱你，缓口气。', '今天已经很努力了。'],
  },
  {
    keywords: ['开心', '高兴', '顺利', '好耶', '不错'],
    replies: ['那我也替你开心。', '听起来很棒呀。', '这份好心情收下了。'],
  },
  {
    keywords: ['难过', '委屈', '烦', '压力', '崩溃'],
    replies: ['我在，你慢慢说。', '先别急，我陪着你。', '不舒服就先停一下。'],
  },
  {
    keywords: ['饿', '吃', '饭', '奶茶', '甜点'],
    replies: ['想吃什么，我先记下。', '补充能量很重要。', '吃点喜欢的会好些。'],
  },
  {
    keywords: ['工作', '上班', '学习', '写代码', '作业'],
    replies: ['先做一点点也行。', '专注十分钟试试。', '我给你守着节奏。'],
  },
  {
    keywords: ['晚安', '睡觉', '休息'],
    replies: ['那就安心休息吧。', '盖好小被子哦。', '祝你做个好梦。'],
  },
];

const actionMap = {
  walk: {
    label: '自由散步',
    line: defaultSpeech,
    mood: 'idle',
    walking: true,
    prop: false,
    speed: 1.8,
  },
  dessert: {
    label: '吃甜点',
    line: defaultSpeech,
    mood: 'dessert',
    walking: false,
    prop: true,
    speed: 0,
  },
  book: {
    label: '看书',
    line: defaultSpeech,
    mood: 'book',
    walking: false,
    prop: true,
    speed: 0,
  },
  rest: {
    label: '休息一下',
    line: defaultSpeech,
    mood: 'rest',
    walking: false,
    prop: true,
    speed: 0,
  },
};

const state = {
  action: 'walk',
  dragging: false,
  activePointerId: null,
  dragDistance: 0,
  renderMode: 'css',
  skin: {
    mode: 'css',
    width: 150,
    height: 150,
    showBuiltInProps: true,
    images: {},
    live2d: {},
  },
  live2d: {
    app: null,
    model: null,
    loading: null,
  },
};

function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function setBubblePreset(name = 'topCenter') {
  const preset = bubblePresets[name] || bubblePresets.topCenter;
  speech.style.setProperty('--bubble-left', preset.left);
  speech.style.setProperty('--bubble-top', preset.top);
  speech.style.setProperty('--bubble-shift-x', preset.shiftX);
  speech.style.setProperty('--bubble-tail-left', preset.tailLeft);
}

function randomizeDessertBubble() {
  const names = ['topLeft', 'topCenter'];
  setBubblePreset(pickRandom(names));
}

function setRenderMode(mode) {
  state.renderMode = mode;
  pet.classList.toggle('image-mode', mode === 'image');
  pet.classList.toggle('live2d-mode', mode === 'live2d');
}

function getLive2dApi() {
  return window.PIXI && window.PIXI.live2d ? window.PIXI.live2d : null;
}

function ensureLive2dApp() {
  if (state.live2d.app) {
    return state.live2d.app;
  }

  const app = new window.PIXI.Application({
    width: state.skin.width,
    height: state.skin.height,
    transparent: true,
    autoStart: true,
    antialias: true,
  });

  live2dContainer.replaceChildren(app.view);
  state.live2d.app = app;
  return app;
}

function destroyLive2dModel() {
  if (state.live2d.model) {
    state.live2d.app.stage.removeChild(state.live2d.model);
    state.live2d.model.destroy();
    state.live2d.model = null;
  }
}

function resizeLive2dApp() {
  if (!state.live2d.app) {
    return;
  }

  state.live2d.app.renderer.resize(state.skin.width, state.skin.height);
}

function layoutLive2dModel() {
  if (!state.live2d.model) {
    return;
  }

  const { width, height, live2d = {} } = state.skin;
  const model = state.live2d.model;
  const scale = Number(live2d.scale) || 1;
  const offsetX = Number(live2d.offsetX) || 0;
  const offsetY = Number(live2d.offsetY) || 0;
  const fitScale = Math.min(width / model.width, height / model.height) * scale;

  model.scale.set(fitScale);
  model.anchor.set(0.5, 1);
  model.x = width / 2 + offsetX;
  model.y = height + offsetY;
}

async function loadLive2dModel() {
  const live2dApi = getLive2dApi();
  const modelPath = state.skin.live2d && state.skin.live2d.model;

  if (!live2dApi || !modelPath) {
    return false;
  }

  if (state.live2d.loading) {
    return state.live2d.loading;
  }

  state.live2d.loading = (async () => {
    try {
      const app = ensureLive2dApp();
      resizeLive2dApp();
      destroyLive2dModel();

      const model = await live2dApi.Live2DModel.from(encodeURI(modelPath), {
        autoInteract: false,
      });

      app.stage.addChild(model);
      state.live2d.model = model;
      layoutLive2dModel();
      return true;
    } catch (error) {
      console.error('Failed to load Live2D model:', error);
      destroyLive2dModel();
      return false;
    } finally {
      state.live2d.loading = null;
    }
  })();

  return state.live2d.loading;
}

async function ensureLive2dReady() {
  if (state.skin.mode !== 'live2d') {
    return false;
  }

  const loaded = await loadLive2dModel();
  if (!loaded) {
    setRenderMode('image');
    updateSprite();
    setSpeech('Live2D 模型未找到，先用静态形象顶上。');
  } else {
    setRenderMode('live2d');
  }
  return loaded;
}

async function performLive2dAction(action) {
  if (!state.live2d.model) {
    return;
  }

  const actionConfig = (state.skin.live2d && state.skin.live2d.actions && state.skin.live2d.actions[action]) || {};

  if (actionConfig.expression !== undefined) {
    try {
      await state.live2d.model.expression(actionConfig.expression);
    } catch (error) {
      console.warn('Failed to switch Live2D expression:', error);
    }
  }

  if (actionConfig.motion) {
    try {
      await state.live2d.model.motion(actionConfig.motion, actionConfig.index);
    } catch (error) {
      console.warn('Failed to play Live2D motion:', error);
    }
  }
}

function setSkin(config) {
  const skin = config && config.skin ? config.skin : {};
  state.skin = {
    mode: skin.mode || 'css',
    width: Number(skin.width) || 150,
    height: Number(skin.height) || 150,
    showBuiltInProps: skin.showBuiltInProps !== false,
    images: skin.images || {},
    live2d: skin.live2d || {},
  };

  document.documentElement.style.setProperty('--pet-width', `${state.skin.width}px`);
  document.documentElement.style.setProperty('--pet-height', `${state.skin.height}px`);
  setRenderMode(state.skin.mode === 'live2d' ? 'live2d' : state.skin.mode === 'image' ? 'image' : 'css');
  resizeLive2dApp();
  if (state.live2d.model) {
    layoutLive2dModel();
  }
  updateSprite();
}

function updateSprite() {
  if (state.renderMode === 'live2d') {
    petSprite.removeAttribute('src');
    return;
  }

  if (state.renderMode !== 'image') {
    petSprite.removeAttribute('src');
    return;
  }

  const nextImage =
    state.skin.images[state.action] ||
    state.skin.images.walk ||
    state.skin.images.idle ||
    '';

  if (nextImage) {
    petSprite.src = encodeURI(nextImage);
  }
}

function setFacing(direction) {
  pet.classList.toggle('facing-left', direction === 'left');
  pet.classList.toggle('facing-right', direction !== 'left');
}

function setSpeech(text, options = {}) {
  const { multiline = false } = options;
  speech.textContent = text || defaultSpeech;
  speech.classList.toggle('speech-bubble--multiline', multiline);
}

function clampChatText(text, maxLength) {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function showChatPanel() {
  petShell.classList.add('chat-open');
  chatPanel.classList.remove('hidden');
}

function hideChatPanel() {
  petShell.classList.remove('chat-open');
  chatPanel.classList.add('hidden');
  chatInput.value = '';
}

function buildChatReply(message) {
  const normalized = clampChatText(message, maxChatInputLength).toLowerCase();

  if (!normalized) {
    return '我在，慢慢说。';
  }

  const matchedRule = restReplyRules.find((rule) =>
    rule.keywords.some((keyword) => normalized.includes(keyword))
  );

  if (matchedRule) {
    return pickRandom(matchedRule.replies);
  }

  const snippet = clampChatText(message, 8);
  const fallback = `收到“${snippet}”啦。`;
  return clampChatText(fallback, maxReplyLength) || '我有在认真听。';
}

function handleChatSubmit() {
  if (state.action !== 'rest') {
    return;
  }

  const message = clampChatText(chatInput.value, maxChatInputLength);
  if (!message) {
    setSpeech('先告诉我一点点吧。');
    return;
  }

  chatInput.value = '';
  setBubblePreset('topCenter');
  setSpeech(buildChatReply(message));
}

function hideMenu() {
  menu.classList.add('hidden');
}

function positionMenu(x, y) {
  menu.classList.remove('hidden');
  const menuW = menu.offsetWidth;
  const menuH = menu.offsetHeight;
  const maxLeft = Math.max(menuViewportPadding, window.innerWidth - menuW - menuViewportPadding);
  const maxTop = Math.max(menuViewportPadding, window.innerHeight - menuH - menuViewportPadding);
  const nextLeft = Math.min(Math.max(x, menuViewportPadding), maxLeft);
  const nextTop = Math.min(Math.max(y, menuViewportPadding), maxTop);
  menu.style.left = `${nextLeft}px`;
  menu.style.top = `${nextTop}px`;
}

async function applyAction(action) {
  const next = actionMap[action];
  if (!next) {
    return;
  }

  let speechText = next.line;
  let multiline = false;

  if (action === 'dessert') {
    speechText = pickRandom(dessertSuggestions);
    multiline = true;
    randomizeDessertBubble();
  } else if (action === 'book') {
    const quote = pickRandom(readingQuotes);
    speechText = `${quote.text}\n${quote.source}`;
    multiline = true;
    setBubblePreset('topCenter');
  } else if (action === 'rest') {
    speechText = restPrompt;
    setBubblePreset('topCenter');
    showChatPanel();
  } else {
    setBubblePreset('topCenter');
    hideChatPanel();
  }

  if (action !== 'rest') {
    hideChatPanel();
  }

  state.action = action;
  petShell.classList.toggle('bubble-front', action === 'dessert' || action === 'book' || action === 'rest');
  pet.classList.remove('mood-idle', 'mood-dessert', 'mood-book', 'mood-rest', 'walking', 'show-prop');
  pet.classList.add(`mood-${next.mood}`);

  if (next.walking) {
    pet.classList.add('walking');
  }

  if (next.prop && state.skin.showBuiltInProps) {
    pet.classList.add('show-prop');
  }

  updateSprite();
  setSpeech(speechText, { multiline });
  window.desktopPet.setWalking(next.walking);
  window.desktopPet.setSpeed(next.speed);
  if (state.skin.mode === 'live2d') {
    await ensureLive2dReady();
    await performLive2dAction(action);
  }
}

petShell.addEventListener('pointerdown', (event) => {
  if (event.button !== 0 || menu.contains(event.target) || chatPanel.contains(event.target)) {
    return;
  }

  hideMenu();
  state.dragging = true;
  state.activePointerId = event.pointerId;
  state.dragDistance = 0;
  petShell.classList.add('dragging');
  window.desktopPet.setWalking(false);
  window.desktopPet.beginDrag({ x: event.screenX, y: event.screenY });
  petShell.setPointerCapture(event.pointerId);
});

window.addEventListener('pointermove', (event) => {
  if (!state.dragging || event.pointerId !== state.activePointerId) {
    return;
  }

  state.dragDistance += Math.abs(event.movementX) + Math.abs(event.movementY);
  window.desktopPet.dragWindow({ x: event.screenX, y: event.screenY });
});

function endDrag(event) {
  if (!state.dragging || event.pointerId !== state.activePointerId) {
    return;
  }

  const wasClick = state.dragDistance < 6;
  state.dragging = false;
  state.activePointerId = null;
  state.dragDistance = 0;
  petShell.classList.remove('dragging');
  if (petShell.hasPointerCapture(event.pointerId)) {
    petShell.releasePointerCapture(event.pointerId);
  }

  window.desktopPet.endDrag();
  if (state.action === 'walk') {
    window.desktopPet.setWalking(true);
  }

  if (wasClick && state.skin.mode === 'live2d' && state.live2d.model) {
    const rect = live2dContainer.getBoundingClientRect();
    state.live2d.model.tap(event.clientX - rect.left, event.clientY - rect.top);
  }
}

window.addEventListener('pointerup', endDrag);
window.addEventListener('pointercancel', endDrag);

window.addEventListener('contextmenu', (event) => {
  event.preventDefault();
  positionMenu(event.clientX, event.clientY);
});

window.addEventListener('pointerdown', (event) => {
  if (!menu.contains(event.target) && event.button !== 2) {
    hideMenu();
  }
});

menu.addEventListener('click', (event) => {
  event.preventDefault();
  const button = event.target.closest('button[data-action]');
  if (!button) {
    return;
  }

  if (button.dataset.action === 'quit') {
    window.desktopPet.quit();
    return;
  }

  applyAction(button.dataset.action);
  hideMenu();
});

chatSend.addEventListener('click', handleChatSubmit);

chatInput.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter') {
    return;
  }

  event.preventDefault();
  handleChatSubmit();
});

chatInput.addEventListener('input', () => {
  const limited = clampChatText(chatInput.value, maxChatInputLength);
  if (limited !== chatInput.value) {
    chatInput.value = limited;
  }
});

window.desktopPet.onDirectionChange((direction) => {
  setFacing(direction);
});

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    hideMenu();
  }
});

async function initialize() {
  const config = await window.desktopPet.getConfig();
  setSkin(config);
  setBubblePreset('topCenter');
  await ensureLive2dReady();
  await applyAction('walk');
}

initialize();