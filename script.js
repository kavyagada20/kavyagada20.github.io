// Game state object - stores all the game data
const game = {
    mode: 'time',           // 'time' or 'words'
    timeLimit: 30,          // seconds
    wordLimit: 25,          // number of words
    currentTime: 30,
    words: [],
    currentWordIndex: 0,
    currentCharIndex: 0,
    isGameStarted: false,
    isGameOver: false,
    startTime: null,
    timerInterval: null,
    correctChars: 0,
    wrongChars: 0,
    totalChars: 0
};

// Get DOM elements
const elements = {
    textDisplay: document.getElementById('textDisplay'),
    inputBox: document.getElementById('inputBox'),
    wpm: document.getElementById('wpm'),
    accuracy: document.getElementById('accuracy'),
    timer: document.getElementById('timer'),
    errors: document.getElementById('errors'),
    results: document.getElementById('results'),
    finalWpm: document.getElementById('finalWpm'),
    finalAccuracy: document.getElementById('finalAccuracy'),
    finalCorrect: document.getElementById('finalCorrect'),
    finalWrong: document.getElementById('finalWrong'),
    restartBtn: document.getElementById('restartBtn'),
    retryBtn: document.getElementById('retryBtn'),
    timeControl: document.getElementById('timeControl'),
    wordControl: document.getElementById('wordControl')
};

// Initialize the game
function init() {
    game.words = generateWords();
    game.currentWordIndex = 0;
    game.currentCharIndex = 0;
    game.isGameStarted = false;
    game.isGameOver = false;
    game.correctChars = 0;
    game.wrongChars = 0;
    game.totalChars = 0;
    game.currentTime = game.timeLimit;
    
    if (game.timerInterval) {
        clearInterval(game.timerInterval);
    }
    
    displayWords();
    resetUI();
    elements.inputBox.value = '';
    elements.inputBox.disabled = false;
    elements.inputBox.focus();
    elements.results.style.display = 'none';
}

// Generate random words from the word list
function generateWords() {
    const count = game.mode === 'time' ? 200 : game.wordLimit;
    const words = [];
    
    for (let i = 0; i < count; i++) {
        const randomIndex = Math.floor(Math.random() * wordList.length);
        words.push(wordList[randomIndex]);
    }
    
    return words;
}

// Display words on screen
function displayWords() {
    elements.textDisplay.innerHTML = '';
    
    game.words.forEach((word, wordIndex) => {
        const wordSpan = document.createElement('span');
        wordSpan.className = 'word';
        
        // Highlight current word
        if (wordIndex === game.currentWordIndex) {
            wordSpan.classList.add('active-word');
        }
        
        word.split('').forEach((char, charIndex) => {
            const charSpan = document.createElement('span');
            charSpan.className = 'letter';
            charSpan.textContent = char;
            wordSpan.appendChild(charSpan);
        });
        
        elements.textDisplay.appendChild(wordSpan);
    });
    
    updateCursor();
}

// Update cursor position
function updateCursor() {
    // Remove all current cursors
    document.querySelectorAll('.letter.current').forEach(el => {
        el.classList.remove('current');
    });
    
    // Add cursor to current position
    const currentWord = elements.textDisplay.children[game.currentWordIndex];
    if (currentWord && currentWord.children[game.currentCharIndex]) {
        currentWord.children[game.currentCharIndex].classList.add('current');
        
        // Auto-scroll to keep current word in view
        const typingBox = currentWord.parentElement.parentElement;
        const wordTop = currentWord.offsetTop;
        const wordBottom = wordTop + currentWord.offsetHeight;
        const boxTop = typingBox.scrollTop;
        const boxBottom = boxTop + typingBox.clientHeight;
        
        // Scroll if word is out of view
        if (wordBottom > boxBottom - 50) {
            typingBox.scrollTop = wordTop - 50;
        } else if (wordTop < boxTop + 50) {
            typingBox.scrollTop = wordTop - 50;
        }
    }
}

// Start the timer
function startTimer() {
    if (game.mode !== 'time') {
        elements.timer.textContent = '—';
        return;
    }
    
    game.timerInterval = setInterval(() => {
        game.currentTime--;
        elements.timer.textContent = game.currentTime;
        
        if (game.currentTime <= 0) {
            endGame();
        }
    }, 1000);
}

// Calculate WPM (Words Per Minute)
function calculateWPM() {
    const timeElapsed = (Date.now() - game.startTime) / 1000 / 60; // in minutes
    const wordsTyped = game.correctChars / 5; // Standard: 5 chars = 1 word
    return Math.round(wordsTyped / timeElapsed);
}

// Calculate Accuracy
function calculateAccuracy() {
    if (game.totalChars === 0) return 100;
    return Math.round((game.correctChars / game.totalChars) * 100);
}

