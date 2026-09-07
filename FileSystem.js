'use strict';

/**
 * FileSystem.js — Acesso a ficheiros isomorfico (Node ou browser)
 *
 * botql.js precisa de ler ficheiros para resolver IMPORT. Em Node isso e
 * fs.readFileSync + path real. No browser (ou em qualquer ambiente sem
 * fs), nao ha disco: os "ficheiros" sao apenas texto que o utilizador
 * forneceu antecipadamente (ex: nos campos de import do editor).
 *
 * Qualquer adapter aqui implementa o mesmo contrato, usado por botql.js:
 *   exists(path) -> boolean
 *   readFile(path) -> string
 *   resolve(basePath, relativePath) -> string (caminho absoluto/canonico)
 *   dirname(path) -> string
 *
 * NodeFileSystem: usa fs/path reais do Node. E o omissao quando o codigo
 * corre em Node (Bootstrap.js, CLI, testes).
 *
 * MemoryFileSystem: guarda ficheiros num Map (caminho -> conteudo) em
 * memoria. Usado no browser: o Index.html regista ai o conteudo de cada
 * ficheiro importado antes de correr o bot. Os caminhos sao tratados como
 * chaves de texto simples, normalizadas (sem "./", sem duplicar "/").
 */

class MemoryFileSystem {
    constructor(files = {}) {
        // files: { "caminho/ficheiro.sql": "conteudo..." }
        this.files = new Map(
            Object.entries(files).map(([k, v]) => [this._normalize(k), v])
        );
    }

    _normalize(p) {
        // Remove "./" do inicio e barras duplicadas, mantem caminho relativo simples.
        return String(p).replace(/^\.\//, '').replace(/\/+/g, '/').trim();
    }

    setFile(path, content) {
        this.files.set(this._normalize(path), content);
    }

    exists(path) {
        return this.files.has(this._normalize(path));
    }

    readFile(path) {
        const key = this._normalize(path);
        if (!this.files.has(key)) {
            throw new Error(`BotQL: ficheiro não encontrado: "${path}"`);
        }
        return this.files.get(key);
    }

    // basePath e' ignorado de proposito: no browser nao ha nocao real de
    // diretorio corrente, os ficheiros importados sao identificados pelo
    // nome/caminho tal como o utilizador os registou.
    resolve(basePath, relativePath) {
        return this._normalize(relativePath);
    }

    dirname(filePath) {
        const norm = this._normalize(filePath);
        const idx = norm.lastIndexOf('/');
        return idx === -1 ? '' : norm.slice(0, idx);
    }
}

class NodeFileSystem {
    constructor() {
        this._fs = require('fs');
        this._path = require('path');
    }

    exists(path) {
        return this._fs.existsSync(path);
    }

    readFile(path) {
        return this._fs.readFileSync(path, 'utf8');
    }

    resolve(basePath, relativePath) {
        return this._path.resolve(basePath, relativePath);
    }

    dirname(filePath) {
        return this._path.dirname(filePath);
    }
}

// Deteta o ambiente uma unica vez. `require` e `module` so existem em Node/CommonJS.
const isNode = typeof process !== 'undefined'
    && process.versions
    && !!process.versions.node;

function createDefaultFileSystem() {
    return isNode ? new NodeFileSystem() : new MemoryFileSystem();
}

const api = { MemoryFileSystem, NodeFileSystem, createDefaultFileSystem };

if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
} else {
    // Browser sem bundler/CommonJS: expõe global.
    this.BotQLFileSystem = api;
}
