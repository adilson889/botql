'use strict';

/**
* RAG.js — Retrieval local sobre ficheiros de conhecimento .txt
*
* Usado pelo REPLY THINK(ficheiro.txt): não liga a nenhuma IA, não sai da
* máquina, não usa embeddings nem rede. É recuperação de texto por
* múltiplos sinais combinados, todos calculáveis localmente:
*
*   1. BM25 — pesa cada palavra da mensagem pela raridade dela no
*      ficheiro (uma palavra rara que aparece é mais decisiva que uma
*      comum), e satura a contagem (a 5ª repetição da mesma palavra já
*      conta pouco mais que a 4ª).
*   2. Stemming leve em português — normaliza plurais e sufixos comuns
*      ("produtos" e "produto" contam como a mesma palavra) para não
*      perder pontos só por causa de flexão gramatical.
*   3. Bónus de frase exata — se um pedaço de 2+ palavras da mensagem
*      aparece tal e qual no bloco, isso conta mais do que as mesmas
*      palavras espalhadas e desconexas.
*   4. Tolerância a erros de escrita — uma palavra da mensagem que não
*      bate em nada mas está a 1-2 letras de distância de uma palavra do
*      bloco (Levenshtein) ainda conta, com peso reduzido.
*   5. Confiança normalizada (0 a 1) — para o `.sql` poder decidir, por
*      exemplo, só usar a resposta se a confiança for superior a 0.3, e
*      cair no OTHERWISE caso contrário.
*
* O que isto NÃO é: compreensão de linguagem. Não percebe sinónimos que
* não partilhem raiz nem letras parecidas ("horas" e "horário" continuam
* a ser tratadas como palavras diferentes — são raízes diferentes, não
* uma questão de sufixo). Para esses casos, o parâmetro `synonyms` (ver
* KnowledgeIndex) permite ligar manualmente um termo a outro.
*
* Formato do ficheiro de conhecimento: blocos de texto livre, separados
* por uma linha em branco.
*
* Uso:
*   const { KnowledgeIndex } = require('./RAG.js');
*   const index = new KnowledgeIndex(textoDoFicheiro);
*   const resultado = index.search('vocês entregam fora de Luanda?');
*   // { text: '...', score: 3.4, confidence: 0.77, index: 2 }
*   // ou null se a mensagem não partilhar nada com nenhum bloco
*/

const STOPWORDS = new Set([
'a', 'o', 'as', 'os', 'de', 'da', 'do', 'das', 'dos', 'e', 'ou',
'que', 'um', 'uma', 'uns', 'umas', 'em', 'no', 'na', 'nos', 'nas',
'por', 'para', 'com', 'sem', 'se', 'foi', 'ser', 'sao', 'esta',
'estao', 'ao', 'aos', 'mas', 'como', 'tem', 'ter', 'nao',
'sim', 'meu', 'minha', 'seu', 'sua', 'eu', 'tu', 'ele', 'ela',
'nos', 'vos', 'eles', 'elas', 'isso', 'isto', 'aquilo', 'quando',
'onde', 'porque', 'qual', 'quais', 'muito', 'muita', 'ja', 'so'
]);

// ===== Normalização e stemming leve (PT) =====

