const screens = document.querySelectorAll(".screen");
const navButtons = document.querySelectorAll("[data-screen]");
const clickSound = createClickSound();
let backgroundMusicStarted = false;
let backgroundMusicStep = 0;

navButtons.forEach((button) => {
  button.addEventListener("click", () => {
    playClick();
    showScreen(button.dataset.screen);
  });
});

function showScreen(screenId) {
  screens.forEach((screen) => {
    screen.classList.toggle("active", screen.id === screenId);
  });

  if (screenId === "memory-screen") {
    startMemoryGame();
  }

  if (screenId === "color-screen") {
    initFreeCanvas();
  }

  if (screenId === "alphabet-screen" || screenId === "numbers-screen") {
    loadPortugueseVoice();
  }
}

function createClickSound() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) {
    return null;
  }
  return { context: null, AudioContext };
}

function playClick() {
  const context = getAudioContext();
  if (!context) {
    return;
  }

  startBackgroundMusic();

  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(520, context.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(780, context.currentTime + 0.08);
  gain.gain.setValueAtTime(0.08, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.12);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.12);
}

function getAudioContext() {
  if (!clickSound) {
    return null;
  }

  if (!clickSound.context) {
    clickSound.context = new clickSound.AudioContext();
  }

  if (clickSound.context.state === "suspended") {
    clickSound.context.resume();
  }

  return clickSound.context;
}

function startBackgroundMusic() {
  if (backgroundMusicStarted) {
    return;
  }

  const context = getAudioContext();
  if (!context) {
    return;
  }

  const melody = [523.25, 659.25, 783.99, 659.25, 587.33, 698.46, 659.25, 523.25];
  backgroundMusicStarted = true;

  const playNote = () => {
    const frequency = melody[backgroundMusicStep % melody.length];
    backgroundMusicStep += 1;

    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(frequency, context.currentTime);

    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.02, context.currentTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.42);

    osc.connect(gain);
    gain.connect(context.destination);
    osc.start();
    osc.stop(context.currentTime + 0.44);
  };

  playNote();
  window.setInterval(playNote, 480);
}

let selectedColor = "#ff4d6d";

document.querySelectorAll(".color-dot").forEach((button) => {
  button.addEventListener("click", () => {
    playClick();
    selectedColor = button.dataset.color;
    document.querySelectorAll(".color-dot").forEach((dot) => dot.classList.remove("selected"));
    button.classList.add("selected");
  });
});

document.getElementById("clear-colors").addEventListener("click", () => {
  playClick();
  clearFreeCanvas();
});

const freeCanvas = document.getElementById("free-canvas");
const freeCtx = freeCanvas.getContext("2d");
let freeCanvasReady = false;
let isFreeDrawing = false;
let freeTool = "brush";
let brushSize = 12;
let lastPoint = null;

function initFreeCanvas() {
  if (!freeCanvasReady) {
    resizeFreeCanvas();
    clearFreeCanvas();
    freeCanvasReady = true;
    window.addEventListener("resize", resizeFreeCanvas);
  }
}

function resizeFreeCanvas() {
  const wrap = freeCanvas.parentElement;
  const width = Math.min(640, Math.floor(wrap.clientWidth - 8));
  const height = Math.round(width * 0.75);
  const saved = freeCanvasReady && freeCanvas.width > 0 ? freeCanvas.toDataURL() : null;

  freeCanvas.width = width;
  freeCanvas.height = height;
  freeCtx.lineCap = "round";
  freeCtx.lineJoin = "round";

  if (saved) {
    const img = new Image();
    img.onload = () => {
      freeCtx.drawImage(img, 0, 0, freeCanvas.width, freeCanvas.height);
    };
    img.src = saved;
  } else {
    clearFreeCanvas();
  }
}

function clearFreeCanvas() {
  freeCtx.fillStyle = "#ffffff";
  freeCtx.fillRect(0, 0, freeCanvas.width, freeCanvas.height);
  freeCtx.strokeStyle = "#e8ecf5";
  freeCtx.lineWidth = 2;
  for (let y = 24; y < freeCanvas.height; y += 24) {
    freeCtx.beginPath();
    freeCtx.moveTo(0, y);
    freeCtx.lineTo(freeCanvas.width, y);
    freeCtx.stroke();
  }
  lastPoint = null;
}

