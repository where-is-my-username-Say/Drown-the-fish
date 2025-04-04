// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .catch(err => console.error('Service Worker registration failed:', err));
  });
}

// Game State
const gameState = {
  initialHP: 50,
  photoHP: 50,
  clickDamage: 2,
  gold: 0,
  hpIncrement: 25,
  upgradeCount: 0,
  photoDefeated: false,
  critChance: 0.1,
  critMultiplier: 2,
  autoClicker: {
    active: false,
    damage: 0,
    cost: 50,
    speed: 1000,
    speedCost: 30,
    damageCost: 25
  },
  critUpgrades: {
    chanceCost: 10,
    damageCost: 10
  },
  audio: {
    musicMuted: false,
    soundMuted: false
  },
  version: '1.3'
};

// Translations
const translations = {
  en: {
    welcome: "Welcome to Minecraft Duck Hunt!",
    damage: "Damage:",
    gold: "Gold:",
    critChance: "Crit Chance:",
    critMultiplier: "Crit Multiplier:",
    upgrade: "Upgrade",
    critChanceUpgrade: "Crit Chance",
    critDamageUpgrade: "Crit Damage",
    autoClicker: "Auto-Clicker",
    acDamage: "AC Damage",
    acSpeed: "AC Speed",
    fullscreen: "Fullscreen",
    toggleMusic: "Toggle Music",
    toggleSound: "Toggle Sound",
    restart: "Restart",
    save: "Save Game",
    saved: "Game Saved!",
    load: "Game Loaded!",
    noSave: "No saved game found",
    confirmReset: "Reset all progress?"
  },
  ar: {
    welcome: "اهلا يا متخلف!",
    damage: "الدمج:",
    gold: "قطع ذهبية:",
    critChance: "كريت ريت:",
    critMultiplier: "كريت دمج:",
    upgrade: "طور",
    critChanceUpgrade: "كريت ريت",
    critDamageUpgrade: "كريت دمج",
    autoClicker: "اوتو كليكر للضعفاء",
    acDamage: "قوة الاوتو كليكر",
    acSpeed: "سرعة الاوتو كليكر",
    fullscreen: "تكبير الشاشة",
    toggleMusic: "تشغيل/إيقاف الموسيقى",
    toggleSound: "تشغيل/إيقاف الصوت",
    restart: "إعادة تشغيل",
    save: "حفظ اللعبة",
    saved: "تم الحفظ بنجاح!",
    load: "تم تحميل اللعبة!",
    noSave: "لا يوجد حفظ سابق",
    confirmReset: "إعادة تعيين كل التقدم؟"
  }
};

// DOM Elements
const elements = {
  photoImage: document.getElementById('photo-image'),
  photoHP: document.getElementById('photo-hp'),
  clickDamage: document.getElementById('click-damage'),
  gold: document.getElementById('gold'),
  critChance: document.getElementById('crit-chance'),
  critMultiplier: document.getElementById('crit-multiplier'),
  messageDisplay: document.getElementById('message-display'),
  welcomeMessage: document.getElementById('welcome-message'),
  upgradeButton: document.getElementById('upgrade-button'),
  critChanceButton: document.getElementById('crit-chance-button'),
  critDamageButton: document.getElementById('crit-damage-button'),
  autoClickerButton: document.getElementById('auto-clicker-button'),
  autoClickerDmgButton: document.getElementById('auto-clicker-dmg-button'),
  autoClickerSpeedButton: document.getElementById('auto-clicker-speed-button'),
  fullscreenButton: document.getElementById('fullscreen-button'),
  muteMusicButton: document.getElementById('mute-music-button'),
  muteSoundButton: document.getElementById('mute-sound-button'),
  restartButton: document.getElementById('restart-button'),
  saveButton: document.getElementById('save-button'),
  languageButton: document.getElementById('language-button'),
  damageSound: document.getElementById('damage-sound'),
  bgMusic: document.getElementById('bg-music'),
  explosionSound: document.getElementById('explosion-sound')
};

