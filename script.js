// DOM Elements
const cyclesContainer = document.getElementById('cyclesContainer');
const registerPopup = document.getElementById('registerPopup');
const closeBtn = document.querySelector('.close-btn');
const saveUserBtn = document.getElementById('saveUser');
const userNameInput = document.getElementById('userName');

// State
let users = [];
let activeCycleSelect = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    loadUsers();
    createCycleCards();
    setupEventListeners();
});

// Load users from localStorage
function loadUsers() {
    const savedUsers = localStorage.getItem('racingUsers');
    users = savedUsers ? JSON.parse(savedUsers) : [
        { id: 'user1', name: 'John Doe' },
        { id: 'user2', name: 'Jane Smith' },
        { id: 'user3', name: 'Mike Johnson' }
    ];
}

// Save users to localStorage
function saveUsers() {
    localStorage.setItem('racingUsers', JSON.stringify(users));
}

// Create cycle cards
function createCycleCards() {
    if (!cyclesContainer) return;
    
    cyclesContainer.innerHTML = '';
    
    for (let i = 1; i <= 8; i++) {
        const batteryLevel = Math.floor(Math.random() * 30) + 70; // 70-100%
        const isLowBattery = batteryLevel < 80;
        
        const card = document.createElement('div');
        card.className = 'cycle-card';
        card.dataset.cycleId = i;
        
        card.innerHTML = `
            <div class="cycle-avatar">C${i}</div>
            <div class="cycle-name">Cycle ${i}</div>
          
            <div class="cycle-race-info" style="display: none;">
                <div class="race-duration">00:00</div>
                <div class="energy-generated">0 Wh</div>
            </div>
            <div class="cycle-controls">
                <select class="cycle-user-select">
                    <option value="">Select User</option>
                    <option value="register">Register New User</option>
                </select>
                <button class="start-btn" style="display: none;">Start</button>
                <button class="stop-btn" style="display: none;">Stop</button>
            </div>
        `;
        
        const select = card.querySelector('select');
        select.addEventListener('change', handleUserSelect);
        
        cyclesContainer.appendChild(card);
    }
    
    updateUserDropdowns();
}

// Update user dropdowns with current users
function updateUserDropdowns() {
    const selects = document.querySelectorAll('.cycle-user-select');
    
    selects.forEach(select => {
        const currentValue = select.value;
        const isRegisterSelected = currentValue === 'register';
        
        // Keep the first two options (Select User and Register New User)
        while (select.options.length > 2) {
            select.remove(2);
        }
        
        // Add current users
        users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = user.name;
            select.add(option);
        });
        
        // Restore selection if it still exists
        if (currentValue && (currentValue === 'register' || users.some(u => u.id === currentValue))) {
            select.value = currentValue;
        } else if (isRegisterSelected) {
            select.value = 'register';
        } else {
            select.value = '';
        }
        
        updateCardStyle(select);
    });
}

// Handle user selection
function handleUserSelect(e) {
    const select = e.target;
    const card = select.closest('.cycle-card');
    
    if (select.value === 'register') {
        // Store the select element to update after registration
        activeCycleSelect = select;
        document.getElementById('registerPopup').style.display = 'flex';
        select.value = '';
        return;
    }
    
    updateCardStyle(select);
    
    // If a user is selected, show the start button
    if (select.value) {
        const startBtn = card.querySelector('.start-btn');
        if (startBtn) {
            startBtn.style.display = 'block';
            startBtn.onclick = () => startRace(select);
        }
    }
}

// Race state for each cycle
const raceStates = new Map();

// Handle race start
function startRace(select) {
    const card = select.closest('.cycle-card');
    const cycleId = card.dataset.cycleId;
    const userId = select.value;
    const user = users.find(u => u.id === userId);
    
    if (user) {
        // Hide start button, show stop button
        const startBtn = card.querySelector('.start-btn');
        const stopBtn = card.querySelector('.stop-btn');
        const raceInfo = card.querySelector('.cycle-race-info');
        const userSelect = card.querySelector('.cycle-user-select');
        
        startBtn.style.display = 'none';
        stopBtn.style.display = 'block';
        raceInfo.style.display = 'block';
        userSelect.disabled = true;
        
        // Initialize race state
        const startTime = Date.now();
        const raceState = {
            startTime,
            intervalId: null,
            energy: 0,
            lastUpdate: startTime
        };
        
        // Start updating duration and energy
        raceState.intervalId = setInterval(() => {
            updateRaceStats(card, raceState);
        }, 1000);
        
        raceStates.set(cycleId, raceState);
        updateRaceStats(card, raceState); // Initial update
        
        showNotification(`Race started for ${user.name}'s cycle!`);
    }
}