function getCanvasPoint(event) {
  const rect = freeCanvas.getBoundingClientRect();
  const scaleX = freeCanvas.width / rect.width;
  const scaleY = freeCanvas.height / rect.height;
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY
  };
}

function drawFreeLine(from, to) {
  freeCtx.beginPath();
  freeCtx.moveTo(from.x, from.y);
  freeCtx.lineTo(to.x, to.y);
  freeCtx.lineWidth = brushSize;
  freeCtx.strokeStyle = freeTool === "eraser" ? "#ffffff" : selectedColor;
  freeCtx.stroke();
}

function startFreeDraw(event) {
  event.preventDefault();
  isFreeDrawing = true;
  lastPoint = getCanvasPoint(event);
  freeCanvas.setPointerCapture(event.pointerId);
}

function moveFreeDraw(event) {
  if (!isFreeDrawing) {
    return;
  }
  event.preventDefault();
  const point = getCanvasPoint(event);
  drawFreeLine(lastPoint, point);
  lastPoint = point;
}

function endFreeDraw(event) {
  if (!isFreeDrawing) {
    return;
  }
  isFreeDrawing = false;
  lastPoint = null;
  if (freeCanvas.hasPointerCapture(event.pointerId)) {
    freeCanvas.releasePointerCapture(event.pointerId);
  }
}

freeCanvas.addEventListener("pointerdown", startFreeDraw);
freeCanvas.addEventListener("pointermove", moveFreeDraw);
freeCanvas.addEventListener("pointerup", endFreeDraw);
freeCanvas.addEventListener("pointercancel", endFreeDraw);
freeCanvas.addEventListener("pointerleave", endFreeDraw);

document.querySelectorAll(".tool-btn[data-tool]").forEach((button) => {
  button.addEventListener("click", () => {
    playClick();
    freeTool = button.dataset.tool;
    document.querySelectorAll(".tool-btn[data-tool]").forEach((btn) => {
      btn.classList.toggle("active", btn === button);
    });
  });
});

document.querySelectorAll(".size-btn").forEach((button) => {
  button.addEventListener("click", () => {
    playClick();
    brushSize = Number(button.dataset.size);
    document.querySelectorAll(".size-btn").forEach((btn) => {
      btn.classList.toggle("active", btn === button);
    });
  });
});

document.getElementById("save-drawing").addEventListener("click", () => {
  playClick();
  const link = document.createElement("a");
  const date = new Date();
  const stamp = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  link.download = `meu-desenho-${stamp}.png`;
  link.href = freeCanvas.toDataURL("image/png");
  link.click();
});

const memoryEmojis = ["🐶", "🐱", "🐸", "🦋", "🌸", "🍎", "🚗", "⭐"];
const memoryGrid = document.getElementById("memory-grid");
const attemptsElement = document.getElementById("attempts");
const winMessage = document.getElementById("win-message");
const restartMemory = document.getElementById("restart-memory");

let firstCard = null;
let secondCard = null;
let lockBoard = false;
let attempts = 0;
let matchedPairs = 0;

function startMemoryGame() {
  const cards = shuffle([...memoryEmojis, ...memoryEmojis]);
  memoryGrid.innerHTML = "";
  attempts = 0;
  matchedPairs = 0;
  firstCard = null;
  secondCard = null;
  lockBoard = false;
  attemptsElement.textContent = "0";
  winMessage.classList.remove("show");

  cards.forEach((emoji) => {
    const card = document.createElement("button");
    card.className = "card";
    card.type = "button";
    card.dataset.emoji = emoji;
    card.setAttribute("aria-label", "Carta escondida");
    card.innerHTML = `
      <span class="card-face card-front">?</span>
      <span class="card-face card-back">${emoji}</span>
    `;
    card.addEventListener("click", () => flipCard(card));
    memoryGrid.appendChild(card);
  });
}

function flipCard(card) {
  if (lockBoard || card === firstCard || card.classList.contains("matched")) {
    return;
  }

  playClick();
  card.classList.add("flipped");
  card.setAttribute("aria-label", `Carta ${card.dataset.emoji}`);

  if (!firstCard) {
    firstCard = card;
    return;
  }

  secondCard = card;
  attempts += 1;
  attemptsElement.textContent = attempts;
  checkMatch();
}

