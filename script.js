// Register Service Worker for PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(reg => console.log('Service Worker registered'))
      .catch(err => console.log('Registration failed:', err));
  });
}

// Game State Variables
let initialHP = 50;
let photoHP = initialHP;
let clickDamage = 2;
let gold = 0;
let hpIncrement = 25;
let upgradeCount = 0;
let photoDefeated = false;
let totalClicks = 0;
let totalDamage = 0;
let totalGoldEarned = 0;
let critChance = 0.1;
let critMultiplier = 2;
let critHits = 0;
let autoClickerActive = false;
let autoClickerInterval;
let autoClickerDamage = 0;
let autoClickerCost = 50;
let autoClickerSpeed = 1000;
let autoClickerLevel = 0;
let autoClickerSpeedCost = 30;
let autoClickerDamageCost = 25;
let critChanceCost = 10;
let critDamageCost = 10;
let musicMuted = false;
let soundMuted = false;
let currentLanguage = 'en';
let gameVersion = '1.2';

// Game Translations
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
    donate: "Donate",
    language: "العربية",
    save: "Save Game",
    saved: "Game Saved Successfully!",
    load: "Game Loaded!",
    noSave: "No saved game found",
    saveError: "Save failed (storage full or not supported)",
    loadError: "Corrupted save data",
    confirmLoad: "Load saved game?",
    confirmReset: "Reset all progress?",
    storageError: "LocalStorage not supported in your browser!",
    secretPlaceholder: "Enter secret code here",
    secretButton: "Activate",
    secretSuccess: "Secret code activated! +10,000 gold!",
    secretFail: "Invalid secret code!"
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
    donate: "تبرع للمسكين",
    language: "English",
    save: "حفظ اللعبة",
    saved: "تم الحفظ بنجاح!",
    load: "تم تحميل اللعبة!",
    noSave: "لا يوجد حفظ سابق",
    saveError: "خطأ في الحفظ (قد يكون التخزين ممتلئاً أو غير مدعوم)",
    loadError: "بيانات الحفظ تالفة",
    confirmLoad: "تحميل اللعبة المحفوظة؟",
    confirmReset: "إعادة تعيين كل التقدم؟",
    storageError: "المتصفح لا يدعم خاصية الحفظ المحلي!",
    secretPlaceholder: "اكتب كلمة السر هنا",
    secretButton: "تفعيل",
    secretSuccess: "تم تفعيل الكود السري! +10,000 ذهب!",
    secretFail: "كود سري خاطئ!"
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
  gameContainer: document.getElementById('game-container'),
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
  donateButton: document.getElementById('donate-button'),
  saveButton: document.getElementById('save-button'),
  languageButton: document.getElementById('language-button'),
  damageSound: document.getElementById('damage-sound'),
  bgMusic: document.getElementById('bg-music'),
  explosionSound: document.getElementById('explosion-sound'),
  secretCodeInput: document.getElementById('secret-code-input'),
  secretCodeButton: document.getElementById('secret-code-button')
};

// Initialize the Game
function initGame() {
  if(!isLocalStorageSupported()) {
    showMessage(translations[currentLanguage].storageError);
    elements.saveButton.disabled = true;
    return;
  }

  loadPreferences();
  updateDisplays();
  updateLanguage();
  initEventListeners();
  initAudio();
  checkForSavedGame();
}

