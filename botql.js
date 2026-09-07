
'use strict';

/**
* botql.js — Motor de execução do BotQL
*
* Recebe a AST gerada pelo Parser.js e executa os comandos: regista o bot,
* cria tabelas, guarda handlers de eventos (ON START / ON MESSAGE / ON SIGNAL)
* e corre-os quando uma mensagem ou sinal chega.
*
* Uso básico:
*   const { BotQLInterpreter } = require('./botql.js');
*   const bot = BotQLInterpreter.fromSource(sourceCode, {
*       onReply: ({ target, text }) => console.log('REPLY', target, text),
*       onForward: ({ target }) => console.log('FORWARD', target),
*       onSend: ({ target, signal }) => console.log('SEND', target, signal),
*   });
*   await bot.start();
*   await bot.receiveMessage('+244900000000', 'quero comprar');
*/

const { Parser } = require('./Parser.js');
const { MemoryDatabase } = require('./Database.js');
const { createDefaultFileSystem } = require('./FileSystem.js');
const { KnowledgeCache } = require('./RAG.js');

const WAITING_TEXTO_PADRAO = 'Pensando...';
const WAITING_SEGUNDOS_PADRAO = 3;

// A base de dados em memória vive só em Database.js. Qualquer objeto com
// os métodos createTable/insert/update/getRows pode ser passado como `db`
// nas opções do interpreter, para ligar a um banco real (ex: SQLiteDatabase).

// ===== Interpreter =====

