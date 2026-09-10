CREATE BOT "SuporteTelegram"
PLATFORM TELEGRAM

CONNECT TELEGRAM CHANNEL "SEU_TOKEN_DO_BOTFATHER"

ON MESSAGE {
    WHEN CONTAINS ("oi", "ola") REPLY "Ola! Em que posso ajudar?"
    WHEN CONTAINS "preco" REPLY "Confira o catalogo: link.com"
    OTHERWISE REPLY "Desculpe, nao entendi."
}

RUN BOT