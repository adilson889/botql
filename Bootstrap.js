'use strict';

/**
 * Bootstrap.js — ponto de entrada do BotQL.
 *
 * Lê um ficheiro .sql (com suporte a IMPORT), cria o interpreter, liga os
 * connectors reais das plataformas usadas via CONNECT, corre ON START e
 * fica pronto a receber mensagens.
 *
 * Uso:
 *   node Bootstrap.js caminho/para/bot.sql
 *
 * Uso programático:
 *   const { bootstrap } = require('./Bootstrap.js');
 *   const bot = await bootstrap('bot.sql');
 *   await bot.receiveMessage('+244900000000', 'quero comprar');
 */

const path = require('path');
const { BotQLInterpreter } = require('./botql.js');
const { ConnectorRegistry, attachConnectors } = require('./Connectors.js');
const { SQLiteDatabase } = require('./Database.js');

/**
 * @param {string} sqlFilePath Caminho do ficheiro .sql principal do bot.
 * @param {object} options
 * @param {string} [options.dbPath] Caminho do ficheiro .sqlite. Sem isto,
 *   usa MemoryDatabase (sem persistência), que é o omisso do interpreter.
 * @param {string} [options.connectorsPath] Caminho alternativo para o JSON
 *   de connectors. Por omissão usa o Connectors.json ao lado deste ficheiro.
 * @param {boolean} [options.autoStart] Corre ON START automaticamente (omissão: true).
 */
async function bootstrap(sqlFilePath, options = {}) {
    const interpreterOptions = {};
    if (options.dbPath) {
        interpreterOptions.db = new SQLiteDatabase(options.dbPath);
    }

    const bot = BotQLInterpreter.fromFile(sqlFilePath, interpreterOptions);

    const registry = new ConnectorRegistry(
        options.connectorsPath || path.join(__dirname, 'Connectors.json')
    );
    attachConnectors(bot, registry);

    if (options.autoStart !== false) {
        await bot.start();
    }

    return bot;
}

// Execução direta: node Bootstrap.js caminho/bot.sql
if (require.main === module) {
    const sqlFilePath = process.argv[2];
    if (!sqlFilePath) {
        console.error('Uso: node Bootstrap.js caminho/para/bot.sql');
        process.exit(1);
    }

    bootstrap(sqlFilePath)
        .then((bot) => {
            console.log(`BotQL: bot "${bot.botName || '(sem nome)'}" iniciado.`);
            if (!bot.running) {
                console.log('Aviso: o ficheiro não tem "RUN BOT" — o bot foi carregado mas não marcado como em execução.');
            }
        })
        .catch((err) => {
            console.error(err.message);
            process.exit(1);
        });
}

module.exports = { bootstrap };