let currentLanguage = 'en';
let autoClickerInterval;

// Initialize Game
function initGame() {
  loadPreferences();
  initEventListeners();
  initAudio();
  updateUI();
}

function loadPreferences() {
  const savedLanguage = localStorage.getItem('gameLanguage');
  if (savedLanguage) currentLanguage = savedLanguage;
  
  const audioPrefs = JSON.parse(localStorage.getItem('audioPreferences')) || {};
  gameState.audio.musicMuted = audioPrefs.musicMuted || false;
  gameState.audio.soundMuted = audioPrefs.soundMuted || false;
}

function initAudio() {
  elements.bgMusic.volume = 0.3;
  elements.bgMusic.muted = gameState.audio.musicMuted;
  
  document.addEventListener('click', () => {
    elements.bgMusic.play().catch(console.error);
  }, { once: true });
}

function initEventListeners() {
  elements.photoImage.addEventListener('click', handlePhotoClick);
  elements.upgradeButton.addEventListener('click', upgradeDamage);
  elements.critChanceButton.addEventListener('click', upgradeCritChance);
  elements.critDamageButton.addEventListener('click', upgradeCritDamage);
  elements.autoClickerButton.addEventListener('click', buyAutoClicker);
  elements.autoClickerDmgButton.addEventListener('click', upgradeAutoClickerDamage);
  elements.autoClickerSpeedButton.addEventListener('click', upgradeAutoClickerSpeed);
  elements.fullscreenButton.addEventListener('click', toggleFullscreen);
  elements.muteMusicButton.addEventListener('click', toggleMusic);
  elements.muteSoundButton.addEventListener('click', toggleSound);
  elements.restartButton.addEventListener('click', confirmReset);
  elements.saveButton.addEventListener('click', saveGame);
  elements.languageButton.addEventListener('click', toggleLanguage);
}

// Game Logic
function handlePhotoClick(event) {
  if (gameState.photoDefeated) return;
  
  elements.photoImage.src = 'being_attacked.jpg';
  
  let damage = gameState.clickDamage;
  const isCrit = Math.random() < gameState.critChance;
  
  if (isCrit) damage = Math.floor(damage * gameState.critMultiplier);
  
  gameState.photoHP -= damage;
  
  if (gameState.photoHP <= 0) handlePhotoDefeat();
  
  showDamage(damage, isCrit, event);
  playSound(elements.damageSound);
  animateClick();
  updateUI();
  
  setTimeout(() => {
    if (!gameState.photoDefeated) elements.photoImage.src = 'fish.jpg';
  }, 100);
}

function handlePhotoDefeat() {
  gameState.photoHP = 0;
  gameState.photoDefeated = true;
  elements.photoImage.src = 'deadduck.jpg';
  
  const goldEarned = Math.floor(gameState.initialHP / 2);
  gameState.gold += goldEarned;
  
  playSound(elements.explosionSound);
  showMessage(`${translations[currentLanguage].youEarned} ${goldEarned} ${translations[currentLanguage].gold}`);
  
  setTimeout(() => {
    gameState.initialHP += gameState.hpIncrement;
    gameState.photoHP = gameState.initialHP;
    gameState.photoDefeated = false;
    elements.photoImage.src = 'fish.jpg';
    updateUI();
  }, 2000);
}

// Upgrade Functions
function upgradeDamage() {
  const cost = getUpgradeCost();
  if (gameState.gold >= cost) {
    gameState.gold -= cost;
    gameState.clickDamage += 1;
    gameState.upgradeCount++;
    updateUI();
  }
}

function upgradeCritChance() {
  if (gameState.gold >= gameState.critUpgrades.chanceCost) {
    gameState.gold -= gameState.critUpgrades.chanceCost;
    gameState.critChance = Math.min(0.95, gameState.critChance + 0.05);
    gameState.critUpgrades.chanceCost = Math.floor(gameState.critUpgrades.chanceCost * 1.5);
    updateUI();
  }
}

