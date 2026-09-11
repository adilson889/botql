// Local Bot Example
// Run: node local-bot.js

const { createBot } = require('botql');
const readline = require('readline');

(async () => {
    const bot = await createBot('local-bot.sql');

    bot.onReply = ({ text }) => {
        console.log('\nBot:', text);
        rl.prompt();
    };

    bot.onThinking = ({ text }) => {
        process.stdout.write('\nThinking: ' + (text || '...'));
    };

    bot.onForward = ({ target }) => {
        console.log('\n[Forwarded to ' + target + ']');
    };

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: 'You: '
    });

    console.log('=== Local Bot ===');
    console.log('Type a message (Ctrl+C to exit)');
    console.log('Try: hello, price, human, delivery\n');

    rl.prompt();

    rl.on('line', async (line) => {
        const text = line.trim();
        if (!text) {
            rl.prompt();
            return;
        }
        try {
            await bot.receiveMessage('user', text);
        } catch (e) {
            console.log('Error:', e.message);
            rl.prompt();
        }
    });
})();