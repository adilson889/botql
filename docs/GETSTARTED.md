# BotQL: Bot Query Language

<p align="justify">
<b>BotQL</b> is a simple <b>rules language</b>, inspired by SQL, for creating bots without writing traditional code.
</p>

<p align="justify">
All commands are written in <b>UPPERCASE</b>. Blocks with more than one action use braces <code>{ }</code>.
</p>

<p align="justify">
It lives in the same <code>.sql</code> file, with real database commands — the bot acts and persists data in the same language, without leaving BotQL.
</p>

---

## General Structure

```sql
IMPORT {file.sql}

CREATE BOT "BotName"
PLATFORM <PLATFORM>

CONNECT <SERVICE> <TYPE> "<credential>"

CREATE TABLE <table> (<columns>) [PREVENT DEFAULT] [DEFAULT MESSAGE ...]

ON <EVENT> {
    <ACTION>
    <ACTION>
}

RUN BOT
```

---

## Keywords

| Command | Description |
|---|---|
| `CREATE BOT "name"` | Creates a new bot with the given name |
| `PLATFORM` | Sets the main platform (WHATSAPP, TELEGRAM, DISCORD) |
| `CONNECT` | Links the bot to an external service (channel, account, API) |
| `CONNECT RESPONSE <alias>` | Links the bot to an AI using an already-imported value (token) — only connects, doesn't trigger anything by itself |
| `CREATE TABLE` | Creates a table to store bot data |
| `PREVENT DEFAULT` | `CREATE TABLE` modifier: creates only if it doesn't already exist, no error if it does |
| `DEFAULT MESSAGE` | `CREATE TABLE` modifier: message sent automatically the first time a `client` appears in that table |
| `Context()` | Reserved table name — schema pre-mapped in the interpreter, no need to declare columns |
| `INSERT INTO` | Saves a new row into the table |
| `UPDATE` / `SET` / `WHERE` | Updates an existing row |
| `LAST_INSERT_ID()` | References the id of the last inserted row |
| `ON` | Defines an event that triggers actions |
| `WHERE` | Filters an event or query condition |
| `CONTAINS` | Checks whether a message contains a text (a single word, an inline list, or a `.txt` file — see its own section) |
| `OR` | Combines multiple conditions |
| `WHEN` | Tests a condition inside an `ON MESSAGE` block |
| `OTHERWISE` | Default action when no `WHEN` is satisfied |
| `REPLY` | Sends a text response (direct text or from an indexed file — see its own section) |
| `FORWARD TO` | Forwards the message to another contact/channel |
| `PARSE SIGNAL` | Parses a received signal (e.g. trading signals) |
| `SEND TO` | Sends data/signal to another platform |
| `UNKNOWN` | Event triggered when nothing matches |
| `START` | Event triggered when the bot starts up |
| `RUN BOT` | Starts running the bot |
| `IMPORT {file.sql}` | Imports and merges the content of another `.sql` file before running |
| `IMPORT {file.txt, N}` | Reads only entry N of a value file, without importing code |
| `IMPORT {..., N} AS <alias>` | Names an imported value, so it can be referenced later by the alias |
| `Response()` / `Response(<alias>)` | Triggers the cycle: sends the current message to the connected AI, waits, and returns the response as text. Without an alias, only works with a single connected AI; with an alias, picks which one to use |
| `THINK(file.txt)` | Performs local retrieval (no AI, no network) over a knowledge file and replies with the most relevant content, if confidence is sufficient |
| `THINK(file.txt) OR REPLY ...` | Same as above, with an explicit fallback for when `THINK` can't answer with enough confidence |
| `WAITING(...)` | Shows a "processing" text/animation and holds for a minimum time. Can come right after a `THINK` (reusing the search time) or alone, as an independent action before anything else slow (e.g. `Response()`) |

---

## CONTAINS: the three forms

<p align="justify">
All forms of <code>CONTAINS</code> are <b>case-insensitive</b> ("HI", "Hi" and "hi" all match <code>CONTAINS "hi"</code>) and can be combined with <code>OR</code> inside the same <code>WHEN</code>.
</p>

### 1. Single word (original form)

```sql
WHEN CONTAINS "hi" OR CONTAINS "hello" {
    REPLY "Hi! How can I help?"
}
```

<p align="justify">
Practical for 2-3 words. For longer lists, repeating <code>OR CONTAINS</code> becomes long and hard to read — one of the two forms below is used instead.
</p>

