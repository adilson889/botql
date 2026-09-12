# BotQL: Bot Query Language

BotQL is a simple, SQL-inspired **rule language** for building bots without writing traditional code.

All commands are written in **UPPERCASE**. Blocks with more than one action use curly braces `{ }`.

It lives in the same `.sql` file as real database commands — the bot acts and persists data in the same language, without ever leaving BotQL.

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
| `PREVENT DEFAULT` | Modifier for `CREATE TABLE`: creates only if it doesn't already exist, no error if it does |
| `DEFAULT MESSAGE` | Modifier for `CREATE TABLE`: message sent automatically the first time a `client` appears in that table |
| `Context()` | Reserved table name — schema pre-mapped in the interpreter, no need to declare columns |
| `INSERT INTO` | Saves a new row in the table |
| `UPDATE` / `SET` / `WHERE` | Updates an existing row |
| `LAST_INSERT_ID()` | References the id of the last inserted row |
| `ON` | Defines an event that triggers actions |
| `WHERE` | Filters the condition of an event or a query |
| `CONTAINS` | Checks whether a message contains a text (a single word, an inline list, or a `.txt` file — see its own section) |
| `OR` | Combines multiple conditions |
| `WHEN` | Tests a condition inside an `ON MESSAGE` block |
| `OTHERWISE` | Default action when no `WHEN` matches |
| `REPLY` | Sends a text response (direct text or from an indexed file — see its own section) |
| `FORWARD TO` | Forwards the message to another contact/channel |
| `PARSE SIGNAL` | Parses a received signal (e.g. trading signals) |
| `SEND TO` | Sends data/signal to another platform |
| `UNKNOWN` | Event triggered when nothing matches |
| `START` | Event triggered when the bot starts up |
| `RUN BOT` | Starts running the bot |
| `IMPORT {file.sql}` | Imports and merges the content of another `.sql` file before running |
| `IMPORT {file.txt, N}` | Reads only entry N of a values file, without importing code |
| `IMPORT {..., N} AS <alias>` | Names an imported value, so it can be referenced later by that alias |
| `Response()` / `Response(<alias>)` | Triggers the cycle: sends the current message to the connected AI, waits, and returns the response as text. Without an alias, only works with a single connected AI; with an alias, chooses which one to use |
| `THINK(file.txt)` | Does local retrieval (no AI, no network) over a knowledge file and replies with the most relevant content, if confidence is sufficient |
| `THINK(file.txt) OR REPLY ...` | Same as above, with an explicit fallback for when `THINK` can't answer with enough confidence |
| `WAITING(...)` | Shows a "processing" text/animation and holds it for a minimum time. Can come right after a `THINK` (reusing the search time) or standalone, as an independent action before anything else slow (e.g. `Response()`) |
| `SHOW CATALOG(file.txt)` | Shows the items of a catalog file — all categories together, or just one with `CATEGORY("...")` |
| `SHOW CATEGORY(file.txt)` | Standalone (outside a CATALOG): shows only the category names in the file |

---

## CONTAINS: the three forms

All forms of `CONTAINS` are case-insensitive ("OLA", "Ola" and "ola" all match `CONTAINS "ola"`) and can be combined with `OR` inside the same `WHEN`.

### 1. Single word (original form)

```sql
WHEN CONTAINS "hi" OR CONTAINS "hello" {
    REPLY "Hi! How can I help you?"
}
```

Practical for 2-3 words. For larger lists, repeating `OR CONTAINS` gets long and hard to read — one of the two forms below is used instead.

### 2. Inline list

```sql
WHEN CONTAINS ("hi", "hello", "good afternoon", "good evening", "good morning") {
    REPLY "Hi! How can I help you?"
}
```

Just one of the words in the list needs to appear in the message for the condition to be true. Good for medium-sized lists (5-20 words) that make sense to keep visible inside the `.sql` itself.

### 3. List from a `.txt` file

```sql
WHEN CONTAINS KEYWORDS(greetings.txt) {
    REPLY "Hi! How can I help you?"
}
```

For large lists (100+ words) that would clutter the `.sql`. The file name is **not quoted** — it's a file name, not a search string, so it looks visually different from `CONTAINS "text"`.