// Update race statistics (duration and energy)
function updateRaceStats(card, raceState) {
    const now = Date.now();
    const elapsed = Math.floor((now - raceState.startTime) / 1000); // in seconds
    const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const seconds = (elapsed % 60).toString().padStart(2, '0');
    
    // Update duration
    const durationEl = card.querySelector('.race-duration');
    if (durationEl) {
        durationEl.textContent = `${minutes}:${seconds}`;
    }
    
    // Update energy (simulated)
    const timeDiff = (now - raceState.lastUpdate) / 1000; // in seconds
    raceState.energy += (Math.random() * 0.5 + 0.5) * timeDiff; // Random energy generation
    raceState.lastUpdate = now;
    
    const energyEl = card.querySelector('.energy-generated');
    if (energyEl) {
        energyEl.textContent = `${raceState.energy.toFixed(1)} Wh`;
    }
}

// Handle race stop
function stopRace(cycleId) {
    const card = document.querySelector(`.cycle-card[data-cycle-id="${cycleId}"]`);
    if (!card) return;
    
    const raceState = raceStates.get(cycleId);
    if (raceState) {
        clearInterval(raceState.intervalId);
        raceStates.delete(cycleId);
    }
    
    const startBtn = card.querySelector('.start-btn');
    const stopBtn = card.querySelector('.stop-btn');
    const raceInfo = card.querySelector('.cycle-race-info');
    const userSelect = card.querySelector('.cycle-user-select');
    
    startBtn.style.display = 'block';
    stopBtn.style.display = 'none';
    raceInfo.style.display = 'none';
    userSelect.disabled = false;
    
    showNotification(`Race stopped!`);
}

// Update card style based on selection
function updateCardStyle(select) {
    const card = select.closest('.cycle-card');
    const cycleId = card.dataset.cycleId;
    const selectedUserId = select.value;
    const startBtn = card.querySelector('.start-btn');
    
    if (selectedUserId && selectedUserId !== 'register') {
        card.classList.add('selected');
        const user = users.find(u => u.id === selectedUserId);
        if (user) {
            card.querySelector('.cycle-name').textContent = `${user.name}'s Cycle`;
        }
        if (startBtn) startBtn.style.display = 'block';
    } else {
        card.classList.remove('selected');
        card.querySelector('.cycle-name').textContent = `Cycle ${cycleId}`;
        if (startBtn) startBtn.style.display = 'none';
    }
}

// Show registration popup
function showPopup() {
    if (!registerPopup) return;
    registerPopup.style.display = 'flex';
    userNameInput.focus();
}

// Close registration popup
function closePopup() {
    if (!registerPopup) return;
    registerPopup.style.display = 'none';
    userNameInput.value = '';
}

// Save new user
function saveUser() {
    const name = userNameInput.value.trim();
    if (!name) return;
    
    const newUser = {
        id: 'user_' + Date.now(),
        name: name
    };
    
    users.push(newUser);
    saveUsers();
    updateUserDropdowns();
    
    if (activeCycleSelect) {
        activeCycleSelect.value = newUser.id;
        updateCardStyle(activeCycleSelect);
        activeCycleSelect = null;
    }
    
    closePopup();
    showNotification(`User "${name}" registered successfully!`);
}

// Show notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Setup event listeners
function setupEventListeners() {
    // Close popup when clicking the close button
    if (closeBtn) {
        closeBtn.addEventListener('click', closePopup);
    }
    
    // Close popup when clicking outside the popup content
    window.addEventListener('click', (e) => {
        if (e.target === registerPopup) {
            closePopup();
        }
    });
    
    // Save user when clicking the save button
    if (saveUserBtn) {
        saveUserBtn.addEventListener('click', saveUser);
    }
    
    // Save user when pressing Enter in the input field
    if (userNameInput) {
        userNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                saveUser();
            }
        });
    }
    
    // Delegate stop button clicks
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('stop-btn')) {
            const card = e.target.closest('.cycle-card');
            if (card) {
                stopRace(card.dataset.cycleId);
            }
        }
    });
}