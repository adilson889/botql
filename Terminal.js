'use strict';

/**
* Terminal.js — feedback visual de "a pensar" para quando o BotQL corre
* num terminal Node.js puro (ex: bot ligado via Bootstrap.js, sem editor
* nenhum por perto).

*/

const FRAMES = ['|', '/', '-', '\\'];
const INTERVALO_MS = 100;

function isNodeRuntime() {
return typeof process !== 'undefined' && !!process.versions && !!process.versions.node;
}

function isInteractiveTerminal() {
return isNodeRuntime() && !!process.stdout && !!process.stdout.isTTY;
}

/**
* Liga um spinner de terminal ao onThinking do interpretador, e um
* fallback de console.log a onReply/onForward/onSend — só para os que
* ainda não tiverem sido definidos.
*
* @param {import('./botql.js').BotQLInterpreter} interpreter
* @returns {() => void} função para desligar o spinner manualmente, se
*   for preciso parar antes do bot terminar (raramente necessário).
*/
function attachTerminalUI(interpreter) {
if (!isNodeRuntime()) {
// Browser/WebView: quem trata da UI é o próprio editor.
return () => {};
}

let timer = null;
let ativo = false;

function pararSpinner() {
if (!ativo) return;
ativo = false;
if (timer) clearInterval(timer);
if (isInteractiveTerminal()) {
process.stdout.write('\r\x1b[K'); // limpa a linha do spinner
}
}

if (!interpreter.onThinking) {
interpreter.onThinking = ({ text }) => {
const rotulo = text ? text + ' ' : '';

if (!isInteractiveTerminal()) {
// Não interativo (ex: saída redirecionada para ficheiro,
// ou executado em CI): uma linha só, sem animação.
console.log(rotulo.trim() || '...');
return;
}

ativo = true;
let frame = 0;
timer = setInterval(() => {
process.stdout.write('\r' + rotulo + FRAMES[frame]);
frame = (frame + 1) % FRAMES.length;
}, INTERVALO_MS);
};
}

// Sem isto o spinner nunca pararia sozinho — onReply/onForward/onSend
// são os eventos que sinalizam "o THINK/bloco terminou, já há resposta".
const envolverEPararSpinner = (onEvent) => async (payload) => {
pararSpinner();
if (onEvent) await onEvent(payload);
};

if (!interpreter.onReply) {
interpreter.onReply = envolverEPararSpinner(({ text }) => console.log(text));
} else {
interpreter.onReply = envolverEPararSpinner(interpreter.onReply);
}

if (!interpreter.onForward) {
interpreter.onForward = envolverEPararSpinner(({ target }) => console.log(`(encaminhado para ${target})`));
} else {
interpreter.onForward = envolverEPararSpinner(interpreter.onForward);
}

if (!interpreter.onSend) {
interpreter.onSend = envolverEPararSpinner(({ target, signal }) => console.log(`(enviado para ${target})`, signal));
} else {
interpreter.onSend = envolverEPararSpinner(interpreter.onSend);
}

return pararSpinner;
}

module.exports = { attachTerminalUI, isInteractiveTerminal, isNodeRuntime };
