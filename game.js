class UnicornMonteGame {
    constructor() {
        this.score = 0;
        this.round = 1;
        this.attempts = 3;
        this.maxScore = 100;
        this.unicornBox = null;
        this.isGameActive = false;
        this.isShuffling = false;
        this.boxes = document.querySelectorAll('.box');
        // Adjust initial positions to be centered
        const spacing = 120;
        this.positions = [-spacing, 0, spacing]; // Center-relative positions
        this.startBtn = document.getElementById('start-btn');
        this.resetBtn = document.getElementById('reset-btn');
        this.scoreDisplay = document.getElementById('score');
        this.roundDisplay = document.getElementById('round');
        this.attemptsDisplay = document.getElementById('attempts');
        this.messageDisplay = document.getElementById('message');
        this.difficultySelector = document.getElementById('difficulty');
        this.selectedCards = new Set(); // Track revealed cards
        this.shuffleSequence = []; // Store the sequence of moves
        this.currentMove = 0; // Track current move in sequence
        
        // Difficulty settings
        this.difficultySettings = {
            easy: {
                shuffleSpeed: 600,
                shuffleCount: 4,
                spacing: 90,
                zIndexChangeFrequency: 0.3
            },
            medium: {
                shuffleSpeed: 400,
                shuffleCount: 6,
                spacing: 90,
                zIndexChangeFrequency: 0.5
            },
            hard: {
                shuffleSpeed: 300,
                shuffleCount: 8,
                spacing: 120,
                zIndexChangeFrequency: 0.7
            }
        };
        
        // Bind the event handlers to maintain 'this' context
        this.handleBoxClick = this.handleBoxClick.bind(this);
        this.startGame = this.startGame.bind(this);
        this.resetGame = this.resetGame.bind(this);
        
        // Add event listeners
        this.startBtn.addEventListener('click', this.startGame);
        this.resetBtn.addEventListener('click', this.resetGame);
        this.boxes.forEach(box => {
            box.addEventListener('click', this.handleBoxClick);
        });
    }

    startGame() {
        if (this.round > 3) {
            this.finalizeGame();
            return;
        }

        const difficulty = this.difficultySettings[this.difficultySelector.value];
        
        this.isGameActive = false;
        this.attempts = 3;
        
        // Disable difficulty selector and start button
        this.difficultySelector.disabled = true;
        this.startBtn.disabled = true;
        
        // Store the previous position before updating
        const previousPosition = this.unicornBox ?? Math.floor(Math.random() * 3) + 1;
        
        if (Math.random() < 0.9) {
            // 90% chance to pick a different position
            const availablePositions = [1, 2, 3].filter(pos => pos !== previousPosition);
            this.unicornBox = availablePositions[Math.floor(Math.random() * availablePositions.length)];
        } else {
            // 10% chance to allow same position
            this.unicornBox = Math.floor(Math.random() * 3) + 1;
        }
        
        this.attemptsDisplay.textContent = this.attempts;
        this.selectedCards.clear();
        
        // Position cards with proper spacing
        const spacing = difficulty.spacing;
        this.positions = [-spacing, 0, spacing]; // Reset to centered positions
        
        // Initialize card positions
        this.boxes.forEach((box, i) => {
            box.classList.remove('flipped', 'correct', 'incorrect');
            this.updateCardPosition(box, this.positions[i]);
            const front = box.querySelector('.card-front');
            front.innerHTML = '';
        });

        // Show unicorn
        const unicornBox = this.boxes[this.unicornBox - 1];
        const front = unicornBox.querySelector('.card-front');
        front.innerHTML = '🦄';
        
        this.messageDisplay.textContent = 'Watch carefully where the unicorn appears!';

        // Show all cards briefly
        this.boxes.forEach(box => box.classList.add('flipped'));

        setTimeout(() => {
            // Hide all cards and start shuffling
            this.boxes.forEach(box => box.classList.remove('flipped'));
            setTimeout(() => {
                this.startShuffling();
            }, 600);
        }, 2000);

        this.startBtn.disabled = true;
    }

    async startShuffling() {
        if (this.isShuffling) return;
        this.isShuffling = true;
        this.isGameActive = false;

        const difficulty = this.difficultySettings[this.difficultySelector.value];
        
        // Generate a sequence of moves
        this.shuffleSequence = this.generateShuffleSequence(difficulty.shuffleCount);
        this.currentMove = 0;
        
        // Start the first move
        this.performNextMove();
    }

    generateShuffleSequence(count) {
        const moves = [];
        const possibleMoves = [
            [0, 1], // Left-Middle swap
            [1, 2], // Middle-Right swap
            [0, 2]  // Left-Right swap
        ];

        for (let i = 0; i < count; i++) {
            // Avoid repeating the same move twice in a row
            let nextMove;
            do {
                nextMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
            } while (moves.length > 0 && 
                    moves[moves.length - 1][0] === nextMove[0] && 
                    moves[moves.length - 1][1] === nextMove[1]);
            moves.push(nextMove);
        }
        return moves;
    }

    performNextMove() {
        if (this.currentMove >= this.shuffleSequence.length) {
            this.isShuffling = false;
            this.isGameActive = true;
            return;
        }

        const difficulty = this.difficultySettings[this.difficultySelector.value];
        const cardPair = this.shuffleSequence[this.currentMove];
        
        this.performSingleSwap(cardPair, difficulty.spacing, difficulty.shuffleSpeed)
            .then(() => {
                // Add a pause between moves
                setTimeout(() => {
                    this.currentMove++;
                    this.performNextMove();
                }, difficulty.shuffleSpeed * 0.3);
            });
    }

    performSingleSwap(cardPair, spacing, speed) {
        return new Promise(resolve => {
            const startTime = Date.now();
            const moveDistance = spacing;
            const arcHeight = 50;
            
            // Reset z-indices
            this.boxes.forEach(box => box.style.zIndex = '1');
            
            const [card1Index, card2Index] = cardPair;
            const card1StartX = this.positions[card1Index];
            const card2StartX = this.positions[card2Index];
            const distance = card2StartX - card1StartX;
            
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / speed, 1);
                
                // Smooth easing function
                const ease = t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
                const currentProgress = ease(progress);
                
                // Calculate positions for the two moving cards
                this.boxes.forEach((box, index) => {
                    if (index === card1Index) {
                        const x = card1StartX + (distance * currentProgress);
                        const y = Math.sin(Math.PI * currentProgress) * arcHeight;
                        const rotation = Math.sin(Math.PI * currentProgress) * 20;
                        this.updateCardPosition(box, x, y, rotation);
                        box.style.zIndex = currentProgress < 0.5 ? '2' : '1';
                    } else if (index === card2Index) {
                        const x = card2StartX - (distance * currentProgress);
                        const y = -Math.sin(Math.PI * currentProgress) * arcHeight;
                        const rotation = -Math.sin(Math.PI * currentProgress) * 20;
                        this.updateCardPosition(box, x, y, rotation);
                        box.style.zIndex = currentProgress < 0.5 ? '1' : '2';
                    }
                    // The third card stays completely still
                });

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    // Update positions array
                    const tempPosition = this.positions[card1Index];
                    this.positions[card1Index] = this.positions[card2Index];
                    this.positions[card2Index] = tempPosition;

                    // Reset all cards to their final positions
                    this.boxes.forEach((box, i) => {
                        this.updateCardPosition(box, this.positions[i], 0, 0);
                        box.style.zIndex = '1';
                    });
                    resolve();
                }
            };

            requestAnimationFrame(animate);
        });
    }

    updateCardPosition(box, x, y = 0, rotation = 0) {
        const transform = y !== 0 || rotation !== 0
            ? `translate(${x}px, ${y}px) rotate(${rotation}deg)`
            : `translateX(${x}px)`;
        box.style.transform = transform;
        box.style.setProperty('--tx', x + 'px');
    }

    shuffleBoxes() {
        if (this.shuffleCount >= 4) {
            this.shuffleCount = 0;
            this.isGameActive = true;
            return;
        }

        const spacing = 90;
        const startX = -spacing;
        
        // Shuffle the positions
        this.boxes.forEach((box, i) => {
            const newX = startX + (i * spacing);
            this.updateCardPosition(box, newX);
        });

        this.shuffleCount++;
        setTimeout(() => this.shuffleBoxes(), 450);
    }

    calculateScore() {
        // Calculate based on which attempt number we're on (4 - attempts)
        const attemptNumber = 4 - this.attempts;
        switch(attemptNumber) {
            case 1: return this.maxScore; // First try: 100 points
            case 2: return this.maxScore / 2; // Second try: 50 points
            case 3: return 0; // Third try: 0 points
            default: return 0;
        }
    }

    handleBoxClick(event) {
        if (!this.isGameActive || this.isShuffling) {
            return;
        }
        
        const box = event.currentTarget;
        if (this.selectedCards.has(box)) {
            return;
        }
        
        const boxIndex = Array.from(this.boxes).indexOf(box) + 1;
        
        box.classList.add('flipped');
        this.selectedCards.add(box);

        if (boxIndex === this.unicornBox) {
            box.classList.add('correct');
            this.score += this.calculateScore();
            this.scoreDisplay.textContent = this.score;
            
            setTimeout(() => {
                this.revealAllCards();
                
                if (this.round === 3) {
                    if (this.score >= 150) {
                        confetti({
                            particleCount: 100,
                            spread: 70,
                            origin: { y: 0.6 }
                        });
                    }
                    setTimeout(() => this.finalizeGame(), 1500);
                } else {
                    this.round++;
                    this.roundDisplay.textContent = this.round;
                    setTimeout(() => this.startNextRound(), 1500);
                }
            }, 1000);
        } else {
            box.classList.add('incorrect');
            this.attempts--;
            this.attemptsDisplay.textContent = this.attempts;
            
            if (this.attempts === 0) {
                setTimeout(() => {
                    this.revealAllCards();
                    if (this.round === 3) {
                        setTimeout(() => this.finalizeGame(), 1500);
                    } else {
                        this.round++;
                        this.roundDisplay.textContent = this.round;
                        setTimeout(() => this.startNextRound(), 1500);
                    }
                }, 1000);
            } else {
                const nextScore = this.calculateScore();
                this.messageDisplay.textContent = `Try again! ${this.attempts} attempts left. Next correct guess worth ${nextScore} points.`;
            }
        }
    }

    revealAllCards() {
        const spacing = 90;
        const startX = -spacing;
        
        this.boxes.forEach((box, i) => {
            box.classList.remove('flipped');
            this.updateCardPosition(box, startX + (i * spacing));
            const front = box.querySelector('.card-front');
            if (i + 1 === this.unicornBox) {
                front.innerHTML = '🦄';
                box.classList.add('correct');
                box.classList.remove('incorrect');
            } else {
                front.innerHTML = '❌';
                box.classList.add('incorrect');
                box.classList.remove('correct');
            }
            setTimeout(() => box.classList.add('flipped'), 50);
        });
    }

    endRound(won) {
        this.isGameActive = false;
        this.round++;
        
        if (!won) {
            const unicornBox = this.boxes[this.unicornBox - 1];
            unicornBox.classList.remove('flipped');
            const front = unicornBox.querySelector('.card-front');
            front.innerHTML = '🦄';
        }

        if (this.round <= 3) {
            this.roundDisplay.textContent = this.round;
            setTimeout(() => this.startGame(), 2000);
        } else {
            this.finalizeGame();
        }
    }

    finalizeGame() {
        this.isGameActive = false;
        
        // Spread out the cards and reveal the unicorn
        const spacing = 90;
        const startX = -spacing;
        
        this.boxes.forEach((box, i) => {
            box.classList.remove('flipped');
            this.updateCardPosition(box, startX + (i * spacing));
            box.style.zIndex = '1';
            
            // Show empty card face for non-unicorn cards
            const front = box.querySelector('.card-front');
            if (i + 1 === this.unicornBox) {
                front.innerHTML = '🦄';
            } else {
                front.innerHTML = '❌';
            }
        });

        let message = `Game Over! Final Score: ${this.score} points.\n`;
        if (this.score >= 250) {
            message += '🏆 Amazing! You\'re a Unicorn Monte master!';
        } else if (this.score >= 150) {
            message += '🎉 Great job! You\'re getting better!';
        } else {
            message += '✨ Good try! Play again to improve your score!';
        }
        
        this.messageDisplay.textContent = message;
        this.startBtn.disabled = true;
    }

    startNextRound() {
        this.isGameActive = false;
        this.attempts = 3;
        this.attemptsDisplay.textContent = this.attempts;
        this.selectedCards.clear();
        
        this.boxes.forEach(box => {
            box.classList.remove('flipped', 'correct', 'incorrect');
            box.style.transform = '';
            box.style.setProperty('--tx', '');
            const front = box.querySelector('.card-front');
            front.innerHTML = '';
        });
        
        setTimeout(() => this.startGame(), 500);
    }

    resetGame() {
        // Stop all ongoing animations
        this.boxes.forEach(box => {
            box.style.transition = 'none';
            box.style.transform = '';
            box.style.zIndex = '1';
            box.classList.remove('flipped', 'correct', 'incorrect');
            const front = box.querySelector('.card-front');
            front.innerHTML = '';
            // Re-enable transitions after reset
            setTimeout(() => {
                box.style.transition = '';
            }, 50);
        });

        // Reset game state
        this.score = 0;
        this.round = 1;
        this.attempts = 3;
        this.unicornBox = null;
        this.isGameActive = false;
        this.isShuffling = false;
        this.selectedCards.clear();
        this.shuffleCount = 0;

        // Update displays
        this.scoreDisplay.textContent = this.score;
        this.roundDisplay.textContent = this.round;
        this.attemptsDisplay.textContent = this.attempts;
        this.messageDisplay.textContent = 'Select difficulty and press Start to begin!';

        // Re-enable controls
        this.difficultySelector.disabled = false;
        this.startBtn.disabled = false;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new UnicornMonteGame();
});