function upgradeCritDamage() {
  if (gameState.gold >= gameState.critUpgrades.damageCost) {
    gameState.gold -= gameState.critUpgrades.damageCost;
    gameState.critMultiplier += 0.2;
    gameState.critUpgrades.damageCost = Math.floor(gameState.critUpgrades.damageCost * 1.5);
    updateUI();
  }
}

// Auto-clicker Functions
function buyAutoClicker() {
  if (!gameState.autoClicker.active && gameState.gold >= gameState.autoClicker.cost) {
    gameState.gold -= gameState.autoClicker.cost;
    gameState.autoClicker.active = true;
    gameState.autoClicker.damage = 1;
    autoClickerInterval = setInterval(autoClickerTick, gameState.autoClicker.speed);
    updateUI();
  }
}

function autoClickerTick() {
  if (!gameState.photoDefeated) {
    gameState.photoHP -= gameState.autoClicker.damage;
    if (gameState.photoHP <= 0) handlePhotoDefeat();
    updateUI();
  }
}

function upgradeAutoClickerDamage() {
  if (gameState.gold >= gameState.autoClicker.damageCost) {
    gameState.gold -= gameState.autoClicker.damageCost;
    gameState.autoClicker.damage += 1;
    gameState.autoClicker.damageCost = Math.floor(gameState.autoClicker.damageCost * 1.3);
    updateUI();
  }
}

function upgradeAutoClickerSpeed() {
  if (gameState.gold >= gameState.autoClicker.speedCost) {
    gameState.gold -= gameState.autoClicker.speedCost;
    gameState.autoClicker.speed = Math.max(200, gameState.autoClicker.speed - 100);
    clearInterval(autoClickerInterval);
    autoClickerInterval = setInterval(autoClickerTick, gameState.autoClicker.speed);
    gameState.autoClicker.speedCost = Math.floor(gameState.autoClicker.speedCost * 1.4);
    updateUI();
  }
}

// UI Functions
function updateUI() {
  elements.photoHP.textContent = `HP: ${gameState.photoHP}/${gameState.initialHP}`;
  elements.clickDamage.textContent = `${translations[currentLanguage].damage} ${gameState.clickDamage}`;
  elements.gold.textContent = `${translations[currentLanguage].gold} ${gameState.gold}`;
  elements.critChance.textContent = `${translations[currentLanguage].critChance} ${Math.round(gameState.critChance * 100)}%`;
  elements.critMultiplier.textContent = `${translations[currentLanguage].critMultiplier} ${gameState.critMultiplier}x`;

  // Update buttons
  elements.upgradeButton.textContent = `${translations[currentLanguage].upgrade} (${getUpgradeCost()}g)`;
  elements.autoClickerButton.textContent = `${translations[currentLanguage].autoClicker} (${gameState.autoClicker.cost}g)`;
  elements.autoClickerButton.disabled = gameState.autoClicker.active || gameState.gold < gameState.autoClicker.cost;
  elements.critChanceButton.textContent = `${translations[currentLanguage].critChanceUpgrade} (${gameState.critUpgrades.chanceCost}g)`;
  elements.critDamageButton.textContent = `${translations[currentLanguage].critDamageUpgrade} (${gameState.critUpgrades.damageCost}g)`;
  elements.autoClickerDmgButton.textContent = `${translations[currentLanguage].acDamage} (${gameState.autoClicker.damageCost}g)`;
  elements.autoClickerSpeedButton.textContent = `${translations[currentLanguage].acSpeed} (${gameState.autoClicker.speedCost}g)`;
  elements.muteMusicButton.textContent = translations[currentLanguage].toggleMusic;
  elements.muteSoundButton.textContent = translations[currentLanguage].toggleSound;
  elements.languageButton.textContent = currentLanguage === 'en' ? 'العربية' : 'English';
}