// Check if localStorage is supported
function isLocalStorageSupported() {
  try {
    const testKey = 'test';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch(e) {
    return false;
  }
}

// Load user preferences
function loadPreferences() {
  const savedLanguage = localStorage.getItem('gameLanguage');
  if (savedLanguage) currentLanguage = savedLanguage;
  
  const audioPrefs = JSON.parse(localStorage.getItem('audioPreferences')) || {};
  musicMuted = audioPrefs.musicMuted || false;
  soundMuted = audioPrefs.soundMuted || false;
}

// Initialize audio system
function initAudio() {
  elements.bgMusic.volume = 0.3;
  elements.bgMusic.muted = musicMuted;
  
  document.addEventListener('click', function initAudioContext() {
    const playPromise = elements.bgMusic.play();
    
    if (playPromise !== undefined) {
      playPromise.catch(e => {
        console.log("Audio play failed, retrying...", e);
        setTimeout(() => elements.bgMusic.play().catch(console.error), 1000);
      });
    }
    
    document.removeEventListener('click', initAudioContext);
  }, { once: true });
}

// Check for saved game data
function checkForSavedGame() {
  const savedGame = localStorage.getItem('minecraftPhotoHuntSave');
  if (!savedGame) return;

  try {
    const gameData = JSON.parse(savedGame);
    if (gameData.version !== gameVersion) {
      console.log("Save version mismatch, ignoring old save");
      return;
    }

    setTimeout(() => {
      if (confirm(translations[currentLanguage].confirmLoad)) {
        loadGame();
      } else {
        addLoadLaterButton();
      }
    }, 1000);
  } catch (e) {
    console.error("Error parsing saved game:", e);
  }
}

// Add temporary load button
function addLoadLaterButton() {
  const loadBtn = document.createElement('button');
  loadBtn.id = 'load-later-btn';
  loadBtn.textContent = translations[currentLanguage].load;
  loadBtn.className = 'btn utility-btn';
  
  loadBtn.addEventListener('click', () => {
    loadGame();
    loadBtn.remove();
  });

  document.body.appendChild(loadBtn);
  
  setTimeout(() => {
    if (document.body.contains(loadBtn)) {
      loadBtn.remove();
    }
  }, 30000);
}

// Update all game displays
function updateDisplays() {
  elements.photoHP.textContent = `HP: ${photoHP}/${initialHP}`;
  elements.clickDamage.textContent = `${translations[currentLanguage].damage} ${clickDamage}`;
  elements.gold.textContent = `${translations[currentLanguage].gold} ${gold}`;
  elements.critChance.textContent = `${translations[currentLanguage].critChance} ${Math.round(critChance * 100)}%`;
  elements.critMultiplier.textContent = `${translations[currentLanguage].critMultiplier} ${critMultiplier}x`;

  // Update buttons
  const upgradeCost = getUpgradeCost();
  elements.upgradeButton.textContent = `${translations[currentLanguage].upgrade} (${upgradeCost}g)`;
  elements.autoClickerButton.textContent = `${translations[currentLanguage].autoClicker} (${autoClickerCost}g)`;
  elements.autoClickerButton.disabled = autoClickerActive || gold < autoClickerCost;
  elements.critChanceButton.textContent = `${translations[currentLanguage].critChanceUpgrade} (${critChanceCost}g)`;
  elements.critDamageButton.textContent = `${translations[currentLanguage].critDamageUpgrade} (${critDamageCost}g)`;
  elements.autoClickerDmgButton.textContent = `${translations[currentLanguage].acDamage} (${autoClickerDamageCost}g)`;
  elements.autoClickerSpeedButton.textContent = `${translations[currentLanguage].acSpeed} (${autoClickerSpeedCost}g)`;

  // Update audio buttons
  elements.muteMusicButton.textContent = musicMuted ? 
    translations[currentLanguage].toggleMusic.replace("Toggle", "Unmute") : 
    translations[currentLanguage].toggleMusic;
  elements.muteSoundButton.textContent = soundMuted ? 
    translations[currentLanguage].toggleSound.replace("Toggle", "Unmute") : 
    translations[currentLanguage].toggleSound;

  // Update other buttons
  elements.saveButton.textContent = translations[currentLanguage].save;
  elements.restartButton.textContent = translations[currentLanguage].restart;
  elements.saveButton.disabled = !isLocalStorageSupported();

  // Update secret code elements
  elements.secretCodeInput.placeholder = translations[currentLanguage].secretPlaceholder;
  elements.secretCodeButton.textContent = translations[currentLanguage].secretButton;
}

// Initialize all event listeners
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
  elements.secretCodeButton.addEventListener('click', checkSecretCode);
}

