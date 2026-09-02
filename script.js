(function() {
    'use strict';

    // ── DOM refs ──
    const resultEl = document.getElementById('result');
    const exprEl = document.getElementById('expression');
    const buttons = document.querySelectorAll('.btn');

    // ── State ──
    const state = {
        currentValue: '0',
        previousValue: '',
        operation: null, // '+', '−', '×', '÷'
        shouldResetDisplay: false,
        justEvaluated: false,
        expression: '',
        lastAction: null,
    };

    // ── Helpers ──
    function formatNumber(num) {
        if (num === undefined || num === null || isNaN(num)) return '0';
        const str = String(num);
        if (str.length > 14) {
            return Number(num).toExponential(6);
        }
        return str;
    }

    function updateDisplay() {
        let displayVal = state.currentValue;
        if (displayVal === 'Error' || displayVal === 'Infinity' || displayVal === '-Infinity') {
            resultEl.textContent = 'Error';
            resultEl.className = 'result error';
            return;
        }

        let num = parseFloat(displayVal);
        if (!isNaN(num) && isFinite(num)) {
            if (Number.isInteger(num) && displayVal.indexOf('.') === -1) {
                displayVal = String(num);
            } else {
                displayVal = String(num);
            }
        }

        if (displayVal.length > 16) {
            const n = parseFloat(displayVal);
            if (!isNaN(n) && isFinite(n)) {
                displayVal = n.toExponential(6);
            } else {
                displayVal = displayVal.slice(0, 16);
            }
        }

        resultEl.textContent = displayVal;
        resultEl.className = 'result';
        if (displayVal.length > 12) {
            resultEl.classList.add('shrink');
        }

        let expr = state.expression;
        if (state.operation && state.previousValue) {
            const opSymbol = state.operation;
            expr = `${state.previousValue} ${opSymbol}`;
            if (state.currentValue !== '0' || state.shouldResetDisplay) {
                expr += ` ${state.currentValue}`;
            }
        } else if (state.expression) {
            expr = state.expression;
        }
        exprEl.textContent = expr;
    }

    function resetCalculator() {
        state.currentValue = '0';
        state.previousValue = '';
        state.operation = null;
        state.shouldResetDisplay = false;
        state.justEvaluated = false;
        state.expression = '';
        state.lastAction = null;
        updateDisplay();
    }

    function handleNumber(value) {
        if (state.justEvaluated) {
            state.currentValue = '0';
            state.justEvaluated = false;
            state.expression = '';
        }
        if (state.shouldResetDisplay) {
            state.currentValue = '0';
            state.shouldResetDisplay = false;
        }
        if (state.currentValue === '0' && value !== '.') {
            state.currentValue = value;
        } else {
            if (state.currentValue.replace('-', '').replace('.', '').length >= 15) return;
            state.currentValue += value;
        }
        state.lastAction = 'number';
        updateDisplay();
    }

    function handleDecimal() {
        if (state.justEvaluated) {
            state.currentValue = '0';
            state.justEvaluated = false;
            state.expression = '';
        }
        if (state.shouldResetDisplay) {
            state.currentValue = '0';
            state.shouldResetDisplay = false;
        }
        if (!state.currentValue.includes('.')) {
            state.currentValue += '.';
        }
        state.lastAction = 'decimal';
        updateDisplay();
    }

    function handleNegate() {
        if (state.currentValue === '0') return;
        if (state.currentValue.startsWith('-')) {
            state.currentValue = state.currentValue.slice(1);
        } else {
            state.currentValue = '-' + state.currentValue;
        }
        state.lastAction = 'negate';
        updateDisplay();
    }

    function handlePercent() {
        const num = parseFloat(state.currentValue);
        if (isNaN(num) || !isFinite(num)) return;
        const result = num / 100;
        state.currentValue = formatNumber(result);
        state.shouldResetDisplay = true;
        state.lastAction = 'percent';
        updateDisplay();
    }

    function compute(a, b, op) {
        let result;
        switch (op) {
            case '+': result = a + b; break;
            case '−': result = a - b; break;
            case '×': result = a * b; break;
            case '÷': 
                if (b === 0) return 'Error';
                result = a / b; 
                break;
            default: return b;
        }
        if (!isFinite(result)) return 'Error';
        if (Number.isFinite(result) && !Number.isInteger(result)) {
            result = parseFloat(result.toPrecision(14));
        }
        return result;
    }

    function handleOperation(op) {
        const current = parseFloat(state.currentValue);
        if (isNaN(current) && state.currentValue !== '-') {
            state.operation = op;
            state.previousValue = '0';
            state.shouldResetDisplay = true;
            state.justEvaluated = false;
            updateDisplay();
            return;
        }

        if (state.operation && !state.shouldResetDisplay && !state.justEvaluated) {
            const prev = parseFloat(state.previousValue);
            if (!isNaN(prev) && isFinite(prev)) {
                const result = compute(prev, current, state.operation);
                if (result === 'Error') {
                    state.currentValue = 'Error';
                    state.operation = null;
                    state.previousValue = '';
                    state.shouldResetDisplay = true;
                    updateDisplay();
                    return;
                }
                state.currentValue = formatNumber(result);
            }
        }

        state.previousValue = state.currentValue;
        state.operation = op;
        state.shouldResetDisplay = true;
        state.justEvaluated = false;
        state.expression = `${state.previousValue} ${op}`;
        state.lastAction = 'operator';
        updateDisplay();
    }

    function handleEquals() {
        const current = parseFloat(state.currentValue);
        if (state.operation && state.previousValue) {
            const prev = parseFloat(state.previousValue);
            if (!isNaN(prev) && isFinite(prev) && !isNaN(current) && isFinite(current)) {
                const result = compute(prev, current, state.operation);
                if (result === 'Error') {
                    state.currentValue = 'Error';
                    state.operation = null;
                    state.previousValue = '';
                    state.shouldResetDisplay = true;
                    state.justEvaluated = true;
                    state.expression = `${state.previousValue} ${state.operation} ${state.currentValue}`;
                    updateDisplay();
                    return;
                }
                state.expression = `${state.previousValue} ${state.operation} ${state.currentValue} =`;
                state.currentValue = formatNumber(result);
                state.operation = null;
                state.previousValue = '';
                state.shouldResetDisplay = true;
                state.justEvaluated = true;
                state.lastAction = 'equals';
                updateDisplay();
            }
        } else {
            state.justEvaluated = true;
            state.expression = `${state.currentValue} =`;
            state.shouldResetDisplay = true;
            updateDisplay();
        }
    }

    function handleClearAll() {
        resetCalculator();
    }

    function handleClearEntry() {
        state.currentValue = '0';
        state.shouldResetDisplay = false;
        state.justEvaluated = false;
        updateDisplay();
    }

    function handleBackspace() {
        if (state.justEvaluated) return;
        if (state.shouldResetDisplay) return;
        if (state.currentValue.length > 1) {
            state.currentValue = state.currentValue.slice(0, -1);
        } else {
            state.currentValue = '0';
        }
        state.lastAction = 'backspace';
        updateDisplay();
    }

    // ── Button click handler ──
    function handleButtonClick(e) {
        const btn = e.currentTarget;
        const action = btn.dataset.action;

        if (state.currentValue === 'Error' && action !== 'clear-all') {
            return;
        }

        switch (action) {
            case 'clear-all': handleClearAll(); break;
            case 'clear-entry': handleClearEntry(); break;
            case 'backspace': handleBackspace(); break;
            case 'percent': handlePercent(); break;
            case 'negate': handleNegate(); break;
            case 'decimal': handleDecimal(); break;
            case 'equals': handleEquals(); break;
            case 'add': handleOperation('+'); break;
            case 'subtract': handleOperation('−'); break;
            case 'multiply': handleOperation('×'); break;
            case 'divide': handleOperation('÷'); break;
            default:
                if (/^[0-9]$/.test(action)) {
                    handleNumber(action);
                }
                break;
        }

        document.querySelectorAll('.btn.op').forEach(b => b.classList.remove('active-op'));
        if (state.operation) {
            const opMap = { '+': 'add', '−': 'subtract', '×': 'multiply', '÷': 'divide' };
            const activeOp = opMap[state.operation];
            if (activeOp) {
                const el = document.querySelector(`.btn.op[data-action="${activeOp}"]`);
                if (el) el.classList.add('active-op');
            }
        }
    }

    // ── Keyboard support ──
    function handleKeydown(e) {
        const key = e.key;
        if (key === 'Escape') { e.preventDefault(); handleClearAll(); return; }
        if (key === 'Backspace') { e.preventDefault(); handleBackspace(); return; }
        if (key === 'Enter' || key === '=') { e.preventDefault(); handleEquals(); return; }
        if (key === '%') { e.preventDefault(); handlePercent(); return; }
        if (key === '.') { e.preventDefault(); handleDecimal(); return; }
        if (key === '+') { e.preventDefault(); handleOperation('+'); return; }
        if (key === '-') { e.preventDefault(); handleOperation('−'); return; }
        if (key === '*') { e.preventDefault(); handleOperation('×'); return; }
        if (key === '/') { e.preventDefault(); handleOperation('÷'); return; }
        if (/^[0-9]$/.test(key)) { e.preventDefault(); handleNumber(key); return; }
        if (key === 'n' || key === '±') { e.preventDefault(); handleNegate(); return; }
    }

    // ── Attach events ──
    buttons.forEach(btn => {
        btn.addEventListener('click', handleButtonClick);
    });
    document.addEventListener('keydown', handleKeydown);
    resetCalculator();

    // ── Prevent double-tap zoom on mobile ──
    document.querySelectorAll('.btn').forEach(el => {
        el.addEventListener('touchstart', () => {}, { passive: true });
    });

})();