The file is read once (and cached) on the first message that evaluates that condition, not on every incoming message.

**`.txt` format:** one word or phrase per line, no quotes, no commas, no comments, no other syntax mixed in — a file serves only one list, avoiding ambiguity about what is a keyword and what isn't.

```
hi
hello
good afternoon
good evening
good morning
```

---

## REPLY from an indexed file

Besides `REPLY "direct text"`, `REPLY` can also read a numbered entry from an external file:

```sql
REPLY (responses.txt, 1)
```

The numbered-entries file accepts **two forms**, never mixed within the same entry — the form chosen for entry N is recognized automatically by what comes right after `N-`.

### Form 1 — single line (`N- value`)

The original form, for short one-line responses:

```
1- Hi! How can I help you?
2- Sorry, I didn't understand. Type "help".
```

`REPLY (responses.txt, 1)` looks for the line starting with `1-` and uses the text after the dash, up to the end of the line, as the response.

### Form 2 — block in braces (`N-{ ... }`)

For responses that need more than one line — text with a list of options, an HTML block, a Markdown snippet with headings and paragraphs:

```
3-{
Which service do you want?
- Technical support
- Sales
- Cancel
}
```

Everything between the opening `{` and the closing `}` belongs to the entry — including line breaks. Reading is **strict about nesting**: if the content inside also has braces (for example an attribute `style="{color:red}"` inside HTML), those inner braces count toward the nesting and don't close the entry early — it only closes at the `}` that exactly matches the `{` that opened it:

```
4-{
<div style="{color:red}">
  <p>Contact form</p>
</div>
}
```

A `{` without a matching `}` before the end of the file is an error — it is never silently ignored.

This is the same file format used by `IMPORT {file.txt, N}`, described next — both forms (line and block) also apply to `IMPORT`, and to the file used in `WAITING(...)`.

---

## IMPORT: the two forms

### 1. Importing another `.sql` file

```sql
IMPORT {responses.sql}
IMPORT {signals.sql}

CREATE BOT "MyBot"
PLATFORM WHATSAPP

RUN BOT
```

Like the `SOURCE` command in the MySQL client or `\i` in `psql`, this isn't a feature of SQL itself — it's the **BotQL interpreter** that resolves it: when it finds `IMPORT {file.sql}`, it reads the given file and merges its content before processing the rest. This allows splitting a large bot into several smaller, organized files.

- `IMPORT` is always resolved before any other command, regardless of where it appears in the file.
- An imported file can contain ready-to-use `ON` blocks — the interpreter merges everything as if it were a single file.

### 2. Importing an entry from a values file

```sql
IMPORT {env.txt, 1}
```

Different from the form above: with a second argument (the index, after the comma), `IMPORT` does **not** treat the file as BotQL code — it only reads entry N of the file (same `N- value` / `N-{ ... }` format as indexed `REPLY`).

Without `AS`, the value read is stored in the generic `env` variable — enough when there's only one secret to import. If the bot needs more than one (e.g. an AI token and a WhatsApp token at the same time), each `IMPORT` should have its own alias, so they don't collide on the same name:

```sql
IMPORT {env.txt, 1} AS K
IMPORT {env.txt, 2} AS TOKEN_WHATSAPP
```

The alias is just a label chosen by whoever writes the `.sql` — it can be a single letter (`K`) or a more descriptive name (`TOKEN_WHATSAPP`); the interpreter doesn't look at the text, it just uses it to know which imported value other commands (like `CONNECT RESPONSE`, next) are pointing to. With `AS`, the value becomes directly accessible by the alias name (e.g. `K`) in any expression — without `AS`, it's only accessible as `env.FILENAME`.

---

## CONNECT RESPONSE and Response(): connecting to an AI

Two pieces, with different roles, that always work together:

- **`CONNECT RESPONSE <alias>`** — links the bot to an AI using an already-imported value (the token/key). It only establishes the connection, ready and waiting — **it doesn't trigger anything by itself**. The alias must match an `IMPORT {..., N} AS <alias>` already done earlier in the file, otherwise it's an error.
- **`Response()`** — triggers the lifecycle: takes the client's current message, sends it to the connected AI, waits for the response, and returns that text wherever it's called (typically inside a `REPLY`).