### 2. Inline list

```sql
WHEN CONTAINS ("hi", "hello", "good afternoon", "good evening", "good morning") {
    REPLY "Hi! How can I help?"
}
```

<p align="justify">
Just one word from the list needs to appear in the message for the condition to be true. Good for medium-sized lists (5-20 words) that make sense staying visible inside the <code>.sql</code> file itself.
</p>

### 3. List from a `.txt` file

```sql
WHEN CONTAINS KEYWORDS(greetings.txt) {
    REPLY "Hi! How can I help?"
}
```

<p align="justify">
For large lists (100+ words) that would clutter the <code>.sql</code>. The filename has <b>no quotes</b> — it's a filename, not a search string, which is why it looks visually different from <code>CONTAINS "text"</code>.
</p>

<p align="justify">
The file is read once (and cached) on the first message that evaluates that condition, not on every incoming message.
</p>

<p align="justify">
<b><code>.txt</code> format:</b> one word or phrase per line, no quotes, no commas, no comments, no other syntax mixed in — a file serves only one list, avoiding ambiguity about what is and isn't a keyword.
</p>

```
hi
hello
good afternoon
good evening
good morning
```

---

## REPLY from an indexed file

<p align="justify">
Besides <code>REPLY "direct text"</code>, <code>REPLY</code> can also read a numbered entry from an external file:
</p>

```sql
REPLY (responses.txt, 1)
```

<p align="justify">
The numbered-entries file accepts <b>two forms</b>, never mixed within the same entry — the form used for entry N is automatically recognized by what comes right after <code>N-</code>.
</p>

### Form 1 — single line (`N- value`)

<p align="justify">
The original form, for short one-line responses:
</p>

```
1- Hi! How can I help?
2- Sorry, I didn't understand. Type "help".
```

<p align="justify">
<code>REPLY (responses.txt, 1)</code> looks for the line starting with <code>1-</code> and uses the text after the dash, to the end of the line, as the response.
</p>

### Form 2 — block in braces (`N-{ ... }`)

<p align="justify">
For responses that need more than one line — text with a list of options, an HTML block, a Markdown snippet with headings and paragraphs:
</p>

```
3-{
Which service do you want?
- Technical support
- Sales
- Cancel
}
```

<p align="justify">
Everything between the opening <code>{</code> and the closing <code>}</code> belongs to the entry — including line breaks. Reading is <b>strict about nesting</b>: if the content inside also has braces (for example a <code>style="{color:red}"</code> attribute inside HTML), those inner braces count toward the nesting and don't close the entry early — it only closes on the <code>}</code> that matches exactly the <code>{</code> that opened:
</p>

```
4-{
<div style="{color:red}">
  <p>Contact form</p>
</div>
}
```

<p align="justify">
A <code>{</code> without its matching <code>}</code> before the end of the file is an error — it's never silently ignored.
</p>

<p align="justify">
This is the same file format used by <code>IMPORT {file.txt, N}</code>, described next — both forms (line and block) also apply to <code>IMPORT</code>, and to the file used in <code>WAITING(...)</code>.
</p>

---

## IMPORT: the two forms

### 1. Import another `.sql` file

```sql
IMPORT {responses.sql}
IMPORT {signals.sql}

CREATE BOT "MyBot"
PLATFORM WHATSAPP

RUN BOT
```

<p align="justify">
Just like the MySQL client's <code>SOURCE</code> or <code>psql</code>'s <code>\i</code>, this isn't a feature of SQL itself — it's the <b>BotQL interpreter</b> resolving it: on finding <code>IMPORT {file.sql}</code>, it reads the given file and merges the content before processing the rest. This allows splitting a large bot into several smaller, organized files.
</p>

- `IMPORT` is always resolved before any other command, regardless of where it appears in the file.
- An imported file can contain ready-to-use `ON` blocks — the interpreter merges everything as if it were a single file.

### 2. Import an entry from a values file

```sql
IMPORT {env.txt, 1}
```

<p align="justify">
Different from the form above: with a second argument (the index, after the comma), <code>IMPORT</code> does <b>not</b> treat the file as BotQL code — it only reads entry N of the file (same <code>N- value</code> / <code>N-{ ... }</code> format as the indexed <code>REPLY</code>).
</p>

