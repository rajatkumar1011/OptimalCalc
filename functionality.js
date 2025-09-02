// --- Animated Background Logic ---
const canvas = document.getElementById('background-canvas');
const ctx = canvas.getContext('2d');
let stars = [];
let nebula;

class Star {
    constructor(canvasWidth, canvasHeight) {
        this.x = Math.random() * canvasWidth;
        this.y = Math.random() * canvasHeight;
        this.radius = Math.random() * 1.5 + 0.5;
        this.alpha = Math.random() * 0.7 + 0.3; // Base opacity
        this.twinkleSpeed = Math.random() * 0.05 + 0.01; // Faster twinkle
        this.phase = Math.random() * Math.PI * 2; // Random start phase
    }
    draw(context, tick) {
        const sineValue = Math.sin(tick * this.twinkleSpeed + this.phase);
        const blinkFactor = Math.pow((sineValue + 1) / 2, 4);
        const currentAlpha = this.alpha * blinkFactor;

        context.fillStyle = `rgba(255, 255, 255, ${Math.max(0, currentAlpha)})`;
        context.beginPath();
        context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        context.fill();
    }
}

class Nebula {
    constructor(canvasWidth, canvasHeight) {
        this.x = Math.random() * canvasWidth;
        this.y = Math.random() * canvasHeight;
        this.radius = Math.random() * (canvasWidth / 3) + (canvasWidth / 4);
        this.color1 = 'rgba(56, 189, 248, 0.05)';
        this.color2 = 'rgba(74, 222, 128, 0.05)';
        this.gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
        this.gradient.addColorStop(0, this.color1);
        this.gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    }
    draw(context) {
        context.fillStyle = this.gradient;
        context.fillRect(0, 0, context.canvas.width, context.canvas.height);
    }
}

function setupCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    stars = [];
    const numberOfStars = Math.floor(canvas.width / 8);
    for (let i = 0; i < numberOfStars; i++) {
        stars.push(new Star(canvas.width, canvas.height));
    }
    nebula = new Nebula(canvas.width, canvas.height);
}

let tick = 0;
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    nebula.draw(ctx);
    stars.forEach(s => s.draw(ctx, tick));
    tick++;
    requestAnimationFrame(animate);
}

window.addEventListener('resize', setupCanvas);
setupCanvas();
animate();

// --- Calculator Logic ---
const display = document.getElementById('display');
const angleModeElem = document.getElementById('angleMode');
let currentExpression = '', angleMode = 'RAD';