```sql
IMPORT {env.txt, 1} AS K
CONNECT RESPONSE K              -- only connects, does nothing by itself

CREATE TABLE Context() PREVENT DEFAULT

ON MESSAGE {
    INSERT INTO Context()

    WHEN CONTAINS "price" {
        REPLY "Check out our catalog: link.com"
    }

    OTHERWISE {
        REPLY Response()         -- this is where it triggers: sends, waits, replies
    }
}

RUN BOT
```

Most common usage pattern: `OTHERWISE { REPLY Response() }` — when no `WHEN` rule covers the message, the AI kicks in as a smart fallback, instead of a fixed "didn't understand" reply.

With more than one AI connected in the same bot, each with its own alias:

```sql
IMPORT {env.txt, 1} AS A
IMPORT {env.txt, 2} AS B

CONNECT RESPONSE A
CONNECT RESPONSE B
```

`Response()` alone (with no argument) only makes sense when there is **one** connected AI — it's ambiguous with more than one (the bot refuses with an error listing the available aliases). With several, `Response(<alias>)` says exactly which one to use for that call:

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

The alias passed to `Response(...)` must match a `CONNECT RESPONSE <alias>` already done earlier in the file — otherwise it's an error.

---

## THINK: local retrieval over a knowledge file

Unlike `REPLY (file, N)` (which always returns the same entry for the same index) and `Response()` (which depends on an externally connected AI), `THINK` searches, **on the device itself**, for the most relevant content for the received message, in a free-text knowledge file. It doesn't use AI, doesn't go out to the network, and doesn't need any `CONNECT`.

```sql
WHEN CONTAINS KEYWORDS(questions.txt)
    THINK(knowledge.txt) OR
    REPLY (fallback.txt, 1)
```

Knowledge file format: free-text blocks, each separated by a blank line — each block is a unit of information that can be used as a response.

```
We deliver anywhere in the city, within 2 to 3 business days after
payment confirmation.

We accept payment via bank transfer, mobile payment, or cash on
delivery.

Business hours are Monday to Friday, 8am to 6pm.
```

### Behavior

`THINK(file.txt)` alone **is** already the response when it finds something with sufficient confidence — it doesn't need a `REPLY THINK(...)` before it; the text is sent directly. Only the fallback (optional, after the `OR`) actually needs the `REPLY` keyword.

When the question clearly points to one part of the knowledge file, `THINK` responds directly with it. When the answer isn't as obvious — for example, more than one part of the file seems relevant to the same question — `THINK` tries to understand why before deciding:

- **Repeated information.** If the candidate parts basically say the same thing (the same information written two ways), `THINK` responds with one of them, without repeating or mixing the two.
- **Complementary information.** If the candidate parts are about the same subject but cover different cases — for example, one talks about deliveries in one city and another in a different city — `THINK` tries to merge both into a single response, instead of picking just one and leaving the other out.
- **Unclear question.** If neither situation above applies and the doubt remains, `THINK` tries to reinterpret the question (focusing on its most decisive part) before giving up.

Only after exhausting these attempts does `THINK` consider that it doesn't have a good enough answer:

- If nothing still matches with sufficient confidence, it runs the `REPLY (...)` after the `OR`, like any normal `REPLY`.
- Without any `OR REPLY (...)`, and without sufficient confidence, `THINK` replies with nothing — whoever writes the `.sql` decides whether that's acceptable, or prefers to always pair `THINK` with a fallback.

### WAITING: text and animation while something takes time

`THINK`'s search isn't instant like a regular `REPLY` — so before searching, `THINK` shows a "processing" state to whoever is on the other side of the conversation. By default, this already works without anything extra in the `.sql`: a generic text like "Thinking..." and a minimum time of 3 seconds, even if the actual search is faster than that — without that minimum, the message would appear and disappear too fast to feel natural.

`WAITING(...)` customizes this behavior, and has two usage forms:

**1. Attached to a `THINK`**, placed right after it, before the `OR` — reuses the search's own time:

