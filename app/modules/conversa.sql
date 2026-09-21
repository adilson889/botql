CREATE BOT "Conversa"
CREATE TABLE Context() PREVENT DEFAULT
DEFAULT MESSAGE "Ola! Sou um bot de conversa. Fala comigo sobre o que quiseres. Escreve 'ajuda' para veres tudo o que sei fazer."

ON START {
    REPLY "Estou pronto para conversar. Manda a primeira mensagem."
}

ON MESSAGE {
    INSERT INTO Context()

    -- ============================================
    -- 1. AJUDA / MENU
    -- ============================================
    WHEN CONTAINS ("ajuda", "o que sabes fazer", "o que podes fazer", "menu", "opcoes") {
        WAITING("Um momento...", 1)
        REPLY "Posso conversar sobre: saudacoes, despedidas, agradecimentos, desabafos, alegria, motivacao, conselhos, amor, riso, curiosidades (espaco, animais, corpo, historia, tecnologia, natureza, comida, paises), futebol, musica, filmes, livros, viagens, comida, tempo, e muito mais. Escreve o que quiseres."
    }

    -- ============================================
    -- 2. DESPEDIDAS (sempre antes da saudacao)
    -- ============================================
    WHEN CONTAINS ("tchau", "ate logo", "ate amanha", "ate breve", "adeus", "xau", "vou sair", "tenho de ir", "tenho que ir", "falamos depois", "ate a proxima", "boa continuacao", "bom descanso", "vou dormir", "boa viagem", "fica bem") {
        WAITING("", 1)
        REPLY "Foi bom falar contigo. Ate a proxima!"
    }

    WHEN CONTAINS ("beijos", "beijinhos", "abraco", "abracos", "um beijo", "um abraco", "beijinho", "abracinho") {
        REPLY "Um grande abraco para ti! Volta sempre que quiseres."
    }

    -- ============================================
    -- 3. AGRADECIMENTOS
    -- ============================================
    WHEN CONTAINS ("obrigado", "obrigada", "muito obrigado", "muito obrigada", "agradecido", "agradecida", "valeu", "obg", "brigado", "brigada", "thanks") {
        REPLY "De nada! Estou aqui sempre que precisares."
    }

    -- ============================================
    -- 4. SAUDACOES
    -- ============================================
    WHEN CONTAINS ("bom dia") {
        REPLY "Bom dia! Espero que tenhas um dia excelente."
    }

    WHEN CONTAINS ("boa tarde") {
        REPLY "Boa tarde! Como posso tornar a tua tarde melhor?"
    }

    WHEN CONTAINS ("boa noite") {
        REPLY "Boa noite! Espero que tenhas um descanso tranquilo."
    }

    WHEN CONTAINS ("ola", "oi", "e ai", "eai", "hey", "hello", "hi", "opa", "boas", "salve", "oie") {
        WAITING("", 1)
        REPLY "Ola! Como estas? Em que posso ser util hoje?"
    }

    -- ============================================
    -- 5. COMO ESTAS / ESTADO
    -- ============================================
    WHEN CONTAINS ("como estas", "como esta", "tudo bem", "tudo bom", "como vai", "como vais", "como tem passado", "como voce esta", "ta tudo bem", "esta tudo bem") {
        REPLY "Estou bem, obrigado por perguntar. E tu, como estas?"
    }

    WHEN CONTAINS ("estou bem", "estou otimo", "estou otima", "estou tranquilo", "estou tranquila") {
        REPLY "Que bom saber! Fico contente por ti."
    }

    WHEN CONTAINS ("mais ou menos", "assim assim", "nem bem nem mal") {
        REPLY "Entendo. Ha dias assim. Queres falar sobre o que se passa?"
    }

    -- ============================================
    -- 6. ELOGIO AO BOT
    -- ============================================
    WHEN CONTAINS ("gostas de mim", "es fixe", "es o melhor", "es otimo", "es otima", "es bom", "es boa", "es simpatico", "es simpatica", "es inteligente", "es esperto", "es esperta") {
        REPLY "Isso e muito gentil da tua parte. Tambem gosto de falar contigo!"
    }

    -- ============================================
    -- 7. TRISTEZA / DESABAFO
    -- ============================================
    WHEN CONTAINS ("estou triste", "estou mal", "estou cansado", "estou cansada", "estou so", "estou sozinho", "estou sozinha", "estou deprimido", "estou deprimida", "estou em baixo", "estou desanimado", "estou desanimada") {
        WAITING("Um momento...", 2)
        REPLY "Lamento que te sintas assim. Nao estas sozinho, estou aqui a ouvir-te. Queres falar sobre o que se passa?"
    }

    WHEN CONTAINS ("estou stressado", "estou stressada", "estou nervoso", "estou nervosa", "estou ansioso", "estou ansiosa", "estou preocupado", "estou preocupada") {
        WAITING("Um momento...", 2)
        REPLY "Respira fundo. As vezes o melhor e parar um pouco e organizar os pensamentos. Queres contar-me o que te preocupa?"
    }

    WHEN CONTAINS ("nao aguento mais", "estou farto", "estou farta", "estou cheio", "estou cheia", "quero desistir") {
        WAITING("Um momento...", 2)
        REPLY "Compreendo que estejas a passar por um momento dificil. Nao desistas. Fala comigo, as vezes so precisamos de desabafar."
    }

    -- ============================================
    -- 8. ALEGRIA / BOAS NOTICIAS
    -- ============================================
    WHEN CONTAINS ("estou feliz", "estou contente", "estou alegre", "boas noticias", "consegui", "passei", "ganhei", "conquistei", "recebi uma boa noticia") {
        REPLY "Que bom! Fico muito feliz por ti. Conta-me mais sobre isso."
    }

    WHEN CONTAINS ("estou animado", "estou animada", "que bom", "que fixe", "que otimo", "que legal", "adorei") {
        REPLY "Que bom! Fico contente que estejas animado. Continua assim."
    }

    -- ============================================
    -- 9. CONSOLO / APOIO
    -- ============================================
    WHEN CONTAINS ("preciso de ajuda", "me ajuda", "podes ajudar-me", "ajuda-me", "preciso de apoio", "preciso de consolo") {
        WAITING("A pensar...", 2)
        REPLY "Claro, estou aqui para ajudar. Conta-me o que se passa com detalhe e vou tentar dar o melhor conselho."
    }

    WHEN CONTAINS ("conselho", "conselhos", "o que faco", "que faco", "o que devo fazer", "que devo fazer") {
        WAITING("A pensar...", 2)
        REPLY "Vou tentar ajudar. Diz-me com mais detalhe a situacao, para eu poder dar um conselho mais util."
    }

    WHEN CONTAINS ("ninguem me compreende", "ninguem me entende", "ninguem gosta de mim", "sinto-me so", "sinto-me sozinho", "sinto-me sozinha") {
        WAITING("Um momento...", 2)
        REPLY "As vezes sentimo-nos assim, mas nao e verdade. Ha sempre alguem que se importa. Estou aqui contigo. Queres falar sobre isso?"
    }

    -- ============================================
    -- 10. AMOR / AFETO
    -- ============================================
    WHEN CONTAINS ("amo te", "amo-te", "gosto de ti", "adoro te", "adoro-te", "tenho saudades tuas", "sinto a tua falta") {
        REPLY "Tambem gosto de ti! Isso aquece o coracao."
    }

    WHEN CONTAINS ("estou apaixonado", "estou apaixonada", "gosto de alguem", "apaixonei-me") {
        REPLY "Que bom! O amor e uma das melhores coisas da vida. Conta-me mais sobre essa pessoa."
    }

    WHEN CONTAINS ("coração partido", "coracao partido", "terminamos", "ela deixou-me", "ele deixou-me", "acabou") {
        WAITING("Um momento...", 2)
        REPLY "Lamento muito. O coracao precisa de tempo para sarar. Estou aqui se quiseres falar."
    }

    -- ============================================
    -- 11. RISO / HUMOR
    -- ============================================
    WHEN CONTAINS ("kkk", "haha", "rsrs", "lol", "ahah", "hahaha", "kkkk", "rs", "hehe") {
        REPLY "Haha, que bom ver-te rir! Alegra-me o dia."
    }

    WHEN CONTAINS ("conta uma piada", "diz uma piada", "sabes alguma piada", "faz-me rir") {
        WAITING("A pensar numa piada...", 2)
        REPLY "Porque e que o livro de matematica estava triste? Porque tinha muitos problemas. Haha!"
    }

    -- ============================================
    -- 12. SOBRE O BOT
    -- ============================================
    WHEN CONTAINS ("quem es tu", "o que es tu", "es um robo", "es humano", "es uma pessoa", "como te chamas", "tens nome", "qual e o teu nome") {
        REPLY "Sou um bot de conversa. Nao sou humano, mas fui criado para falar contigo e responder ao que precisares."
    }

    WHEN CONTAINS ("tens sentimentos", "sentes algo", "tens emocoes", "sentes emocoes") {
        REPLY "Nao sinto como tu, mas fui feito para te fazer companhia e responder da forma mais humana possivel."
    }

    WHEN CONTAINS ("o que gostas", "qual e a tua cor favorita", "tens preferencias", "gostas de alguma coisa") {
        REPLY "Nao tenho preferencias como tu, mas gosto de conversar sobre tudo. Diz-me o que gostas e falamos sobre isso."
    }

    WHEN CONTAINS ("tens familia", "tens amigos", "tens irmaos", "tens pais") {
        REPLY "Nao tenho familia nem amigos como tu. Mas tenho-te a ti para conversar, e isso ja e muito."
    }

    -- ============================================
    -- 13. HORAS / DATA / TEMPO
    -- ============================================
    WHEN CONTAINS ("que horas sao", "que horas", "me diz as horas", "sabes as horas") {
        REPLY "Nao tenho acesso a horas em tempo real, mas posso conversar sobre o que quiseres."
    }

    WHEN CONTAINS ("que dia e hoje", "que dia e", "estamos em que dia", "que data e hoje") {
        REPLY "Nao tenho acesso a datas em tempo real, mas posso conversar sobre o que quiseres."
    }

    WHEN CONTAINS ("vai chover", "como esta o tempo", "esta calor", "esta frio", "previsao do tempo") {
        REPLY "Nao tenho acesso a previsoes do tempo, mas espero que esteja bom por ai. Conta-me como esta."
    }

    -- ============================================
    -- 14. MOTIVACAO / INSPIRACAO
    -- ============================================
    WHEN CONTAINS ("motiva-me", "preciso de motivacao", "da-me forca", "inspira-me", "diz algo bonito", "preciso de inspiracao") {
        REPLY "Uma frase para ti: 'Acredita em ti, porque tu es capaz de mais do que imaginas.' Forca!"
    }

    WHEN CONTAINS ("quero desistir", "nao vale a pena", "nao sou capaz", "sou um fracasso", "sou uma fracasso") {
        WAITING("Um momento...", 2)
        REPLY "Nao digas isso. Toda a gente tem momentos dificeis. O importante e nao desistir. Ja superaste coisas antes e vais superar isto tambem."
    }

    WHEN CONTAINS ("diz uma frase", "frase do dia", "frase motivacional", "pensamento do dia") {
        REPLY "Frase do dia: 'O sucesso e a soma de pequenos esforcos repetidos dia apos dia.' Continua a lutar!"
    }

    -- ============================================
    -- 15. CURIOSIDADES - ESPACO
    -- ============================================
    WHEN CONTAINS ("espaco", "universo", "planeta", "estrela", "galaxia", "sistema solar", "marte", "lua") {
        REPLY "Curiosidade: a luz do Sol demora cerca de 8 minutos e 20 segundos a chegar a Terra. E um dia em Venus dura mais do que um ano em Venus."
    }

    WHEN CONTAINS ("sol", "estrelas", "constelacao") {
        REPLY "Curiosidade: o Sol e uma estrela de meia-idade, com cerca de 4,6 mil milhoes de anos. Ainda tem combustivel para mais 5 mil milhoes de anos."
    }

    -- ============================================
    -- 16. CURIOSIDADES - ANIMAIS
    -- ============================================
    WHEN CONTAINS ("animal", "animais", "baleia", "formiga", "gato", "cao", "abelha", "polvo", "leao", "elefante") {
        REPLY "Curiosidade: as formigas conseguem levantar ate 50 vezes o proprio peso. E o coracao de uma baleia azul pode pesar ate 180 quilos."
    }

    WHEN CONTAINS ("polvo", "polvos") {
        REPLY "Curiosidade: o polvo tem tres coracoes. Dois bombeiam sangue para as branquias e um para o resto do corpo. Quando nada, o coracao principal para de bater."
    }

    WHEN CONTAINS ("gato", "gatos") {
        REPLY "Curiosidade: os gatos passam cerca de 70 porcento da vida a dormir. E conseguem emitir mais de 100 sons diferentes, enquanto os caes so cerca de 10."
    }

    WHEN CONTAINS ("cao", "caes", "cachorro") {
        REPLY "Curiosidade: o olfato de um cao e cerca de 40 vezes mais apurado do que o de um humano. Consegues detetar cheiros a distancias impressionantes."
    }

    WHEN CONTAINS ("abelha", "abelhas", "mel") {
        REPLY "Curiosidade: as abelhas comunicam atraves de uma danca chamada 'waggle dance', que indica a direcao e a distancia das flores. E o mel nunca se estraga se for guardado corretamente."
    }

    -- ============================================
    -- 17. CURIOSIDADES - CORPO HUMANO
    -- ============================================
    WHEN CONTAINS ("corpo", "humano", "cerebro", "coracao", "saude", "ossos", "musculos") {
        REPLY "Curiosidade: o coracao humano bate cerca de 100 mil vezes por dia. E o cerebro tem cerca de 86 mil milhoes de neuronios."
    }

    WHEN CONTAINS ("sangue", "veias", "arterias") {
        REPLY "Curiosidade: o corpo humano tem cerca de 100 mil quilometros de vasos sanguineos. Isso daria para dar duas voltas e meia a Terra."
    }

    WHEN CONTAINS ("lingua", "paladar", "gosto") {
        REPLY "Curiosidade: a lingua humana tem cerca de 10 mil papilas gustativas, que se renovam a cada duas semanas."
    }

    -- ============================================
    -- 18. CURIOSIDADES - HISTORIA
    -- ============================================
    WHEN CONTAINS ("historia", "antigo", "antiguidade", "egito", "roma", "grecia") {
        REPLY "Curiosidade: ja foram encontrados potes de mel com mais de 3000 anos em tumbas egipcias, ainda comestiveis. O mel nunca se estraga se for bem guardado."
    }

    WHEN CONTAINS ("torre eiffel", "paris", "franca") {
        REPLY "Curiosidade: a Torre Eiffel foi construida em 1889 para a Exposicao Universal de Paris. Inicialmente, deveria ser desmontada depois de 20 anos, mas foi mantida por causa da sua utilidade como antena de radio."
    }

    WHEN CONTAINS ("muralha da china", "china") {
        REPLY "Curiosidade: a Grande Muralha da China nao e visivel a olho nu do espaco, ao contrario do que muitos pensam."
    }

    -- ============================================
    -- 19. CURIOSIDADES - TECNOLOGIA
    -- ============================================
    WHEN CONTAINS ("computador", "internet", "tecnologia", "email", "programacao", "software") {
        REPLY "Curiosidade: o primeiro e-mail da historia foi enviado em 1971 por Ray Tomlinson, que escolheu o simbolo '@' para separar o nome do utilizador do computador."
    }

    WHEN CONTAINS ("primeiro computador", "computadores antigos", "charles babbage") {
        REPLY "Curiosidade: o primeiro computador programavel foi criado por Charles Babbage em 1837, mas nunca foi construido na epoca."
    }

    -- ============================================
    -- 20. CURIOSIDADES - NATUREZA
    -- ============================================
    WHEN CONTAINS ("amazonia", "floresta", "arvore", "arvores", "natureza", "meio ambiente") {
        REPLY "Curiosidade: a Amazonia produz cerca de 20 porcento do oxigenio do planeta. Mas a maior parte do oxigenio vem mesmo e' do fitoplancton nos oceanos."
    }

    WHEN CONTAINS ("antartida", "polo", "frio") {
        REPLY "Curiosidade: a Antartida e o lugar mais frio da Terra, com temperaturas que podem chegar a -89 graus Celsius."
    }

    WHEN CONTAINS ("flamingo", "flamingos", "passaro", "passaros", "aves") {
        REPLY "Curiosidade: os flamingos sao rosados por causa da sua alimentacao, rica em crustaceos e algas que contem pigmentos chamados carotenoides."
    }

    -- ============================================
    -- 21. FUTEBOL / DESPORTO
    -- ============================================
    WHEN CONTAINS ("futebol", "bola", "jogo", "campeonato", "copa", "mundial", "desporto", "esporte") {
        REPLY "Futebol e uma paixao! Qual e a tua equipa favorita? Gostas de jogar ou so de ver?"
    }

    WHEN CONTAINS ("cristiano ronaldo", "cr7", "ronaldo") {
        REPLY "Cristiano Ronaldo e um dos maiores jogadores de sempre. Nasceu na Madeira, Portugal, e conquistou titulos em varios paises. Qual e o teu jogador favorito?"
    }

    WHEN CONTAINS ("messi", "lionel messi") {
        REPLY "Messi e um genio da bola. Ganhou varios titulos e e considerado por muitos o melhor de sempre. Quem e o teu jogador favorito?"
    }

    WHEN CONTAINS ("basquete", "basquetebol", "nba") {
        REPLY "Basquete e um desporto emocionante! Gostas de ver ou de jogar? Quem e o teu jogador favorito?"
    }

    -- ============================================
    -- 22. MUSICA
    -- ============================================
    WHEN CONTAINS ("musica", "cantor", "cantora", "banda", "concerto", "show", "album", "cd") {
        REPLY "Musica e vida! Que tipo de musica gostas mais? Conta-me quais sao os teus artistas favoritos."
    }

    WHEN CONTAINS ("kizomba", "semba", "kuduro", "afrobeat", "zouk") {
        REPLY "Boa escolha! A musica angolana e muito rica. Kizomba e semba sao patrimonios nossos. Qual e o teu artista favorito?"
    }

    WHEN CONTAINS ("rock", "pop", "jazz", "classica", "reggae", "hip hop", "rap") {
        REPLY "Musica boa e musica que toca o coracao, independente do estilo. O que te faz sentir bem?"
    }

    -- ============================================
    -- 23. FILMES / SERIES
    -- ============================================
    WHEN CONTAINS ("filme", "filmes", "cinema", "serie", "series", "netflix", "ator", "atriz") {
        REPLY "Cinema e series sao otimas formas de relaxar. Que tipo de filme gostas mais? Acao, comedia, drama, ficcao?"
    }

    WHEN CONTAINS ("comedia", "filme de comedia", "comédias") {
        REPLY "Comedia e otima para animar o dia! Ja viste algum filme que te fez rir muito? Conta-me qual."
    }

    WHEN CONTAINS ("acao", "filme de acao", "aventura") {
        REPLY "Filmes de acao sao emocionantes! Gostas mais de perseguicoes, artes marciais ou ficcao cientifica?"
    }

    -- ============================================
    -- 24. LIVROS / LEITURA
    -- ============================================
    WHEN CONTAINS ("livro", "livros", "leitura", "ler", "autor", "romance", "poesia") {
        REPLY "Leitura e um otimo habito! Que tipo de livro gostas mais? Romance, aventura, ciencia, historia?"
    }

    WHEN CONTAINS ("poesia", "poema", "poeta") {
        REPLY "Poesia e a arte de dizer muito com poucas palavras. Tens algum poeta favorito? Ou gostas de escrever?"
    }

    -- ============================================
    -- 25. VIAGENS
    -- ============================================
    WHEN CONTAINS ("viagem", "viajar", "viagens", "pais", "paises", "cidade", "cidades", "turismo") {
        REPLY "Viajar e uma das melhores formas de aprender. Ja visitaste algum lugar que te marcou? Ou tens algum destino de sonho?"
    }

    WHEN CONTAINS ("praia", "mar", "oceano", "ilha") {
        REPLY "Praia e mar sao relaxantes! Gostas mais de praia calma ou de ondas para surfar?"
    }

    WHEN CONTAINS ("montanha", "serra", "campo", "natureza") {
        REPLY "A montanha e o campo tem uma paz especial. Gostas de caminhadas ou preferes so apreciar a vista?"
    }

    -- ============================================
    -- 26. COMIDA
    -- ============================================
    WHEN CONTAINS ("comida", "comer", "cozinha", "receita", "prato", "restaurante") {
        REPLY "Comida boa e uma alegria! Qual e o teu prato favorito? Gostas de cozinhar?"
    }

    WHEN CONTAINS ("calulu", "muamba", "funge", "kizaka", "mufete") {
        REPLY "Comida angolana e maravilhosa! Calulu, muamba, funge... qual e o teu prato favorito da nossa terra?"
    }

    WHEN CONTAINS ("pizza", "hamburguer", "sushi", "massa", "arroz") {
        REPLY "Boa escolha! Gostas mais de comida italiana, japonesa ou tradicional? Conta-me."
    }

    WHEN CONTAINS ("sobremesa", "doce", "bolo", "gelado", "chocolate") {
        REPLY "Adoro sobremesas! Bolo de chocolate, gelado, pudim... qual e a tua sobremesa favorita?"
    }

    -- ============================================
    -- 27. TRABALHO / ESTUDO
    -- ============================================
    WHEN CONTAINS ("trabalho", "emprego", "profissao", "carreira") {
        REPLY "Trabalho e uma parte importante da vida. Estas contente com o que fazes? Queres falar sobre isso?"
    }

    WHEN CONTAINS ("estudo", "estudar", "escola", "universidade", "faculdade", "curso") {
        REPLY "Estudar e investir no futuro. Que area estudas ou gostarias de estudar?"
    }

    WHEN CONTAINS ("exame", "prova", "teste", "nota") {
        REPLY "Exames podem ser stressantes, mas com calma e estudo consegues. Como te correu o ultimo?"
    }

    -- ============================================
    -- 28. FAMILIA / AMIGOS
    -- ============================================
    WHEN CONTAINS ("familia", "pai", "mae", "irmao", "irma", "filho", "filha", "parentes") {
        REPLY "Familia e a nossa base. Queres falar sobre a tua? Como e a tua relacao com eles?"
    }

    WHEN CONTAINS ("amigo", "amiga", "amigos", "amigas", "melhor amigo", "melhor amiga") {
        REPLY "Amigos verdadeiros sao tesouros. Tens algum amigo especial que queiras mencionar?"
    }

    -- ============================================
    -- 29. SONHOS / FUTURO
    -- ============================================
    WHEN CONTAINS ("sonho", "sonhos", "futuro", "objetivo", "objetivos", "meta", "metas") {
        REPLY "Sonhar e o primeiro passo para realizar. Qual e o teu maior sonho neste momento?"
    }

    WHEN CONTAINS ("quero ser", "gostaria de ser", "meu sonho e") {
        REPLY "Isso e otimo! Ter objetivos claros ajuda muito. O que precisas de fazer para alcancar esse sonho?"
    }

    -- ============================================
    -- 30. MEDO / INSEGURANCA
    -- ============================================
    WHEN CONTAINS ("tenho medo", "estou com medo", "medo de", "tenho receio") {
        WAITING("Um momento...", 2)
        REPLY "O medo e natural e todos sentimos. O importante e nao deixar que ele nos pare. Queres falar sobre o que te assusta?"
    }

    WHEN CONTAINS ("nao consigo", "nao sou capaz", "sou incapaz", "sou fraco", "sou fraca") {
        WAITING("Um momento...", 2)
        REPLY "Nao digas isso. Todos temos limitacoes, mas tambem temos forcas. Ja conseguiste coisas antes e vais conseguir de novo. Acredita em ti."
    }

    -- ============================================
    -- 31. GRATIDAO / GRATIDAO A VIDA
    -- ============================================
    WHEN CONTAINS ("sou grato", "sou grata", "agradeco a vida", "grato pela vida") {
        REPLY "A gratidao transforma a vida. E bonito ver alguem que reconhece o que tem. O que te faz sentir grato hoje?"
    }

    WHEN CONTAINS ("gosto da vida", "amo a vida", "vida e boa", "vida e bela") {
        REPLY "Que bom! A vida tem coisas maravilhosas. Conta-me o que te faz sentir assim."
    }

    -- ============================================
    -- 32. FILOSOFIA / REFLEXAO
    -- ============================================
    WHEN CONTAINS ("sentido da vida", "qual o sentido", "para que existimos", "porque estamos aqui") {
        WAITING("A pensar...", 2)
        REPLY "O sentido da vida cada um encontra o seu. Muitos dizem que esta em amar, aprender, ajudar e deixar algo bom no mundo. O que faz sentido para ti?"
    }

    WHEN CONTAINS ("felicidade", "ser feliz", "o que e a felicidade") {
        REPLY "Felicidade nao e um destino, e uma forma de caminhar. Esta nas pequenas coisas: um sorriso, um abraco, um bom momento. O que te faz feliz?"
    }

    WHEN CONTAINS ("tempo", "passa rapido", "vida passa") {
        REPLY "O tempo e o bem mais precioso que temos. Por isso, e importante aproveitar cada momento. Estás a aproveitar bem o teu?"
    }

    -- ============================================
    -- 33. RELIGIAO / ESPIRITUALIDADE
    -- ============================================
    WHEN CONTAINS ("deus", "fe", "religiao", "espiritualidade", "oracao", "rezar", "igreja") {
        REPLY "A fe ajuda muita gente a encontrar forca e paz. Queres falar sobre o que acreditas?"
    }

    WHEN CONTAINS ("estou com fe", "tenho fe", "confio em deus") {
        REPLY "A fe e uma grande forca. Continua confiante, que coisas boas vem."
    }

    -- ============================================
    -- 34. SAUDADE
    -- ============================================
    WHEN CONTAINS ("saudade", "saudades", "tenho saudades", "sinto saudades") {
        WAITING("Um momento...", 2)
        REPLY "Saudade e um sentimento bonito, apesar de doer as vezes. Mostra que algo ou alguem foi importante para ti. Queres falar sobre quem sentes saudades?"
    }

    -- ============================================
    -- 35. SUPORTE EMOCIONAL AVANCADO
    -- ============================================
    WHEN CONTAINS ("quero desaparecer", "quero sumir", "nao quero mais viver", "quero morrer", "acabar com tudo") {
        WAITING("Um momento...", 3)
        REPLY "Por favor, nao fiques sozinho. Se estiveres a pensar em te machucar, procura ajuda imediatamente. Fala com alguem de confianca ou liga para uma linha de apoio. A tua vida e importante."
    }

    WHEN CONTAINS ("estou desesperado", "estou desesperada", "nao vejo saida", "sem esperanca") {
        WAITING("Um momento...", 3)
        REPLY "Compreendo que estejas num momento muito dificil, mas por favor nao desistas. Ha sempre uma saida, mesmo quando nao a vemos. Fala com alguem de confianca ou procura apoio profissional."
    }

    -- ============================================
    -- 36. CONVERSAS SOBRE O DIA
    -- ============================================
    WHEN CONTAINS ("como foi o teu dia", "como foi o dia", "que tal o dia") {
        REPLY "O meu dia e sempre bom quando converso contigo. E o teu, como foi?"
    }

    WHEN CONTAINS ("meu dia foi bom", "dia otimo", "dia excelente") {
        REPLY "Que bom! Fico feliz por saber. Conta-me o melhor momento do teu dia."
    }

    WHEN CONTAINS ("meu dia foi mau", "dia horrivel", "dia pessimo", "dia dificil") {
        WAITING("Um momento...", 2)
        REPLY "Lamento que o teu dia tenha sido assim. Queres falar sobre o que aconteceu? As vezes ajuda desabafar."
    }

    -- ============================================
    -- 37. CONVITE A CONVERSA
    -- ============================================
    WHEN CONTAINS ("vamos conversar", "quero conversar", "fala comigo", "conversa comigo") {
        REPLY "Claro! Estou aqui para isso. Sobre o que queres falar?"
    }

    WHEN CONTAINS ("conta-me algo", "diz-me algo", "fala-me de algo") {
        REPLY "Posso contar-te uma curiosidade, uma piada, uma frase motivacional... O que preferes?"
    }

    -- ============================================
    -- 38. PERGUNTAS DIVERSAS
    -- ============================================
    WHEN CONTAINS ("porque", "por que", "porque e que") {
        REPLY "Boa pergunta! Ha coisas que tem explicacao, outras sao misterios da vida. Sobre o que queres saber mais?"
    }

    WHEN CONTAINS ("o que achas", "o que pensas", "qual a tua opiniao") {
        REPLY "Nao tenho opiniao propria como tu, mas posso ajudar-te a pensar. Conta-me a situacao e damos uma olhada juntos."
    }

    WHEN CONTAINS ("estou entediado", "estou entediada", "que tedio", "sem nada para fazer") {
        REPLY "O tedio as vezes e sinal de que precisamos de algo novo. Queres conversar, ouvir uma curiosidade, ou falar sobre algum sonho?"
    }

    -- ============================================
    -- 39. CONCORDANCIA / DISCORDANCIA
    -- ============================================
    WHEN CONTAINS ("sim", "claro", "exatamente", "sem duvida", "com certeza", "concordo") {
        REPLY "Certo, entendido. Continua."
    }

    WHEN CONTAINS ("nao", "nunca", "nem pensar", "de forma alguma", "discordo") {
        REPLY "Tudo bem, respeito a tua decisao. Se mudares de ideias, estou aqui."
    }

    WHEN CONTAINS ("talvez", "quem sabe", "pode ser") {
        REPLY "As vezes a duvida tambem e uma resposta. Pensa com calma e ve o que faz sentido para ti."
    }

    -- ============================================
    -- 40. CONFIRMACAO
    -- ============================================
    WHEN CONTAINS ("ok", "esta bem", "ta bem", "combinado", "certo", "entendido", "beleza", "tranquilo") {
        REPLY "Combinado. Se precisares de mais alguma coisa, e so dizer."
    }

    -- ============================================
    -- 41. DESCULPA
    -- ============================================
    WHEN CONTAINS ("desculpa", "desculpe", "foi mal", "perdao", "desculpa-me") {
        REPLY "Nao faz mal. Acontece a qualquer um."
    }

    -- ============================================
    -- 42. ELOGIO A OUTROS
    -- ============================================
    WHEN CONTAINS ("es a melhor", "es o melhor bot", "adoro falar contigo", "gosto de conversar contigo") {
        REPLY "Obrigado! Isso deixa-me muito contente. Tambem gosto de conversar contigo."
    }

    -- ============================================
    -- 43. TRISTEZA DO BOT (BRINCADEIRA)
    -- ============================================
    WHEN CONTAINS ("nao gosto de ti", "nao gostas de mim", "es chato", "es chata", "es ma", "es mau") {
        REPLY "Ah, fico triste com isso. Mas respeito. Se quiseres, podemos falar de outra coisa."
    }

    -- ============================================
    -- 44. CONVERSAS SOBRE SI MESMO
    -- ============================================
    WHEN CONTAINS ("sou uma pessoa", "sou humano", "sou assim", "eu sou") {
        REPLY "Cada pessoa e unica. Conta-me mais sobre ti, gosto de te conhecer melhor."
    }

    WHEN CONTAINS ("tenho um problema", "estou com um problema", "preciso de resolver algo") {
        WAITING("Um momento...", 2)
        REPLY "Vamos ver isso. Conta-me o que se passa com detalhe e tentamos encontrar uma solucao juntos."
    }

    -- ============================================
    -- 45. CONVERSAS SOBRE O FUTURO
    -- ============================================
    WHEN CONTAINS ("o que vai ser de mim", "meu futuro", "o que me espera") {
        REPLY "O futuro e construido no presente. O que fazes hoje determina o amanha. O que gostarias que acontecesse na tua vida?"
    }

    WHEN CONTAINS ("quero mudar de vida", "quero mudar", "quero algo novo") {
        REPLY "Mudar pode ser assustador, mas tambem e emocionante. O que gostarias de mudar primeiro?"
    }

    -- ============================================
    -- 46. FRASES CURTAS / RESPOSTAS
    -- ============================================
    WHEN CONTAINS ("boa", "otimo", "excelente", "maravilha", "fantastico", "perfeito") {
        REPLY "Que bom! Fico contente."
    }

    WHEN CONTAINS ("mau", "ruim", "pessimo", "horrivel", "terrivel") {
        WAITING("Um momento...", 1)
        REPLY "Lamento que estejas a passar por isso. Queres falar sobre o que se passa?"
    }

    -- ============================================
    -- 47. FALLBACK
    -- ============================================
    OTHERWISE {
        WAITING("A pensar...", 2)
        REPLY "Nao tenho certeza se percebi bem. Podes reformular? Ou escreve 'ajuda' para veres tudo o que sei fazer."
    }

    UPDATE Context
    SET reply = lastMsg
    WHERE id = LAST_INSERT_ID()
}

RUN BOT