function checkMatch() {
  const isMatch = firstCard.dataset.emoji === secondCard.dataset.emoji;

  if (isMatch) {
    firstCard.classList.add("matched");
    secondCard.classList.add("matched");
    matchedPairs += 1;
    resetTurn();

    if (matchedPairs === memoryEmojis.length) {
      winMessage.classList.add("show");
    }
    return;
  }

  lockBoard = true;
  setTimeout(() => {
    firstCard.classList.remove("flipped");
    secondCard.classList.remove("flipped");
    firstCard.setAttribute("aria-label", "Carta escondida");
    secondCard.setAttribute("aria-label", "Carta escondida");
    resetTurn();
  }, 850);
}

function resetTurn() {
  firstCard = null;
  secondCard = null;
  lockBoard = false;
}

function shuffle(items) {
  return items
    .map((item) => ({ item, order: Math.random() }))
    .sort((a, b) => a.order - b.order)
    .map(({ item }) => item);
}

restartMemory.addEventListener("click", () => {
  playClick();
  startMemoryGame();
});

let portugueseVoice = null;
let speechSessionId = 0;
let naturalAudio = null;

function loadPortugueseVoice() {
  if (!("speechSynthesis" in window)) {
    return;
  }

  const voices = speechSynthesis.getVoices();
  const portugueseVoices = voices.filter((voice) => voice.lang && voice.lang.toLowerCase().startsWith("pt"));

  if (!portugueseVoices.length) {
    portugueseVoice = null;
    return;
  }

  const femaleHints = /(female|femin|mulher|francisca|maria|helena|luciana|camila|vit[oó]ria|daniela|fernanda|gabriela|isabela|leticia|sofia|yara)/i;
  const maleHints = /(male|masc|homem|daniel|jo[aã]o|carlos|pedro|paulo|antonio|thiago)/i;

  portugueseVoice = portugueseVoices.sort((a, b) => {
    const score = (voice) => {
      let points = 0;
      const label = `${voice.name} ${voice.voiceURI}`.toLowerCase();
      if (voice.lang.toLowerCase() === "pt-br") points += 50;
      if (femaleHints.test(label)) points += 80;
      if (maleHints.test(label)) points -= 40;
      return points;
    };
    return score(b) - score(a);
  })[0];
}

if ("speechSynthesis" in window) {
  loadPortugueseVoice();
  speechSynthesis.addEventListener("voiceschanged", loadPortugueseVoice);
}

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function cancelSpeech() {
  speechSessionId += 1;

  if (naturalAudio) {
    naturalAudio.pause();
    naturalAudio.removeAttribute("src");
    naturalAudio.load();
    naturalAudio = null;
  }

  if ("speechSynthesis" in window) {
    speechSynthesis.cancel();
  }

  return speechSessionId;
}

function buildNaturalVoiceUrl(text, client = "gtx") {
  const query = encodeURIComponent(text.trim());
  return `https://translate.googleapis.com/translate_tts?ie=UTF-8&client=${client}&tl=pt-BR&q=${query}`;
}

function playOnlineVoiceFromUrl(url, sessionId) {
  return new Promise((resolve) => {
    const audio = new Audio();
    naturalAudio = audio;
    audio.src = url;

    const finish = (ok) => {
      if (naturalAudio === audio) {
        naturalAudio = null;
      }
      resolve(Boolean(ok && sessionId === speechSessionId));
    };

    audio.onended = () => finish(true);
    audio.onerror = () => finish(false);
    audio.play().catch(() => finish(false));
  });
}

async function playOnlineVoice(text, sessionId) {
  const urls = [
    buildNaturalVoiceUrl(text, "gtx"),
    buildNaturalVoiceUrl(text, "tw-ob")
  ];

  for (const url of urls) {
    if (sessionId !== speechSessionId) {
      return false;
    }
    const worked = await playOnlineVoiceFromUrl(url, sessionId);
    if (worked) {
      return true;
    }
  }

  return false;
}