<p align="justify">
Without <code>AS</code>, the read value goes into the generic <code>env</code> variable — enough when there's only one secret to import. If the bot needs more than one (e.g. an AI token and a WhatsApp token at the same time), each <code>IMPORT</code> must have its own alias, so they don't collide on the same name:
</p>

```sql
IMPORT {env.txt, 1} AS K
IMPORT {env.txt, 2} AS TOKEN_WHATSAPP
```

<p align="justify">
The alias is just a label chosen by whoever writes the <code>.sql</code> — it can be a single letter (<code>K</code>) or a more descriptive name (<code>TOKEN_WHATSAPP</code>); the interpreter doesn't look at the text, it only uses it to know which imported value other commands (like <code>CONNECT RESPONSE</code>, next) are pointing to. With <code>AS</code>, the value is accessible directly by the alias name (e.g. <code>K</code>) in any expression — without <code>AS</code>, it's only accessible as <code>env.FILENAME</code>.
</p>

---

## CONNECT RESPONSE and Response(): connecting to an AI

<p align="justify">
Two pieces, with different roles, that always work together:
</p>

- **`CONNECT RESPONSE <alias>`** — connects the bot to an AI using an already-imported value (the token/key). Only establishes the connection, standing ready — **doesn't trigger anything by itself**. The alias must match an `IMPORT {..., N} AS <alias>` already done earlier in the file, otherwise it's an error.
- **`Response()`** — triggers the lifecycle: takes the client's current message, sends it to the connected AI, waits for the response, and returns that text wherever it's called (usually inside a `REPLY`).

```sql
IMPORT {env.txt, 1} AS K
CONNECT RESPONSE K              -- only connects, does nothing by itself

CREATE TABLE Context() PREVENT DEFAULT

ON MESSAGE {
    INSERT INTO Context()

    WHEN CONTAINS "price" {
        REPLY "Check our catalog: link.com"
    }

    OTHERWISE {
        REPLY Response()         -- this is what triggers: sends, waits, replies
    }
}

RUN BOT
```

<p align="justify">
Most common usage pattern: <code>OTHERWISE { REPLY Response() }</code> — when no `WHEN` rule covers the message, the AI steps in as a smart fallback, instead of a fixed "didn't understand" reply.
</p>

<p align="justify">
With more than one AI connected to the same bot, each with its own alias:
</p>

```sql
IMPORT {env.txt, 1} AS A
IMPORT {env.txt, 2} AS B

CONNECT RESPONSE A
CONNECT RESPONSE B
```

<p align="justify">
<code>Response()</code> alone (no argument) only makes sense when there's <b>one</b> AI connected — it's ambiguous with more than one (the bot refuses with an error listing the available aliases). With several, <code>Response(<alias>)</code> says exactly which one to use for that call:
</p>

```sql
ON MESSAGE {
    WHEN CONTAINS "sales" {
        REPLY Response(A)
    }

    WHEN CONTAINS "support" {
        REPLY Response(B)
    }

    OTHERWISE {
        REPLY Response(A)
    }
}
```

<p align="justify">
The alias passed to <code>Response(...)</code> must match a <code>CONNECT RESPONSE <alias></code> already done earlier in the file — otherwise it's an error.
</p>

---

## THINK: local retrieval over a knowledge file

<p align="justify">
Unlike <code>REPLY (file, N)</code> (which always returns the same entry for the same index) and <code>Response()</code> (which depends on an external connected AI), <code>THINK</code> searches, <b>on the device itself</b>, for the content most relevant to the received message, in a free-text knowledge file. It doesn't use AI, doesn't go over the network, and needs no <code>CONNECT</code> at all.
</p>

```sql
WHEN CONTAINS KEYWORDS(questions.txt)
    THINK(knowledge.txt) OR
    REPLY (fallback.txt, 1)
```

<p align="justify">
Knowledge file format: free-text blocks, each separated by a blank line — each block is a unit of information that can be used as a response.
</p>

```
We deliver anywhere in Luanda, within 2 to 3 business days after
payment confirmation.

We accept payment via bank transfer, Multicaixa Express, or cash
on delivery.

Business hours are Monday to Friday, 8am to 6pm.
```

### Behavior

<p align="justify">
<code>THINK(file.txt)</code> alone <b>is already</b> the response when it finds something with enough confidence — it doesn't need <code>REPLY THINK(...)</code> before it; the text is sent directly. Only the fallback (optional, after the <code>OR</code>) actually needs the word <code>REPLY</code>.
</p>