function showDamage(damage, isCrit, event) {
  const damageElement = document.createElement('div');
  damageElement.className = `damage-display ${isCrit ? 'crit-damage' : ''}`;
  damageElement.textContent = `-${damage}`;
  damageElement.style.left = `${event.clientX}px`;
  damageElement.style.top = `${event.clientY}px`;
  
  document.body.appendChild(damageElement);
  setTimeout(() => damageElement.remove(), 800);
}

function animateClick() {
  elements.photoImage.classList.add('shake');
  setTimeout(() => elements.photoImage.classList.remove('shake'), 600);
}

function playSound(soundElement) {
  if (!gameState.audio.soundMuted) {
    soundElement.currentTime = 0;
    soundElement.play().catch(console.error);
  }
}

// Utility Functions
function getUpgradeCost() {
  return Math.floor(2 + gameState.upgradeCount * 1.5);
}

function showMessage(message) {
  elements.messageDisplay.textContent = message;
  elements.messageDisplay.style.opacity = 1;
  setTimeout(() => elements.messageDisplay.style.opacity = 0, 3000);
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(console.error);
  } else if (document.exitFullscreen) {
    document.exitFullscreen();
  }
}

function toggleMusic() {
  gameState.audio.musicMuted = !gameState.audio.musicMuted;
  elements.bgMusic.muted = gameState.audio.musicMuted;
  saveAudioPreferences();
  updateUI();
}

function toggleSound() {
  gameState.audio.soundMuted = !gameState.audio.soundMuted;
  saveAudioPreferences();
  updateUI();
}

function saveAudioPreferences() {
  localStorage.setItem('audioPreferences', JSON.stringify(gameState.audio));
}

function toggleLanguage() {
  currentLanguage = currentLanguage === 'en' ? 'ar' : 'en';
  localStorage.setItem('gameLanguage', currentLanguage);
  document.documentElement.lang = currentLanguage;
  document.documentElement.dir = currentLanguage === 'ar' ? 'rtl' : 'ltr';
  updateUI();
}

function confirmReset() {
  if (confirm(translations[currentLanguage].confirmReset)) {
    resetGame();
  }
}

function resetGame() {
  clearInterval(autoClickerInterval);
  Object.assign(gameState, {
    initialHP: 50,
    photoHP: 50,
    clickDamage: 2,
    gold: 0,
    hpIncrement: 25,
    upgradeCount: 0,
    photoDefeated: false,
    critChance: 0.1,
    critMultiplier: 2,
    autoClicker: {
      active: false,
      damage: 0,
      cost: 50,
      speed: 1000,
      speedCost: 30,
      damageCost: 25
    },
    critUpgrades: {
      chanceCost: 10,
      damageCost: 10
    }
  });
  elements.photoImage.src = 'fish.jpg';
  updateUI();
}

// Save/Load Functions
function saveGame() {
  try {
    localStorage.setItem('gameSave', JSON.stringify(gameState));
    showMessage(translations[currentLanguage].saved);
  } catch(e) {
    console.error("Save error:", e);
    showMessage("Error saving game");
  }
}

function loadGame() {
  const savedGame = localStorage.getItem('gameSave');
  if (!savedGame) {
    showMessage(translations[currentLanguage].noSave);
    return false;
  }
  
  try {
    const loadedState = JSON.parse(savedGame);
    Object.assign(gameState, loadedState);
    
    if (gameState.autoClicker.active) {
      clearInterval(autoClickerInterval);
      autoClickerInterval = setInterval(autoClickerTick, gameState.autoClicker.speed);
    }
    
    elements.photoImage.src = gameState.photoDefeated ? 'deadduck.jpg' : 'fish.jpg';
    updateUI();
    showMessage(translations[currentLanguage].load);
    return true;
  } catch(e) {
    console.error("Load error:", e);
    return false;
  }
}

// Initialize Game
initGame();