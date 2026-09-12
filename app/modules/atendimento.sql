CREATE BOT "Atendimento"
CREATE TABLE Context() PREVENT DEFAULT

ON START {
    REPLY "Olá! Sou o bot de atendimento. Escreve 'ajuda' para veres o que posso fazer."
}

ON MESSAGE {
    WHEN CONTAINS "ajuda" {
        REPLY "Posso responder a dúvidas simples. Escreve 'horário' ou 'contacto'."
    }
    WHEN CONTAINS "horário" {
        REPLY "Estamos disponíveis de segunda a sexta, das 8h às 18h."
    }
    WHEN CONTAINS "contacto" {
        REPLY "Podes falar connosco por este mesmo chat a qualquer momento."
    }
    OTHERWISE {
        REPLY "Não percebi. Escreve 'ajuda' para veres as opções disponíveis."
    }
}

RUN BOT