<p align="justify">
When the question clearly points to one part of the knowledge file, <code>THINK</code> answers directly with it. When the answer isn't as obvious — for example, more than one part of the file seems relevant to the same question — <code>THINK</code> tries to understand why before deciding:
</p>

- **Repeated information.** If the candidate parts say basically the same thing (the same information written two ways), `THINK` answers with one of them, without repeating or mixing the two.
- **Complementary information.** If the candidate parts are about the same subject but cover different cases — for example, one talks about delivery in Luanda and another in Huambo — `THINK` tries to merge both into a single response, rather than picking just one and leaving the other out.
- **Unclear question.** If neither of the above applies and the doubt remains, `THINK` tries to re-read the question (focusing on its most decisive part) before giving up.

<p align="justify">
Only after exhausting those attempts does <code>THINK</code> consider that it doesn't have a good enough answer:
</p>

- If, even so, nothing matches with enough confidence, it runs the `REPLY (...)` after the `OR`, just like any normal `REPLY`.
- Without any `OR REPLY (...)`, and without enough confidence, `THINK` replies with nothing — whoever writes the `.sql` decides whether that's acceptable, or whether to always pair `THINK` with a fallback.

### WAITING: text and animation while something takes time

<p align="justify">
A <code>THINK</code> search isn't instant like a normal <code>REPLY</code> — so before searching, <code>THINK</code> shows a "processing" state to whoever is on the other side of the conversation. By default, this already works without anything extra in the <code>.sql</code>: a generic "Thinking..." text and a minimum time of 3 seconds, even if the actual search is faster than that — without that minimum, the message would appear and disappear too fast to feel natural.
</p>

<p align="justify">
<code>WAITING(...)</code> customizes this behavior, and has two forms of use:
</p>

<p align="justify">
<strong>1. Attached to a <code>THINK</code></strong>, right after it, before the <code>OR</code> — reusing the time of the search itself:
</p>

```sql
THINK(knowledge.txt) WAITING(loading.txt, 2) OR
REPLY (fallback.txt, 1)
```

<p align="justify">
<strong>2. Alone, as an independent action</strong> anywhere in the block — useful before anything else that might also take time and has no warning of its own, like <code>Response()</code> (an external AI):
</p>

```sql
WHEN CONTAINS "sales" {
    WAITING("One moment...")
    REPLY Response(A)
}
```

<p align="justify">
In both cases, the arguments are the same:
</p>

- **First argument** (optional) — direct text in quotes, or the name of a `.txt` file (no quotes) with the text/markup to show while waiting. With no argument at all (`WAITING()`), the interpreter's default text is used.
- **Second argument** (optional) — minimum seconds that state stays visible, even if the action finishes sooner. Without an argument (`WAITING()` or just the text/file), 3 seconds is the default.

<p align="justify">
When used with a file, it follows the same rules as any other project <code>.txt</code> — only <code>.txt</code> and <code>.sql</code> exist in BotQL's file system, so an HTML/CSS animation is written inside a normal <code>.txt</code>, not a separate <code>.html</code>:
</p>

```
<div class="thinking">
  <span>Checking the best answer...</span>
</div>
```

