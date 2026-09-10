CREATE BOT "AtendimentoWhatsApp"
PLATFORM WHATSAPP

CONNECT WHATSAPP ACCOUNT "SEU_TOKEN_WHATSAPP_BUSINESS"

CREATE TABLE Context() PREVENT DEFAULT
DEFAULT MESSAGE "Ola! Bem-vindo ao atendimento. Como posso ajudar?"

ON MESSAGE {
    INSERT INTO Context()
    WHEN CONTAINS "horario" REPLY "Atendemos das 8h as 18h, seg a sex."
    OTHERWISE REPLY "Pode detalhar melhor sua duvida?"
}

RUN BOT