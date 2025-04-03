// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(reg => console.log('Service Worker registered'))
      .catch(err => console.log('Registration failed:', err));
  });
}
// Game State
let initialHP = 50;
let photoHP = initialHP;
let clickDamage = 2;
let gold = 0;
let restartCounter = 10;
let hpIncrement = 25;
let upgradeCount = 0;
let clickCounter = 0;
let photoDefeated = false;
let totalClicks = 0;
let totalDamage = 0;
let totalGoldEarned = 0;
let critChance = 0.1;
let critMultiplier = 2;
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
let critHits = 0;
let currentLanguage = 'en';

// Translations
const translations = {
  en: {
    welcome: "Welcome to the site!",
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
    language: "العربية"
  },
  ar: {
    welcome: "نورت يا معاق!",
    damage: "الدمج:",
    gold: "قطع ذهبية:",
    critChance: "الكريت ريت :",
    critMultiplier: "الكريت دمج",
    upgrade: "تطوير",
    critChanceUpgrade: " الكريت ريت",
    critDamageUpgrade: " الكريت دمج",
    autoClicker: " اوتو كليكر",
    acDamage: "دمج الاوتو كليكر",
    acSpeed: " سرعة الأوتو كلكير",
    fullscreen: "فول سكرين مية مية ",
    toggleMusic: "تشغيل/إيقاف الموسيقى",
    toggleSound: "تشغيل/إيقاف الصوت",
    restart: "إعادة البدأ",
    donate: "تبرع",
    language: "English"
  }
};

// DOM Elements
const elements = {
  photoImage: document.getElementById('photo-image'),
  photoHP: document.getElementById('photo-hp'),
  clickDamage: document.getElementById('click-damage'),
  gold: document.getElementById('gold'),
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
  damageSound: document.getElementById('damage-sound'),
  bgMusic: document.getElementById('bg-music'),
  languageButton: document.getElementById('language-button'),
  welcomeMessage: document.getElementById('welcome-message'),
  donateButton: document.getElementById('donate-button'),
  critChance: document.getElementById('crit-chance'),
  critMultiplier: document.getElementById('crit-multiplier'),
  messageDisplay: document.getElementById('message-display')
};

// Initialize game
function initGame() {
  updateDisplays();
  updateLanguage();
  initEventListeners();
  elements.restartButton.style.display = 'none';
  
  // Initialize audio
  elements.bgMusic.volume = 0.3;
  document.addEventListener('click', function initAudio() {
    elements.bgMusic.play().catch(console.error);
    document.removeEventListener('click', initAudio);
  }, { once: true });
}

// Update all displays
function updateDisplays() {
  elements.photoHP.textContent = `HP: ${photoHP}`;
  elements.clickDamage.textContent = `${translations[currentLanguage].damage} ${clickDamage}`;
  elements.gold.textContent = `${translations[currentLanguage].gold} ${gold}`;
  elements.critChance.textContent = `${translations[currentLanguage].critChance} ${Math.round(critChance * 100)}%`;
  elements.critMultiplier.textContent = `${translations[currentLanguage].critMultiplier} ${critMultiplier}x`;

  const upgradeCost = getUpgradeCost();
  elements.upgradeButton.textContent = `${translations[currentLanguage].upgrade} (${upgradeCost} ${translations[currentLanguage].gold})`;
  elements.autoClickerButton.textContent = `${translations[currentLanguage].autoClicker} (${autoClickerCost} ${translations[currentLanguage].gold})`;
  elements.autoClickerButton.disabled = autoClickerActive || gold < autoClickerCost;

  elements.critChanceButton.textContent = `${translations[currentLanguage].critChanceUpgrade} (${critChanceCost} ${translations[currentLanguage].gold})`;
  elements.critDamageButton.textContent = `${translations[currentLanguage].critDamageUpgrade} (${critDamageCost} ${translations[currentLanguage].gold})`;
  elements.autoClickerDmgButton.textContent = `${translations[currentLanguage].acDamage} (${autoClickerDamageCost} ${translations[currentLanguage].gold})`;
  elements.autoClickerSpeedButton.textContent = `${translations[currentLanguage].acSpeed} (${autoClickerSpeedCost} ${translations[currentLanguage].gold})`;

  elements.muteMusicButton.textContent = musicMuted ? 
    translations[currentLanguage].toggleMusic.replace("Toggle", "Unmute") : 
    translations[currentLanguage].toggleMusic;

  elements.muteSoundButton.textContent = soundMuted ? 
    translations[currentLanguage].toggleSound.replace("Toggle", "Unmute") : 
    translations[currentLanguage].toggleSound;
}