// Secret code function
function checkSecretCode() {
  const secretCode = elements.secretCodeInput.value.trim();
  
  if (secretCode === "السلمندر جميل") {
    gold += 10000;
    elements.secretCodeInput.value = "";
    showMessage(translations[currentLanguage].secretSuccess);
    updateDisplays();
  } else {
    showMessage(translations[currentLanguage].secretFail);
  }
}

// Photo click handler with duck image transitions
function handlePhotoClick(event) {
  if (photoDefeated) return;
  
  // Show attacked duck image
  elements.photoImage.src = 'being_attacked.jpg';
  
  totalClicks++;
  let damage = clickDamage;
  let isCrit = Math.random() < critChance;
  
  if (isCrit) {
    damage = Math.floor(damage * critMultiplier);
    critHits++;
  }
  
  photoHP -= damage;
  totalDamage += damage;
  
  if (photoHP <= 0) {
    handlePhotoDefeat();
  }
  
  showDamage(damage, isCrit, event);
  playDamageSound();
  animatePhotoClick();
  updateDisplays();
  
  // Return to normal duck after 100ms
  setTimeout(() => {
    if (!photoDefeated) {
      elements.photoImage.src = 'fish.jpg';
    }
  }, 100);
}

// Handle photo defeat with dead duck image
function handlePhotoDefeat() {
  photoHP = 0;
  photoDefeated = true;
  elements.photoImage.src = 'deadduck.jpg';
  const goldEarned = Math.floor(initialHP / 2);
  gold += goldEarned;
  totalGoldEarned += goldEarned;
  
  // Play explosion sound
  if (!soundMuted) {
    elements.explosionSound.currentTime = 0;
    elements.explosionSound.play().catch(e => console.log("Explosion sound error:", e));
  }
  
  showMessage(currentLanguage === 'en' ? 
    `You earned ${goldEarned} gold!` : 
    `لقد ربحت ${goldEarned} ذهب!`);
  
  setTimeout(() => {
    initialHP += hpIncrement;
    photoHP = initialHP;
    photoDefeated = false;
    elements.photoImage.src = 'fish.jpg';
    updateDisplays();
  }, 2000);
}

// Show damage numbers
function showDamage(damage, isCrit, event) {
  const damageElement = document.createElement('div');
  damageElement.className = `damage-display ${isCrit ? 'crit-damage' : ''}`;
  damageElement.textContent = `-${damage}`;
  damageElement.style.left = `${event.clientX}px`;
  damageElement.style.top = `${event.clientY}px`;
  
  document.body.appendChild(damageElement);
  setTimeout(() => damageElement.remove(), 800);
}

// Play damage sound
function playDamageSound() {
  if (!soundMuted) {
    elements.damageSound.currentTime = 0;
    elements.damageSound.play().catch(e => console.log("Sound error:", e));
  }
}

// Animate photo click
function animatePhotoClick() {
  elements.photoImage.classList.add('shake');
  setTimeout(() => elements.photoImage.classList.remove('shake'), 600);
}

// Upgrade functions
function upgradeDamage() {
  const cost = getUpgradeCost();
  if (gold >= cost) {
    gold -= cost;
    clickDamage += 1;
    upgradeCount++;
    updateDisplays();
  }
}

function upgradeCritChance() {
  if (gold >= critChanceCost) {
    gold -= critChanceCost;
    critChance = Math.min(0.95, critChance + 0.05);
    critChanceCost = Math.floor(critChanceCost * 1.5);
    updateDisplays();
  }
}

function upgradeCritDamage() {
  if (gold >= critDamageCost) {
    gold -= critDamageCost;
    critMultiplier += 0.2;
    critDamageCost = Math.floor(critDamageCost * 1.5);
    updateDisplays();
  }
}

// Auto-clicker functions
function buyAutoClicker() {
  if (!autoClickerActive && gold >= autoClickerCost) {
    gold -= autoClickerCost;
    autoClickerActive = true;
    autoClickerDamage = 1;
    autoClickerInterval = setInterval(autoClickerTick, autoClickerSpeed);
    updateDisplays();
  }
}

