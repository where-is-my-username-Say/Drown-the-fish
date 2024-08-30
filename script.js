// Initial game state
let initialHP = 50; // Start with an initial HP of 50
let photoHP = initialHP; // Set photoHP to initialHP at the start
let clickDamage = 2;
let gold = 0;
let restartCounter = 10; // Counter for restart button
let hpIncrement = 25; // HP increment per defeat
let upgradeCount = 0; // Track the number of upgrades
let clickCounter = 0; // Track the number of clicks for restart
let photoDefeated = false; // Track if the photo has been defeated
let hpBeforeClick = 0; // Store HP value before the click

// Anti-auto-clicker variables
const MAX_CLICKS_PER_SECOND = 20; // Maximum allowed clicks per second
const CLICK_INTERVAL = 1000; // Time window for counting clicks (in milliseconds)
let clickTimestamps = []; // Array to store click timestamps

// Get HTML elements
const photoImage = document.getElementById('photo-image');
const photoHPDisplay = document.getElementById('photo-hp');
const clickDamageDisplay = document.getElementById('click-damage');
const goldDisplay = document.getElementById('gold');
const upgradeButton = document.getElementById('upgrade-button');
const fullscreenButton = document.getElementById('fullscreen-button');
const restartButton = document.getElementById('restart-button');
const restartCounterDisplay = document.getElementById('restart-counter');
const messageDisplay = document.getElementById('message-display');
const damageSound = document.getElementById('damage-sound'); // Get damage sound element
const bgMusic = document.getElementById('bg-music'); // Get background music element

// Function to update displays
function updateDisplays() {
  photoHPDisplay.textContent = `HP: ${photoHP}`;
  clickDamageDisplay.textContent = `Click Damage: ${clickDamage}`;
  goldDisplay.textContent = `Gold: ${gold}`;

  // Update upgrade button text
  const upgradeCost = getUpgradeCost();
  upgradeButton.textContent = `Upgrade Click (${upgradeCost} Gold)`;

  // Show or hide restart button and counter based on photo HP and defeat status
  if (photoDefeated && photoHP >= 10000) {
    restartButton.style.display = 'block';
    restartCounterDisplay.style.display = 'none'; // Hide the restart counter
  } else if (photoHP >= 10000) {
    photoImage.src = 'path/to/MD.png'; // Change photo to MD.png
    photoHP = 0; // Set HP to 0
    showMessage('Congratulations! You have reached 10,000 HP and won the game!');
    restartButton.style.display = 'block';
    restartCounterDisplay.style.display = 'none'; // Hide the restart counter
  } else {
    restartButton.style.display = 'none';
    restartCounterDisplay.style.display = 'none'; // Hide the restart counter
  }
}

// Function to show in-game messages
function showMessage(text) {
  messageDisplay.textContent = text;
  messageDisplay.style.opacity = '1';
  setTimeout(() => {
    messageDisplay.style.opacity = '0';
  }, 2000); // Display for 2 seconds
}

// Function to determine gold earned based on the initial HP value
function getGoldReward(initialHP) {
  if (initialHP >= 7500) {
    return 150;
  } else if (initialHP >= 5000) {
    return 100;
  } else if (initialHP >= 2500) {
    return 50;
  } else if (initialHP >= 1000) {
    return 25;
  } else if (initialHP >= 500) {
    return 10;
  } else if (initialHP >= 100) {
    return 5;
  }
  return 2; // Default reward if initialHP is less than 100
}

// Function to handle photo defeat
function handlePhotoDefeat() {
  // Calculate reward based on the initial HP value
  const goldReward = getGoldReward(initialHP);
  console.log(`photoHP at defeat: ${initialHP}`); // Debugging line
  console.log(`Gold Reward: ${goldReward}`); // Debugging line
  gold += goldReward;

  showMessage(`You've defeated the enemy! You earned ${goldReward} gold.`);

  // Increase HP for the next level
  initialHP += hpIncrement; // Increase the initial HP by the increment value
  photoHP = initialHP; // Set photo HP to the new initial HP value

  // Check if photoHP is at least 10,000
  if (photoHP >= 10000) {
    photoDefeated = true; // Set the defeated flag to true
  }

  // Adjust the hpIncrement based on initialHP
  if (initialHP >= 7500) {
    hpIncrement = 500;
  } else if (initialHP >= 5000) {
    hpIncrement = 500;
  } else if (initialHP >= 2500) {
    hpIncrement = 250;
  } else if (initialHP >= 1000) {
    hpIncrement = 100;
  } else if (initialHP >= 500) {
    hpIncrement = 50;
  }

  updateDisplays(); // Update displays to reflect the new state
}

