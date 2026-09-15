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

// ── appended: IP/Subnet tab ──
// ═══════════════════════════════════════════════════════
// BinCalc — IP / Subnet tab logic (appended to app.js)
// ═══════════════════════════════════════════════════════

(function () {
  const $ = id => document.getElementById(id);

  function setHidden(el, h) { if (!el) return; if (h) el.setAttribute('hidden',''); else el.removeAttribute('hidden'); }

  // ── Validate an octet string (0–255) ──
  function validOctet(s) {
    const n = parseInt(s, 10);
    return s !== '' && !isNaN(n) && n >= 0 && n <= 255 && String(n) === s.trim();
  }

  // ── CIDR ↔ dotted mask sync ──
  function cidrToMask(cidr) {
    const mask = cidr === 0 ? 0 : (~0 << (32 - cidr)) >>> 0;
    return [(mask >>> 24) & 0xFF, (mask >>> 16) & 0xFF, (mask >>> 8) & 0xFF, mask & 0xFF];
  }
  function maskToCIDR(octets) {
    const n = (octets[0] << 24 | octets[1] << 16 | octets[2] << 8 | octets[3]) >>> 0;
    const cidr = (32 - Math.clz32(~n >>> 0)) & 0x3F;
    // Validate it's a contiguous mask
    const rebuilt = cidrToMask(cidr);
    if (rebuilt.every((v,i) => v === octets[i])) return cidr;
    return null; // Not a valid contiguous mask
  }
  function octToBin8(n) { return (n >>> 0).toString(2).padStart(8, '0'); }

  // ── Auto-advance octet inputs on '.' or when full ──
  const ipInputs = [$('ip0'),$('ip1'),$('ip2'),$('ip3')];
  const smInputs = [$('sm0'),$('sm1'),$('sm2'),$('sm3')];

  function wireOctetAdvance(inputs, onComplete) {
    inputs.forEach((inp, i) => {
      inp.addEventListener('input', () => {
        const v = inp.value.replace(/[^0-9]/g,'');
        inp.value = v;
        if (v.length === 3 && i < inputs.length - 1) inputs[i+1].focus();
        if (onComplete) onComplete();
      });
      inp.addEventListener('keydown', e => {
        if (e.key === '.' && i < inputs.length - 1) { e.preventDefault(); inputs[i+1].focus(); }
        if (e.key === 'Backspace' && inp.value === '' && i > 0) inputs[i-1].focus();
        if (e.key === 'Enter') $('ipCalcBtn').click();
      });
    });
  }

  // Sync CIDR → dotted mask
  $('cidrInput').addEventListener('input', () => {
    const c = parseInt($('cidrInput').value, 10);
    if (!isNaN(c) && c >= 0 && c <= 32) {
      const m = cidrToMask(c);
      smInputs.forEach((inp, i) => inp.value = m[i]);
    }
  });

  // Sync dotted mask → CIDR
  smInputs.forEach(inp => {
    inp.addEventListener('input', () => {
      const octets = smInputs.map(i => parseInt(i.value, 10));
      if (octets.every(o => !isNaN(o) && o >= 0 && o <= 255)) {
        const cidr = maskToCIDR(octets);
        if (cidr !== null) $('cidrInput').value = cidr;
      }
    });
  });

  wireOctetAdvance(ipInputs);
  wireOctetAdvance(smInputs);

  // ── IP Class detection ──
  function ipClass(firstOctet) {
    if (firstOctet >= 1   && firstOctet <= 126)  return { cls: 'A', defaultMask: '255.0.0.0',     cidr: 8,  type: 'Unicast', hosts: '16,777,214' };
    if (firstOctet === 127)                       return { cls: 'A (Loopback)', defaultMask: '255.0.0.0', cidr: 8, type: 'Loopback', hosts: 'N/A' };
    if (firstOctet >= 128 && firstOctet <= 191)  return { cls: 'B', defaultMask: '255.255.0.0',   cidr: 16, type: 'Unicast', hosts: '65,534' };
    if (firstOctet >= 192 && firstOctet <= 223)  return { cls: 'C', defaultMask: '255.255.255.0', cidr: 24, type: 'Unicast', hosts: '254' };
    if (firstOctet >= 224 && firstOctet <= 239)  return { cls: 'D', defaultMask: 'N/A',           cidr: null, type: 'Multicast', hosts: 'N/A' };
    return { cls: 'E', defaultMask: 'N/A', cidr: null, type: 'Reserved/Experimental', hosts: 'N/A' };
  }

  function isPrivate(octs) {
    if (octs[0] === 10) return true;
    if (octs[0] === 172 && octs[1] >= 16 && octs[1] <= 31) return true;
    if (octs[0] === 192 && octs[1] === 168) return true;
    return false;
  }

  // ── Main calculate ──
  $('ipCalcBtn').addEventListener('click', () => {
    // Clear errors
    $('ipErr').textContent = '';
    $('smErr').textContent = '';
    ipInputs.forEach(i => i.classList.remove('error'));
    smInputs.forEach(i => i.classList.remove('error'));
    setHidden($('ipBinResult'), true);
    setHidden($('ipNetInfo'), true);
    setHidden($('ipClassCard'), true);

    // Validate IP
    const ipOcts = ipInputs.map(i => i.value.trim());
    if (ipOcts.some(o => !validOctet(o))) {
      $('ipErr').textContent = 'Enter a valid IPv4 address (each octet 0–255)';
      ipInputs.forEach((inp, i) => { if (!validOctet(ipOcts[i])) inp.classList.add('error'); });
      return;
    }
    const ipNums = ipOcts.map(Number);

    // Validate mask — prefer CIDR if filled
    let cidr;
    const cidrVal = $('cidrInput').value.trim();
    if (cidrVal !== '') {
      cidr = parseInt(cidrVal, 10);
      if (isNaN(cidr) || cidr < 0 || cidr > 32) { $('smErr').textContent = 'CIDR must be 0–32'; return; }
      const m = cidrToMask(cidr);
      smInputs.forEach((inp, i) => inp.value = m[i]);
    } else {
      const smVals = smInputs.map(i => i.value.trim());
      if (smVals.some(o => !validOctet(o))) {
        $('smErr').textContent = 'Enter a valid subnet mask or CIDR prefix';
        smInputs.forEach((inp, i) => { if (!validOctet(smVals[i])) inp.classList.add('error'); });
        return;
      }
      const smNums = smVals.map(Number);
      cidr = maskToCIDR(smNums);
      if (cidr === null) { $('smErr').textContent = 'Not a valid contiguous subnet mask'; return; }
    }

    computeAndRender(ipNums, cidr);
  });

  function computeAndRender(ipNums, cidr) {
    const maskNums = cidrToMask(cidr);
    const wildNums = maskNums.map(b => 255 - b);

    // Network address = IP AND mask
    const netNums  = ipNums.map((b, i) => b & maskNums[i]);
    // Broadcast = net OR wildcard
    const bcastNums = netNums.map((b, i) => b | wildNums[i]);
    // First host
    const firstHost = [...netNums]; firstHost[3] += 1;
    // Last host
    const lastHost  = [...bcastNums]; lastHost[3] -= 1;
    // Host count
    const hostBits = 32 - cidr;
    const totalHosts = hostBits >= 31 ? (hostBits === 0 ? 0 : hostBits === 1 ? 0 : 2) : Math.pow(2, hostBits) - 2;

    // ── Binary breakdown ──
    const grid = $('ipBinaryGrid');
    grid.innerHTML = '';

    function makeBinRow(label, nums, type) {
      const row = document.createElement('div');
      row.className = 'ip-bin-row';
      const lbl = document.createElement('span');
      lbl.className = 'ip-bin-label';
      lbl.textContent = label;
      const octsWrap = document.createElement('div');
      octsWrap.className = 'ip-bin-octets';
      nums.forEach((n, i) => {
        const bits = octToBin8(n);
        const span = document.createElement('span');
        span.className = `ip-bin-octet ${type}`;
        if (type === 'net-part') {
          // Colour network bits vs host bits within each octet
          const netBitsInOctet = Math.max(0, Math.min(8, cidr - i * 8));
          if (netBitsInOctet === 8) {
            span.className = 'ip-bin-octet net-part';
            span.textContent = bits;
          } else if (netBitsInOctet === 0) {
            span.className = 'ip-bin-octet host-part';
            span.textContent = bits;
          } else {
            span.className = 'ip-bin-octet';
            span.innerHTML =
              `<span style="color:var(--accent)">${bits.slice(0, netBitsInOctet)}</span>` +
              `<span style="color:#f0883e">${bits.slice(netBitsInOctet)}</span>`;
          }
        } else {
          span.textContent = bits;
        }
        octsWrap.appendChild(span);
        if (i < 3) {
          const dot = document.createElement('span');
          dot.style.cssText = 'color:var(--text-sub);font-family:var(--mono);font-size:0.9rem;';
          dot.textContent = '.';
          octsWrap.appendChild(dot);
        }
      });
      row.appendChild(lbl);
      row.appendChild(octsWrap);
      grid.appendChild(row);
    }

    makeBinRow('IP Address', ipNums, 'net-part');
    const hr1 = document.createElement('hr'); hr1.className = 'ip-bin-divider'; grid.appendChild(hr1);
    makeBinRow('Subnet Mask', maskNums, 'mask-part');
    makeBinRow('Wildcard', wildNums, 'wildcard-part');
    const hr2 = document.createElement('hr'); hr2.className = 'ip-bin-divider'; grid.appendChild(hr2);
    makeBinRow('Network Addr', netNums, 'net-part');
    makeBinRow('Broadcast', bcastNums, 'host-part');

    // Legend
    const legend = document.createElement('div');
    legend.className = 'legend-row';
    legend.innerHTML = `
      <span class="legend-item"><span class="legend-dot net"></span>Network bits</span>
      <span class="legend-item"><span class="legend-dot host"></span>Host bits</span>
      <span class="legend-item"><span class="legend-dot wild"></span>Wildcard</span>`;
    grid.appendChild(legend);
    setHidden($('ipBinResult'), false);

    // Copy
    const copyText = [
      `IP:        ${ipNums.join('.')}`,
      `Binary:    ${ipNums.map(octToBin8).join('.')}`,
      `Mask:      ${maskNums.join('.')}  /${cidr}`,
      `Network:   ${netNums.join('.')}`,
      `Broadcast: ${bcastNums.join('.')}`,
    ].join('\n');
    $('copyIP').onclick = () => {
      navigator.clipboard.writeText(copyText).then(() => {
        $('copyIP').textContent = 'Copied!';
        $('copyIP').classList.add('copied');
        setTimeout(() => { $('copyIP').textContent = 'Copy'; $('copyIP').classList.remove('copied'); }, 1500);
      });
    };

    // ── Network Info ──
    const infoGrid = $('ipInfoGrid');
    function infoRow(key, val, cls='') {
      return `<div class="ip-info-row"><span class="ip-info-key">${key}</span><span class="ip-info-val ${cls}">${val}</span></div>`;
    }
    infoGrid.innerHTML = [
      infoRow('IP Address', ipNums.join('.')),
      infoRow('Subnet Mask', maskNums.join('.') + ` (/${cidr})`),
      infoRow('Wildcard Mask', wildNums.join('.')),
      infoRow('Network Address', netNums.join('.'), 'net'),
      infoRow('Broadcast', bcastNums.join('.'), 'host'),
      infoRow('First Usable Host', cidr <= 30 ? firstHost.join('.') : 'N/A', 'net'),
      infoRow('Last Usable Host',  cidr <= 30 ? lastHost.join('.')  : 'N/A', 'host'),
      infoRow('Usable Hosts', cidr <= 30 ? totalHosts.toLocaleString() : (cidr === 31 ? '2 (point-to-point)' : '1 (host route)'), 'neutral'),
      infoRow('CIDR Notation', `${ipNums.join('.')}/${cidr}`, 'neutral'),
      infoRow('IP Type', isPrivate(ipNums) ? 'Private (RFC 1918)' : 'Public', 'neutral'),
    ].join('');
    setHidden($('ipNetInfo'), false);

    // ── IP Class ──
    const cls = ipClass(ipNums[0]);
    $('ipClassBody').innerHTML =
      `<span>Class <span class="highlight">${cls.cls}</span>  ·  ${cls.type}\n\n</span>` +
      `<span>Default mask for this class: <span class="highlight">${cls.defaultMask}${cls.cidr ? ' (/' + cls.cidr + ')' : ''}</span>\n</span>` +
      (cls.hosts !== 'N/A' ? `<span>Default usable hosts per network: <span class="highlight">${cls.hosts}</span>\n\n</span>` : '\n') +
      `<span class="explain">` +
      (isPrivate(ipNums)
        ? `This is a private IP address (RFC 1918) — not routable on the public internet.`
        : `This is a public IP address — routable on the internet.`) +
      `</span>`;
    setHidden($('ipClassCard'), false);
  }

  // Pre-fill example
  window.addEventListener('DOMContentLoaded', () => {});

})();