```sql
THINK(knowledge.txt) WAITING(loading.txt, 2) OR
REPLY (fallback.txt, 1)
```

**2. Standalone, as an independent action** anywhere in the block — useful before anything else that might also take time and doesn't have its own notice, like `Response()` (an external AI):

```sql
WHEN CONTAINS "sales" {
    WAITING("One moment...")
    REPLY Response(A)
}
```

In both cases, the arguments are the same:

- **First argument** (optional) — direct text in quotes, or the name of a `.txt` file (no quotes) with the text/markup to show while waiting. With no argument at all (`WAITING()`), uses the interpreter's default text.
- **Second argument** (optional) — minimum seconds this state stays visible, even if the action finishes sooner. Without an argument (`WAITING()` or just the text/file), uses 3 seconds by default.

When used with a file, it follows the same rules as any other `.txt` in the project — only `.txt` and `.sql` exist in BotQL's file system, so an HTML/CSS animation is written inside a normal `.txt`, not a separate `.html`:

```
<div class="thinking">
  <span>Checking the best response...</span>
</div>
```

Platforms that only show plain text (like WhatsApp) ignore the markup and use only the text; clients that render HTML (like the BotQL editor/preview) show the full animation.

### How relevance is calculated

`THINK` combines several signals, all calculated locally:

- **Weighted frequency** — a rare word from the message that appears in the content weighs more than a common word; additional repetitions of the same word count for less each time.
- **Phrase matching** — if a 2+ word phrase from the message appears verbatim in the content, that counts more than the same words scattered and disconnected.
- **Typo tolerance** — a word from the message written with 1-2 letters swapped can still match a word in the content, with reduced weight.
- **Plural/suffix variations** — "products" and "product" count as the same word.

`THINK` does **not** understand synonyms that don't share a root or similar letters — "hours" and "schedule" remain different words to it. For those cases, it's possible to manually link one term to another in the interpreter's options.

The knowledge file is read and processed once (and cached), not on every incoming message.

---

## SHOW CATALOG / SHOW CATEGORY: product catalog from a file

Shows the items (or categories) of a catalog file — useful for shops, menus, service lists. Two forms:

**1. `SHOW CATEGORY(file.txt)`** — standalone, not tied to a `CATALOG`. Shows only the category **names** in the file:

```sql
WHEN CONTAINS "categories" {
    SHOW CATEGORY(catalog.txt)
}
```

**2. `SHOW CATALOG(file.txt)`** — shows items (name, price, color, image). Without `CATEGORY`, shows items from all categories together; with `CATEGORY("...")`, only from that category:

```sql
WHEN CONTAINS "everything" {
    SHOW CATALOG(catalog.txt)
}

WHEN CONTAINS "drinks" {
    SHOW CATALOG(catalog.txt) CATEGORY("Drinks")
}
```

Catalog file format: one block per category, each `ITEM` with a name in quotes and optional modifiers `PRICE`, `COLOR` and `IMAGE`:

```
Drinks {
    ITEM "Coca-Cola 350ml" PRICE "500 Kz"
    ITEM "Mango juice" PRICE "450 Kz" COLOR "#F5A623"
}

Snacks {
    ITEM "Fries" PRICE "700 Kz" COLOR "#F5D76E" IMAGE "fries.png"
}
```

### Behavior

Like the rest of BotQL, the response always arrives in two forms at once, in the same event — whoever receives it chooses which to use:

- **Plain text**, with no markup at all — used by plain-text platforms (WhatsApp, terminal).
- **Self-contained HTML**, with its own embedded `<style>` — used by the editor's preview and by a BotQL Server's chat.