function appendToDisplay(v) { currentExpression+=v; updateDisplay(); }
function appendFunction(f) { currentExpression+=`${f}(`; updateDisplay(); }
function appendConstant(c) { currentExpression+=c; updateDisplay(); }
function updateDisplay() { display.value=currentExpression.replace(/\*/g,'×').replace(/\//g,'÷').replace(/sqrt/g,'√'); display.scrollLeft=display.scrollWidth; }
function clearAll() { currentExpression=''; display.value=''; display.placeholder='0'; }
function backspace() { currentExpression=currentExpression.slice(0,-1); updateDisplay(); }
function toggleAngleMode() { angleMode=angleMode==='RAD'?'DEG':'RAD'; angleModeElem.querySelector('span').textContent=angleMode; }

function calculateResult() {
    if(currentExpression==='') return;
    const sin=(x)=>angleMode==='DEG'?Math.sin(x*Math.PI/180):Math.sin(x);
    const cos=(x)=>angleMode==='DEG'?Math.cos(x*Math.PI/180):Math.cos(x);
    const tan=(x)=>{ if(angleMode==='DEG'&&Math.abs(x%180)===90)return Infinity; if(angleMode==='RAD'&&Math.abs(x%Math.PI)===Math.PI/2)return Infinity; return angleMode==='DEG'?Math.tan(x*Math.PI/180):Math.tan(x); };
    const log=Math.log10, ln=Math.log, sqrt=Math.sqrt;
    let evalExpression=currentExpression.replace(/×/g,'*').replace(/÷/g,'/').replace(/\^/g,'**').replace(/√/g,'sqrt').replace(/π/g,'Math.PI').replace(/e/g,'Math.E');
    
    // BUG FIX: Sanitize numbers to handle leading zeros (e.g., "01" becomes "1")
    // This prevents errors in evaluation for inputs like "01+01".
    const numberRegex = /[0-9]+(?:\.[0-9]*)?|\.[0-9]+/g;
    evalExpression = evalExpression.replace(numberRegex, (numberStr) => {
        // parseFloat correctly interprets "01" as 1, "007" as 7, etc.
        return parseFloat(numberStr).toString();
    });

    try {
        const result=new Function('sin','cos','tan','log','ln','sqrt',`'use strict'; return ${evalExpression}`)(sin,cos,tan,log,ln,sqrt);
        if(result===Infinity){display.value='TOO BIG!';currentExpression='';return;}
        if(result===-Infinity){display.value='TOO SMALL!';currentExpression='';return;}
        if(isNaN(result)){display.value='Error';currentExpression='';return;}
        currentExpression=String(parseFloat(result.toFixed(10))); updateDisplay();
    } catch(e) { console.error("Calc Error:",e); display.value='Error'; currentExpression=''; }
}

// Add onclick events to buttons
document.querySelectorAll('.btn').forEach(button => {
    const value = button.querySelector('span').textContent;
    const actions = {
        'sin': () => appendFunction('sin'), 'cos': () => appendFunction('cos'), 'tan': () => appendFunction('tan'),
        'π': () => appendConstant('π'), 'e': () => appendConstant('e'), 'log': () => appendFunction('log'),
        'ln': () => appendFunction('ln'), '(': () => appendToDisplay('('), ')': () => appendToDisplay(')'),
        '√': () => appendFunction('sqrt'), 'AC': clearAll, 'C': backspace, 'xʸ': () => appendToDisplay('^'),
        '%': () => appendToDisplay('%'), '÷': () => appendToDisplay('/'), '×': () => appendToDisplay('*'),
        '-': () => appendToDisplay('-'), '+': () => appendToDisplay('+'), '=': calculateResult,
    };
    if (actions[value]) {
        button.onclick = actions[value];
    } else {
        button.onclick = () => appendToDisplay(value);
    }
});

document.addEventListener('keydown', (e) => {
    const k=e.key;
    if((k>='0'&&k<='9')||k==='.'||k==='('||k===')'){appendToDisplay(k);}
    else if(['+','-','*','/','%','^'].includes(k)){appendToDisplay(k);}
    else if(k==='Enter'||k==='='){e.preventDefault();calculateResult();}
    else if(k==='Backspace'){backspace();}
    else if(k.toLowerCase()==='c'||k==='Escape'){clearAll();}
});

// --- Gemini API & Modal Logic ---
const aiModal = document.getElementById('aiModal');
const aiSolverButton = document.getElementById('aiSolverButton');
const closeModalButton = document.getElementById('closeModalButton');
const submitProblemButton = document.getElementById('submitProblemButton');
const wordProblemInput = document.getElementById('wordProblemInput');
const modalStatus = document.getElementById('modal-status');

aiSolverButton.addEventListener('click', () => aiModal.classList.add('visible'));
closeModalButton.addEventListener('click', () => aiModal.classList.remove('visible'));
submitProblemButton.addEventListener('click', handleWordProblem);

async function handleWordProblem() {
    const problemText = wordProblemInput.value.trim();
    if (!problemText) {
        modalStatus.innerHTML = `<p class="text-red-400">Please enter a problem.</p>`;
        return;
    }

    modalStatus.innerHTML = `<div class="loader mx-auto"></div>`;
    submitProblemButton.disabled = true;

    const prompt = `You are a mathematical assistant. Convert the following word problem into a single, solvable mathematical expression. Provide ONLY the raw expression. For example, for the problem "What is 3 plus 5 divided by 2?", you should only output "(3+5)/2". Problem: "${problemText}"`;
    
    try {
        const expression = await callGemini(prompt);
        currentExpression = expression;
        updateDisplay();
        aiModal.classList.remove('visible');
    } catch (error) {
        console.error('Gemini API Error:', error);
        modalStatus.innerHTML = `<p class="text-red-400">Failed to solve. Please try again.</p>`;
    } finally {
        submitProblemButton.disabled = false;
        wordProblemInput.value = '';
        if (!modalStatus.querySelector('.loader')) {
            setTimeout(() => { modalStatus.innerHTML = ''; }, 3000);
        }
    }
}

async function callGemini(prompt, retries = 3, delay = 1000) {
    const apiKey = "AIzaSyBd5Nqt9n5RSbPBzDTAZ1LCBcIw52i4Zkg"; 
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
    
    const payload = {
        contents: [{ role: "user", parts: [{ text: prompt }] }]
    };

    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.candidates && result.candidates.length > 0 &&
                result.candidates[0].content && result.candidates[0].content.parts &&
                result.candidates[0].content.parts.length > 0) {
                // Clean up the response to remove any markdown or extra text
                return result.candidates[0].content.parts[0].text.replace(/```/g, '').replace(/`/g, '').trim();
            } else {
                throw new Error("Invalid response structure from API.");
            }
        } catch (error) {
            if (i === retries - 1) throw error;
            await new Promise(res => setTimeout(res, delay * Math.pow(2, i)));
        }
    }
}

