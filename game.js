class UnicornMonteGame {
    constructor() {
        this.score = 0;
        this.round = 1;
        this.attempts = 3;
        this.maxScore = 100;
        this.unicornBox = null;
        this.isGameActive = false;
        this.boxes = document.querySelectorAll('.box');
        this.positions = [0, 120, 240]; // Track actual positions
        this.startBtn = document.getElementById('start-btn');
        this.resetBtn = document.getElementById('reset-btn');
        this.scoreDisplay = document.getElementById('score');
        this.roundDisplay = document.getElementById('round');
        this.attemptsDisplay = document.getElementById('attempts');
        this.messageDisplay = document.getElementById('message');
        this.selectedCards = new Set(); // Track revealed cards
        this.shuffleCount = 0; // Track shuffle count
        
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

        this.isGameActive = false;
        this.attempts = 3;
        this.unicornBox = Math.floor(Math.random() * 3) + 1;
        this.attemptsDisplay.textContent = this.attempts;
        this.selectedCards.clear();
        
        // Calculate center point and spacing
        const boxWidth = 80;
        const spacing = 90;
        const startX = -spacing;
        
        // Position cards with proper spacing
        this.boxes.forEach((box, i) => {
            box.classList.remove('flipped', 'correct', 'incorrect');
            const translateX = startX + (i * spacing);
            box.style.transform = `translateX(${translateX}px)`;
            box.style.setProperty('--tx', translateX + 'px');
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
                this.isGameActive = true;
            }, 600);
        }, 2000);

        this.startBtn.disabled = true;
    }

    async startShuffling() {
        const shuffleCount = 6 + Math.min(this.round * 2, 8);
        const boxes = Array.from(this.boxes);
        const spacing = 90;
        const startX = -spacing;
        
        let positions = [startX, 0, spacing];
        
        for (let i = 0; i < shuffleCount; i++) {
            const startFromLeft = Math.random() < 0.5;
            await this.performShuffle(boxes, positions, startFromLeft, spacing);
            
            if (startFromLeft) {
                boxes.push(boxes.shift());
                boxes.push(boxes.shift());
                positions = [startX, 0, spacing];
            } else {
                boxes.unshift(boxes.pop());
                boxes.unshift(boxes.pop());
                positions = [startX, 0, spacing];
            }
        }

        this.isGameActive = true;
        this.messageDisplay.textContent = 'Where is the unicorn? Click a box to guess!';
    }

    async performShuffle(boxes, positions, startFromLeft, spacing) {
        // First perform the shuffle
        await new Promise(resolve => {
            const duration = 450;
            const startTime = Date.now();
            const moveDistance = spacing * 2.5; // Increased from 1.2 to 2.5
            const cardWidth = 80;
            const arcHeight = 40;
            
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Smooth easing
                const ease = t => t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
                const currentProgress = ease(progress);

                // Circular motion parameters
                const angle = currentProgress * Math.PI;
                const verticalArc = -Math.sin(angle) * arcHeight;
                
                if (startFromLeft) {
                    // Calculate positions with wider spread
                    const pos0 = positions[0] + currentProgress * moveDistance;
                    const pos1 = positions[1] + currentProgress * moveDistance;
                    const pos2 = positions[2] - currentProgress * moveDistance * 2;
                    
                    // Check for overlaps to manage z-index and shadows
                    const overlap01 = pos0 + cardWidth > pos1;
                    const overlap12 = pos1 + cardWidth > pos2;
                    
                    if (overlap01) {
                        boxes[0].style.zIndex = '2';
                        boxes[1].style.zIndex = '1';
                        boxes[0].classList.add('elevated');
                    } else {
                        boxes[0].style.zIndex = '';
                        boxes[1].style.zIndex = '';
                        boxes[0].classList.remove('elevated');
                    }
                    
                    if (overlap12) {
                        boxes[1].style.zIndex = '2';
                        boxes[2].style.zIndex = '1';
                        boxes[1].classList.add('elevated');
                    } else {
                        boxes[2].style.zIndex = '';
                        boxes[1].classList.remove('elevated');
                    }

                    // Apply movements with arcs
                    boxes[0].style.transform = `translate(${pos0}px, ${verticalArc}px) rotate(${-angle * 5}deg)`;
                    boxes[1].style.transform = `translate(${pos1}px, ${verticalArc * 0.7}px)`;
                    boxes[2].style.transform = `translate(${pos2}px, ${verticalArc * 0.3}px)`;
                } else {
                    // Calculate positions with wider spread
                    const pos2 = positions[2] - currentProgress * moveDistance;
                    const pos1 = positions[1] - currentProgress * moveDistance;
                    const pos0 = positions[0] + currentProgress * moveDistance * 2;
                    
                    // Check for overlaps to manage z-index and shadows
                    const overlap21 = pos2 + cardWidth > pos1;
                    const overlap10 = pos1 + cardWidth > pos0;
                    
                    if (overlap21) {
                        boxes[2].style.zIndex = '2';
                        boxes[1].style.zIndex = '1';
                        boxes[2].classList.add('elevated');
                    } else {
                        boxes[2].style.zIndex = '';
                        boxes[1].style.zIndex = '';
                        boxes[2].classList.remove('elevated');
                    }
                    
                    if (overlap10) {
                        boxes[1].style.zIndex = '2';
                        boxes[0].style.zIndex = '1';
                        boxes[1].classList.add('elevated');
                    } else {
                        boxes[0].style.zIndex = '';
                        boxes[1].classList.remove('elevated');
                    }

                    // Apply movements with arcs
                    boxes[2].style.transform = `translate(${pos2}px, ${verticalArc}px) rotate(${angle * 5}deg)`;
                    boxes[1].style.transform = `translate(${pos1}px, ${verticalArc * 0.7}px)`;
                    boxes[0].style.transform = `translate(${pos0}px, ${verticalArc * 0.3}px)`;
                }

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };

            requestAnimationFrame(animate);
        });

        // Then perform the precise alignment animation
        await new Promise(resolve => {
            const alignDuration = 250; // Slightly longer to account for greater distance
            const startTime = Date.now();
            const startPositions = Array.from(boxes).map(box => {
                const transform = box.style.transform;
                const match = transform.match(/translate\(([^,]+)px/);
                return match ? parseFloat(match[1]) : 0;
            });
            const targetPositions = [-spacing, 0, spacing];

            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / alignDuration, 1);
                
                // Smooth easing for precise movement
                const ease = t => t * (2 - t);
                const currentProgress = ease(progress);

                boxes.forEach((box, i) => {
                    const start = startPositions[i];
                    const target = targetPositions[i];
                    const current = start + (target - start) * currentProgress;
                    
                    // Slight vertical movement for precision effect
                    const verticalAdjust = Math.sin(progress * Math.PI) * 3;
                    
                    box.style.transform = `translate(${current}px, ${verticalAdjust}px)`;
                    box.style.zIndex = '';
                    box.classList.remove('elevated');
                });

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    boxes.forEach((box, i) => {
                        box.style.transform = `translateX(${targetPositions[i]}px)`;
                    });
                    resolve();
                }
            };

            requestAnimationFrame(animate);
        });
    }

    updateCardPosition(box, x) {
        box.style.transform = `translateX(${x}px)`;
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
        if (!this.isGameActive) {
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
            box.style.transform = `translateX(${startX + (i * spacing)}px)`;
            box.style.setProperty('--tx', (startX + (i * spacing)) + 'px');
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
            box.style.transform = `translateX(${startX + (i * spacing)}px)`;
            box.style.setProperty('--tx', (startX + (i * spacing)) + 'px');
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
        this.score = 0;
        this.round = 1;
        this.attempts = 3;
        this.isGameActive = false;
        
        this.scoreDisplay.textContent = this.score;
        this.roundDisplay.textContent = this.round;
        this.attemptsDisplay.textContent = this.attempts;
        this.messageDisplay.textContent = 'Game reset. Click Start to play!';

        this.boxes.forEach(box => {
            box.classList.remove('flipped', 'correct', 'incorrect');
            box.style.transform = '';
            box.style.setProperty('--tx', '');
            const front = box.querySelector('.card-front');
            front.innerHTML = '';
        });

        this.startBtn.disabled = false;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new UnicornMonteGame();
});