Item cards come marked with `data-botql-produto="Item name"`, and each category (in `SHOW CATEGORY`) with `data-botql-categoria="Name"`. The bot never executes anything on its own from a click — it only later receives the normal text message that the client itself sends (it's the host — the chat.html or the preview — that decides what to write into the message field when someone taps a card).

---

## DEFAULT MESSAGE: automatic greeting on first contact

Without any platform integration, BotQL has no way to "speak first" on its own — it only reacts when `ON MESSAGE` triggers, upon receiving something. `DEFAULT MESSAGE` solves this differently: instead of depending on a "new conversation" event (which not every platform exposes), it uses the bot's own database to detect whether this is the first time a `client` has appeared.

`DEFAULT MESSAGE` is a modifier of `CREATE TABLE`, alongside `PREVENT DEFAULT`:

```sql
CREATE TABLE Context() PREVENT DEFAULT
DEFAULT MESSAGE "Hi! Welcome."
```

It works the same way with a manual table, as long as the table has a column for the sender (`client` or `sender`, the same name used in the `INSERT`/`VALUES` of `ON MESSAGE`):

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

It also accepts an indexed file, just like `REPLY`:

```sql
DEFAULT MESSAGE (greets.txt, 1)
```

### Behavior

Before running the rest of `ON MESSAGE` (the `INSERT`, the `WHEN`s, the `OTHERWISE`), the interpreter checks whether any row already exists in the table declared with `DEFAULT MESSAGE` whose sender value matches the `client` of the received message:

- If **no row exists** — this is that sender's first message. The bot responds with the `DEFAULT MESSAGE` and does **not** run the rest of the block this time.
- If **a row already exists** — the bot already knows this sender. `ON MESSAGE` runs normally, from the `INSERT` onward, without repeating the greeting.

This means the greeting depends only on data the bot already stores — it doesn't need any special "new conversation" connector to work, even with no real platform connected.

---

## The `env.txt` convention

For API keys, tokens, and any other sensitive data, BotQL's convention is to gather everything in a single file always called `env.txt`, with one numbered entry per service:

```
1- sk-abc123yourkeyhere
2- anothersecretkey
```

Each `IMPORT {env.txt, N}` reads one specific line of that file. This keeps all secrets out of the main `.sql` and out of any file that gets shared or published — `env.txt` should never be pushed to a public repository (see the next section).

---

## Security: `env.txt` never goes to the repository

A BotQL project can be public on GitHub (the interpreter, the main `.sql`, the response and keyword files) without ever exposing any API key — as long as `env.txt` stays out of the repository.

To do this, the project should have a `.gitignore` at the root with the line:

```
env.txt
```

This tells Git to never track or push that file. Each person using the project creates their **own** `env.txt` locally, with their own keys — the file is never shared or made public, even if the rest of the project is.

---

## Available events

- `ON START` — runs once, when the bot starts up.
- `ON MESSAGE` — runs whenever a message arrives.
- `ON SIGNAL FROM "<source>"` — runs when a signal arrives from a specific channel.

---

## Implicit variables

BotQL doesn't use dot notation (e.g. `MESSAGE.TEXT` doesn't exist). Instead, it uses simple variables, always available inside the `ON MESSAGE` block:

| Variable | Description |
|---|---|
| `client` | Sender of the received message |
| `message` | Text of the received message |
| `lastMsg` | Text of the last response sent by the bot |

---

## Database Integration

BotQL stores real database data in the same `.sql` file, without leaving the language. There are two ways to create a table:

**1. Manual, with explicit columns:**

```sql
CREATE TABLE messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    sender TEXT,
    content TEXT,
    reply TEXT,
    created_at DATETIME
) PREVENT DEFAULT
```

**2. Automatic, via the reserved name `Context()`:**

```sql
CREATE TABLE Context() PREVENT DEFAULT
```

No need to declare columns — the interpreter already has `Context()`'s schema pre-mapped. `INSERT` is also automatic:

```sql
INSERT INTO Context()
```

No parameters — the interpreter captures `client`, `message`, and the date automatically, just as `CREATE TABLE Context()` skips columns.

### Fixed ordering rule — INSERT always first, UPDATE always last

