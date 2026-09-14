'use strict';

/**
* ternlight-mini/index.js
*
* Ponto de entrada que RAG.js carrega via require('./ternlight-mini/index.js')
* (ver RAG.js, topo do ficheiro). Fica na raiz de ternlight-mini/, ao lado
* de pkg-web/ — não mexe em nada dentro de pkg-web/ além do já adaptado
* em pkg-web/tern_engine.js (troca de export ES Module por CommonJS, ver
* comentário nesse ficheiro; nenhuma lógica gerada por wasm-bindgen foi
* alterada).
*
* Por que isto existe: tern_engine.js (pkg-web, wasm-bindgen --target web)
* foi feito para correr num browser real, com <script type="module"> e
* fetch() do .wasm via import.meta.url. Dentro do bundle IIFE que o
* esbuild gera para o BotQL (ver workflow "Publish to npm" do repo),
* nada disso existe — nem import.meta, nem module resolution do browser.
*
* A ponte: o Kotlin expõe os bytes do .wasm em base64 via
* AndroidBridge.lerAssetBase64() (MainActivity.kt) — lerAsset() normal
* corrompe binário por passar por toString(UTF_8). Este ficheiro
* descodifica o base64 e chama initSync(bytes) (pkg-web/tern_engine.js),
* que é a variante SÍNCRONA de inicialização que o próprio wasm-bindgen
* já gera — não precisou de nenhuma lógica nova, só o caminho certo de
* entrada de bytes.
*/

const ternEngine = require('./pkg-web/tern_engine.js');

let inicializado = false;

// Caminho do asset tal como fica dentro do APK: assets/ternlight-mini/
// pkg-web/tern_engine_bg.wasm — o próprio .wasm nunca passa pelo
// esbuild (fica como asset bruto, não é importado por nenhum código
// JS), só é lido aqui em runtime pela bridge.
const CAMINHO_WASM = 'ternlight-mini/pkg-web/tern_engine_bg.wasm';

function obterBridge() {
if (typeof window === 'undefined') return null;
return window.AndroidBridge || window.Android || null;
}

function base64ParaBytes(base64) {
const binario = atob(base64);
const bytes = new Uint8Array(binario.length);
for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);
return bytes;
}

// Síncrona de propósito — RAG.js chama embed()/cosineSim() de forma
// síncrona (ver _conselhoSemantico em RAG.js), e initSync() do
// wasm-bindgen também é síncrona (não faz IO, só instancia bytes já
// em memória). Só falha (devolve false) se a bridge Android não
// estiver disponível ou o asset não existir — nesses casos, RAG.js já
// trata ternlight === null como "sem conselheiro semântico" e continua
// a funcionar só com BM25, exatamente como antes desta integração.
function inicializar() {
if (inicializado) return true;

const bridge = obterBridge();
if (!bridge || typeof bridge.lerAssetBase64 !== 'function') return false;

const base64 = bridge.lerAssetBase64(CAMINHO_WASM);
if (!base64) return false;

try {
const bytes = base64ParaBytes(base64);
ternEngine.initSync(bytes);
inicializado = true;
return true;
} catch (e) {
return false;
}
}

function embed(texto) {
if (!inicializado && !inicializar()) {
throw new Error('ternlight-mini: motor não disponível (bridge Android em falta, ou .wasm não encontrado nos assets)');
}
return ternEngine.embed(texto);
}

// Vetores de embed() já vêm L2-normalizados (garantia documentada no
// próprio tern_engine, ver tern_engine.d.ts) — cosseno vira um dot
// product simples, sem sqrt.
function cosineSim(a, b) {
let soma = 0;
for (let i = 0; i < a.length; i++) soma += a[i] * b[i];
return soma;
}

module.exports = { embed, cosineSim, inicializar };