<p align="justify">
Platforms that only show plain text (like WhatsApp) ignore the markup and use only the text; clients that render HTML (like BotQL's editor/preview) show the full animation.
</p>

### How relevance is calculated

<p align="justify">
<code>THINK</code> combines several signals, all calculated locally:
</p>

- **Weighted frequency** — a rare word from the message that appears in the content weighs more than a common one; additional repetitions of the same word count for less each time.
- **Phrase matching** — if a 2+ word snippet from the message appears exactly as-is in the content, that counts for more than the same words scattered and disconnected.
- **Typo tolerance** — a word from the message with 1-2 letters swapped can still match a word in the content, with reduced weight.
- **Plural/suffix variations** — "products" and "product" count as the same word.

<p align="justify">
<code>THINK</code> does <b>not</b> understand synonyms that don't share a root or similar letters — "hours" and "schedule" remain different words to it. For those cases, a term can be manually linked to another in the interpreter's options.
</p>

<p align="justify">
The knowledge file is read and processed once (and cached), not on every incoming message.
</p>

---

## DEFAULT MESSAGE: automatic greeting on first contact

<p align="justify">
Without any platform integration, BotQL has no way to "speak first" on its own — it only reacts when <code>ON MESSAGE</code> fires, upon receiving something. <code>DEFAULT MESSAGE</code> solves this differently: instead of depending on a "new conversation" event (which not every platform exposes), it uses the bot's own database to detect whether this is the first time a given <code>client</code> has appeared.
</p>

<p align="justify">
<code>DEFAULT MESSAGE</code> is a <code>CREATE TABLE</code> modifier, alongside <code>PREVENT DEFAULT</code>:
</p>

```sql
CREATE TABLE Context() PREVENT DEFAULT
DEFAULT MESSAGE "Hi! Welcome."
```

<p align="justify">
Works the same way with a manual table, as long as the table has a column for the sender (<code>client</code> or <code>sender</code>, the same name used in the <code>ON MESSAGE</code>'s <code>INSERT</code>/<code>VALUES</code>):
</p>

```sql
CREATE TABLE messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    sender TEXT,
    content TEXT,
    reply TEXT,
    created_at DATETIME
) PREVENT DEFAULT
DEFAULT MESSAGE "Hi! Welcome."
```

<p align="justify">
It also accepts an indexed file, just like <code>REPLY</code>:
</p>

```sql
DEFAULT MESSAGE (greets.txt, 1)
```

### Behavior

<p align="justify">
Before running the rest of the <code>ON MESSAGE</code> block (the <code>INSERT</code>, the <code>WHEN</code>s, the <code>OTHERWISE</code>), the interpreter checks whether any row already exists in the table declared with <code>DEFAULT MESSAGE</code> whose sender value matches the <code>client</code> of the received message:
</p>

- If **no row exists** — this is that sender's first message. The bot replies with the `DEFAULT MESSAGE` and does **not** run the rest of the block that time.
- If **a row already exists** — the bot already knows that sender. `ON MESSAGE` runs normally, from `INSERT` onward, without repeating the greeting.

<p align="justify">
This means the greeting depends only on data the bot itself already stores — it doesn't need any special "new conversation" connector to work, even with no real platform connected.
</p>

---

## The `env.txt` convention

<p align="justify">
For API keys, tokens, and any other sensitive data, BotQL's convention is to concentrate everything in a single file always called <code>env.txt</code>, with one numbered entry per service:
</p>

```
1- sk-abc123youractualkeyhere
2- anothersecretkey
```

<p align="justify">
Each <code>IMPORT {env.txt, N}</code> reads a specific line of that file. This keeps all secrets out of the main <code>.sql</code> and out of any file that gets shared or published — <code>env.txt</code> must never be pushed to a public repository (see next section).
</p>

---

## Security: `env.txt` never goes to the repository

<p align="justify">
A BotQL project can be public on GitHub (the interpreter, the main <code>.sql</code>, the response and keyword files) without ever exposing any API key — as long as <code>env.txt</code> stays out of the repository.
</p>

<p align="justify">
For that, the project should have a <code>.gitignore</code> at the root with the line:
</p>

```
env.txt
```

<p align="justify">
This tells Git to never track or push that file. Each person using the project creates their <b>own</b> <code>env.txt</code> locally, with their own keys — the file is never shared or made public, even if the rest of the project is.
</p>

---

## Available events

- `ON START` — runs once, when the bot connects.
- `ON MESSAGE` — runs whenever a message arrives.
- `ON SIGNAL FROM "<source>"` — runs when a signal arrives from a specific channel.

---

## Implicit variables

<p align="justify">
BotQL doesn't use dot notation (e.g. <code>MESSAGE.TEXT</code> doesn't exist). Instead, it uses simple variables, always available inside the <code>ON MESSAGE</code> block:
</p>

| Variable | Description |
|---|---|
| `client` | Sender of the received message |
| `message` | Text of the received message |
| `lastMsg` | Text of the last response sent by the bot |

---

## Database Integration

<p align="justify">
BotQL stores real database data in the same <code>.sql</code> file, without leaving the language. There are two ways to create a table:
</p>

<p align="justify">
<b>1. Manual, with explicit columns:</b>
</p>

```sql
CREATE TABLE messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    sender TEXT,
    content TEXT,
    reply TEXT,
    created_at DATETIME
) PREVENT DEFAULT
```

<p align="justify">
<b>2. Automatic, via the reserved name <code>Context()</code>:</b>
</p>

```sql
CREATE TABLE Context() PREVENT DEFAULT
```

<p align="justify">
No need to declare columns — the interpreter already has <code>Context()</code>'s schema pre-mapped. <code>INSERT</code> is automatic too:
</p>

```sql
INSERT INTO Context()
```

<p align="justify">
No parameters — the interpreter captures <code>client</code>, <code>message</code>, and the date automatically, just as <code>CREATE TABLE Context()</code> requires no columns.
</p>

### Fixed order rule — INSERT always first, UPDATE always last

<p align="justify">
Inside an <code>ON MESSAGE</code> block, when the bot needs to save the received message <b>and then</b> save the response it gave, the order is always the same, no exceptions:
</p>

1. `INSERT` happens **right at the start** of the block, before any `WHEN` — saves the received message as soon as it arrives.
2. The `WHEN` / `OTHERWISE` blocks decide the response normally.
3. `UPDATE` happens **always at the end** of the block, after all `WHEN`s — writes the final response into the same row, using `LAST_INSERT_ID()`.

```sql
ON MESSAGE {
    -- 1. INSERT first: saves the received message
    INSERT INTO messages (sender, content, created_at)
    VALUES (client, message, NOW())

    -- 2. WHEN decides the response
    WHEN CONTAINS "price" {
        REPLY "Check our catalog: link.com"
    }

    WHEN CONTAINS "human" {
        FORWARD TO "+244900000000"
        REPLY "Forwarding to a human agent..."
    }

    OTHERWISE {
        REPLY "Sorry, I didn't understand."
    }

    -- 3. UPDATE last: writes the response into the same row
    UPDATE messages
    SET reply = lastMsg
    WHERE id = LAST_INSERT_ID()
}
```

<p align="justify">
<code>UPDATE</code> doesn't repeat inside each <code>WHEN</code> — it runs once, after the response is decided. This order (<code>INSERT</code> → <code>WHEN</code> → <code>UPDATE</code>) is the same in any bot that needs to save question and answer together, including when using <code>Context()</code>.
</p>

---

## Example 1 — Support bot with Context()

```sql
CREATE BOT "StoreBot"
PLATFORM WHATSAPP

CREATE TABLE Context() PREVENT DEFAULT

ON MESSAGE {
    -- INSERT first, always
    INSERT INTO Context()

    WHEN CONTAINS "price" {
        REPLY "Check our catalog: link.com"
    }

    WHEN CONTAINS "buy" {
        REPLY "Order registered!"
    }

    OTHERWISE {
        REPLY "Sorry, I didn't understand."
    }
}

RUN BOT
```

---

## Example 2 — Support bot with manual table

```sql
CREATE BOT "SupportBot"
PLATFORM WHATSAPP

CREATE TABLE messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    sender TEXT,
    content TEXT,
    reply TEXT,
    created_at DATETIME
) PREVENT DEFAULT

ON START {
    REPLY "Hello! I'm online."
}

ON MESSAGE {
    INSERT INTO messages (sender, content, created_at)
    VALUES (client, message, NOW())

    WHEN CONTAINS "price" REPLY "Check our catalog: link.com"
    WHEN CONTAINS "hours" REPLY "We're open from 9am to 6pm"
    WHEN CONTAINS "human" {
        FORWARD TO "+244900000000"
        REPLY "Forwarding to a human agent..."
    }
    OTHERWISE REPLY "Sorry, I didn't understand."

    UPDATE messages
    SET reply = lastMsg
    WHERE id = LAST_INSERT_ID()
}

RUN BOT
```

---

## Example 3 — Bot with a large greeting list and file-based responses

```sql
CREATE BOT "SupportBot"
PLATFORM WHATSAPP

CREATE TABLE Context() PREVENT DEFAULT

ON MESSAGE {
    INSERT INTO Context()

    WHEN CONTAINS KEYWORDS(greetings.txt) {
        REPLY (responses.txt, 1)
    }

    WHEN CONTAINS ("price", "how much", "cost") {
        REPLY "Check our catalog: link.com"
    }

    OTHERWISE {
        REPLY (responses.txt, 2)
    }
}

RUN BOT
```

<p align="justify">
<code>greetings.txt</code>, in the same project:
</p>

```
hi
hello
good afternoon
good evening
good morning
```

<p align="justify">
<code>responses.txt</code>, in the same project:
</p>

```
1- Hi! How can I help?
2- Sorry, I didn't understand. Type "help".
```

---

## Example 4 — Signal bot (Trading)

```sql
CREATE BOT "SignalForwarder"

CONNECT TELEGRAM CHANNEL "@gold_signals"
CONNECT QUOTEX ACCOUNT "my_token_here"

ON SIGNAL FROM "@gold_signals" {
    PARSE SIGNAL
    SEND TO QUOTEX
    REPLY TO ADMIN "Signal sent: " + SIGNAL.PAIR
}

ON MESSAGE {
    WHEN CONTAINS "status" REPLY "Bot active. Processing signals in real time."
}

RUN BOT
```

---

## Example 5 — Support bot with AI fallback

```sql
IMPORT {env.txt, 1} AS K
CONNECT RESPONSE K

CREATE BOT "SmartSupport"
PLATFORM WHATSAPP

CREATE TABLE Context() PREVENT DEFAULT

ON MESSAGE {
    INSERT INTO Context()

    WHEN CONTAINS "price" {
        REPLY "Check our catalog: link.com"
    }

    WHEN CONTAINS "hours" {
        REPLY "We're open from 9am to 6pm"
    }

    OTHERWISE {
        WAITING("One moment...")
        REPLY Response(K)
    }
}

RUN BOT
```

<p align="justify">
<code>env.txt</code>, in the same project (outside the repository):
</p>

```
1- sk-abc123youractualkeyhere
```

---

## Example 6 — Response with options and an HTML block

<p align="justify">
Shows both forms of the indexed file side by side: single-line entries (<code>N- text</code>) and block entries (<code>N-{ ... }</code>) for longer responses, with a list of options or HTML.
</p>

```sql
CREATE BOT "SupportBot"
PLATFORM WHATSAPP

ON MESSAGE {
    WHEN CONTAINS ("hi", "hello") {
        REPLY (responses.txt, 1)
    }

    WHEN CONTAINS "service" {
        REPLY (responses.txt, 2)
    }

    WHEN CONTAINS "form" {
        REPLY (responses.txt, 3)
    }

    OTHERWISE {
        REPLY (responses.txt, 4)
    }
}

RUN BOT
```

<p align="justify">
<code>responses.txt</code>, in the same project:
</p>

```
1- Hi! How can I help?
2-{
Which service do you want?
- Technical support
- Sales
- Cancel
}
3-{
<div style="{color:red}">
  <p>Contact form</p>
</div>
}
4- Sorry, I didn't understand.
```

---

## Example 7 — Bot with local knowledge (THINK and WAITING)

```sql
CREATE BOT "StoreBot"
PLATFORM WHATSAPP

CREATE TABLE Context() PREVENT DEFAULT
DEFAULT MESSAGE "Hi! Welcome. Ask me about delivery, payment, or business hours."

ON MESSAGE {
    INSERT INTO Context()

    WHEN CONTAINS ("hi", "hello") {
        REPLY "What else can I help with?"
    }

    OTHERWISE
        THINK(knowledge.txt) WAITING(loading.txt, 2) OR
        REPLY (fallback.txt, 1)
}

RUN BOT
```

<p align="justify">
<code>knowledge.txt</code>, in the same project:
</p>

```
We deliver anywhere in Luanda, within 2 to 3 business days after
payment confirmation.

We accept payment via bank transfer, Multicaixa Express, or cash
on delivery.

Business hours are Monday to Friday, 8am to 6pm.
```

<p align="justify">
<code>loading.txt</code>, in the same project:
</p>

```
Checking the best answer...
```

<p align="justify">
<code>fallback.txt</code>, in the same project:
</p>

```
1- Sorry, I don't have that information. An agent will reply shortly.
```

<p align="justify">
In this example, the <code>DEFAULT MESSAGE</code> is sent only on each new <code>client</code>'s first message (before any <code>WHEN</code>/<code>THINK</code> runs); from that same sender's second message onward, the normal <code>ON MESSAGE</code> flow always runs.
</p>

---

## Syntax rules

1. Every command is written in **UPPERCASE**.
2. Literal text always goes between quotes `" "`.
3. Blocks with more than one action use braces `{ }`, always right after `ON` or `WHEN`.
4. A single action doesn't need braces.
5. `WHEN` can only be used inside an `ON MESSAGE { }` block.
6. `OTHERWISE` is optional, but recommended — covers any message that doesn't match any `WHEN`.
7. There's no dot notation (`MESSAGE.TEXT`); implicit variables are used instead (`client`, `message`, `lastMsg`).
8. `PREVENT DEFAULT` on `CREATE TABLE` avoids an error if the table already exists.
9. `Context()` is the only reserved table name — automatic schema, no columns, and `INSERT INTO Context()` is also automatic, no parameters.
10. When an `ON MESSAGE` block needs to save both question and answer, the order is always `INSERT` at the start → `WHEN`/`OTHERWISE` in the middle → `UPDATE` at the end, referencing `LAST_INSERT_ID()`.
11. `{ }` after `IMPORT` isn't an action block — it's a file reference. Without an index (`IMPORT {file.sql}`) it imports code; with an index (`IMPORT {file.txt, N}`) it reads only one value entry.
12. `CONTAINS (...)` accepts a list of strings in parentheses — just one needs to match for the condition to be true.
13. `CONTAINS KEYWORDS(file.txt)` loads the list from a project `.txt` file; the filename has no quotes. The `.txt` can only contain keywords, one per line — no other syntax mixed in.
14. `REPLY (file.txt, N)` reads entry N from an indexed file. Two forms per entry, never mixed: `N- value` (one line) or `N-{ ... }` (block in braces, can have multiple lines). Inside the block, inner braces count toward the nesting — it only closes on the `}` matching the `{` that opened; an unclosed brace is an error.
15. Secrets (API keys, tokens) always live in a single `env.txt` file, one numbered entry per service, read via `IMPORT {env.txt, N}`. That file is never included in the repository — it must always be listed in `.gitignore`.
16. `IMPORT {..., N} AS <alias>` names an imported value, accessible directly by the alias name; without `AS`, the value falls into the generic `env` variable (accessible as `env.FILENAME`). Use an alias whenever more than one secret is imported in the same bot.
17. `CONNECT RESPONSE <alias>` only connects the bot to an AI — it doesn't trigger anything by itself. It's `Response()` (or `Response(<alias>)`, with more than one AI connected) that fires the cycle (send current message, wait, return response); so it only makes sense inside an action like `REPLY`, never alone. The alias in `Response(<alias>)` must match a `CONNECT RESPONSE <alias>` already done earlier in the file.
18. Filenames in any `.sql` reference (`IMPORT`, `CONTAINS KEYWORDS`, `REPLY (file, N)`, `THINK`, `WAITING`, `DEFAULT MESSAGE`) only recognize letters, numbers, and underscore before/after the dot — a name with a hyphen (`my-data.txt`) isn't read correctly.
19. `THINK(file.txt)` alone is already the response when it finds something with enough confidence — it doesn't need `REPLY` before it. When more than one part of the file seems relevant, `THINK` first tries to tell whether it's repeated or complementary information before deciding; only the optional fallback (`OR REPLY ...`) needs the word `REPLY`, and it only runs when `THINK` can't reach an answer with enough confidence.
20. `WAITING(...)` has two forms of use: attached to a `THINK`, always right after it and before the `OR`; or alone, as an independent action anywhere in the block. Both arguments are optional and independent in either form: with none, default text and time are used; with text/file, only the message/animation is customized; with the second argument too, the minimum time (in seconds) is customized as well.
21. `DEFAULT MESSAGE`, when used, always goes inside the `CREATE TABLE` declaration, alongside `PREVENT DEFAULT`. It applies to any `client`/`sender` that doesn't yet have a row in that table — in that case, `ON MESSAGE` doesn't run the rest of the block that time, it only replies with the default message.

---

## Philosophy

<p align="justify">
BotQL isn't a programming language — it's a <b>rules language</b> for creating bots, much like an SQL query describes what you want to fetch from a database. You don't need to know how to program to write BotQL; you just need to know what you want your bot to do.
</p>

---

## Where the bot runs

<p align="justify">
The <b>interpreter</b> lives in one fixed place (GitHub), and each user only needs their own <code>.sql</code> file with the bot's rules. The interpreter reads and translates that file into real actions.
</p>

<p align="justify">
The bot runs <b>locally</b>, on the user's own computer or server — not on servers managed by third parties. This means the bot stays online as long as that process keeps running; if the user shuts down the computer or closes the process, the bot stops. Keeping the bot online at all times (for example, with PM2, <code>screen</code>, or a dedicated server) is up to whoever creates it, just like with any bot built in plain Node.js.
</p>
