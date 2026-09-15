'use strict';

const $ = id => document.getElementById(id);
const isBinary = s => /^[01]+$/.test(s.trim());
const isDecimal = s => /^\d+$/.test(s.trim());
const isHex = s => /^[0-9a-fA-F]+$/.test(s.trim());
const isOctal = s => /^[0-7]+$/.test(s.trim());

function showErr(id, msg) {
  const el = $(id);
  el.textContent = msg;
  const inputId = id.replace('err','num').replace('cvErr','cv').replace('bwErr','bwNum');
  const inp = $(inputId);
  if (inp) inp.classList.toggle('error', !!msg);
}
function clearErr(id) { showErr(id, ''); }
function setHidden(el, hidden) { if (hidden) el.setAttribute('hidden',''); else el.removeAttribute('hidden'); }

// Tabs
const tabBtns = document.querySelectorAll('.tab-btn');
const tabPanels = document.querySelectorAll('.tab-panel');
tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    tabBtns.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected','false'); });
    tabPanels.forEach(p => { p.classList.remove('active'); setHidden(p, true); });
    btn.classList.add('active'); btn.setAttribute('aria-selected','true');
    const panel = $('tab-' + btn.dataset.tab);
    panel.classList.add('active'); setHidden(panel, false);
  });
});

// Operator selection
let currentOp = '+';
document.querySelectorAll('#tab-calculator .op-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#tab-calculator .op-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentOp = btn.dataset.op;
  });
});

function binToInt(s) { return parseInt(s, 2); }
function intToBin(n) { if (n < 0) return '-' + ((-n) >>> 0).toString(2); return n.toString(2); }
function intToHex(n) { if (n < 0) return '-' + (-n).toString(16).toUpperCase(); return n.toString(16).toUpperCase(); }
function intToOct(n) { if (n < 0) return '-' + (-n).toString(8); return n.toString(8); }

function buildArithSteps(a, b, op, result) {
  const aDec = binToInt(a), bDec = binToInt(b), resDec = result;
  let html = '';
  if (op === '+') {
    const maxLen = Math.max(a.length, b.length) + 1;
    const aP = a.padStart(maxLen, '0'), bP = b.padStart(maxLen, '0');
    const resP = (resDec < 0 ? '-' : '') + Math.abs(resDec).toString(2).padStart(maxLen, '0');
    let carry = 0;
    const carries = new Array(maxLen + 1).fill(0);
    for (let i = maxLen - 1; i >= 0; i--) {
      const sum = parseInt(aP[i]) + parseInt(bP[i]) + carry;
      carry = Math.floor(sum / 2); carries[i] = carry;
    }
    const carryStr = carries.slice(0, maxLen).map(c => c || ' ').join('');
    html += `<span class="carry-row">carry: ${carryStr}</span>\n`;
    html += `  <span class="highlight">${aP}</span>\n+ ${bP}\n`;
    html += `<span class="divider"></span>= <span class="highlight">${resP}</span>\n\n`;
    html += `<span class="explain">${aDec} + ${bDec} = ${resDec} in decimal</span>`;
  } else if (op === '−') {
    const maxLen = Math.max(a.length, b.length);
    const aP = a.padStart(maxLen, '0'), bP = b.padStart(maxLen, '0');
    const absDiff = Math.abs(resDec), sign = resDec < 0 ? '−' : '';
    const resP = absDiff.toString(2).padStart(maxLen, '0');
    html += `  <span class="highlight">${aP}</span>\n− ${bP}\n`;
    html += `<span class="divider"></span>= ${sign}<span class="highlight">${resP}</span>\n\n`;
    html += `<span class="explain">${aDec} − ${bDec} = ${resDec} in decimal</span>`;
  } else if (op === '×') {
    html += `  <span class="highlight">${a}</span>\n× ${b}\n`;
    html += `<span class="divider"></span>= <span class="highlight">${resDec.toString(2)}</span>\n\n`;
    html += `<span class="explain">${aDec} × ${bDec} = ${resDec} in decimal</span>`;
  } else if (op === '÷') {
    const quotient = Math.floor(aDec / bDec), remainder = aDec % bDec;
    html += `  <span class="highlight">${a}</span>  (${aDec})\n÷ ${b}  (${bDec})\n`;
    html += `<span class="divider"></span>= <span class="highlight">${quotient.toString(2)}</span>  quotient (${quotient})\n`;
    if (remainder !== 0) html += `  remainder: <span class="highlight">${remainder.toString(2)}</span>  (${remainder})\n`;
    html += `\n<span class="explain">${aDec} ÷ ${bDec} = ${quotient} remainder ${remainder}</span>`;
  }
  return html;
}