function normalizar(texto) {
return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// Stemmer conservador: só remove sufixos muito regulares e de baixo risco
// de juntar palavras que não deviam ("produtos" -> "produto" é seguro;
// não tenta reduzir verbos a infinitivo, porque isso erra fácil e junta
// palavras com sentidos diferentes).
const SUFIXOS_ADJETIVO_ADVERBIO = ['issimamente', 'issimo', 'issima', 'mente'];
const SUFIXOS_NOMINALIZACAO = ['acoes', 'acao', 'imentos', 'imento', 'idades', 'idade'];

function stem(palavra) {
let p = palavra;

for (const suf of SUFIXOS_ADJETIVO_ADVERBIO) {
if (p.length > suf.length + 3 && p.endsWith(suf)) {
p = p.slice(0, -suf.length);
break;
}
}
for (const suf of SUFIXOS_NOMINALIZACAO) {
if (p.length > suf.length + 3 && p.endsWith(suf)) {
p = p.slice(0, -suf.length);
break;
}
}
// Plural regular: "produtos" -> "produto", "entregas" -> "entrega".
if (p.length > 4 && p.endsWith('s') && !p.endsWith('ns')) {
p = p.slice(0, -1);
}
return p;
}

function tokenizar(texto) {
return normalizar(texto)
.toLowerCase()
.replace(/[^a-z0-9\s]/g, ' ')
.split(/\s+/)
.filter((palavra) => palavra.length > 1 && !STOPWORDS.has(palavra))
.map(stem);
}

// ===== Distância de edição (Levenshtein), para tolerar erros de escrita =====

function distanciaEdicao(a, b) {
if (a === b) return 0;
const la = a.length;
const lb = b.length;
if (la === 0) return lb;
if (lb === 0) return la;

let linhaAnterior = new Array(lb + 1);
for (let j = 0; j <= lb; j++) linhaAnterior[j] = j;

for (let i = 1; i <= la; i++) {
const linhaAtual = [i];
for (let j = 1; j <= lb; j++) {
const custo = a[i - 1] === b[j - 1] ? 0 : 1;
linhaAtual[j] = Math.min(
linhaAtual[j - 1] + 1,
linhaAnterior[j] + 1,
linhaAnterior[j - 1] + custo
);
}
linhaAnterior = linhaAtual;
}
return linhaAnterior[lb];
}

function distanciaMaximaTolerada(tamanho) {
if (tamanho <= 4) return 0;
if (tamanho <= 7) return 1;
return 2;
}

// ===== BM25 =====

const BM25_K1 = 1.5;
const BM25_B = 0.75;

const PESO_BM25 = 1;
const PESO_FRASE = 2.5;
const PESO_FUZZY = 0.4;

// ===== Limiares do DecisionEngine (usados só em analyze(), não em search()) =====

// confidence minima para considerar RESPONDER direto
const CONFIANCA_ALTA = 0.55;
// abaixo disto, mesmo sem concorrente, e considerado ruido -> UNKNOWN
const CONFIANCA_MINIMA = 0.15;
// margem relativa minima entre 1o e 2o colocado: quanto o melhor precisa
// estar na frente do segundo (em % do proprio score) para ser decisivo.
// margem baixa = os dois blocos disputam a resposta -> REANALISAR
const MARGEM_MINIMA = 0.12;

// similaridade (Jaccard sobre tokens) a partir da qual dois blocos
// concorrentes sao considerados "o mesmo conteudo, dito duas vezes"
// -> nesse caso nao ha o que unir, so responde com o melhor tal como esta
const SIMILARIDADE_DUPLICADA = 0.75;

// ===== Deteção de entidades simples (nomes proprios) para a fusão =====
//
// Heuristica propositalmente simples (sem NER de verdade): uma palavra
// capitalizada que não é a primeira da frase é tratada como nome próprio
// (local, produto, pessoa). Funciona bem para o caso comum de FAQs
// ("entregamos em Luanda" / "entregamos no Huambo"), mas não é infalível
// — frases com mais de um nome próprio, ou sem nenhum, simplesmente não
// entram no caminho de fusão (ver _tentarUnir).

function extrairNomesProprios(texto) {
const palavras = texto.split(/\s+/);
const encontrados = [];
for (let i = 1; i < palavras.length; i++) {
const limpa = palavras[i].replace(/^[(["']+|[.,;:!?)\]"']+$/g, '');
if (/^[A-ZÀ-Ý][a-zà-ÿ]+$/.test(limpa)) {
encontrados.push(limpa);
}
}
return encontrados;
}

class KnowledgeIndex {
/**
* @param {string} sourceText Conteúdo do ficheiro de conhecimento.
* @param {Object} [options]
* @param {Record<string,string>} [options.synonyms] Mapa de termo -> termo
*   canónico, para ligar manualmente palavras que o stemmer não junta
*   sozinho (ex: { horas: 'horario' }).
*/
constructor(sourceText, options = {}) {
this.synonyms = {};
for (const [de, para] of Object.entries(options.synonyms || {})) {
this.synonyms[stem(normalizar(de.toLowerCase()))] = stem(normalizar(para.toLowerCase()));
}

this.blocks = KnowledgeIndex.parseBlocks(sourceText);
this._buildIndex();
}

static parseBlocks(sourceText) {
return sourceText
.split(/\n\s*\n/)
.map((bloco) => bloco.trim())
.filter((bloco) => bloco.length > 0);
}

_aplicarSinonimos(tokens) {
return tokens.map((t) => this.synonyms[t] || t);
}

_buildIndex() {
this.docs = this.blocks.map((bloco) => tokenizar(bloco));
this.docTextNormalizado = this.blocks.map((bloco) => normalizar(bloco).toLowerCase());

this.docFreq = new Map();
this.vocabulario = new Set();
for (const tokens of this.docs) {
const vistas = new Set(tokens);
for (const palavra of vistas) {
this.docFreq.set(palavra, (this.docFreq.get(palavra) || 0) + 1);
this.vocabulario.add(palavra);
}
}
this.listaVocabulario = Array.from(this.vocabulario);

this.totalDocs = this.docs.length;
this.avgDocLen = this.totalDocs === 0
? 0
: this.docs.reduce((soma, tokens) => soma + tokens.length, 0) / this.totalDocs;
}

_idf(palavra) {
const n = this.docFreq.get(palavra) || 0;
if (n === 0) return 0;
return Math.log(1 + (this.totalDocs - n + 0.5) / (n + 0.5));
}

_termoMaisProximo(termo) {
const tolerancia = distanciaMaximaTolerada(termo.length);
if (tolerancia === 0) return null;

let melhor = null;
let melhorDist = tolerancia + 1;
for (const candidato of this.listaVocabulario) {
if (Math.abs(candidato.length - termo.length) > tolerancia) continue;
const d = distanciaEdicao(termo, candidato);
if (d < melhorDist) {
melhorDist = d;
melhor = candidato;
}
}
return melhorDist <= tolerancia ? melhor : null;
}

_scoreBM25(queryTokens, docIndex) {
const tokens = this.docs[docIndex];
if (tokens.length === 0) return 0;

const termFreq = new Map();
for (const t of tokens) termFreq.set(t, (termFreq.get(t) || 0) + 1);

let score = 0;
for (const termo of queryTokens) {
let tf = termFreq.get(termo) || 0;
let idf = this._idf(termo);
let peso = 1;

if (tf === 0) {
const proximo = this._termoMaisProximo(termo);
if (proximo === null) continue;
tf = termFreq.get(proximo) || 0;
if (tf === 0) continue;
idf = this._idf(proximo);
peso = PESO_FUZZY;
}

const numerador = tf * (BM25_K1 + 1);
const denominador = tf + BM25_K1 * (1 - BM25_B + BM25_B * (tokens.length / this.avgDocLen));
score += peso * idf * (numerador / denominador);
}
return score;
}

_bonusFrase(message, docIndex) {
const msgNorm = normalizar(message).toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
const palavras = msgNorm.split(/\s+/).filter((p) => p.length > 1);
if (palavras.length < 2) return 0;

const textoBloco = this.docTextNormalizado[docIndex];
let bonus = 0;

for (let tamanho = Math.min(6, palavras.length); tamanho >= 2; tamanho--) {
for (let i = 0; i + tamanho <= palavras.length; i++) {
const frase = palavras.slice(i, i + tamanho).join(' ');
if (textoBloco.includes(frase)) {
bonus += tamanho * tamanho;
}
}
}
return bonus;
}

_scoreDoc(message, queryTokens, docIndex) {
const bm25 = this._scoreBM25(queryTokens, docIndex);
const frase = this._bonusFrase(message, docIndex);
return PESO_BM25 * bm25 + PESO_FRASE * frase;
}

// Calcula o score de todos os blocos para a mensagem e devolve ordenado
// do maior para o menor. Base partilhada por search() e analyze().
_rankTodos(message) {
const queryTokens = this._aplicarSinonimos(tokenizar(message));
if (queryTokens.length === 0) return [];

const resultados = [];
for (let i = 0; i < this.totalDocs; i++) {
resultados.push({ index: i, score: this._scoreDoc(message, queryTokens, i) });
}
resultados.sort((a, b) => b.score - a.score);
return resultados;
}

/**
* Procura o bloco mais relevante para a mensagem recebida.
*
* @returns {{text: string, score: number, confidence: number, index: number} | null}
*   `confidence` está sempre entre 0 e 1 — não é probabilidade
*   estatística real, é uma escala interpretável para decidir um
*   limiar no `.sql` (ex: "só responde se confidence > 0.3").
*/
search(message) {
if (this.totalDocs === 0) return null;

const ranking = this._rankTodos(message);
if (ranking.length === 0) return null;

const melhor = ranking[0];
if (melhor.score <= 0) return null;

return {
text: this.blocks[melhor.index],
score: melhor.score,
confidence: melhor.score / (melhor.score + 3),
index: melhor.index
};
}

// Jaccard sobre os tokens (já com stem aplicado) de dois blocos já
// indexados. Usado só pra detetar "mesmo conteúdo repetido" (valor
// alto) — dois blocos sobre o mesmo assunto mas com detalhes
// diferentes normalmente NÃO têm jaccard alto (a maior parte da frase
// difere), por isso não serve pra decidir se vale a pena tentar unir.
_similaridadeBlocos(indexA, indexB) {
const a = new Set(this.docs[indexA]);
const b = new Set(this.docs[indexB]);
if (a.size === 0 || b.size === 0) return 0;
let intersecao = 0;
for (const t of a) if (b.has(t)) intersecao++;
const uniao = a.size + b.size - intersecao;
return uniao === 0 ? 0 : intersecao / uniao;
}

// Quantos tokens (com stem) os dois blocos partilham, em termos
// absolutos. Usado como gatilho pra tentar unir: basta partilharem UM
// termo de assunto ("entregamos") — quem garante que a fusão é segura
// não é isto, é a regra de "exatamente um nome próprio diferente em
// cada bloco" dentro de _tentarUnir.
_termosPartilhados(indexA, indexB) {
const a = new Set(this.docs[indexA]);
const b = this.docs[indexB];
let count = 0;
for (const t of b) if (a.has(t)) count++;
return count;
}

// Compara dois blocos concorrentes pelo nome próprio que cada um
// menciona, pra decidir se são "a mesma informação" ou "informação
// complementar que dá pra unir":
//   - mesmo nome próprio nos dois (ex: os dois falam de Luanda)
//     -> { tipo: 'duplicado' }: é a mesma coisa dita de formas
//     diferentes, não há o que unir, usa qualquer um dos dois
//   - nomes próprios diferentes (ex: Luanda vs Huambo)
//     -> { tipo: 'unido', texto: '...' }: funde numa frase só
//   - não dá pra identificar com segurança (nenhum nome próprio, ou
//     mais de um em algum dos blocos) -> null: quem chama decide o
//     que fazer a seguir (normalmente: reanalisar, ou cair no fallback)
_tentarUnir(textoA, textoB) {
const entidadesA = extrairNomesProprios(textoA);
const entidadesB = extrairNomesProprios(textoB);

if (entidadesA.length !== 1 || entidadesB.length !== 1) return null;

const entidadeA = entidadesA[0];
const entidadeB = entidadesB[0];

if (normalizar(entidadeA).toLowerCase() === normalizar(entidadeB).toLowerCase()) {
return { tipo: 'duplicado' };
}

// usa a primeira palavra do bloco de maior score como a "ação" comum
// (ex: "Entregamos"), assumindo que é o verbo que abre a frase
const primeiraPalavra = textoA.trim().split(/\s+/)[0].replace(/[.,;:!?]+$/, '');

return { tipo: 'unido', texto: `${primeiraPalavra} em vários lugares, como ${entidadeA} e ${entidadeB}.` };
}

// Segunda tentativa de ranking, usada só quando a primeira ficou
// ambígua: descarta metade dos termos da query (os de menor IDF, ou
// seja, os mais genéricos/comuns) e refaz o ranking só com os termos
// mais raros/decisivos. Uma query mais focada às vezes desempata o
// que uma query "cheia" deixa embolado.
_reanalisarFocado(message) {
const tokens = this._aplicarSinonimos(tokenizar(message));
if (tokens.length <= 2) return null; // já é curta, não dá pra focar mais

const comIdf = tokens.map((t) => ({ termo: t, idf: this._idf(t) }));
comIdf.sort((a, b) => b.idf - a.idf);
const focados = comIdf.slice(0, Math.max(1, Math.ceil(tokens.length / 2))).map((x) => x.termo);

const resultados = [];
for (let i = 0; i < this.totalDocs; i++) {
resultados.push({ index: i, score: this._scoreDoc(message, focados, i) });
}
resultados.sort((a, b) => b.score - a.score);
return resultados;
}

/**
* Versão completa da busca: além do melhor bloco, avalia a evidência
* (melhor x segundo colocado) e devolve uma decisão explícita, em vez
* de deixar o `.sql` decidir tudo com um único limiar de confidence.
*
* EvidenceEvaluator: compara o melhor resultado com o segundo. Se os
* dois estão muito próximos, o motor não tem certeza de qual bloco
* responde à pergunta — mesmo que o score absoluto seja alto.
*
* ConfidenceEngine: mesma fórmula de sempre (score / (score + 3)),
* aplicada só ao melhor resultado.
*
* DecisionEngine: cruza confidence com margem para decidir entre:
*   - RESPONDER    confidence alta e o melhor bloco se destaca do 2o,
*                  OU os dois concorrentes foram reconciliados (ver
*                  abaixo) — nesse caso `texto` já vem pronto pra usar
*   - REANALISAR   os blocos concorrentes são sobre assuntos diferentes
*                  demais pra reconciliar, e nem a retentativa focada
*                  resolveu — o `.sql` decide o que fazer (normalmente
*                  cair no fallback do OR REPLY)
*   - UNKNOWN      confidence baixa demais, não há bloco que sirva
*
* Reconciliação (só entra quando o resultado não é decisivo de cara):
*   1. Se o melhor e o segundo colocado são basicamente o mesmo
*      conteúdo (alta similaridade) — não há nada pra unir, usa o
*      melhor tal como está.
*   2. Se são blocos diferentes mas do mesmo assunto, e cada um tem
*      exatamente um nome próprio diferente (ex: "entregamos em
*      Luanda" / "entregamos no Huambo") — tenta fundir numa frase só
*      ("entregamos em vários lugares, como Luanda e Huambo").
*   3. Se nada disso se aplica, tenta de novo com uma versão mais
*      enxuta da pergunta (só os termos mais decisivos) antes de
*      desistir.
*
* @returns {{
*   decision: 'RESPONDER'|'REANALISAR'|'UNKNOWN',
*   confidence: number,
*   margem: number,
*   texto: string | null,
*   unificado: boolean,
*   reanalisado: boolean,
*   melhor: {text: string, score: number, index: number} | null,
*   segundo: {text: string, score: number, index: number} | null
* }}
*/
analyze(message) {
const vazio = { decision: 'UNKNOWN', confidence: 0, margem: 0, texto: null, unificado: false, reanalisado: false, melhor: null, segundo: null };
if (this.totalDocs === 0) return vazio;

const ranking = this._rankTodos(message);
if (ranking.length === 0 || ranking[0].score <= 0) return vazio;

const melhor = ranking[0];
const segundo = ranking[1] || { index: -1, score: 0 };

const margem = (melhor.score - segundo.score) / melhor.score;
const confidence = melhor.score / (melhor.score + 3);

const melhorInfo = { text: this.blocks[melhor.index], score: melhor.score, index: melhor.index };
const segundoInfo = segundo.index >= 0
? { text: this.blocks[segundo.index], score: segundo.score, index: segundo.index }
: null;

if (confidence < CONFIANCA_MINIMA) return vazio;

if (confidence >= CONFIANCA_ALTA && margem >= MARGEM_MINIMA) {
return {
decision: 'RESPONDER', confidence, margem, texto: melhorInfo.text,
unificado: false, reanalisado: false, melhor: melhorInfo, segundo: segundoInfo
};
}

// zona ambígua: melhor e segundo disputam a resposta
if (segundoInfo) {
const similaridade = this._similaridadeBlocos(melhor.index, segundo.index);

if (similaridade >= SIMILARIDADE_DUPLICADA) {
// mesmo conteúdo, dito de duas formas — mantém a frase igual
return {
decision: 'RESPONDER', confidence, margem, texto: melhorInfo.text,
unificado: false, reanalisado: false, melhor: melhorInfo, segundo: segundoInfo
};
}

const termosPartilhados = this._termosPartilhados(melhor.index, segundo.index);
if (termosPartilhados >= 1) {
const resultado = this._tentarUnir(melhorInfo.text, segundoInfo.text);
if (resultado && resultado.tipo === 'duplicado') {
return {
decision: 'RESPONDER', confidence, margem, texto: melhorInfo.text,
unificado: false, reanalisado: false, melhor: melhorInfo, segundo: segundoInfo
};
}
if (resultado && resultado.tipo === 'unido') {
return {
decision: 'RESPONDER', confidence, margem, texto: resultado.texto,
unificado: true, reanalisado: false, melhor: melhorInfo, segundo: segundoInfo
};
}
}
}

// nem duplicado nem fundível: tenta de novo com a query mais focada
const tentativa2 = this._reanalisarFocado(message);
if (tentativa2 && tentativa2.length > 0 && tentativa2[0].score > 0) {
const melhor2 = tentativa2[0];
const segundo2 = tentativa2[1] || { index: -1, score: 0 };
const margem2 = (melhor2.score - segundo2.score) / melhor2.score;
const confidence2 = melhor2.score / (melhor2.score + 3);

if (confidence2 >= CONFIANCA_ALTA && margem2 >= MARGEM_MINIMA) {
return {
decision: 'RESPONDER', confidence: confidence2, margem: margem2,
texto: this.blocks[melhor2.index], unificado: false, reanalisado: true,
melhor: { text: this.blocks[melhor2.index], score: melhor2.score, index: melhor2.index },
segundo: segundo2.index >= 0
? { text: this.blocks[segundo2.index], score: segundo2.score, index: segundo2.index }
: null
};
}
}

return {
decision: 'REANALISAR', confidence, margem, texto: null,
unificado: false, reanalisado: false, melhor: melhorInfo, segundo: segundoInfo
};
}
}

class KnowledgeCache {
constructor(fileSystem) {
this.fileSystem = fileSystem;
this.cache = new Map();
}

get(resolvedPath, options) {
if (this.cache.has(resolvedPath)) return this.cache.get(resolvedPath);

if (!this.fileSystem.exists(resolvedPath)) {
throw new Error(`BotQL/THINK: ficheiro de conhecimento não encontrado: "${resolvedPath}"`);
}

const texto = this.fileSystem.readFile(resolvedPath);
const index = new KnowledgeIndex(texto, options);
this.cache.set(resolvedPath, index);
return index;
}
}

module.exports = { KnowledgeIndex, KnowledgeCache, tokenizar, normalizar, stem, distanciaEdicao };