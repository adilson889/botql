'use strict';

/**
 * Modo BotQL para CodeMirror 5 (addon/mode/simple.js).
 *
 * Usa exatamente a mesma lista de keywords do Parser.js (KEYWORDS),
 * para nunca desalinhar highlight vs. sintaxe real aceite pelo parser.
 *
 * Uso (depois de incluir codemirror.js, mode/sql/sql.js NÃO é necessário,
 * e addon/mode/simple.js):
 *
 *   <script src="codemirror.js"></script>
 *   <script src="addon/mode/simple.js"></script>
 *   <script src="botql-mode.js"></script>
 *
 *   const editor = CodeMirror(document.body, {
 *       mode: "botql",
 *       theme: "default"
 *   });
 */

// Mesma lista do Parser.js — SQL real (CREATE, INSERT, UPDATE, ...)
// e BotQL (ON, WHEN, REPLY, ...) juntas, porque highlight não separa
// os dois mundos: é uma linguagem só.
const BOTQL_KEYWORDS = [
    'CREATE', 'BOT', 'PLATFORM', 'CONNECT', 'TABLE', 'PREVENT', 'DEFAULT',
    'ON', 'START', 'MESSAGE', 'FROM',
    'WHEN', 'CONTAINS', 'OR', 'OTHERWISE',
    'REPLY', 'TO', 'FORWARD', 'PARSE', 'SEND',
    'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'WHERE',
    'IMPORT', 'RUN'
];

// Palavras especiais que merecem cor própria por serem "mágicas"
// no interpreter (botql.js), não por serem sintaxe da gramática.
const BOTQL_BUILTINS = ['Context', 'NOW', 'LAST_INSERT_ID'];

// Variáveis implícitas do runtime (client, message, lastMsg, SIGNAL).
const BOTQL_VARS = ['client', 'message', 'lastMsg', 'SIGNAL'];

function defineBotQLMode(CodeMirror) {
    const keywordRegex = new RegExp('^(?:' + BOTQL_KEYWORDS.join('|') + ')\\b');
    const builtinRegex = new RegExp('^(?:' + BOTQL_BUILTINS.join('|') + ')\\b');
    const varRegex = new RegExp('^(?:' + BOTQL_VARS.join('|') + ')\\b');

    CodeMirror.defineSimpleMode('botql', {
        start: [
            { regex: /--.*/, token: 'comment' },
            { regex: /"(?:[^"\\]|\\.)*"?/, token: 'string' },
            { regex: /'(?:[^'\\]|\\.)*'?/, token: 'string' },
            { regex: /\b\d+(?:\.\d+)?\b/, token: 'number' },
            { regex: keywordRegex, token: 'keyword' },
            { regex: builtinRegex, token: 'builtin' },
            { regex: varRegex, token: 'variable-2' },
            { regex: /[A-Za-z_]\w*(?=\s*\()/, token: 'variable-2' }, // chamadas: NOME(
            { regex: /[{}]/, token: 'bracket' },
            { regex: /[()]/, token: 'bracket' },
            { regex: /[+=,.]/, token: 'operator' },
            { regex: /[A-Za-z_]\w*/, token: 'variable' }
        ],
        meta: {
            lineComment: '--'
        }
    });
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { defineBotQLMode, BOTQL_KEYWORDS, BOTQL_BUILTINS, BOTQL_VARS };
}
if (typeof window !== 'undefined' && window.CodeMirror) {
    defineBotQLMode(window.CodeMirror);
}
