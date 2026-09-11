-- Local Bot Example
-- Complete bot with knowledge base, fallback, and default greeting

CREATE BOT "LocalBot"
PLATFORM WHATSAPP

CREATE TABLE Context() PREVENT DEFAULT
DEFAULT MESSAGE "Welcome to our store. Ask about delivery, payment, hours or returns."

ON MESSAGE {
    INSERT INTO Context()

    -- Greetings
    WHEN CONTAINS "hello" REPLY "Hello! How can I help you today?"
    WHEN CONTAINS "hi" REPLY "Hello! How can I help you today?"

    -- Farewell
    WHEN CONTAINS "bye" REPLY "Goodbye! Come back anytime."
    WHEN CONTAINS "thanks" REPLY "You're welcome!"

    -- Human handoff
    WHEN CONTAINS "human" {
        FORWARD TO "+244900000000"
        REPLY "Connecting you to a human agent..."
    }

    -- Pricing
    WHEN CONTAINS "price" REPLY "Check our catalog at link.com/prices"

    -- Everything else: search local knowledge base
    OTHERWISE
        THINK(knowledge.txt) WAITING(loading.txt, 2) OR
        REPLY (fallback.txt, 1)
}

RUN BOT