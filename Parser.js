'use strict';

/**
* BotQL Parser
*
* Converte código-fonte .sql (sintaxe BotQL) numa AST de statements
* que o botql.js (interpreter) consegue percorrer e executar.
*
* Uso:
*   const { Parser } = require('./Parser.js');
*   const ast = new Parser(sourceCode).parseProgram();
*/

// ===== Tokenizer =====

const TokenType = {
KEYWORD: 'KEYWORD',
STRING: 'STRING',
NUMBER: 'NUMBER',
IDENT: 'IDENT',
SYMBOL: 'SYMBOL',
EOF: 'EOF'
};

// Palavras reservadas (case-insensitive na fonte, normalizadas para maiúsculas)
const KEYWORDS = new Set([
'CREATE', 'BOT', 'PLATFORM', 'CONNECT', 'TABLE', 'PREVENT', 'DEFAULT',
'ON', 'START', 'MESSAGE', 'FROM',
'WHEN', 'CONTAINS', 'OR', 'OTHERWISE', 'KEYWORDS', 'THINK', 'WAITING',
'REPLY', 'TO', 'FORWARD', 'PARSE', 'SEND',
'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'WHERE',
'RUN', 'IMPORT', 'AS', 'RESPONSE'
]);

class Token {
constructor(type, value, line) {
this.type = type;
this.value = value;
this.line = line;
}
}

class Tokenizer {
constructor(source) {
this.source = source;
this.pos = 0;
this.line = 1;
this.tokens = [];
}

error(msg) {
throw new Error(`syntax error: ${msg}`);
}

peekChar(offset = 0) {
return this.source[this.pos + offset];
}

tokenize() {
while (this.pos < this.source.length) {
const c = this.peekChar();

// Nova linha
if (c === '\n') {
this.line++;
this.pos++;
continue;
}

// Espaços
if (/\s/.test(c)) {
this.pos++;
continue;
}

// Comentário de linha: -- ...
if (c === '-' && this.peekChar(1) === '-') {
while (this.pos < this.source.length && this.peekChar() !== '\n') this.pos++;
continue;
}

// String literal
if (c === '"' || c === "'") {
this.tokens.push(this.readString(c));
continue;
}

// Número
if (/[0-9]/.test(c)) {
this.tokens.push(this.readNumber());
continue;
}

// Símbolos de um caractere
if ('{}(),.=+*;'.includes(c)) {
this.tokens.push(new Token(TokenType.SYMBOL, c, this.line));
this.pos++;
continue;
}

// Identificador / palavra-chave
if (/[A-Za-z_]/.test(c)) {
const word = this.readWord();
this.tokens.push(word);
continue;
}

this.error(`unexpected character: "${c}"`);
}

this.tokens.push(new Token(TokenType.EOF, null, this.line));
return this.tokens;
}

readString(quote) {
const startLine = this.line;
this.pos++; // consome a aspa de abertura
let value = '';
while (this.pos < this.source.length && this.peekChar() !== quote) {
if (this.peekChar() === '\\') {
this.pos++;
value += this.peekChar();
this.pos++;
continue;
}
if (this.peekChar() === '\n') this.line++;
value += this.peekChar();
this.pos++;
}
if (this.peekChar() !== quote) {
this.error('unterminated string');
}
this.pos++; // consome a aspa de fecho
return new Token(TokenType.STRING, value, startLine);
}

readNumber() {
const startLine = this.line;
let value = '';
while (this.pos < this.source.length && /[0-9.]/.test(this.peekChar())) {
value += this.peekChar();
this.pos++;
}
return new Token(TokenType.NUMBER, Number(value), startLine);
}

readWord() {
const startLine = this.line;
let value = '';
while (this.pos < this.source.length && /[A-Za-z0-9_]/.test(this.peekChar())) {
value += this.peekChar();
this.pos++;
}
const upper = value.toUpperCase();
if (KEYWORDS.has(upper) && value === upper) {
return new Token(TokenType.KEYWORD, upper, startLine);
}
return new Token(TokenType.IDENT, value, startLine);
}
}

