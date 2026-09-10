CREATE BOT "ModeradorDiscord"
PLATFORM DISCORD

CONNECT DISCORD BOT "SEU_TOKEN_DO_BOT_DISCORD"

ON MESSAGE {
    WHEN CONTAINS "regras" REPLY "Ve as regras no canal #regras."
    WHEN CONTAINS "ajuda" REPLY "Chama um moderador com @staff."
    OTHERWISE REPLY "Nao entendi, tenta reformular."
}

RUN BOT