Inside an `ON MESSAGE` block, when the bot needs to save the received message **and then** save the response it gave, the order is always the same, with no exceptions:

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
        REPLY "Check out our catalog: link.com"
    }

    WHEN CONTAINS "human" {
        FORWARD TO "+1234567890"
        REPLY "Forwarding you to a human agent..."
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

The `UPDATE` is not repeated inside each `WHEN` — it runs once, after the response has been decided. This order (`INSERT` → `WHEN` → `UPDATE`) is the same in any bot that needs to save question and answer together, including when using `Context()`.

---

## Example 1 — Customer Service Bot with Context()

```sql
CREATE BOT "ShopBot"
PLATFORM WHATSAPP

CREATE TABLE Context() PREVENT DEFAULT

ON MESSAGE {
    -- INSERT first, always
    INSERT INTO Context()

    WHEN CONTAINS "price" {
        REPLY "Check out our catalog: link.com"
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

## Example 2 — Customer Service Bot with a manual table

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

    WHEN CONTAINS "price" REPLY "Check out our catalog: link.com"
    WHEN CONTAINS "hours" REPLY "We're open from 9am to 6pm"
    WHEN CONTAINS "human" {
        FORWARD TO "+1234567890"
        REPLY "Forwarding you to a human agent..."
    }
    OTHERWISE REPLY "Sorry, I didn't understand."

    UPDATE messages
    SET reply = lastMsg
    WHERE id = LAST_INSERT_ID()
}

RUN BOT
```

---

## Example 3 — Bot with a large greetings list and file-based responses

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
        REPLY "Check out our catalog: link.com"
    }

    OTHERWISE {
        REPLY (responses.txt, 2)
    }
}

RUN BOT
```

`greetings.txt`, in the same project:

```
hi
hello
good afternoon
good evening
good morning
```

`responses.txt`, in the same project:

```
1- Hi! How can I help you?
2- Sorry, I didn't understand. Type "help".
```

---

## Example 4 — Signal Bot (Trading)

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

## Example 5 — Customer Service Bot with AI fallback

```sql
IMPORT {env.txt, 1} AS K
CONNECT RESPONSE K

CREATE BOT "SmartSupport"
PLATFORM WHATSAPP

CREATE TABLE Context() PREVENT DEFAULT