function upgradeAutoClickerDamage() {
  if (gold >= autoClickerDamageCost) {
    gold -= autoClickerDamageCost;
    autoClickerDamage += 1;
    autoClickerDamageCost = Math.floor(autoClickerDamageCost * 1.3);
    updateDisplays();
  }
}

function upgradeAutoClickerSpeed() {
  if (gold >= autoClickerSpeedCost) {
    gold -= autoClickerSpeedCost;
    autoClickerSpeed = Math.max(200, autoClickerSpeed - 100);
    clearInterval(autoClickerInterval);
    autoClickerInterval = setInterval(autoClickerTick, autoClickerSpeed);
    autoClickerSpeedCost = Math.floor(autoClickerSpeedCost * 1.4);
    updateDisplays();
  }
}

function autoClickerTick() {
  if (!photoDefeated) {
    photoHP -= autoClickerDamage;
    totalDamage += autoClickerDamage;
    
    if (photoHP <= 0) {
      handlePhotoDefeat();
    }
    updateDisplays();
  }
}

// Utility functions
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(console.error);
  } else if (document.exitFullscreen) {
    document.exitFullscreen();
  }
}

function toggleMusic() {
  musicMuted = !musicMuted;
  elements.bgMusic.muted = musicMuted;
  localStorage.setItem('audioPreferences', JSON.stringify({
    musicMuted,
    soundMuted
  }));
  updateDisplays();
}

function toggleSound() {
  soundMuted = !soundMuted;
  localStorage.setItem('audioPreferences', JSON.stringify({
    musicMuted,
    soundMuted
  }));
  updateDisplays();
}

function toggleLanguage() {
  currentLanguage = currentLanguage === 'en' ? 'ar' : 'en';
  localStorage.setItem('gameLanguage', currentLanguage);
  updateLanguage();
}

function updateLanguage() {
  document.documentElement.lang = currentLanguage;
  document.documentElement.dir = currentLanguage === 'ar' ? 'rtl' : 'ltr';
  elements.welcomeMessage.textContent = translations[currentLanguage].welcome;
  elements.languageButton.textContent = translations[currentLanguage].language;
  updateDisplays();
}

function confirmReset() {
  if (confirm(translations[currentLanguage].confirmReset)) {
    resetGame();
  }
}

function resetGame() {
  initialHP = 50;
  photoHP = initialHP;
  clickDamage = 2;
  gold = 0;
  hpIncrement = 25;
  upgradeCount = 0;
  photoDefeated = false;
  totalClicks = 0;
  totalDamage = 0;
  totalGoldEarned = 0;
  critChance = 0.1;
  critMultiplier = 2;
  critHits = 0;
  autoClickerActive = false;
  autoClickerDamage = 0;
  autoClickerCost = 50;
  autoClickerSpeed = 1000;
  autoClickerLevel = 0;
  autoClickerSpeedCost = 30;
  autoClickerDamageCost = 25;
  critChanceCost = 10;
  critDamageCost = 10;
  
  clearInterval(autoClickerInterval);
  elements.photoImage.src = 'fish.jpg';
  updateDisplays();
}

// Save/Load functions
function saveGame() {
  if(!isLocalStorageSupported()) {
    showMessage(translations[currentLanguage].storageError);
    return;
  }

  const gameState = {
    version: gameVersion,
    timestamp: new Date().toISOString(),
    initialHP,
    photoHP,
    clickDamage,
    gold,
    hpIncrement,
    upgradeCount,
    photoDefeated,
    totalClicks,
    totalDamage,
    totalGoldEarned,
    critChance,
    critMultiplier,
    autoClickerActive,
    autoClickerDamage,
    autoClickerCost,
    autoClickerSpeed,
    autoClickerLevel,
    autoClickerSpeedCost,
    autoClickerDamageCost,
    critChanceCost,
    critDamageCost,
    critHits,
    musicMuted,
    soundMuted
  };
  
  try {
    localStorage.setItem('minecraftPhotoHuntSave', JSON.stringify(gameState));
    showMessage(translations[currentLanguage].saved);
    elements.saveButton.classList.add('save-pulse');
    setTimeout(() => elements.saveButton.classList.remove('save-pulse'), 1000);
  } catch(e) {
    console.error("Save error:", e);
    if(e.name === 'QuotaExceededError') {
      showMessage(translations[currentLanguage].saveError);
    } else {
      showMessage("Error saving game: " + e.message);
    }
  }
}