// Initialize event listeners
function initEventListeners() {
  // Photo click
  elements.photoImage.addEventListener('click', function(event) {
    if (photoDefeated) return;
    
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
      photoHP = 0;
      photoDefeated = true;
      const goldEarned = Math.floor(initialHP / 2);
      gold += goldEarned;
      totalGoldEarned += goldEarned;
      showMessage(currentLanguage === 'en' ? `You earned ${goldEarned} gold!` : `لقد ربحت ${goldEarned} ذهب!`);
      
      setTimeout(() => {
        initialHP += hpIncrement;
        photoHP = initialHP;
        photoDefeated = false;
        updateDisplays();
      }, 2000);
    }
    
    // Show damage at click position
    showDamage(damage, isCrit, event);
    
    // Play sound
    if (!soundMuted) {
      elements.damageSound.currentTime = 0;
      elements.damageSound.play().catch(e => console.log("Audio play error:", e));
    }
    
    // Shake animation
    elements.photoImage.classList.add('shake');
    setTimeout(() => {
      elements.photoImage.classList.remove('shake');
    }, 600);
    
    updateDisplays();
  });

  // Buttons
  elements.upgradeButton.addEventListener('click', function() {
    const cost = getUpgradeCost();
    if (gold >= cost) {
      gold -= cost;
      clickDamage += 1;
      upgradeCount++;
      updateDisplays();
    }
  });

  elements.critChanceButton.addEventListener('click', function() {
    if (gold >= critChanceCost) {
      gold -= critChanceCost;
      critChance += 0.05;
      critChanceCost = Math.floor(critChanceCost * 1.5);
      updateDisplays();
    }
  });

  elements.critDamageButton.addEventListener('click', function() {
    if (gold >= critDamageCost) {
      gold -= critDamageCost;
      critMultiplier += 0.2;
      critDamageCost = Math.floor(critDamageCost * 1.5);
      updateDisplays();
    }
  });

  elements.autoClickerButton.addEventListener('click', function() {
    if (!autoClickerActive && gold >= autoClickerCost) {
      gold -= autoClickerCost;
      autoClickerActive = true;
      autoClickerDamage = 1;
      autoClickerInterval = setInterval(function() {
        if (!photoDefeated) {
          photoHP -= autoClickerDamage;
          totalDamage += autoClickerDamage;
          
          if (photoHP <= 0) {
            photoHP = 0;
            photoDefeated = true;
            const goldEarned = Math.floor(initialHP / 2);
            gold += goldEarned;
            totalGoldEarned += goldEarned;
            
            setTimeout(() => {
              initialHP += hpIncrement;
              photoHP = initialHP;
              photoDefeated = false;
            }, 2000);
          }
          updateDisplays();
        }
      }, autoClickerSpeed);
      updateDisplays();
    }
  });

  elements.autoClickerDmgButton.addEventListener('click', function() {
    if (gold >= autoClickerDamageCost) {
      gold -= autoClickerDamageCost;
      autoClickerDamage += 1;
      autoClickerDamageCost = Math.floor(autoClickerDamageCost * 1.3);
      updateDisplays();
    }
  });

  elements.autoClickerSpeedButton.addEventListener('click', function() {
    if (gold >= autoClickerSpeedCost) {
      gold -= autoClickerSpeedCost;
      autoClickerSpeed = Math.max(200, autoClickerSpeed - 100);
      clearInterval(autoClickerInterval);
      autoClickerInterval = setInterval(function() {
        if (!photoDefeated) {
          photoHP -= autoClickerDamage;
          totalDamage += autoClickerDamage;
          
          if (photoHP <= 0) {
            photoHP = 0;
            photoDefeated = true;
            const goldEarned = Math.floor(initialHP / 2);
            gold += goldEarned;
            totalGoldEarned += goldEarned;
            
            setTimeout(() => {
              initialHP += hpIncrement;
              photoHP = initialHP;
              photoDefeated = false;
            }, 2000);
          }
          updateDisplays();
        }
      }, autoClickerSpeed);
      autoClickerSpeedCost = Math.floor(autoClickerSpeedCost * 1.4);
      updateDisplays();
    }
  });

  elements.fullscreenButton.addEventListener('click', function() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  });

  elements.muteMusicButton.addEventListener('click', function() {
    musicMuted = !musicMuted;
    elements.bgMusic.muted = musicMuted;
    updateDisplays();
  });

  elements.muteSoundButton.addEventListener('click', function() {
    soundMuted = !soundMuted;
    updateDisplays();
  });

  elements.restartButton.addEventListener('click', function() {
    if (confirm(currentLanguage === 'en' ? 'Are you sure you want to restart?' : 'هل أنت متأكد أنك تريد إعادة التشغيل؟')) {
      // Reset all game state variables
      initialHP = 50;
      photoHP = initialHP;
      clickDamage = 2;
      gold = 0;
      restartCounter = 10;
      hpIncrement = 25;
      upgradeCount = 0;
      clickCounter = 0;
      photoDefeated = false;
      totalClicks = 0;
      totalDamage = 0;
      totalGoldEarned = 0;
      critChance = 0.1;
      critMultiplier = 2;
      autoClickerActive = false;
      autoClickerDamage = 0;
      autoClickerCost = 50;
      autoClickerSpeed = 1000;
      autoClickerLevel = 0;
      autoClickerSpeedCost = 30;
      autoClickerDamageCost = 25;
      critChanceCost = 10;
      critDamageCost = 10;
      critHits = 0;
      
      clearInterval(autoClickerInterval);
      elements.photoImage.src = 'fish.jpg';
      updateDisplays();
    }
  });

  elements.languageButton.addEventListener('click', function() {
    currentLanguage = currentLanguage === 'en' ? 'ar' : 'en';
    updateLanguage();
  });
}