class BotQLInterpreter {
constructor(options = {}) {
this.db = options.db || new MemoryDatabase();

// onReply/onForward/onSend ficam `null` quando não passados nas
// opções, para se poder distinguir "não definido" de "função vazia".
// Isto é o que permite ao Connectors.js (attachConnectors) saber se
// deve ou não injetar o connector real da plataforma — se ficasse
// sempre com uma função por omissão, o `||` do attachConnectors
// nunca via um valor falsy e nunca substituía nada.
this.onReply = options.onReply || null;
this.onForward = options.onForward || null;
this.onSend = options.onSend || null;
this.signalParser = options.signalParser || ((raw) => raw);

// THINK(ficheiro.txt): dispara onThinking (se definido) antes de
// procurar no KnowledgeIndex — a plataforma usa isso para mostrar
// algo tipo "Pensando..." enquanto a busca corre, já que não é
// instantânea como um REPLY comum (RAG.js pondera BM25 + fuzzy match
// sobre o ficheiro inteiro a cada chamada não cacheada).
//
// A decisão de responder ou não já vem pronta do KnowledgeIndex
// (analyze(), que cruza confidence com a margem entre o melhor e o
// segundo colocado — ver RAG.js) — por isso não há aqui um limiar
// fixo configurável como havia antes com search().
this.onThinking = options.onThinking || null;

this.botName = null;
this.platform = null;
this.connections = [];
this.handlers = { START: [], MESSAGE: [], SIGNAL: [] };
this.running = false;

// CONNECT RESPONSE <alias>: guarda so os aliases ligados (Set), na
// ordem declarada no .sql. Response() sem argumento so e permitido
// com exatamente uma ligacao — response() com mais de uma e ambiguo,
// listado no erro. A funcao que fala com a IA de verdade fica de
// fora do motor (this.onResponse, plugavel como onReply/onForward) —
// o interpreter so valida o alias e invoca o handler.
this.responseConnections = new Set();
this.onResponse = options.onResponse || null;

// DEFAULT MESSAGE: no máximo uma tabela do bot pode ter isto (a doc
// não define o que aconteceria com duas), por isso guardamos só a
// última declarada, tal como faria um CREATE TABLE duplicado.
// { table, senderColumn, file?, index?, value? } — ver load() e
// receiveMessage().
this.defaultMessageConfig = null;

this.nativeFuncs = new Map();
this.registerFunction('NOW', () => new Date().toISOString());

// Acesso a ficheiros para resolver IMPORT: por omissão usa fs/path
// reais do Node (createDefaultFileSystem deteta o ambiente). Em
// browser ou qualquer ambiente sem disco, passar options.fileSystem
// com um adapter próprio (ex: FileSystem.MemoryFileSystem) — ver
// FileSystem.js para o contrato exigido.
this.fileSystem = options.fileSystem || createDefaultFileSystem();

// Suporte a IMPORT: pilha de diretórios base (para resolver caminhos
// relativos de imports aninhados) e registo de ficheiros já
// importados (evita loops em imports circulares).
const defaultBasePath = (typeof process !== 'undefined' && process.cwd) ? process.cwd() : '';
this._basePathStack = [options.basePath || defaultBasePath];
this._importedFiles = new Set();

// Base fixa usada para resolver CONTAINS KEYWORDS("ficheiro.txt"):
// ao contrário do _basePathStack (que muda durante o load de
// IMPORTs aninhados), isto guarda sempre a pasta do ficheiro
// principal, porque KEYWORDS() só é lido em runtime (ao receber
// uma mensagem), já depois do load/_flattenImports ter terminado.
this._rootBasePath = options.basePath || defaultBasePath;

// Cache de ficheiros de keywords já lidos: path -> array de
// palavras (uma por linha). Evita reler o ficheiro a cada
// mensagem recebida.
this._keywordsFileCache = new Map();

// Cache de ficheiros de resposta (REPLY (ficheiro.txt, N)) já lidos:
// path -> Map(indice -> texto). Mesmo raciocínio do
// _keywordsFileCache acima. Reaproveitado também por
// IMPORT {ficheiro.txt, N} — é o mesmo formato "N- valor" por linha.
this._replyFileCache = new Map();

// Valores carregados via IMPORT {ficheiro.txt, N}: nome do ficheiro
// (sem extensão) -> valor lido. Ficam disponíveis em qualquer
// expressão como env.NOME (ex: IMPORT {env.txt, 1} fica acessível
// como env.env — ver evalExpr, ramo MemberAccess).
this.envValues = new Map();

// KnowledgeCache (RAG.js): um KnowledgeIndex por ficheiro de
// conhecimento, construído (BM25 + stemming) na primeira vez que
// THINK(ficheiro) é avaliado, e reaproveitado nas mensagens
// seguintes — o índice não muda entre mensagens, só a query muda.
this.knowledgeCache = new KnowledgeCache(this.fileSystem);
}

static fromSource(source, options = {}) {
const ast = new Parser(source).parseProgram();
const interpreter = new BotQLInterpreter(options);
interpreter.load(ast);
return interpreter;
}

// Lê um ficheiro .sql do disco (ou de outro fileSystem injetado) e usa
// a sua pasta como base para resolver IMPORTs relativos dentro dele.
static fromFile(filePath, options = {}) {
const fileSystem = options.fileSystem || createDefaultFileSystem();
const resolved = fileSystem.resolve('', filePath);
const source = fileSystem.readFile(resolved);
return BotQLInterpreter.fromSource(source, {
...options,
fileSystem,
basePath: fileSystem.dirname(resolved)
});
}

registerFunction(name, fn) {
this.nativeFuncs.set(name, fn);
}

// ---- Carregamento da AST: statements de topo, fora de eventos ----
//
// IMPORT é sempre resolvido antes de qualquer outro comando, independente
// de onde aparece no ficheiro (tal como o SOURCE do MySQL ou o \i do
// psql) — por isso o corpo é primeiro "achatado": todo o conteúdo vindo
// de ficheiros importados entra ANTES dos statements do próprio ficheiro,
// recursivamente, mesmo que o IMPORT apareça no meio ou no fim do texto.

load(ast, basePath = this._basePathStack[this._basePathStack.length - 1]) {
const flatBody = this._flattenImports(ast.body, basePath);

for (const node of flatBody) {
switch (node.type) {
case 'CreateBot':
this.botName = node.name;
break;
case 'Platform':
this.platform = node.value;
break;
case 'Connect':
this.connections.push({
service: node.service,
kind: node.kind,
credential: node.credential
});
break;
case 'ConnectResponse':
if (!this.envValues.has(node.alias)) {
throw new Error(`runtime error: CONNECT RESPONSE failed, alias "${node.alias}" was not imported (use IMPORT {..., N} AS ${node.alias})`);
}
this.responseConnections.add(node.alias);
break;
case 'CreateTable':
this.db.createTable(node.name, node.columns, node.preventDefault);
if (node.defaultMessage) {
const senderColumn = node.name === 'Context'
? 'client'
: (node.columns.find((c) => c.name === 'client' || c.name === 'sender') || {}).name;
if (!senderColumn) {
throw new Error(`runtime error: DEFAULT MESSAGE on table "${node.name}" requires a "client" or "sender" column`);
}
this.defaultMessageConfig = { table: node.name, senderColumn, ...node.defaultMessage };
}
break;
case 'On':
this.handlers[node.event].push(node);
break;
case 'RunBot':
this.running = true;
break;
default:
throw new Error(`runtime error: unsupported top-level statement: ${node.type}`);
}
}
}

// Devolve um array de statements sem nenhum nó 'Import': o conteúdo de
// cada ficheiro importado é lido, parseado e achatado recursivamente
// primeiro (imports dentro de imports também respeitam a regra), e só
// depois vêm os statements que pertencem a este próprio ficheiro.
//
// IMPORT {ficheiro.sql} (sem índice) — comportamento original: lê o
// ficheiro inteiro como código BotQL e junta ao programa.
//
// IMPORT {ficheiro.txt, N} (com índice) — não é código: lê só a
// entrada N do ficheiro (mesmo formato "N- valor" do REPLY indexado)
// e guarda em this.envValues. Com AS alias, a chave é o alias (fica
// acessível diretamente pelo nome, ex: K, CONNECT RESPONSE K); sem
// AS, mantém-se o comportamento original — chave é o nome do
// ficheiro sem extensão, só acessível via env.NOME_FICHEIRO. Um
// ficheiro sem AS não pode ser usado por CONNECT RESPONSE (exige
// alias explícito, para não colidir com outros IMPORTs do mesmo
// ficheiro em índices diferentes).
// Não produz nenhum statement — é resolvido e removido do AST aqui
// mesmo, antes de correr qualquer evento.
_flattenImports(body, basePath) {
const fromImports = [];
const ownStatements = [];

for (const node of body) {
if (node.type !== 'Import') {
ownStatements.push(node);
continue;
}

if (node.index !== null && node.index !== undefined) {
const index = this.evalExpr(node.index, this.createContext());
const entries = this._loadIndexedFile(node.path, basePath);
const value = entries.get(Number(index));
if (value === undefined) {
throw new Error(`runtime error: IMPORT failed, entry ${index} not found in "${node.path}"`);
}
const key = node.alias || node.path.replace(/\.[^.]+$/, '');
this.envValues.set(key, value);
continue;
}

const fullPath = this.fileSystem.resolve(basePath, node.path);
if (this._importedFiles.has(fullPath)) continue; // já importado, ignora (evita loops)
if (!this.fileSystem.exists(fullPath)) {
throw new Error(`runtime error: IMPORT failed, file not found: "${fullPath}"`);
}
this._importedFiles.add(fullPath);

const source = this.fileSystem.readFile(fullPath);
const importedAst = new Parser(source).parseProgram();
const nestedFlat = this._flattenImports(importedAst.body, this.fileSystem.dirname(fullPath));
fromImports.push(...nestedFlat);
}

return [...fromImports, ...ownStatements];
}

// ---- Contexto de execução de um evento ----

createContext(base = {}) {
return {
vars: {
client: base.client || null,
message: base.message || null,
lastMsg: null,
SIGNAL: null
},
rawSignal: base.rawSignal || null,
lastInsertId: null
};
}

// ---- Ciclo de vida do bot ----

async start() {
for (const handler of this.handlers.START) {
const ctx = this.createContext();
await this.run(handler.body, ctx);
}
}

async receiveMessage(client, message) {
const ctx = this.createContext({ client, message });

// DEFAULT MESSAGE: se a tabela declarada ainda não tem nenhuma linha
// para este client/sender, é o primeiro contacto — responde só com a
// saudação e não corre o resto do ON MESSAGE desta vez (nem o INSERT
// que normalmente regista a mensagem). Em produção real (WhatsApp,
// Telegram) isto só pode ser detetado reactivamente, na primeira
// mensagem recebida — a plataforma não deixa o bot escrever primeiro
// sem o utilizador ter escrito antes. Ver greetIfNew() para o caso do
// preview do editor, que não tem essa restrição.
const cumprimentou = await this.greetIfNew(client);
if (cumprimentou) return ctx;

for (const handler of this.handlers.MESSAGE) {
await this.run(handler.body, ctx);
}
return ctx;
}

// Mostra a DEFAULT MESSAGE para este client, se ainda não for
// conhecido — sem precisar de nenhuma mensagem recebida. Usado por
// receiveMessage() (caso real, reativo) e também pode ser chamado
// diretamente pelo editor/preview ao abrir o chat, já que aí não há a
// restrição das plataformas reais de só poder responder depois do
// utilizador escrever primeiro. Devolve true se cumprimentou (e por
// isso nada mais deve correr nesse turno), false caso contrário —
// incluindo quando não há DEFAULT MESSAGE nenhuma configurada.
async greetIfNew(client) {
if (!this.defaultMessageConfig) return false;

const { table, senderColumn } = this.defaultMessageConfig;
const jaConhecido = this.db.getRows(table).some((row) => row[senderColumn] === client);
if (jaConhecido) return false;

const ctx = this.createContext({ client });
const text = this.resolveDefaultMessageText(this.defaultMessageConfig, ctx);
ctx.vars.lastMsg = text;
// Regista este client agora, senão a próxima chamada também
// encontraria "nenhuma linha" e a DEFAULT MESSAGE nunca pararia de
// disparar.
this.db.insert(table, [senderColumn], [client]);
if (this.onReply) {
await this.onReply({ target: null, text, client });
}
return true;
}

// Resolve o texto do DEFAULT MESSAGE: mesma dualidade texto-direto vs
// ficheiro indexado que o REPLY já tem (ver resolveReplyFromFile).
resolveDefaultMessageText(config, ctx) {
if (config.file) {
return this.resolveReplyFromFile(config.file, config.index, ctx);
}
return String(this.evalExpr(config.value, ctx));
}

async receiveSignal(source, rawSignal) {
const ctx = this.createContext({ rawSignal });
for (const handler of this.handlers.SIGNAL) {
if (handler.source !== source) continue;
await this.run(handler.body, ctx);
}
return ctx;
}

// ---- Execução de uma lista de statements (corpo de um bloco) ----

async run(statements, ctx) {
let groupMatched = false;

for (let i = 0; i < statements.length; i++) {
const stmt = statements[i];

if (stmt.type === 'When') {
if (i === 0 || statements[i - 1].type !== 'When') groupMatched = false;
const isMatch = stmt.conditions.some((cond) => this.evalCondition(cond, ctx));
if (isMatch) {
await this.run(stmt.body, ctx);
groupMatched = true;
}
continue;
}

if (stmt.type === 'Otherwise') {
if (!groupMatched) await this.run(stmt.body, ctx);
groupMatched = false;
continue;
}

await this.execStatement(stmt, ctx);
}
}

evalCondition(cond, ctx) {
if (typeof ctx.vars.message !== 'string') return false;
const message = ctx.vars.message.toLowerCase();

if (cond.op === 'CONTAINS') {
// Case-insensitive: "OLA", "Ola" e "ola" devem bater com CONTAINS "ola".
return message.includes(cond.value.toLowerCase());
}

if (cond.op === 'CONTAINS_ANY') {
// CONTAINS ("oi", "ola", ...) — basta uma das palavras bater.
return cond.values.some((v) => message.includes(v.toLowerCase()));
}

if (cond.op === 'CONTAINS_KEYWORDS_FILE') {
// CONTAINS KEYWORDS("ficheiro.txt") — mesma lógica do CONTAINS_ANY,
// mas a lista vem de um ficheiro (lido uma vez e mantido em cache).
const words = this._loadKeywordsFile(cond.path);
return words.some((v) => message.includes(v.toLowerCase()));
}

throw new Error(`runtime error: unsupported condition: ${cond.op}`);
}

// Lê um ficheiro de keywords: uma palavra/frase por linha, nada mais.
// Sem comentários nem qualquer outra sintaxe misturada de propósito —
// um ficheiro só serve para um fim, evita ambiguidade sobre o que é
// keyword e o que não é. Resultado fica em cache — chamado a cada
// mensagem recebida, não pode reler disco/rede sempre.
_loadKeywordsFile(path) {
if (this._keywordsFileCache.has(path)) {
return this._keywordsFileCache.get(path);
}

const fullPath = this.fileSystem.resolve(this._rootBasePath, path);
if (!this.fileSystem.exists(fullPath)) {
throw new Error(`runtime error: KEYWORDS failed, file not found: "${fullPath}"`);
}

const raw = this.fileSystem.readFile(fullPath);
const words = raw
.split('\n')
.map((linha) => linha.trim())
.filter((linha) => linha.length > 0);

this._keywordsFileCache.set(path, words);
return words;
}

// Resolve o texto e o tempo mínimo do WAITING(...) de um THINK. Sem
// WAITING nenhum no .sql (stmt.waiting === null), ou com WAITING()
// vazio, usa os valores por omissão. O ficheiro do WAITING é lido tal
// e qual (texto/HTML livre) — ao contrário do REPLY/DEFAULT MESSAGE
// indexados, não é o formato "N- valor".
resolveWaitingConfig(waiting, ctx) {
if (!waiting) return { text: WAITING_TEXTO_PADRAO, seconds: WAITING_SEGUNDOS_PADRAO };

let text = WAITING_TEXTO_PADRAO;
if (waiting.file) {
const fullPath = this.fileSystem.resolve(this._rootBasePath, waiting.file);
if (!this.fileSystem.exists(fullPath)) {
throw new Error(`runtime error: WAITING failed, file not found: "${fullPath}"`);
}
text = this.fileSystem.readFile(fullPath).trim();
}

let seconds = WAITING_SEGUNDOS_PADRAO;
if (waiting.seconds) {
seconds = Number(this.evalExpr(waiting.seconds, ctx));
}

return { text, seconds };
}

// Resolve REPLY (ficheiro.txt, indice): lê o índice (número ou
// expressão que resolve a número) e devolve o texto da entrada
// correspondente do ficheiro de respostas.
resolveReplyFromFile(file, indexNode, ctx) {const index = this.evalExpr(indexNode, ctx);
const entries = this._loadIndexedFile(file, this._rootBasePath);
const text = entries.get(Number(index));
if (text === undefined) {
throw new Error(`runtime error: REPLY failed, entry ${index} not found in "${file}"`);
}
return text;
}

// Lê um ficheiro de entradas numeradas. Duas formas, na mesma
// entrada N, nunca misturadas:
//
//   N- texto            — uma linha só (forma original, continua igual)
//   N-{ ... }            — bloco delimitado por chaves, pode ter
//                          varias linhas e HTML/Markdown/CSS por
//                          dentro. So fecha na "}" que corresponde a
//                          "{" que abriu — chaves internas (ex: um
//                          style="{color:red}" dentro do HTML) contam
//                          para o aninhamento e NAO fecham a entrada
//                          cedo. Rigoroso: uma "{" sem a "}"
//                          correspondente antes do fim do ficheiro e'
//                          erro, nunca silenciosamente ignorado.
//
// Resultado e' um Map indice -> valor, em cache — usado tanto por
// REPLY (ficheiro, N) como por IMPORT {ficheiro, N}.
_loadIndexedFile(path, basePath) {
if (this._replyFileCache.has(path)) {
return this._replyFileCache.get(path);
}

const fullPath = this.fileSystem.resolve(basePath, path);
if (!this.fileSystem.exists(fullPath)) {
throw new Error(`runtime error: file not found: "${fullPath}"`);
}

const raw = this.fileSystem.readFile(fullPath);
const entries = this._parseIndexedEntries(raw, path);
this._replyFileCache.set(path, entries);
return entries;
}

// Parser char-by-char do formato de entradas numeradas. Percorre o
// ficheiro procurando "N-" no inicio de uma linha (ignorando espacos);
// o que vem a seguir decide a forma:
//   "{" logo a seguir -> bloco: conta chaves ate a correspondente
//        fechar, valor e' o conteudo entre elas (sem as chaves),
//        aparado nas pontas.
//   qualquer outra coisa -> forma de uma linha: valor e' o resto da
//        linha, aparado.
_parseIndexedEntries(raw, path) {
const entries = new Map();
const len = raw.length;
let i = 0;

while (i < len) {
// Posiciona no inicio de uma linha antes de tentar casar "N-".
const lineStart = i;
let j = lineStart;
while (j < len && (raw[j] === ' ' || raw[j] === '\t')) j++;

const numMatch = /^\d+/.exec(raw.slice(j));
if (!numMatch || raw[j + numMatch[0].length] !== '-') {
// Nao e' inicio de entrada nesta linha — avanca para a linha seguinte.
const nl = raw.indexOf('\n', lineStart);
i = nl === -1 ? len : nl + 1;
continue;
}

const index = Number(numMatch[0]);
let k = j + numMatch[0].length + 1; // posicao logo depois do "-"

if (raw[k] === '{') {
// Forma de bloco: conta chaves ate encontrar a correspondente.
let depth = 1;
const contentStart = k + 1;
let p = contentStart;
while (p < len && depth > 0) {
if (raw[p] === '{') depth++;
else if (raw[p] === '}') depth--;
p++;
}
if (depth !== 0) {
throw new Error(`runtime error: unclosed "{" for entry ${index} in "${path}"`);
}
const value = raw.slice(contentStart, p - 1).trim();
entries.set(index, value);
i = p; // continua logo depois do "}" de fecho
continue;
}

// Forma de uma linha: valor e' o resto da linha, aparado.
const nl = raw.indexOf('\n', k);
const lineEnd = nl === -1 ? len : nl;
const value = raw.slice(k, lineEnd).trim();
entries.set(index, value);
i = nl === -1 ? len : nl + 1;
}

return entries;
}

// ---- Execução de um statement de ação ----

async execStatement(stmt, ctx) {
switch (stmt.type) {
case 'Reply': {
const text = stmt.file
? this.resolveReplyFromFile(stmt.file, stmt.index, ctx)
: String(await this.evalReplyValue(stmt.value, ctx));
ctx.vars.lastMsg = text;
if (this.onReply) {
await this.onReply({ target: stmt.target, text, client: ctx.vars.client });
}
break;
}

case 'Think': {
const waiting = this.resolveWaitingConfig(stmt.waiting, ctx);
const inicio = Date.now();

if (this.onThinking) {
await this.onThinking({ client: ctx.vars.client, text: waiting.text });
}

const fullPath = this.fileSystem.resolve(this._rootBasePath, stmt.file);
const index = this.knowledgeCache.get(fullPath);
const resultado = index.analyze(ctx.vars.message);

// Tempo mínimo do WAITING: mesmo que a busca termine mais depressa
// que isso, só responde depois de decorrido esse mínimo — sem isto
// a bolha "a pensar" apareceria e desapareceria rápido demais para
// parecer natural (ver doc, secção WAITING).
const decorrido = Date.now() - inicio;
const faltam = waiting.seconds * 1000 - decorrido;
if (faltam > 0) {
await new Promise((resolve) => setTimeout(resolve, faltam));
}

if (resultado.decision === 'RESPONDER') {
const text = resultado.texto;
ctx.vars.lastMsg = text;
if (this.onReply) {
await this.onReply({ target: null, text, client: ctx.vars.client });
}
} else if (stmt.fallback) {
// REANALISAR (blocos concorrentes sem vencedor claro, mesmo após
// a retentativa focada e a tentativa de unir/deduplicar dentro do
// analyze) ou UNKNOWN (nada bateu com confiança suficiente): em
// ambos os casos corre o REPLY fallback declarado a seguir ao OR,
// tal como qualquer outro statement.
await this.execStatement(stmt.fallback, ctx);
}
// Sem fallback e sem decisão de RESPONDER: THINK não responde nada
// (silencioso) — quem escreve o .sql decide se isso é aceitável ou
// se devia sempre ter um OR REPLY (fallback.txt, N) a acompanhar.
break;
}

case 'ForwardTo': {
const target = String(this.evalExpr(stmt.target, ctx));
if (this.onForward) {
await this.onForward({ target, client: ctx.vars.client });
}
break;
}

case 'ParseSignal': {
ctx.vars.SIGNAL = await this.signalParser(ctx.rawSignal);
break;
}

case 'SendTo': {
if (this.onSend) {
await this.onSend({ target: stmt.target, signal: ctx.vars.SIGNAL });
}
break;
}

case 'Insert': {
this.execInsert(stmt, ctx);
break;
}

case 'Update': {
this.execUpdate(stmt, ctx);
break;
}

default:
throw new Error(`runtime error: unsupported statement inside event: ${stmt.type}`);
}
}

execInsert(stmt, ctx) {
let columnNames;
let values;

// INSERT INTO Context() automático: sem parâmetros, captura implícita.
if (stmt.table === 'Context' && (!stmt.columns || stmt.columns.length === 0) && !stmt.values) {
columnNames = ['client', 'message', 'created_at'];
values = [ctx.vars.client, ctx.vars.message, new Date().toISOString()];
} else {
columnNames = (stmt.columns || []).map((c) => c.name);
values = (stmt.values || []).map((v) => this.evalExpr(v, ctx));
}

ctx.lastInsertId = this.db.insert(stmt.table, columnNames, values);
}

execUpdate(stmt, ctx) {
const value = this.evalExpr(stmt.set.value, ctx);

let whereColumn = null;
let whereValue = null;
if (stmt.where) {
whereColumn = stmt.where.left.name;
whereValue = this.evalExpr(stmt.where.right, ctx);
}

this.db.update(stmt.table, stmt.set.column, value, whereColumn, whereValue);
}

// ---- Avaliação de expressões ----

// Ponto de entrada usado só por REPLY <expr>: trata Response()/
// Response(alias) como caso especial assíncrono (chama this.onResponse,
// que fala de verdade com a IA ligada) e delega qualquer outra
// expressão ao evalExpr síncrono normal. Response() não pode ser
// composto dentro de + (ex: REPLY "x" + Response() não é suportado) —
// só faz sentido como o valor direto do REPLY, conforme a doc.
async evalReplyValue(node, ctx) {
if (node.type === 'Call' && node.callee === 'Response') {
return this.execResponse(node, ctx);
}
return this.evalExpr(node, ctx);
}

// Response() / Response(alias): dispara o ciclo com a IA ligada via
// CONNECT RESPONSE — envia a mensagem atual, espera, devolve o texto.
// Sem argumento só é válido com exatamente uma ligação (ambíguo com
// mais que uma); com argumento, o alias tem de corresponder a um
// CONNECT RESPONSE já feito.
async execResponse(node, ctx) {
if (!this.onResponse) {
throw new Error('runtime error: Response() failed, no AI connected (missing onResponse handler)');
}

let alias;
if (node.args.length === 0) {
if (this.responseConnections.size === 0) {
throw new Error('runtime error: Response() failed, no CONNECT RESPONSE found');
}
if (this.responseConnections.size > 1) {
throw new Error(`runtime error: Response() is ambiguous with multiple CONNECT RESPONSE (${[...this.responseConnections].join(', ')}); use Response(alias)`);
}
alias = [...this.responseConnections][0];
} else {
const argNode = node.args[0];
if (argNode.type !== 'Identifier') {
throw new Error('runtime error: Response(alias) expects an alias name, not a string or expression');
}
alias = argNode.name;
if (!this.responseConnections.has(alias)) {
throw new Error(`runtime error: Response(${alias}) failed, no CONNECT RESPONSE ${alias} found`);
}
}

const token = this.envValues.get(alias);
const text = await this.onResponse({ alias, token, message: ctx.vars.message, client: ctx.vars.client });
return text;
}

evalExpr(node, ctx) {
switch (node.type) {
case 'Literal':
return node.value;

case 'Identifier': {
if (node.name === 'env') {
return Object.fromEntries(this.envValues);
}
if (Object.prototype.hasOwnProperty.call(ctx.vars, node.name)) {
return ctx.vars[node.name];
}
// Alias de um IMPORT {..., N} AS alias: acessivel diretamente pelo
// nome do alias, sem passar por env.alias (so quem nao usou AS cai
// em env.NOME_FICHEIRO, tratado no ramo acima).
if (this.envValues.has(node.name)) {
return this.envValues.get(node.name);
}
throw new Error(`runtime error: unknown identifier: "${node.name}"`);
}

case 'Member': {
const obj = this.evalExpr(node.object, ctx);
if (obj === null || obj === undefined) return undefined;
return obj[node.property];
}

case 'Call': {
if (node.callee === 'LAST_INSERT_ID') return ctx.lastInsertId;
const fn = this.nativeFuncs.get(node.callee);
if (!fn) throw new Error(`runtime error: unknown function: "${node.callee}"`);
const args = node.args.map((a) => this.evalExpr(a, ctx));
return fn(...args);
}

case 'Binary': {
const left = this.evalExpr(node.left, ctx);
const right = this.evalExpr(node.right, ctx);
if (node.op === '+') {
if (typeof left === 'number' && typeof right === 'number') return left + right;
return String(left) + String(right);
}
if (node.op === '=') return left === right;
throw new Error(`runtime error: unsupported operator: "${node.op}"`);
}

default:
throw new Error(`runtime error: unsupported expression: ${node.type}`);
}
}
}

module.exports = { BotQLInterpreter, MemoryDatabase };