function loadGame() {
  if(!isLocalStorageSupported()) {
    showMessage(translations[currentLanguage].storageError);
    return false;
  }

  const savedGame = localStorage.getItem('minecraftPhotoHuntSave');
  if (!savedGame) {
    showMessage(translations[currentLanguage].noSave);
    return false;
  }
  
  try {
    const gameState = JSON.parse(savedGame);
    
    if (!gameState.version || typeof gameState.gold !== 'number') {
      throw new Error("Invalid save data");
    }

    initialHP = gameState.initialHP || 50;
    photoHP = gameState.photoHP || initialHP;
    clickDamage = gameState.clickDamage || 2;
    gold = gameState.gold || 0;
    hpIncrement = gameState.hpIncrement || 25;
    upgradeCount = gameState.upgradeCount || 0;
    photoDefeated = gameState.photoDefeated || false;
    totalClicks = gameState.totalClicks || 0;
    totalDamage = gameState.totalDamage || 0;
    totalGoldEarned = gameState.totalGoldEarned || 0;
    critChance = gameState.critChance || 0.1;
    critMultiplier = gameState.critMultiplier || 2;
    autoClickerActive = gameState.autoClickerActive || false;
    autoClickerDamage = gameState.autoClickerDamage || 0;
    autoClickerCost = gameState.autoClickerCost || 50;
    autoClickerSpeed = gameState.autoClickerSpeed || 1000;
    autoClickerLevel = gameState.autoClickerLevel || 0;
    autoClickerSpeedCost = gameState.autoClickerSpeedCost || 30;
    autoClickerDamageCost = gameState.autoClickerDamageCost || 25;
    critChanceCost = gameState.critChanceCost || 10;
    critDamageCost = gameState.critDamageCost || 10;
    critHits = gameState.critHits || 0;
    musicMuted = gameState.musicMuted || false;
    soundMuted = gameState.soundMuted || false;

    if (autoClickerActive) {
      clearInterval(autoClickerInterval);
      autoClickerInterval = setInterval(autoClickerTick, autoClickerSpeed);
    }

    elements.photoImage.src = photoDefeated ? 'deadduck.jpg' : 'fish.jpg';
    
    elements.bgMusic.muted = musicMuted;
    elements.gameContainer.classList.add('load-flash');
    setTimeout(() => elements.gameContainer.classList.remove('load-flash'), 500);
    
    updateDisplays();
    showMessage(translations[currentLanguage].load);
    return true;
  } catch(e) {
    console.error("Load error:", e);
    showMessage(translations[currentLanguage].loadError);
    return false;
  }
}

// Helper functions
function getUpgradeCost() {
  return Math.floor(2 + upgradeCount * 1.5);
}

function showMessage(message) {
  elements.messageDisplay.textContent = message;
  elements.messageDisplay.style.opacity = 1;
  setTimeout(() => elements.messageDisplay.style.opacity = 0, 3000);
}

// PWA Installation Handling
let installPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  installPrompt = e;
  showInstallButton();
});

function showInstallButton() {
  const installBtn = document.getElementById('install-btn') || document.createElement('button');
  installBtn.id = 'install-btn';
  installBtn.textContent = 'Install Game';
  installBtn.className = 'install-btn';
  
  installBtn.addEventListener('click', async () => {
    if (!installPrompt) return;
    const result = await installPrompt.prompt();
    console.log(`Install prompt: ${result.outcome}`);
    installPrompt = null;
    installBtn.remove();
  });

  if (!document.getElementById('install-btn')) {
    document.body.appendChild(installBtn);
  }
}

window.addEventListener('appinstalled', () => {
  const installBtn = document.getElementById('install-btn');
  if (installBtn) installBtn.remove();
});

// Start the game
initGame();