// Update live statistics
function updateStats() {
    elements.wpm.textContent = calculateWPM();
    elements.accuracy.textContent = calculateAccuracy() + '%';
    elements.errors.textContent = game.wrongChars;
}

// Reset UI to initial state
function resetUI() {
    elements.wpm.textContent = '0';
    elements.accuracy.textContent = '100%';
    elements.timer.textContent = game.mode === 'time' ? game.timeLimit : '—';
    elements.errors.textContent = '0';
}

// Handle input from user
elements.inputBox.addEventListener('input', (e) => {
    // Start the game on first input
    if (!game.isGameStarted) {
        game.isGameStarted = true;
        game.startTime = Date.now();
        startTimer();
    }
    
    if (game.isGameOver) return;
    
    const typedValue = e.target.value;
    const currentWord = game.words[game.currentWordIndex];
    const wordElement = elements.textDisplay.children[game.currentWordIndex];
    const letters = wordElement.children;
    
    // Clear previous styling
    for (let i = 0; i < letters.length; i++) {
        letters[i].classList.remove('correct', 'wrong');
    }
    
    // Check each typed character
    for (let i = 0; i < typedValue.length; i++) {
        if (i < currentWord.length) {
            if (typedValue[i] === currentWord[i]) {
                letters[i].classList.add('correct');
            } else {
                letters[i].classList.add('wrong');
            }
        }
    }
    
    game.currentCharIndex = typedValue.length;
    updateCursor();
    
    // Check if space is pressed (word completed)
    if (typedValue.endsWith(' ')) {
        const typedWord = typedValue.trim();
        
        // Calculate correct and wrong characters
        for (let i = 0; i < Math.max(typedWord.length, currentWord.length); i++) {
            game.totalChars++;
            if (typedWord[i] === currentWord[i]) {
                game.correctChars++;
            } else {
                game.wrongChars++;
            }
        }
        
        // Add space character
        game.totalChars++;
        game.correctChars++;
        
        // Remove active-word class from current word
        wordElement.classList.remove('active-word');
        
        // Move to next word
        game.currentWordIndex++;
        game.currentCharIndex = 0;
        e.target.value = '';
        
        // Add active-word class to next word
        if (elements.textDisplay.children[game.currentWordIndex]) {
            elements.textDisplay.children[game.currentWordIndex].classList.add('active-word');
        }
        
        // Check if all words are typed in words mode
        if (game.mode === 'words' && game.currentWordIndex >= game.wordLimit) {
            endGame();
            return;
        }
        
        updateCursor();
    }
    
    updateStats();
});

// End the game and show results
function endGame() {
    game.isGameOver = true;
    clearInterval(game.timerInterval);
    elements.inputBox.disabled = true;
    
    // Calculate final stats
    const finalWPM = calculateWPM();
    const finalAccuracy = calculateAccuracy();
    
    // Update results display
    elements.finalWpm.textContent = finalWPM;
    elements.finalAccuracy.textContent = finalAccuracy + '%';
    elements.finalCorrect.textContent = game.correctChars;
    elements.finalWrong.textContent = game.wrongChars;
    
    // Hide typing area and show results
    elements.textDisplay.parentElement.style.display = 'none';
    elements.inputBox.style.display = 'none';
    elements.results.style.display = 'block';
}

// Mode selection handlers
document.querySelectorAll('.btn-mode').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.btn-mode').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        game.mode = btn.dataset.mode;
        
        if (game.mode === 'time') {
            elements.timeControl.style.display = 'flex';
            elements.wordControl.style.display = 'none';
        } else {
            elements.timeControl.style.display = 'none';
            elements.wordControl.style.display = 'flex';
        }
        
        init();
    });
});

// Time selection handlers
document.querySelectorAll('.btn-time').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.btn-time').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        game.timeLimit = parseInt(btn.dataset.time);
        game.currentTime = game.timeLimit;
        
        init();
    });
});

// Word count selection handlers
document.querySelectorAll('.btn-word').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.btn-word').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        game.wordLimit = parseInt(btn.dataset.words);
        
        init();
    });
});

// Restart button handler
elements.restartBtn.addEventListener('click', () => {
    elements.textDisplay.parentElement.style.display = 'block';
    elements.inputBox.style.display = 'block';
    init();
});

// Retry button handler
elements.retryBtn.addEventListener('click', () => {
    elements.textDisplay.parentElement.style.display = 'block';
    elements.inputBox.style.display = 'block';
    init();
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // ESC to restart
    if (e.key === 'Escape') {
        elements.textDisplay.parentElement.style.display = 'block';
        elements.inputBox.style.display = 'block';
        init();
    }
});

// Prevent input box from losing focus during game
elements.inputBox.addEventListener('blur', () => {
    if (game.isGameStarted && !game.isGameOver) {
        setTimeout(() => elements.inputBox.focus(), 0);
    }
});

// Initialize the game when page loads
window.addEventListener('load', init); 