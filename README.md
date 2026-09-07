
# BotQL: Bot Query Language
<center>

[![npm version](https://img.shields.io/npm/v/botql.svg)](https://www.npmjs.com/package/botql)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/adilson889/botql/pulls)
[![BotQL](https://img.shields.io/badge/BotQL-rules%20language-blue.svg)](https://github.com/adilson889/botql)
</Center>

**BotQL** é uma linguagem de regras simples, inspirada em SQL, para criar bots sem precisar de escrever código tradicional. Todos os comandos são escritos em **MAIÚSCULAS**, e blocos com mais de uma ação usam chaves `{ }`.

Vive no mesmo ficheiro `.sql`, com comandos reais de banco de dados — o bot age e persiste dados na mesma linguagem, sem sair do BotQL. O bot corre localmente, no computador ou servidor do próprio utilizador, e não em servidores geridos por terceiros.

Não precisas de saber programar para escrever BotQL; precisas apenas de saber o que queres que o teu bot faça.

---

## Documentação Completa

Ver **[docs/GETSTARTED.md](docs/GETSTARTED.md)** para o guia completo.

## Instalação

### Node.js

```bash
npm install botql
```

```javascript
const { BotQLInterpreter } = require('botql');

const bot = BotQLInterpreter.fromSource(`
CREATE BOT "MeuBot"
ON MESSAGE {
    WHEN CONTAINS "olá" REPLY "Oi!"
}
RUN BOT
`);

bot.start();
```

Browser (CDN)

```html
<script src="https://cdn.jsdelivr.net/npm/botql@1.0.2/botql.browser.js"></script>
```

Uso

JavaScript

```javascript
const { BotQLInterpreter } = require('botql');

const bot = BotQLInterpreter.fromSource(`
CREATE BOT "JSBot"
ON MESSAGE {
    WHEN CONTAINS "hello" REPLY "Hello!"
}
RUN BOT
`);

bot.start();
bot.receiveMessage('+244900000000', 'hello');
```

JSX (React)

```jsx
import { BotQLInterpreter } from 'botql';

const bot = BotQLInterpreter.fromSource(`
CREATE BOT "ReactBot"
ON MESSAGE {
    WHEN CONTAINS "olá" REPLY "Olá do React!"
}
RUN BOT
`);

bot.start();
```

TypeScript

```typescript
import { BotQLInterpreter } from 'botql';

const bot = BotQLInterpreter.fromSource(`
CREATE BOT "TSBot"
ON MESSAGE {
    WHEN CONTAINS "olá" REPLY "Olá do TypeScript!"
}
RUN BOT
`);

bot.start();
```

PHP

```php
<?php
$codigo = 'CREATE BOT "PHPBot" ON MESSAGE { WHEN CONTAINS "olá" REPLY "Olá!" } RUN BOT';
$resposta = shell_exec('node -e "' . addslashes($codigo) . '"');
echo $resposta;
?>
```

Python

```python
import subprocess

codigo = 'CREATE BOT "PythonBot" ON MESSAGE { WHEN CONTAINS "olá" REPLY "Olá!" } RUN BOT'
subprocess.run(['node', '-e', codigo])
```

---

Licença

MIT © Adilson C. Rafael