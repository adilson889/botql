'use strict';

const path = require('path');

/**
 * ConnectorRegistry — resolve o nome de uma plataforma (ex: "TELEGRAM")
 * para o módulo que sabe falar a API real dessa plataforma.
 *
 * O registry NÃO tenta cobrir todas as plataformas existentes — só regista
 * as que o próprio projeto usa, tal como o xlang-modules.json faz para
 * bibliotecas. Uma plataforma sem entrada dá erro claro, não falha
 * silenciosa.
 *
 * O mapeamento plataforma -> ficheiro vive em Connectors.json (JSON puro,
 * sem lógica), esta classe é que sabe carregar e instanciar esses ficheiros.
 */
class ConnectorRegistry {
    constructor(registryPathOrObject = path.join(__dirname, 'Connectors.json')) {
        if (typeof registryPathOrObject === 'string') {
            this.baseDir = path.dirname(path.resolve(registryPathOrObject));
            this.registry = { ...require(path.resolve(registryPathOrObject)) };
        } else {
            this.baseDir = __dirname;
            this.registry = { ...registryPathOrObject };
        }
        this.cache = new Map();
    }

    // Regista/substitui uma plataforma em runtime. Aceita:
    //  - uma função factory: (credential) => connector
    //  - o caminho (string) para um módulo que exporta essa factory
    register(platform, moduleOrFactory) {
        this.registry[platform] = typeof moduleOrFactory === 'function'
            ? { factory: moduleOrFactory }
            : moduleOrFactory;
    }

    resolve(platform, credential) {
        const entry = this.registry[platform];
        if (!entry) {
            throw new Error(
                `BotQL: nenhum connector registado para a plataforma "${platform}". ` +
                `Regista-a em Connectors.json ou via registry.register("${platform}", adapter).`
            );
        }

        const cacheKey = `${platform}:${credential}`;
        if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

        // entry pode ser: string (caminho de módulo), ou { factory } vindo de register().
        const factory = typeof entry === 'string'
            ? require(path.resolve(this.baseDir, entry))
            : entry.factory || require(path.resolve(this.baseDir, entry.module));

        const connector = factory(credential);
        this.cache.set(cacheKey, connector);
        return connector;
    }
}

/**
 * Liga um BotQLInterpreter já carregado a esta registry: para cada
 * CONNECT registado no bot, resolve o connector real e passa a usá-lo
 * como destino de REPLY / FORWARD TO / SEND TO para essa plataforma.
 *
 * Chamadas manuais a onReply/onForward/onSend passadas nas opções do
 * interpreter continuam a ter prioridade — isto só preenche o que não
 * foi definido à mão (onReply/onForward/onSend ficam `null` no
 * interpreter enquanto não forem definidos, ver botql.js).
 */
function attachConnectors(interpreter, registry) {
    const byService = new Map();
    for (const conn of interpreter.connections) {
        byService.set(conn.service, registry.resolve(conn.service, conn.credential));
    }

    const platformConnector = interpreter.platform ? byService.get(interpreter.platform) : null;

    if (!interpreter.onReply) {
        interpreter.onReply = async ({ target, text, client }) => {
            const connector = platformConnector || byService.get('ADMIN');
            if (!connector) return;
            await connector.send(target || client, text);
        };
    }

    if (!interpreter.onForward) {
        interpreter.onForward = async ({ target, client }) => {
            if (!platformConnector) return;
            await platformConnector.send(target, `Encaminhado de ${client}`);
        };
    }

    if (!interpreter.onSend) {
        interpreter.onSend = async ({ target, signal }) => {
            const connector = byService.get(target);
            if (!connector) return;
            await connector.send(target, JSON.stringify(signal));
        };
    }

    return interpreter;
}

module.exports = { ConnectorRegistry, attachConnectors };
