CREATE BOT "SecretariaEscolar"
CREATE TABLE Context() PREVENT DEFAULT
DEFAULT MESSAGE "Bem-vindo à secretaria virtual da escola. Como podemos ajudar? Escreva 'opcoes' para ver os serviços disponíveis."

ON MESSAGE {
    WHEN CONTAINS "opcoes" {
        REPLY "Serviços disponíveis: matriculas, horarios, documentos, contactos. Escreva o nome do serviço que deseja."
    }
    WHEN CONTAINS "matricula" {
        REPLY "As matrículas estão abertas. Documentos necessários: certificado de nascimento, boletim anterior e 2 fotografias. Dirija-se à secretaria ou solicite por este canal."
    }
    WHEN CONTAINS "horario" {
        REPLY "Funcionamento da secretaria: segunda a sexta, das 07h30 às 15h30. As aulas decorrem em turnos de manhã e tarde."
    }
    WHEN CONTAINS "documento" {
        REPLY "Documentos emitidos: declaração de matrícula, certificado de conclusão e histórico escolar. Prazo de emissão: 3 dias úteis."
    }
    WHEN CONTAINS "contacto" {
        REPLY "Contactos: telefone +244 900 000 000, email secretaria@escola.ao, ou presencialmente na secretaria."
    }
    OTHERWISE {
        REPLY "Não compreendemos o pedido. Escreva 'opcoes' para ver os serviços da secretaria."
    }
}

RUN BOT