ON MESSAGE {
    INSERT INTO Context()

    WHEN CONTAINS "price" {
        REPLY "Check out our catalog: link.com"
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

`env.txt`, in the same project (outside the repository):

```
1- sk-abc123yourkeyhere
```

---

## Example 6 — Response with options and an HTML block

Shows both forms of the indexed file side by side: one-line entries (`N- text`) and block entries (`N-{ ... }`) for longer responses, with a list of options or HTML.

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

`responses.txt`, in the same project:

```
1- Hi! How can I help you?
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
CREATE BOT "ShopBot"
PLATFORM WHATSAPP

CREATE TABLE Context() PREVENT DEFAULT
DEFAULT MESSAGE "Hi! Welcome. Ask me about delivery, payment, or hours."

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

`knowledge.txt`, in the same project:

```
We deliver anywhere in the city, within 2 to 3 business days after
payment confirmation.

We accept payment via bank transfer, mobile payment, or cash on
delivery.

Business hours are Monday to Friday, 8am to 6pm.
```

`loading.txt`, in the same project:

```
Checking the best response...
```

`fallback.txt`, in the same project:

```
1- Sorry, I don't have that information. An agent will reply shortly.
```

In this example, `DEFAULT MESSAGE` is only sent on the first message from each new `client` (before any `WHEN`/`THINK` runs); from the second message from that same sender onward, the normal `ON MESSAGE` flow always runs.

---

## Syntax rules

1. Every command is written in **UPPERCASE**.
2. Literal text always goes in quotes `" "`.
3. Blocks with more than one action use braces `{ }`, always right after `ON` or `WHEN`.
4. A single action doesn't need braces.
5. `WHEN` can only be used inside an `ON MESSAGE { }` block.
6. `OTHERWISE` is optional, but recommended — covers any message that doesn't match any `WHEN`.
7. There is no dot notation (`MESSAGE.TEXT`); implicit variables are used instead (`client`, `message`, `lastMsg`).
8. `PREVENT DEFAULT` on `CREATE TABLE` avoids an error if the table already exists.
9. `Context()` is the only reserved table name — automatic schema, no columns, and `INSERT INTO Context()` is also automatic, with no parameters.
10. When an `ON MESSAGE` block needs to save question and answer, the order is always `INSERT` at the start → `WHEN`/`OTHERWISE` in the middle → `UPDATE` at the end, referencing `LAST_INSERT_ID()`.
11. `{ }` after `IMPORT` is not an action block — it's a file reference. Without an index (`IMPORT {file.sql}`) it imports code; with an index (`IMPORT {file.txt, N}`) it reads only one value entry.
12. `CONTAINS (...)` accepts a list of strings in parentheses — just one needs to match for the condition to be true.
13. `CONTAINS KEYWORDS(file.txt)` loads the list from a `.txt` file in the project; the file name is not quoted. The `.txt` may only contain keywords, one per line — no other syntax mixed in.
14. `REPLY (file.txt, N)` reads entry N from an indexed file. Two forms per entry, never mixed: `N- value` (one line) or `N-{ ... }` (block in braces, can span multiple lines). Inside the block, inner braces count toward the nesting — it only closes at the `}` matching the `{` that opened it; an unclosed brace is an error.
15. Secrets (API keys, tokens) always live in a single `env.txt` file, one numbered entry per service, read via `IMPORT {env.txt, N}`. That file is never included in the repository — it must always be listed in `.gitignore`.
16. `IMPORT {..., N} AS <alias>` names an imported value, accessible directly by the alias name; without `AS`, the value falls into the generic `env` variable (accessible as `env.FILENAME`). Use an alias whenever more than one secret is imported in the same bot.
17. `CONNECT RESPONSE <alias>` only connects the bot to an AI — it doesn't trigger anything by itself. It's `Response()` (or `Response(<alias>)`, with more than one connected AI) that triggers the cycle (send current message, wait, return response); so it only makes sense inside an action like `REPLY`, never standalone. The alias in `Response(<alias>)` must match a `CONNECT RESPONSE <alias>` already done earlier in the file.
18. File names in any reference in the `.sql` (`IMPORT`, `CONTAINS KEYWORDS`, `REPLY (file, N)`, `THINK`, `WAITING`, `DEFAULT MESSAGE`) only recognize letters, numbers, and underscore before/after the dot — a name with a hyphen (`my-data.txt`) isn't read correctly.
19. `THINK(file.txt)` alone is already the response when it finds something with sufficient confidence — it doesn't need a `REPLY` before it. When more than one part of the file seems relevant, `THINK` first tries to determine whether it's repeated or complementary information before deciding; only the optional fallback (`OR REPLY ...`) needs the `REPLY` keyword, and it only runs when `THINK` can't reach a response with sufficient confidence.
20. `WAITING(...)` has two usage forms: attached to a `THINK`, always right after it and before the `OR`; or standalone, as an independent action anywhere in the block. Both arguments are optional and independent in either form: with none, uses default text and time; with text/file, customizes just the message/animation; with the second argument too, also customizes the minimum time (in seconds).
21. `DEFAULT MESSAGE`, when used, always goes inside the `CREATE TABLE` declaration, alongside `PREVENT DEFAULT`. It applies to any `client`/`sender` that doesn't yet have any row in that table — in that case, `ON MESSAGE` doesn't run the rest of the block that time, it only responds with the default message.
22. `SHOW CATEGORY(file.txt)` alone shows only category names; `SHOW CATALOG(file.txt)` shows items, with optional `CATEGORY("...")` to filter to just one. The response always arrives with plain text and self-contained HTML together — whoever receives it chooses which to use.

---

## Philosophy

BotQL is not a programming language — it's a **rule language** for building bots, the same way an SQL query describes what you want to fetch from a database. You don't need to know how to program to write BotQL; you just need to know what you want your bot to do.

---

## Where the bot runs

The **interpreter** lives in one fixed place (GitHub), and each user only needs their own `.sql` file with the bot's rules. The interpreter reads and translates that file into real actions.

The bot runs **locally**, on the user's own computer or server — not on servers managed by third parties. This means the bot stays online as long as that process is running; if the user shuts down the computer or closes the process, the bot stops. Keeping the bot online at all times (for example, with PM2, `screen`, or a dedicated server) is the responsibility of whoever creates it, just as with any bot built in plain Node.js.