function speakWithBrowser(text, sessionId) {
  return new Promise((resolve) => {
    if (!("speechSynthesis" in window) || !text) {
      resolve();
      return;
    }

    if (!portugueseVoice) {
      loadPortugueseVoice();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "pt-BR";
    utterance.rate = 0.9;
    utterance.pitch = 1.08;
    utterance.volume = 1;

    if (portugueseVoice) {
      utterance.voice = portugueseVoice;
    }

    utterance.onend = () => {
      if (sessionId === speechSessionId) {
        resolve();
      }
    };
    utterance.onerror = () => resolve();
    speechSynthesis.speak(utterance);
  });
}

async function speakNaturally(text) {
  const session = cancelSpeech();
  await wait(100);

  const onlineWorked = await playOnlineVoice(text, session);
  if (onlineWorked) {
    return;
  }

  if (session === speechSessionId) {
    await speakWithBrowser(text, session);
  }
}

async function speakLetter(letter, word) {
  await speakNaturally(`${letter} de ${word}`);
}

async function speakNumberStars(number) {
  const phrase = number === 1 ? "1 estrela" : `${number} estrelas`;
  await speakNaturally(phrase);
}

const alphabet = [
  ["A", "Avião", "✈️"],
  ["B", "Bola", "⚽"],
  ["C", "Casa", "🏠"],
  ["D", "Dado", "🎲"],
  ["E", "Elefante", "🐘"],
  ["F", "Flor", "🌸"],
  ["G", "Gato", "🐱"],
  ["H", "Helicóptero", "🚁"],
  ["I", "Ilha", "🏝️"],
  ["J", "Jacaré", "🐊"],
  ["K", "Kiwi", "🥝"],
  ["L", "Lua", "🌙"],
  ["M", "Maçã", "🍎"],
  ["N", "Nuvem", "☁️"],
  ["O", "Ovo", "🥚"],
  ["P", "Pato", "🦆"],
  ["Q", "Queijo", "🧀"],
  ["R", "Rato", "🐭"],
  ["S", "Sol", "☀️"],
  ["T", "Tartaruga", "🐢"],
  ["U", "Uva", "🍇"],
  ["V", "Vaca", "🐮"],
  ["W", "Web", "🌐"],
  ["X", "Xícara", "☕"],
  ["Y", "Yoga", "🧘"],
  ["Z", "Zebra", "🦓"]
];

const letterColors = ["yellow", "blue", "green", "pink", "orange", "purple"];
const lettersGrid = document.getElementById("letters-grid");
const letterDisplay = document.getElementById("letter-display");

alphabet.forEach(([letter, word, emoji], index) => {
  const button = document.createElement("button");
  button.className = `letter-button ${letterColors[index % letterColors.length]}`;
  button.type = "button";
  button.textContent = letter;
  button.addEventListener("click", () => showLetter(letter, word, emoji));
  lettersGrid.appendChild(button);
});

function showLetter(letter, word, emoji) {
  speakLetter(letter, word);
  letterDisplay.innerHTML = `
    <div class="display-big">${letter}</div>
    <div class="display-word">${letter} de ${word}</div>
    <div class="display-emoji">${emoji}</div>
  `;
  letterDisplay.style.animation = "none";
  letterDisplay.offsetHeight;
  letterDisplay.style.animation = "bounce 0.45s ease";
}

const numbers = [
  [1, "Um"],
  [2, "Dois"],
  [3, "Três"],
  [4, "Quatro"],
  [5, "Cinco"],
  [6, "Seis"],
  [7, "Sete"],
  [8, "Oito"],
  [9, "Nove"],
  [10, "Dez"]
];

const numbersGrid = document.getElementById("numbers-grid");
const numberDisplay = document.getElementById("number-display");

numbers.forEach(([number], index) => {
  const button = document.createElement("button");
  button.className = `number-button ${letterColors[index % letterColors.length]}`;
  button.type = "button";
  button.textContent = number;
  button.addEventListener("click", () => showNumber(number));
  numbersGrid.appendChild(button);
});

function showNumber(number) {
  const label = number === 1 ? "1 estrela" : `${number} estrelas`;
  speakNumberStars(number);
  const stars = "⭐".repeat(number);
  numberDisplay.innerHTML = `
    <div class="display-big">${number}</div>
    <div class="display-word">${label}</div>
    <div class="display-emoji">${stars}</div>
  `;
  numberDisplay.style.animation = "none";
  numberDisplay.offsetHeight;
  numberDisplay.style.animation = "bounce 0.45s ease";
}

startMemoryGame();
