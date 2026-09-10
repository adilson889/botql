CREATE BOT "AssistenteSlack"
PLATFORM SLACK

CONNECT SLACK BOT "SEU_TOKEN_OAUTH_SLACK"

ON MESSAGE {
    WHEN CONTAINS "reuniao" REPLY "Agenda de reunioes: link.com/agenda"
    WHEN CONTAINS "ferias" REPLY "Pedidos de ferias: link.com/rh"
    OTHERWISE REPLY "Nao encontrei isso, tenta o canal #rh."
}

RUN BOT