$('calcBtn').addEventListener('click', () => {
  const a = $('num1').value.trim(), b = $('num2').value.trim();
  clearErr('err1'); clearErr('err2');
  let valid = true;
  if (!a || !isBinary(a)) { showErr('err1', 'Enter a valid binary number (0s and 1s only)'); valid = false; }
  if (!b || !isBinary(b)) { showErr('err2', 'Enter a valid binary number (0s and 1s only)'); valid = false; }
  if (!valid) return;
  const aInt = binToInt(a), bInt = binToInt(b);
  let result;
  if (currentOp === '+') result = aInt + bInt;
  else if (currentOp === '−') result = aInt - bInt;
  else if (currentOp === '×') result = aInt * bInt;
  else if (currentOp === '÷') {
    if (bInt === 0) { showErr('err2', 'Division by zero is undefined'); return; }
    result = Math.floor(aInt / bInt);
  }
  $('resBin').textContent = intToBin(result);
  $('resDec').textContent = result;
  $('resHex').textContent = intToHex(result);
  $('resOct').textContent = intToOct(result);
  setHidden($('calcResult'), false);
  $('stepBody').innerHTML = buildArithSteps(a, b, currentOp, result);
  setHidden($('calcSteps'), false);
  addHistory(`${a} ${currentOp} ${b}`, intToBin(result));
  $('copyCalc').onclick = () => copyText(intToBin(result), 'copyCalc');
});
[$('num1'), $('num2')].forEach(inp => inp.addEventListener('keydown', e => { if (e.key === 'Enter') $('calcBtn').click(); }));

// History
const history = [];
function addHistory(expr, res) {
  history.unshift({ expr, res });
  if (history.length > 20) history.pop();
  renderHistory();
}
function renderHistory() {
  const list = $('historyList');
  if (!history.length) { setHidden($('historySection'), true); return; }
  setHidden($('historySection'), false);
  list.innerHTML = history.map(h => `<li><span class="hist-expr">${h.expr}</span><span class="hist-result">${h.res}</span></li>`).join('');
}
$('clearHistory').addEventListener('click', () => { history.length = 0; renderHistory(); });

function copyText(text, btnId) {
  navigator.clipboard.writeText(text).then(() => {
    const btn = $(btnId);
    btn.textContent = 'Copied!'; btn.classList.add('copied');
    setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 1500);
  });
}

// Converter
function setConvField(id, val) { const el = $(id); if (document.activeElement !== el) el.value = val; }
function showLearn(n, binStr) {
  const bits = binStr;
  const terms = [];
  for (let i = 0; i < bits.length; i++) {
    if (bits[i] === '1') { const p = bits.length - 1 - i; terms.push({ power: p, val: Math.pow(2, p) }); }
  }
  let html = `<b style="color:var(--text)">${n}</b> in binary is <b style="color:var(--accent)">${bits}</b>\n\n`;
  if (terms.length) {
    html += terms.map(t => `1 × 2^${t.power} = ${t.val}`).join('\n');
    html += `\n<span class="divider"></span>Total = ${terms.map(t => t.val).join(' + ')} = ${n}\n`;
  } else { html += 'Value is 0 — all bits are 0.'; }
  html += `\n<span class="explain">Hex: 0x${n.toString(16).toUpperCase()}   Octal: ${n.toString(8)}   Decimal: ${n}</span>`;
  $('convLearnBody').innerHTML = html; setHidden($('convLearn'), false);
}
function updateFromBin(raw) {
  const s = raw.trim();
  if (!s) { ['cvDec','cvHex','cvOct'].forEach(id => $(id).value = ''); return; }
  if (!isBinary(s)) { showErr('cvErrBin', 'Only 0s and 1s allowed'); return; }
  clearErr('cvErrBin');
  const n = parseInt(s, 2);
  setConvField('cvDec', n.toString(10)); setConvField('cvHex', n.toString(16).toUpperCase()); setConvField('cvOct', n.toString(8));
  showLearn(n, s);
}
function updateFromDec(raw) {
  const s = raw.trim();
  if (!s) { ['cvBin','cvHex','cvOct'].forEach(id => $(id).value = ''); return; }
  if (!isDecimal(s)) { showErr('cvErrDec', 'Integers only (0–9)'); return; }
  clearErr('cvErrDec');
  const n = parseInt(s, 10);
  setConvField('cvBin', n.toString(2)); setConvField('cvHex', n.toString(16).toUpperCase()); setConvField('cvOct', n.toString(8));
  showLearn(n, n.toString(2));
}
function updateFromHex(raw) {
  const s = raw.trim();
  if (!s) { ['cvBin','cvDec','cvOct'].forEach(id => $(id).value = ''); return; }
  if (!isHex(s)) { showErr('cvErrHex', 'Hex digits only (0–9, A–F)'); return; }
  clearErr('cvErrHex');
  const n = parseInt(s, 16);
  setConvField('cvBin', n.toString(2)); setConvField('cvDec', n.toString(10)); setConvField('cvOct', n.toString(8));
  showLearn(n, n.toString(2));
}
function updateFromOct(raw) {
  const s = raw.trim();
  if (!s) { ['cvBin','cvDec','cvHex'].forEach(id => $(id).value = ''); return; }
  if (!isOctal(s)) { showErr('cvErrOct', 'Octal digits only (0–7)'); return; }
  clearErr('cvErrOct');
  const n = parseInt(s, 8);
  setConvField('cvBin', n.toString(2)); setConvField('cvDec', n.toString(10)); setConvField('cvHex', n.toString(16).toUpperCase());
  showLearn(n, n.toString(2));
}
$('cvBin').addEventListener('input', e => updateFromBin(e.target.value));
$('cvDec').addEventListener('input', e => updateFromDec(e.target.value));
$('cvHex').addEventListener('input', e => updateFromHex(e.target.value));
$('cvOct').addEventListener('input', e => updateFromOct(e.target.value));

