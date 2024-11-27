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
        this.positions = [0, 120, 240]; // Track actual positions
        this.startBtn = document.getElementById('start-btn');
        this.resetBtn = document.getElementById('reset-btn');
        this.scoreDisplay = document.getElementById('score');
        this.roundDisplay = document.getElementById('round');
        this.attemptsDisplay = document.getElementById('attempts');
        this.messageDisplay = document.getElementById('message');
        this.difficultySelector = document.getElementById('difficulty');
        this.selectedCards = new Set(); // Track revealed cards
        this.shuffleCount = 0; // Track shuffle count
        
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
        const previousPosition = this.unicornBox;
        
        // Try to avoid the previous position when possible
        if (previousPosition !== null && Math.random() < 0.8) {
            // Generate a position that's different from the previous one
            const availablePositions = [1, 2, 3].filter(pos => pos !== previousPosition);
            this.unicornBox = availablePositions[Math.floor(Math.random() * availablePositions.length)];
        } else {
            // 20% chance to allow same position, or first round (previousPosition is null)
            this.unicornBox = Math.floor(Math.random() * 3) + 1;
        }
        
        this.attemptsDisplay.textContent = this.attempts;
        this.selectedCards.clear();
        
        // Calculate center point and spacing based on difficulty
        const boxWidth = 80;
        const spacing = difficulty.spacing;
        const startX = -spacing;
        
        // Position cards with proper spacing
        this.boxes.forEach((box, i) => {
            box.classList.remove('flipped', 'correct', 'incorrect');
            const translateX = startX + (i * spacing);
            this.updateCardPosition(box, translateX);
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
        this.isShuffling = true;
        this.isGameActive = false;
        
        const difficulty = this.difficultySettings[this.difficultySelector.value];
        const shuffleCount = difficulty.shuffleCount + Math.min(this.round * 2, 4);
        const boxes = Array.from(this.boxes);
        const spacing = difficulty.spacing;
        const startX = -spacing;
        
        // Track the initial position of the unicorn box
        const initialUnicornIndex = boxes.findIndex(box => 
            box.querySelector('.card-front').innerHTML === '🦄'
        );
        
        let positions = [startX, 0, spacing];
        let currentShuffles = 0;
        
        const performShuffleSequence = async () => {
            const startFromLeft = Math.random() < 0.5;
            
            // Add random z-index changes based on difficulty
            if (Math.random() < difficulty.zIndexChangeFrequency) {
                const randomBox = boxes[Math.floor(Math.random() * boxes.length)];
                randomBox.style.zIndex = Math.floor(Math.random() * 3) + 1;
            }
            
            await this.performShuffle(boxes, positions, startFromLeft, spacing, difficulty.shuffleSpeed);
            
            if (startFromLeft) {
                boxes.push(boxes.shift());
                boxes.push(boxes.shift());
            } else {
                boxes.unshift(boxes.pop());
                boxes.unshift(boxes.pop());
            }
            positions = [startX, 0, spacing];
        };
        
        // Perform initial shuffles
        for (let i = 0; i < shuffleCount; i++) {
            await performShuffleSequence();
            currentShuffles++;
        }
        
        // Check final position of unicorn
        const finalUnicornIndex = boxes.findIndex(box => 
            box.querySelector('.card-front').innerHTML === '🦄'
        );
        
        // If unicorn ended up in starting position and we haven't shuffled too many times,
        // do 1-2 more shuffles
        if (finalUnicornIndex === initialUnicornIndex && currentShuffles < shuffleCount + 1) {
            const extraShuffles = 1 + Math.floor(Math.random() * 2); // 1 or 2 extra shuffles
            for (let i = 0; i < extraShuffles; i++) {
                await performShuffleSequence();
            }
        }

        this.isShuffling = false;
        this.isGameActive = true;
        this.messageDisplay.textContent = 'Where is the unicorn? Click a box to guess!';
    }

    async performShuffle(boxes, positions, startFromLeft, spacing, speed) {
        return new Promise(resolve => {
            const startTime = Date.now();
            const moveDistance = spacing * 5; // Increased horizontal movement distance
            const arcHeight = 70; // Increased arc height for more dramatic movement
            const circleRadius = 60; // Increased circle radius for wider arcs
            
            // Set initial z-indices
            boxes.forEach(box => box.style.zIndex = '1');
            
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / speed, 1);
                
                // Enhanced easing for more natural movement
                const ease = t => {
                    // Custom easing function that mimics human-like acceleration and deceleration
                    return t < 0.2 
                        ? 3 * t * t // Quick start
                        : t < 0.8 
                            ? 0.6 + (t - 0.4) * 1.2 + Math.sin(t * Math.PI) * 0.1 // Middle phase with slight wobble
                            : 1 - Math.pow(1.2 - t, 2); // Smooth end
                };
                const currentProgress = ease(progress);

                // Calculate circular motion
                const angle = currentProgress * Math.PI;
                const wobble = Math.sin(currentProgress * Math.PI * 4) * 5; // Add subtle wobble
                
                if (startFromLeft) {
                    // Left card: clockwise circular motion
                    const leftCircleX = positions[0] + currentProgress * moveDistance * 1.2;
                    const leftCircleY = Math.sin(angle) * arcHeight + wobble;
                    const leftRotation = Math.sin(angle) * 20 + wobble * 0.5;

                    // Right card: counter-clockwise circular motion
                    const rightCircleX = positions[2] - currentProgress * moveDistance * 1.2;
                    const rightCircleY = -Math.sin(angle) * arcHeight - wobble;
                    const rightRotation = -Math.sin(angle) * 20 - wobble * 0.5;

                    // Middle card: enhanced minimal movement
                    const middleX = positions[1] + Math.sin(angle * 2) * 10;  // Slight horizontal sway
                    const middleY = Math.sin(angle * 3) * (arcHeight * 0.08) + wobble * 0.3; // More dynamic vertical movement
                    const middleRotation = Math.sin(angle * 2) * 5; // Slight rotation
                    
                    // Calculate enhanced circular paths with variable radius
                    const radiusMultiplier = 1 + Math.sin(currentProgress * Math.PI * 2) * 0.2; // Varying radius
                    const leftX = leftCircleX + Math.cos(angle) * (circleRadius * radiusMultiplier * (1 - currentProgress));
                    const rightX = rightCircleX - Math.cos(angle) * (circleRadius * radiusMultiplier * (1 - currentProgress));
                    
                    // Update positions with enhanced motions
                    this.updateCardPosition(boxes[0], leftX, leftCircleY, leftRotation);
                    this.updateCardPosition(boxes[1], middleX, middleY, middleRotation);
                    this.updateCardPosition(boxes[2], rightX, rightCircleY, rightRotation);

                    // Only change z-index after significant horizontal movement
                    if (currentProgress > 0.4) {
                        if (currentProgress < 0.6) {
                            boxes[0].style.zIndex = '2';
                            boxes[1].style.zIndex = '1';
                            boxes[2].style.zIndex = '2';
                        } else {
                            boxes[0].style.zIndex = '1';
                            boxes[1].style.zIndex = '1';
                            boxes[2].style.zIndex = '1';
                        }
                    }
                } else {
                    // Right card: counter-clockwise circular motion
                    const rightCircleX = positions[2] - currentProgress * moveDistance * 1.2;
                    const rightCircleY = Math.sin(angle) * arcHeight + wobble;
                    const rightRotation = Math.sin(angle) * 20 + wobble * 0.5;

                    // Left card: clockwise circular motion
                    const leftCircleX = positions[0] + currentProgress * moveDistance * 1.2;
                    const leftCircleY = -Math.sin(angle) * arcHeight - wobble;
                    const leftRotation = -Math.sin(angle) * 20 - wobble * 0.5;

                    // Middle card: enhanced minimal movement
                    const middleX = positions[1] + Math.sin(angle * 2) * 10; // Slight horizontal sway
                    const middleY = Math.sin(angle * 3) * (arcHeight * 0.08) + wobble * 0.3; // More dynamic vertical movement
                    const middleRotation = Math.sin(angle * 2) * 5; // Slight rotation
                    
                    // Calculate enhanced circular paths with variable radius
                    const radiusMultiplier = 1 + Math.sin(currentProgress * Math.PI * 2) * 0.2; // Varying radius
                    const rightX = rightCircleX - Math.cos(angle) * (circleRadius * radiusMultiplier * (1 - currentProgress));
                    const leftX = leftCircleX + Math.cos(angle) * (circleRadius * radiusMultiplier * (1 - currentProgress));
                    
                    // Update positions with enhanced motions
                    this.updateCardPosition(boxes[2], rightX, rightCircleY, rightRotation);
                    this.updateCardPosition(boxes[1], middleX, middleY, middleRotation);
                    this.updateCardPosition(boxes[0], leftX, leftCircleY, leftRotation);

                    // Only change z-index after significant horizontal movement
                    if (currentProgress > 0.4) {
                        if (currentProgress < 0.6) {
                            boxes[2].style.zIndex = '2';
                            boxes[1].style.zIndex = '1';
                            boxes[0].style.zIndex = '2';
                        } else {
                            boxes[2].style.zIndex = '1';
                            boxes[1].style.zIndex = '1';
                            boxes[0].style.zIndex = '1';
                        }
                    }
                }

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    boxes.forEach((box, i) => {
                        this.updateCardPosition(box, positions[i], 0, 0);
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
