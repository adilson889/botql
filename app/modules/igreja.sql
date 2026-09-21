CREATE BOT "SecretariaIgreja"
CREATE TABLE Context() PREVENT DEFAULT
DEFAULT MESSAGE "A paz do Senhor. Bem-vindo à secretaria virtual da igreja. Escreva 'opcoes' para ver os serviços disponíveis."

ON MESSAGE {
    WHEN CONTAINS "opcoes" {
        REPLY "Informações disponíveis: cultos, batismos, casamentos, visitas e contactos. Escreva o assunto desejado."
    }
    WHEN CONTAINS "culto" {
        REPLY "Horários dos cultos: domingo às 09h00 (culto de adoração) e quarta-feira às 18h00 (culto de ensino)."
    }
    WHEN CONTAINS "batismo" {
        REPLY "Para batismo, é necessário inscrição prévia na secretaria. Dirija-se à igreja ou solicite por este canal."
    }
    WHEN CONTAINS "casamento" {
        REPLY "Para celebração de casamento, agende uma reunião com a secretaria. Documentos serão solicitados no atendimento."
    }
    WHEN CONTAINS "visita" {
        REPLY "Solicitações de visita pastoral podem ser feitas por este canal. Informe o nome, endereço e motivo."
    }
    WHEN CONTAINS "contacto" {
        REPLY "Contactos: telefone +244 900 000 000, email secretaria@igreja.ao, ou presencialmente na secretaria."
    }
    OTHERWISE {
        REPLY "Não compreendemos o pedido. Escreva 'opcoes' para ver os serviços disponíveis."
    }
}

RUN BOT