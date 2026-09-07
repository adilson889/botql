<h1 align="center">
    <span style="background: linear-gradient(90deg, #6C5CE7, #00B894); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 900; font-size: 2.2em;">
        BotQL: Bot Query Language
    </span>
</h1>

<p align="center">
    <a href="https://www.npmjs.com/package/botql">
        <img src="https://img.shields.io/npm/v/botql.svg" alt="npm version">
    </a>
    <a href="https://opensource.org/licenses/MIT">
        <img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT">
    </a>
    <a href="https://github.com/adilson889/botql/pulls">
        <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome">
    </a>
    <a href="https://github.com/adilson889/botql">
        <img src="https://img.shields.io/badge/BotQL-rules%20language-blue.svg" alt="BotQL">
    </a>
    <a href="https://github.com/sponsors/adilson889">
        <img src="https://img.shields.io/badge/Sponsor-%E2%9D%A4-red.svg" alt="Sponsor">
    </a>
</p>

<p align="justify">
    <strong>BotQL</strong> is a simple, SQL-inspired rules language for creating bots without writing traditional code. All commands are written in <strong>UPPERCASE</strong>, and blocks with more than one action use curly braces <code>{ }</code>.
</p>

<p align="justify">
    It lives in <code>.sql</code> files, with real database commands — the bot acts and persists data in the same language, without leaving BotQL. The bot runs locally, on the user's own computer or server, not on third-party managed servers.
</p>

<p align="justify">
    You don't need to know how to code to write BotQL; you just need to know what you want your bot to do.
</p>

---

## Getting Started

Want to learn the full syntax, see all commands, and understand how BotQL works? The complete guide walks you through everything from your first bot to advanced features like local knowledge retrieval and AI integration.

**[Read the full documentation →](docs/GETSTARTED.md)**

---

## Installation

### Node.js

For server-side applications, CLI tools, and any Node.js environment:

```bash
npm install botql
```

```javascript
const { BotQLInterpreter } = require('botql');

const bot = BotQLInterpreter.fromSource(`
CREATE BOT "MyBot"
ON MESSAGE {
    WHEN CONTAINS "hello" REPLY "Hi!"
}
RUN BOT
`);

bot.start();
```

### Browser (CDN)

For websites, web apps, and in-browser editors — no build step required:

```html
<!-- jsDelivr -->
<script src="https://cdn.jsdelivr.net/npm/botql/botql.browser.js"></script>

<!-- unpkg -->
<script src="https://unpkg.com/botql/botql.browser.js"></script>
```

---

## Usage

### JavaScript

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

### JSX (React)

```jsx
import { BotQLInterpreter } from 'botql';

const bot = BotQLInterpreter.fromSource(`
CREATE BOT "ReactBot"
ON MESSAGE {
    WHEN CONTAINS "hello" REPLY "Hello from React!"
}
RUN BOT
`);

bot.start();
```

### TypeScript

```typescript
import { BotQLInterpreter } from 'botql';

const bot = BotQLInterpreter.fromSource(`
CREATE BOT "TSBot"
ON MESSAGE {
    WHEN CONTAINS "hello" REPLY "Hello from TypeScript!"
}
RUN BOT
`);

bot.start();
```

### PHP

```php
<?php
$code = 'CREATE BOT "PHPBot" ON MESSAGE { WHEN CONTAINS "hello" REPLY "Hello!" } RUN BOT';
$response = shell_exec('node -e "' . addslashes($code) . '"');
echo $response;
?>
```

### Python

```python
import subprocess

code = 'CREATE BOT "PythonBot" ON MESSAGE { WHEN CONTAINS "hello" REPLY "Hello!" } RUN BOT'
subprocess.run(['node', '-e', code])
```

---

## Support

If this project helped you, consider supporting:

[![GitHub Sponsors](https://img.shields.io/badge/GitHub%20Sponsors-Donate-pink.svg)](https://github.com/sponsors/adilson889)
[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-Donate-yellow.svg)](https://www.buymeacoffee.com/adilson889)

---

### License

MIT © Adilson C. Rafael