// Bitwise
let currentBwOp = 'AND';
document.querySelectorAll('.bw-ops .op-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.bw-ops .op-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active'); currentBwOp = btn.dataset.bwop;
    setHidden($('bwNum2Group'), currentBwOp === 'NOT');
  });
});
$('bwCalcBtn').addEventListener('click', () => {
  const a = $('bwNum1').value.trim(), b = $('bwNum2').value.trim();
  clearErr('bwErr1'); clearErr('bwErr2');
  let valid = true;
  if (!a || !isBinary(a)) { showErr('bwErr1', 'Enter a valid binary number'); valid = false; }
  if (currentBwOp !== 'NOT' && (!b || !isBinary(b))) { showErr('bwErr2', 'Enter a valid binary number'); valid = false; }
  if (!valid) return;
  const aInt = binToInt(a);
  let result;
  if (currentBwOp === 'AND') result = aInt & binToInt(b);
  else if (currentBwOp === 'OR') result = aInt | binToInt(b);
  else if (currentBwOp === 'XOR') result = aInt ^ binToInt(b);
  else if (currentBwOp === 'NOT') result = ~aInt >>> 0;
  const binRes = result.toString(2);
  $('bwResBin').textContent = binRes;
  $('bwResDec').textContent = result;
  $('bwResHex').textContent = result.toString(16).toUpperCase();
  setHidden($('bwResult'), false);
  $('copyBw').onclick = () => copyText(binRes, 'copyBw');
  buildBitwiseSteps(a, currentBwOp === 'NOT' ? null : b, currentBwOp, result);
});
function buildBitwiseSteps(aStr, bStr, op, result) {
  const maxLen = bStr ? Math.max(aStr.length, bStr.length) : aStr.length;
  const aPad = aStr.padStart(maxLen, '0'), bPad = bStr ? bStr.padStart(maxLen, '0') : null;
  const resBin = result.toString(2), resPad = op === 'NOT' ? resBin.slice(-maxLen).padStart(maxLen, '0') : resBin.padStart(maxLen, '0');
  if (op === 'NOT') {
    let html = '<table class="truth-table"><thead><tr><th>Bit</th><th>Position</th><th>NOT</th></tr></thead><tbody>';
    for (let i = 0; i < aPad.length; i++) {
      const bit = aPad[i], notBit = bit === '1' ? '0' : '1';
      html += `<tr><td class="${bit==='1'?'hi':'lo'}">${bit}</td><td>${aPad.length-1-i}</td><td class="${notBit==='1'?'hi':'lo'}">${notBit}</td></tr>`;
    }
    html += '</tbody></table>';
    $('bwStepBody').innerHTML = html; setHidden($('bwSteps'), false); return;
  }
  let html = `<table class="truth-table"><thead><tr><th>A bit</th><th>B bit</th><th>${op}</th></tr></thead><tbody>`;
  for (let i = 0; i < maxLen; i++) {
    const aBit = aPad[i], bBit = bPad[i], resBit = resPad[i];
    html += `<tr><td class="${aBit==='1'?'hi':'lo'}">${aBit}</td><td class="${bBit==='1'?'hi':'lo'}">${bBit}</td><td class="${resBit==='1'?'hi':'lo'}">${resBit}</td></tr>`;
  }
  html += '</tbody></table>';
  $('bwStepBody').innerHTML = html; setHidden($('bwSteps'), false);
}
[$('bwNum1'), $('bwNum2')].forEach(inp => inp.addEventListener('keydown', e => { if (e.key === 'Enter') $('bwCalcBtn').click(); }));