// Helper functions
function getUpgradeCost() {
  return Math.floor(2 + upgradeCount * 1.5);
}

function showDamage(damage, isCrit, event) {
  const damageElement = document.createElement('div');
  damageElement.className = 'damage-display';
  if (isCrit) damageElement.classList.add('crit-damage');
  damageElement.textContent = `-${damage}`;
  
  // Position at click location
  damageElement.style.position = 'fixed';
  damageElement.style.left = `${event.clientX}px`;
  damageElement.style.top = `${event.clientY}px`;
  damageElement.style.transform = 'translate(-50%, -50%)';
  
  document.body.appendChild(damageElement);
  
  setTimeout(() => {
    damageElement.remove();
  }, 800);
}

function showMessage(message) {
  elements.messageDisplay.textContent = message;
  elements.messageDisplay.style.opacity = 1;
  
  setTimeout(() => {
    elements.messageDisplay.style.opacity = 0;
  }, 3000);
}

function updateLanguage() {
  const lang = translations[currentLanguage];
  elements.welcomeMessage.textContent = lang.welcome;
  elements.donateButton.textContent = lang.donate;
  elements.languageButton.textContent = lang.language;
  document.documentElement.lang = currentLanguage;
  document.documentElement.dir = currentLanguage === 'ar' ? 'rtl' : 'ltr';
  updateDisplays();
}

// Start the game
initGame();
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  // منع المتصفح من عرض رسالة التثبيت التلقائية
  e.preventDefault();
  // حفظ الحدث لاستخدامه لاحقاً
  deferredPrompt = e;
  
  // عرض زر التثبيت الخاص بك
  const installButton = document.createElement('button');
  installButton.id = 'install-button';
  installButton.textContent = 'Install App';
  installButton.style.position = 'fixed';
  installButton.style.bottom = '20px';
  installButton.style.right = '20px';
  installButton.style.zIndex = '1000';
  installButton.style.padding = '10px 20px';
  installButton.style.backgroundColor = '#ff5722';
  installButton.style.color = 'white';
  installButton.style.border = 'none';
  installButton.style.borderRadius = '5px';
  installButton.style.cursor = 'pointer';
  
  document.body.appendChild(installButton);
  
  installButton.addEventListener('click', () => {
    // عرض رسالة التثبيت
    deferredPrompt.prompt();
    // الانتظار حتى يقرر المستخدم
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted install');
      } else {
        console.log('User dismissed install');
      }
      deferredPrompt = null;
      // إزالة زر التثبيت بعد الاستخدام
      installButton.remove();
    });
  });
});

window.addEventListener('appinstalled', () => {
  console.log('App installed successfully');
  // يمكنك إزالة زر التثبيت هنا إذا كان لا يزال موجوداً
  const installButton = document.getElementById('install-button');
  if (installButton) {
    installButton.remove();
  }
});
// Install Prompt Handling
let installPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  installPrompt = e;
  showInstallButton();
});

function showInstallButton() {
  const installBtn = document.createElement('button');
  installBtn.id = 'install-btn';
  installBtn.textContent = 'Install Game';
  installBtn.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 10px 15px;
    background: #FF5722;
    color: white;
    border: none;
    border-radius: 5px;
    font-size: 16px;
    cursor: pointer;
    z-index: 1000;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  `;
  
  installBtn.addEventListener('click', async () => {
    if (!installPrompt) return;
    const result = await installPrompt.prompt();
    console.log(`Install prompt was: ${result.outcome}`);
    installPrompt = null;
    installBtn.remove();
  });

  document.body.appendChild(installBtn);
}

// Check if app is already installed
window.addEventListener('appinstalled', () => {
  console.log('App was successfully installed');
  const installBtn = document.getElementById('install-btn');
  if (installBtn) installBtn.remove();
});