// ===== Parser (recursive descent) =====

class Parser {
constructor(source) {
this.tokens = new Tokenizer(source).tokenize();
this.pos = 0;
}

error(msg) {
const tok = this.current();
throw new Error(`syntax error: ${msg}, near "${tok ? tok.value : 'EOF'}"`);
}

current() {
return this.tokens[this.pos];
}

at(type, value) {
const tok = this.current();
if (tok.type !== type) return false;
if (value !== undefined && tok.value !== value) return false;
return true;
}

atKeyword(...values) {
return this.at(TokenType.KEYWORD) && values.includes(this.current().value);
}

// Casa por valor, independente do token ser KEYWORD ou IDENT.
// Necessário para palavras como "SIGNAL", que tanto introduz um
// evento (ON SIGNAL FROM) como é usada como identificador (SIGNAL.PAIR).
atWord(...values) {
const tok = this.current();
return (tok.type === TokenType.KEYWORD || tok.type === TokenType.IDENT) && values.includes(tok.value);
}

advance() {
const tok = this.current();
if (tok.type !== TokenType.EOF) this.pos++;
return tok;
}

expect(type, value) {
if (!this.at(type, value)) {
this.error(`expected ${value || type}`);
}
return this.advance();
}

expectKeyword(value) {
return this.expect(TokenType.KEYWORD, value);
}

isAtEnd() {
return this.at(TokenType.EOF);
}

// ---- Programa ----

parseProgram() {
const statements = [];
while (!this.isAtEnd()) {
statements.push(this.parseStatement());
}
return { type: 'Program', body: statements };
}

// ---- Bloco { ... } ou statement único ----
// Regra da linguagem: bloco com mais de uma ação usa chaves,
// uma única ação não precisa.

parseBody() {
if (this.at(TokenType.SYMBOL, '{')) {
this.advance(); // {
const statements = [];
while (!this.at(TokenType.SYMBOL, '}')) {
if (this.isAtEnd()) this.error('unclosed block "{"');
statements.push(this.parseStatement());
}
this.advance(); // }
return statements;
}
// Ação única, sem chaves
return [this.parseStatement()];
}

// ---- Dispatch de statement ----

parseStatement() {
if (this.atKeyword('CREATE')) return this.parseCreate();
if (this.atKeyword('PLATFORM')) return this.parsePlatform();
if (this.atKeyword('CONNECT')) return this.parseConnect();
if (this.atKeyword('ON')) return this.parseOn();
if (this.atKeyword('WHEN')) return this.parseWhen();
if (this.atKeyword('OTHERWISE')) return this.parseOtherwise();
if (this.atKeyword('REPLY')) return this.parseReply();
if (this.atKeyword('THINK')) return this.parseThink();
if (this.atKeyword('FORWARD')) return this.parseForward();
if (this.atKeyword('PARSE')) return this.parseParseSignal();
if (this.atKeyword('SEND')) return this.parseSend();
if (this.atKeyword('INSERT')) return this.parseInsert();
if (this.atKeyword('UPDATE')) return this.parseUpdate();
if (this.atKeyword('RUN')) return this.parseRunBot();
if (this.atKeyword('IMPORT')) return this.parseImport();

this.error('unexpected statement');
}

// ---- CREATE BOT / CREATE TABLE ----

parseCreate() {
this.expectKeyword('CREATE');
if (this.atKeyword('BOT')) {
this.advance();
const name = this.expect(TokenType.STRING).value;
return { type: 'CreateBot', name };
}
if (this.atKeyword('TABLE')) {
this.advance();
const name = this.expect(TokenType.IDENT).value;
const columns = this.parseColumnList();
const preventDefault = this.tryParsePreventDefault();
const defaultMessage = this.tryParseDefaultMessage();
return { type: 'CreateTable', name, columns, preventDefault, defaultMessage };
}
this.error('expected BOT or TABLE after CREATE');
}

parseColumnList() {
this.expect(TokenType.SYMBOL, '(');
const columns = [];
while (!this.at(TokenType.SYMBOL, ')')) {
const colName = this.expect(TokenType.IDENT).value;
const constraints = [];
let colType = null;
// Tipo e constraints são identificadores livres (INT, TEXT, PRIMARY, KEY, ...)
// até à vírgula ou ao fecho do parêntese.
while (this.at(TokenType.IDENT) && !this.at(TokenType.SYMBOL, ',') && !this.at(TokenType.SYMBOL, ')')) {
const word = this.advance().value;
if (!colType) colType = word;
else constraints.push(word);
}
columns.push({ name: colName, columnType: colType, constraints });
if (this.at(TokenType.SYMBOL, ',')) this.advance();
}
this.expect(TokenType.SYMBOL, ')');
return columns;
}

tryParsePreventDefault() {
if (this.atKeyword('PREVENT')) {
this.advance();
this.expectKeyword('DEFAULT');
return true;
}
return false;
}

// ---- DEFAULT MESSAGE "texto" ----
// ---- DEFAULT MESSAGE (ficheiro.txt, N) ----
//
// Modificador do CREATE TABLE, ao lado de PREVENT DEFAULT: saudação
// automática enviada só na primeira mensagem de cada client/sender
// (ver botql.js, receiveMessage). Aceita texto direto ou a mesma forma
// de ficheiro indexado do REPLY — por isso reaproveita isReplyFileForm
// para o lookahead. "DEFAULT" aqui não é o mesmo "DEFAULT" de "PREVENT
// DEFAULT" — só é reconhecido como início de DEFAULT MESSAGE quando NÃO
// vem logo a seguir a PREVENT (tryParsePreventDefault já consumiu esse
// caso antes de chegarmos aqui).
tryParseDefaultMessage() {
if (!this.atKeyword('DEFAULT')) return null;
const next = this.tokens[this.pos + 1];
if (!next || next.type !== TokenType.KEYWORD || next.value !== 'MESSAGE') return null;

this.advance(); // DEFAULT
this.advance(); // MESSAGE

if (this.isReplyFileForm()) {
this.expect(TokenType.SYMBOL, '(');
const file = this.parseFileName();
this.expect(TokenType.SYMBOL, ',');
const index = this.parseExpression();
this.expect(TokenType.SYMBOL, ')');
return { file, index };
}

const value = this.parseExpression();
return { value };
}

// ---- PLATFORM ----

parsePlatform() {
this.expectKeyword('PLATFORM');
const value = this.advance().value; // ex: WHATSAPP (IDENT)
return { type: 'Platform', value };
}

// ---- CONNECT SERVIÇO TIPO "credencial" ----
// ---- CONNECT RESPONSE alias ----
//
// A segunda forma liga o bot a uma IA usando um valor já importado (o
// alias de um IMPORT {..., N} AS alias) — só estabelece a ligação,
// não dispara nada sozinho (quem dispara é Response()/Response(alias),
// dentro de uma ação). RESPONSE é keyword fixa aqui, por isso da para
// distinguir logo no primeiro token, sem lookahead: a forma normal
// nunca começa por essa palavra.

parseConnect() {
this.expectKeyword('CONNECT');

if (this.atKeyword('RESPONSE')) {
this.advance();
const alias = this.expect(TokenType.IDENT).value;
return { type: 'ConnectResponse', alias };
}

const service = this.advance().value;
const kind = this.advance().value;
const credential = this.expect(TokenType.STRING).value;
return { type: 'Connect', service, kind, credential };
}

// ---- ON START | ON MESSAGE | ON SIGNAL FROM "..." ----

parseOn() {
this.expectKeyword('ON');
if (this.atKeyword('START')) {
this.advance();
const body = this.parseBody();
return { type: 'On', event: 'START', body };
}
if (this.atKeyword('MESSAGE')) {
this.advance();
const body = this.parseBody();
return { type: 'On', event: 'MESSAGE', body };
}
if (this.atWord('SIGNAL')) {
this.advance();
this.expectKeyword('FROM');
const source = this.expect(TokenType.STRING).value;
const body = this.parseBody();
return { type: 'On', event: 'SIGNAL', source, body };
}
this.error('unexpected event after ON');
}

// ---- WHEN CONTAINS "..." [OR CONTAINS "..."]* ----

parseWhen() {
this.expectKeyword('WHEN');
const conditions = [this.parseCondition()];
while (this.atKeyword('OR')) {
this.advance();
conditions.push(this.parseCondition());
}
const body = this.parseBody();
return { type: 'When', conditions, body };
}

parseCondition() {
this.expectKeyword('CONTAINS');

// CONTAINS ("oi", "ola", "boa tarde", ...) — lista inline, evita
// repetir "OR CONTAINS" para cada palavra-chave.
if (this.at(TokenType.SYMBOL, '(')) {
const values = this.parseStringList();
return { op: 'CONTAINS_ANY', values };
}

// CONTAINS KEYWORDS(ficheiro.txt) — lista carregada de um ficheiro
// à parte (uma palavra-chave por linha), para listas grandes
// (100+ palavras) sem poluir o .sql. Sem aspas de propósito: não é
// uma string de busca, é um nome de ficheiro (fica visualmente
// diferente de CONTAINS "texto").
if (this.atKeyword('KEYWORDS')) {
this.advance();
this.expect(TokenType.SYMBOL, '(');
const path = this.parseFileName();
this.expect(TokenType.SYMBOL, ')');
return { op: 'CONTAINS_KEYWORDS_FILE', path };
}

// CONTAINS "texto" — forma original, continua a funcionar.
const value = this.expect(TokenType.STRING).value;
return { op: 'CONTAINS', value };
}

// Lista de strings entre parênteses: ("a", "b", "c")
parseStringList() {
this.expect(TokenType.SYMBOL, '(');
const values = [];
while (!this.at(TokenType.SYMBOL, ')')) {
values.push(this.expect(TokenType.STRING).value);
if (this.at(TokenType.SYMBOL, ',')) this.advance();
}
this.expect(TokenType.SYMBOL, ')');
return values;
}

// Nome de ficheiro sem aspas, ex: saudacoes.txt ou lista_bot.sql.
// O tokenizer separa "saudacoes" (IDENT) e ".txt" em IDENT + SYMBOL('.')
// + IDENT, por isso remontamos aqui em vez de pedir um STRING.
parseFileName() {
let name = this.expect(TokenType.IDENT).value;
while (this.at(TokenType.SYMBOL, '.')) {
this.advance();
name += '.' + this.expect(TokenType.IDENT).value;
}
return name;
}

// ---- OTHERWISE ----

parseOtherwise() {
this.expectKeyword('OTHERWISE');
const body = this.parseBody();
return { type: 'Otherwise', body };
}

// ---- REPLY [TO alvo] expressão ----
// ---- REPLY [TO alvo] (ficheiro.txt, N) ----
//
// A segunda forma referencia uma entrada numerada de um ficheiro de
// respostas (uma linha "N- texto" por entrada). Distingue-se da
// expressão comum porque começa por "(" seguido de um nome de
// ficheiro (IDENT + "." + IDENT), e não por uma STRING/NUMBER/IDENT
// isolado — daí o lookahead antes de decidir qual ramo seguir.

// ---- THINK(ficheiro.txt) ----
// ---- THINK(ficheiro.txt) OR REPLY (fallback.txt, N) ----
// ---- THINK(ficheiro.txt) OR REPLY "texto fixo" ----
//
// Diferente de REPLY: THINK não responde com um texto já mapeado, faz
// retrieval local sobre um ficheiro de conhecimento (ver RAG.js) e só
// responde se achar um bloco com confiança suficiente. Antes de
// procurar, sinaliza onThinking (para a plataforma poder mostrar
// "Pensando..." enquanto isso, já que a busca — em ficheiros grandes —
// não é instantânea como um REPLY comum).
//
// O "OR REPLY ..." é o fallback: só corre se THINK não encontrar nada
// com confiança suficiente. Fica preso ao mesmo statement (não é um
// segundo statement solto no corpo do WHEN) porque só faz sentido
// junto — um REPLY fallback sem THINK antes seria só um REPLY normal.

parseThink() {
this.expectKeyword('THINK');
this.expect(TokenType.SYMBOL, '(');
const file = this.parseFileName();
this.expect(TokenType.SYMBOL, ')');

const waiting = this.tryParseWaiting();

let fallback = null;
if (this.atKeyword('OR')) {
this.advance();
fallback = this.parseReply();
}

return { type: 'Think', file, waiting, fallback };
}

// ---- WAITING() | WAITING(ficheiro.txt) | WAITING(ficheiro.txt, N) ----
//
// Modificador do THINK, sempre logo a seguir a ele, antes do OR (ver
// parseThink acima). Os dois argumentos são opcionais e independentes:
// sem nenhum, o interpretador usa texto e tempo mínimo por omissão
// ("Pensando...", 3 segundos) — ver botql.js, resolveWaitingConfig.
tryParseWaiting() {
if (!this.atKeyword('WAITING')) return null;
this.advance();
this.expect(TokenType.SYMBOL, '(');

let file = null;
let seconds = null;
if (!this.at(TokenType.SYMBOL, ')')) {
file = this.parseFileName();
if (this.at(TokenType.SYMBOL, ',')) {
this.advance();
seconds = this.parseExpression();
}
}

this.expect(TokenType.SYMBOL, ')');
return { file, seconds };
}

parseReply() {
this.expectKeyword('REPLY');
let target = null;
if (this.atKeyword('TO')) {
this.advance();
target = this.advance().value; // ex: ADMIN
}

if (this.isReplyFileForm()) {
this.expect(TokenType.SYMBOL, '(');
const file = this.parseFileName();
this.expect(TokenType.SYMBOL, ',');
const index = this.parseExpression();
this.expect(TokenType.SYMBOL, ')');
return { type: 'Reply', target, file, index };
}

const value = this.parseExpression();
return { type: 'Reply', target, value };
}

// Lookahead: "(" IDENT "." IDENT "," ... — só a forma de ficheiro
// tem "." logo a seguir ao primeiro identificador dentro dos
// parênteses. Uma chamada de função normal, ex: (NOW()), nunca
// bate aqui.
isReplyFileForm() {
if (!this.at(TokenType.SYMBOL, '(')) return false;
const next = this.tokens[this.pos + 1];
const afterNext = this.tokens[this.pos + 2];
return !!next && next.type === TokenType.IDENT &&
!!afterNext && afterNext.type === TokenType.SYMBOL && afterNext.value === '.';
}

// ---- FORWARD TO "contacto" ----

parseForward() {
this.expectKeyword('FORWARD');
this.expectKeyword('TO');
const target = this.parseExpression();
return { type: 'ForwardTo', target };
}

// ---- PARSE SIGNAL ----

parseParseSignal() {
this.expectKeyword('PARSE');
if (!this.atWord('SIGNAL')) this.error('expected SIGNAL after PARSE');
this.advance();
return { type: 'ParseSignal' };
}

// ---- SEND TO destino ----

parseSend() {
this.expectKeyword('SEND');
this.expectKeyword('TO');
const target = this.advance().value;
return { type: 'SendTo', target };
}

// ---- INSERT INTO tabela [(cols)] [VALUES (vals)] ----

parseInsert() {
this.expectKeyword('INSERT');
this.expectKeyword('INTO');
const table = this.expect(TokenType.IDENT).value;

let columns = null;
if (this.at(TokenType.SYMBOL, '(')) {
columns = this.parseExpressionList();
}

let values = null;
if (this.atKeyword('VALUES')) {
this.advance();
values = this.parseExpressionList();
}

return { type: 'Insert', table, columns, values };
}

parseExpressionList() {
this.expect(TokenType.SYMBOL, '(');
const items = [];
while (!this.at(TokenType.SYMBOL, ')')) {
items.push(this.parseExpression());
if (this.at(TokenType.SYMBOL, ',')) this.advance();
}
this.expect(TokenType.SYMBOL, ')');
return items;
}

// ---- UPDATE tabela SET col = expr WHERE expr ----

parseUpdate() {
this.expectKeyword('UPDATE');
const table = this.expect(TokenType.IDENT).value;
this.expectKeyword('SET');
const column = this.expect(TokenType.IDENT).value;
this.expect(TokenType.SYMBOL, '=');
const value = this.parseExpression();

let where = null;
if (this.atKeyword('WHERE')) {
this.advance();
where = this.parseComparison();
}

return { type: 'Update', table, set: { column, value }, where };
}

// ---- IMPORT {ficheiro.sql} ----
// ---- IMPORT {ficheiro.txt, N} ----
// ---- IMPORT {ficheiro.txt, N} AS alias ----
//
// A segunda forma importa só a entrada N de um ficheiro de valores
// (o mesmo formato "N- texto" usado por REPLY (ficheiro, N)), em vez
// do ficheiro inteiro. O índice é opcional, tal como em REPLY.
//
// AS alias só faz sentido junto com o índice (dá nome ao valor lido,
// para CONNECT RESPONSE/Response(...) e qualquer outra expressão
// referenciarem por esse nome em vez do nome generico "env"). Sem AS,
// mantém-se o comportamento original: o valor cai em env.NOME_FICHEIRO.

parseImport() {
this.expectKeyword('IMPORT');
this.expect(TokenType.SYMBOL, '{');
const path = this.parseFileName();
let index = null;
if (this.at(TokenType.SYMBOL, ',')) {
this.advance();
index = this.parseExpression();
}
this.expect(TokenType.SYMBOL, '}');

let alias = null;
if (this.atKeyword('AS')) {
this.advance();
alias = this.expect(TokenType.IDENT).value;
}

return { type: 'Import', path, index, alias };
}

// ---- RUN BOT ----

parseRunBot() {
this.expectKeyword('RUN');
this.expectKeyword('BOT');
return { type: 'RunBot' };
}

// ---- Expressões: literais, identificadores, chamadas, acesso a
// propriedade (obj.prop) e concatenação com "+" ----

parseExpression() {
let node = this.parsePrimary();
while (this.at(TokenType.SYMBOL, '+')) {
this.advance();
const right = this.parsePrimary();
node = { type: 'Binary', op: '+', left: node, right };
}
return node;
}

// Igualdade, usada em WHERE (ex: id = LAST_INSERT_ID())
parseComparison() {
const left = this.parseExpression();
if (this.at(TokenType.SYMBOL, '=')) {
this.advance();
const right = this.parseExpression();
return { type: 'Binary', op: '=', left, right };
}
return left;
}

parsePrimary() {
const tok = this.current();

if (tok.type === TokenType.STRING) {
this.advance();
return { type: 'Literal', value: tok.value };
}

if (tok.type === TokenType.NUMBER) {
this.advance();
return { type: 'Literal', value: tok.value };
}

if (tok.type === TokenType.IDENT) {
this.advance();
let node = { type: 'Identifier', name: tok.value };

// Chamada de função: NOME(...)
if (this.at(TokenType.SYMBOL, '(')) {
const args = this.parseExpressionList();
node = { type: 'Call', callee: node.name, args };
}

// Acesso a propriedade: NOME.CAMPO (ex: SIGNAL.PAIR)
while (this.at(TokenType.SYMBOL, '.')) {
this.advance();
const prop = this.expect(TokenType.IDENT).value;
node = { type: 'Member', object: node, property: prop };
}

return node;
}

this.error('invalid expression');
}
}

module.exports = { Parser, Tokenizer, TokenType, KEYWORDS };