// Function to restart the game
function restartGame() {
  initialHP = 50; // Reset initial HP to its original value
  photoHP = initialHP; // Reset HP to the initial value
  clickDamage = 2; // Reset damage to base value
  gold = 0; // Reset gold
  restartCounter = 10; // Reset restart counter
  restartButton.disabled = true; // Disable the restart button again
  upgradeCount = 0; // Reset the upgrade count
  clickCounter = 0; // Reset the click counter
  photoDefeated = false; // Reset the defeated flag
  hpIncrement = 25; // Reset the HP increment

  showMessage('Game restarted!');
  updateDisplays();
}

// Function to get the cost of the next upgrade
function getUpgradeCost() {
  return 2 + upgradeCount; // Upgrade cost increases by 1 each time
}

// Function to create and display damage number
function showDamageNumber(x, y, damage) {
  const damageDisplay = document.createElement('div');
  damageDisplay.textContent = `-${damage}`;
  damageDisplay.className = 'damage-display'; // Apply CSS class for damage display
  damageDisplay.style.left = `${x}px`;
  damageDisplay.style.top = `${y}px`;
  document.getElementById('photo-container').appendChild(damageDisplay);

  // Remove the damage display after 1 second
  setTimeout(() => {
    damageDisplay.remove();
  }, 1000); // Display for 1 second
}

// Click event on photo image
photoImage.addEventListener('click', (event) => {
  // Anti-auto-clicker logic
  const now = Date.now();
  clickTimestamps.push(now);

  // Remove timestamps older than CLICK_INTERVAL
  clickTimestamps = clickTimestamps.filter(timestamp => now - timestamp <= CLICK_INTERVAL);

  // Check if click limit exceeded
  if (clickTimestamps.length > MAX_CLICKS_PER_SECOND) {
    return; // Ignore this click
  }

  // Store HP value before processing the click
  hpBeforeClick = photoHP;

  // Calculate the position for damage display
  const rect = photoImage.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  // Reduce HP by click damage
  photoHP -= clickDamage;

  // Show damage number
  showDamageNumber(x, y, clickDamage);

  // Play damage sound
  damageSound.currentTime = 0; // Reset the playback position
  damageSound.play().catch(error => {
    console.error('Damage sound failed to play:', error);
  });

  // Shake animation on hit
  photoImage.classList.add('shake');
  setTimeout(() => {
    photoImage.classList.remove('shake');
  }, 600);

  // Check if HP is zero or less
  if (photoHP <= 0) {
    photoHP = 0; // Prevent negative HP
    handlePhotoDefeat(); // Handle photo defeat
  }

  updateDisplays();
});

// Upgrade button functionality
upgradeButton.addEventListener('click', () => {
  const upgradeCost = getUpgradeCost();
  if (gold >= upgradeCost) {
    gold -= upgradeCost;
    clickDamage += 1;
    upgradeCount++;
    showMessage('Upgrade successful!');
    updateDisplays();
  } else {
    showMessage('Not enough gold for upgrade!');
  }
});

// Restart button functionality
restartButton.addEventListener('click', () => {
  restartCounter--;
  if (restartCounter <= 0) {
    // Restart the game
    restartGame();
  } else {
    updateDisplays();
  }
});

// Fullscreen button functionality
fullscreenButton.addEventListener('click', () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
});

// Start background music
bgMusic.play().catch(error => {
  console.error('Background music failed to play:', error);
});

// Reset restart button state on page load
restartButton.disabled = true;
