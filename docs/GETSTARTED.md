# BotQL:  Bot Query Language

<p align="justify">
<b>BotQL</b> é uma <b>linguagem de regras</b> simples, inspirada em SQL, para criar bots sem precisar de escrever código tradicional.
</p>

<p align="justify">
Todos os comandos são escritos em <b>MAIÚSCULAS</b>. Blocos com mais de uma ação usam chaves <code>{ }</code>.
</p>

<p align="justify">
Vive no mesmo ficheiro <code>.sql</code>, com comandos reais de banco de dados — o bot age e persiste dados na mesma linguagem, sem sair do BotQL.
</p>

---

## Estrutura Geral

```sql
IMPORT {ficheiro.sql}

CREATE BOT "NomeDoBot"
PLATFORM <PLATAFORMA>

CONNECT <SERVIÇO> <TIPO> "<credencial>"

CREATE TABLE <tabela> (<colunas>) [PREVENT DEFAULT] [DEFAULT MESSAGE ...]

ON <EVENTO> {
    <AÇÃO>
    <AÇÃO>
}

RUN BOT
```

---

## Palavras-chave

| Comando | Descrição |
|---|---|
| `CREATE BOT "nome"` | Cria um novo bot com o nome indicado |
| `PLATFORM` | Define a plataforma principal (WHATSAPP, TELEGRAM, DISCORD) |
| `CONNECT` | Liga o bot a um serviço externo (canal, conta, API) |
| `CONNECT RESPONSE <alias>` | Liga o bot a uma IA usando um valor já importado (token) — só liga, não dispara nada sozinho |
| `CREATE TABLE` | Cria uma tabela para guardar dados do bot |
| `PREVENT DEFAULT` | Modificador do `CREATE TABLE`: cria só se não existir, sem erro se já existir |
| `DEFAULT MESSAGE` | Modificador do `CREATE TABLE`: mensagem enviada automaticamente na primeira vez que um `client` aparece nessa tabela |
| `Context()` | Nome de tabela reservado — schema pré-mapeado no interpretador, sem precisar declarar colunas |
| `INSERT INTO` | Guarda uma nova linha na tabela |
| `UPDATE` / `SET` / `WHERE` | Atualiza uma linha existente |
| `LAST_INSERT_ID()` | Referencia o id da última linha inserida |
| `ON` | Define um evento que dispara ações |
| `WHERE` | Filtra a condição de um evento ou de uma query |
| `CONTAINS` | Verifica se uma mensagem contém um texto (uma palavra, uma lista inline, ou um ficheiro `.txt` — ver secção própria) |
| `OR` | Combina múltiplas condições |
| `WHEN` | Testa uma condição dentro de um bloco `ON MESSAGE` |
| `OTHERWISE` | Ação padrão quando nenhum `WHEN` é satisfeito |
| `REPLY` | Envia uma resposta de texto (texto direto ou de um ficheiro indexado — ver secção própria) |
| `FORWARD TO` | Reencaminha a mensagem para outro contacto/canal |
| `PARSE SIGNAL` | Interpreta um sinal recebido (ex: sinais de trading) |
| `SEND TO` | Envia dados/sinal para outra plataforma |
| `UNKNOWN` | Evento disparado quando nada corresponde |
| `START` | Evento disparado quando o bot arranca |
| `RUN BOT` | Inicia a execução do bot |
| `IMPORT {ficheiro.sql}` | Importa e junta o conteúdo de outro ficheiro `.sql` antes de correr |
| `IMPORT {ficheiro.txt, N}` | Lê só a entrada N de um ficheiro de valores, sem importar código |
| `IMPORT {..., N} AS <alias>` | Dá nome a um valor importado, para poder referenciá-lo depois pelo alias |
| `Response()` / `Response(<alias>)` | Dispara o ciclo: envia a mensagem atual para a IA ligada, espera e devolve a resposta como texto. Sem alias, só funciona com uma única IA ligada; com alias, escolhe qual delas usar |
| `THINK(ficheiro.txt)` | Faz retrieval local (sem IA, sem rede) sobre um ficheiro de conhecimento e responde com o conteúdo mais relevante, se a confiança for suficiente |
| `THINK(ficheiro.txt) OR REPLY ...` | Mesmo que acima, com um fallback explícito para quando o `THINK` não consegue responder com confiança suficiente |
| `WAITING(...)` | Mostra um texto/animação de "a processar" e segura por um tempo mínimo. Pode vir logo a seguir a um `THINK` (reaproveita o tempo da busca) ou sozinho, como ação independente antes de qualquer outra coisa lenta (ex: `Response()`) |

---

## CONTAINS: as três formas

<p align="justify">
Todas as formas de <code>CONTAINS</code> são <b>case-insensitive</b> ("OLA", "Ola" e "ola" batem todas com <code>CONTAINS "ola"</code>) e podem ser combinadas com <code>OR</code> dentro do mesmo <code>WHEN</code>.
</p>

### 1. Palavra única (forma original)

```sql
WHEN CONTAINS "oi" OR CONTAINS "ola" {
    REPLY "Ola! Como posso ajudar?"
}
```

<p align="justify">
Prático para 2-3 palavras. Para listas maiores, repetir <code>OR CONTAINS</code> fica longo e difícil de ler — usa-se uma das duas formas abaixo.
</p>

### 2. Lista inline

```sql
WHEN CONTAINS ("oi", "ola", "boa tarde", "boa noite", "bom dia") {
    REPLY "Ola! Como posso ajudar?"
}
```

<p align="justify">
Basta uma das palavras da lista aparecer na mensagem para a condição ser verdadeira. Boa para listas de tamanho médio (5-20 palavras) que fazem sentido ficar visíveis dentro do próprio <code>.sql</code>.
</p>

### 3. Lista a partir de um ficheiro `.txt`

```sql
WHEN CONTAINS KEYWORDS(saudacoes.txt) {
    REPLY "Ola! Como posso ajudar?"
}
```

<p align="justify">
Para listas grandes (100+ palavras) que poluiriam o <code>.sql</code>. O nome do ficheiro <b>não leva aspas</b> — é um nome de ficheiro, não uma string de busca, por isso fica visualmente diferente de <code>CONTAINS "texto"</code>.
</p>

<p align="justify">
O ficheiro é lido uma vez (e mantido em cache) na primeira mensagem que avalia essa condição, não a cada mensagem recebida.
</p>

<p align="justify">
<b>Formato do <code>.txt</code>:</b> uma palavra ou frase por linha, sem aspas, sem vírgulas, sem comentários, sem qualquer outra sintaxe misturada — um ficheiro serve só para uma lista, evita ambiguidade sobre o que é keyword e o que não é.
</p>

```
oi
ola
boa tarde
boa noite
bom dia
```

---

## REPLY a partir de um ficheiro indexado

<p align="justify">
Além de <code>REPLY "texto direto"</code>, o <code>REPLY</code> também lê uma entrada numerada de um ficheiro externo:
</p>

```sql
REPLY (respostas.txt, 1)
```

<p align="justify">
O ficheiro de entradas numeradas aceita <b>duas formas</b>, nunca misturadas dentro da mesma entrada — a forma escolhida para a entrada N é reconhecida automaticamente pelo que vem logo a seguir ao <code>N-</code>.
</p>

### Forma 1 — uma linha só (`N- valor`)

<p align="justify">
A forma original, para respostas curtas de uma linha:
</p>

```
1- Ola! Como posso ajudar?
2- Desculpe, nao percebi. Escreve "ajuda".
```

<p align="justify">
<code>REPLY (respostas.txt, 1)</code> procura a linha que começa por <code>1-</code> e usa o texto a seguir ao traço, até ao fim da linha, como resposta.
</p>

### Forma 2 — bloco entre chaves (`N-{ ... }`)

<p align="justify">
Para respostas que precisam de mais de uma linha — texto com opções em lista, um bloco de HTML, um trecho de Markdown com títulos e parágrafos:
</p>

```
3-{
Qual serviço você quer?
- Suporte técnico
- Vendas
- Cancelar
}
```

<p align="justify">
Tudo entre a <code>{</code> que abre e a <code>}</code> que fecha pertence à entrada — incluindo quebras de linha. A leitura é <b>rigorosa quanto ao aninhamento</b>: se o conteúdo lá dentro também tiver chaves (por exemplo um atributo <code>style="{color:red}"</code> dentro de HTML), essas chaves internas contam para o aninhamento e não fecham a entrada antes da hora — só fecha na <code>}</code> que corresponde exatamente à <code>{</code> que abriu:
</p>

```
4-{
<div style="{color:red}">
  <p>Formulário de contacto</p>
</div>
}
```

<p align="justify">
Uma <code>{</code> sem a <code>}</code> correspondente antes do fim do ficheiro é erro — nunca é ignorado silenciosamente.
</p>

<p align="justify">
Este é o mesmo formato de ficheiro usado por <code>IMPORT {ficheiro.txt, N}</code>, descrito a seguir — as duas formas (linha e bloco) valem também para <code>IMPORT</code>, e também para o ficheiro usado em <code>WAITING(...)</code>.
</p>

---

## IMPORT: as duas formas

### 1. Importar outro ficheiro `.sql`

```sql
IMPORT {respostas.sql}
IMPORT {sinais.sql}

CREATE BOT "MeuBot"
PLATFORM WHATSAPP

RUN BOT
```

<p align="justify">
Tal como o <code>SOURCE</code> do cliente MySQL ou o <code>\i</code> do <code>psql</code>, isto não é uma funcionalidade da linguagem SQL em si — é o <b>interpretador do BotQL</b> que resolve: ao encontrar <code>IMPORT {ficheiro.sql}</code>, lê o ficheiro indicado e junta o conteúdo antes de processar o resto. Permite dividir um bot grande em vários ficheiros mais pequenos e organizados.
</p>

- `IMPORT` é sempre resolvido antes de qualquer outro comando, independente de onde aparece no ficheiro.
- Um ficheiro importado pode conter blocos `ON` prontos a usar — o interpretador junta tudo como se fosse um único ficheiro.

### 2. Importar uma entrada de um ficheiro de valores

```sql
IMPORT {env.txt, 1}
```

<p align="justify">
Diferente da forma acima: com um segundo argumento (o índice, depois da vírgula), o <code>IMPORT</code> <b>não</b> trata o ficheiro como código BotQL — lê só a entrada N do ficheiro (mesmo formato <code>N- valor</code> / <code>N-{ ... }</code> do <code>REPLY</code> indexado).
</p>

<p align="justify">
Sem <code>AS</code>, o valor lido fica na variável genérica <code>env</code> — o suficiente quando só há um segredo a importar. Se o bot precisa de mais que um (ex: token da IA e token do WhatsApp ao mesmo tempo), cada <code>IMPORT</code> deve ter o seu próprio alias, para não pisarem o mesmo nome:
</p>

```sql
IMPORT {env.txt, 1} AS K
IMPORT {env.txt, 2} AS TOKEN_WHATSAPP
```

<p align="justify">
O alias é só uma etiqueta escolhida por quem escreve o <code>.sql</code> — pode ser uma letra só (<code>K</code>) ou um nome mais descritivo (<code>TOKEN_WHATSAPP</code>); o interpretador não olha para o texto, só usa para saber a que valor importado outros comandos (como <code>CONNECT RESPONSE</code>, a seguir) estão a apontar. Com <code>AS</code>, o valor fica acessível diretamente pelo nome do alias (ex: <code>K</code>) em qualquer expressão — sem <code>AS</code>, só é acessível como <code>env.NOME_FICHEIRO</code>.
</p>

---

## CONNECT RESPONSE e Response(): ligar a uma IA

<p align="justify">
Duas peças, com papéis diferentes e que trabalham sempre juntas:
</p>

- **`CONNECT RESPONSE <alias>`** — liga o bot a uma IA usando um valor já importado (o token/chave). Só estabelece a ligação, fica pronta à espera — **não dispara nada sozinho**. O alias tem de corresponder a um `IMPORT {..., N} AS <alias>` já feito antes no ficheiro, senão é erro.
- **`Response()`** — dispara o ciclo de vida: pega na mensagem atual do cliente, envia para a IA ligada, espera a resposta, e devolve esse texto onde for chamado (normalmente dentro de um `REPLY`).

```sql
IMPORT {env.txt, 1} AS K
CONNECT RESPONSE K              -- só liga, não faz nada sozinho

CREATE TABLE Context() PREVENT DEFAULT

ON MESSAGE {
    INSERT INTO Context()

    WHEN CONTAINS "preço" {
        REPLY "Confira o nosso catálogo: link.com"
    }

    OTHERWISE {
        REPLY Response()         -- aqui é que dispara: envia, espera, responde
    }
}

RUN BOT
```

<p align="justify">
Padrão de uso mais comum: <code>OTHERWISE { REPLY Response() }</code> — quando nenhuma regra <code>WHEN</code> cobre a mensagem, a IA entra como fallback inteligente, em vez de uma resposta fixa tipo "não percebi".
</p>

<p align="justify">
Com mais que uma IA ligada no mesmo bot, cada uma com o seu alias:
</p>

```sql
IMPORT {env.txt, 1} AS A
IMPORT {env.txt, 2} AS B

CONNECT RESPONSE A
CONNECT RESPONSE B
```

<p align="justify">
<code>Response()</code> sozinho (sem argumento) só faz sentido quando há <b>uma</b> IA ligada — é ambíguo se houver mais que uma (o bot recusa com um erro que lista os aliases disponíveis). Com várias, <code>Response(<alias>)</code> diz exatamente qual delas usar nessa chamada:
</p>

```sql
ON MESSAGE {
    WHEN CONTAINS "vendas" {
        REPLY Response(A)
    }

    WHEN CONTAINS "suporte" {
        REPLY Response(B)
    }

    OTHERWISE {
        REPLY Response(A)
    }
}
```

<p align="justify">
O alias passado a <code>Response(...)</code> tem de corresponder a um <code>CONNECT RESPONSE <alias></code> já feito antes no ficheiro — senão é erro.
</p>

---

## THINK: retrieval local sobre um ficheiro de conhecimento

<p align="justify">
Diferente de <code>REPLY (ficheiro, N)</code> (que devolve sempre a mesma entrada para o mesmo índice) e de <code>Response()</code> (que depende de uma IA externa ligada), <code>THINK</code> procura, <b>dentro do próprio dispositivo</b>, o conteúdo mais relevante para a mensagem recebida, num ficheiro de conhecimento em texto livre. Não usa IA, não sai para a rede, não precisa de <code>CONNECT</code> nenhum.
</p>

```sql
WHEN CONTAINS KEYWORDS(perguntas.txt)
    THINK(conhecimento.txt) OR
    REPLY (fallback.txt, 1)
```

<p align="justify">
Formato do ficheiro de conhecimento: blocos de texto livre, cada um separado por uma linha em branco — cada bloco é uma unidade de informação que pode ser usada como resposta.
</p>

```
Entregamos em toda Luanda, com prazo de 2 a 3 dias uteis apos confirmacao
do pagamento.

Aceitamos pagamento via transferencia bancaria, multicaixa express ou
dinheiro na entrega.

O horario de atendimento e de segunda a sexta, das 8h as 18h.
```

### Comportamento

<p align="justify">
<code>THINK(ficheiro.txt)</code> sozinho já <b>é</b> a resposta quando encontra algo com confiança suficiente — não precisa de <code>REPLY THINK(...)</code> antes; o texto é enviado diretamente. Só o fallback (opcional, depois do <code>OR</code>) precisa da palavra <code>REPLY</code> de facto.
</p>

<p align="justify">
Quando a pergunta aponta claramente para uma parte do ficheiro de conhecimento, <code>THINK</code> responde direto com ela. Quando a resposta não é tão óbvia — por exemplo, mais de uma parte do ficheiro parece relevante para a mesma pergunta — <code>THINK</code> tenta perceber o motivo antes de decidir:
</p>

- **Informação repetida.** Se as partes candidatas dizem basicamente a mesma coisa (a mesma informação escrita de duas formas), `THINK` responde com uma delas, sem repetir nem misturar as duas.
- **Informação complementar.** Se as partes candidatas são sobre o mesmo assunto mas cobrem casos diferentes — por exemplo, uma fala de entregas em Luanda e outra em Huambo — `THINK` tenta juntar as duas numa única resposta, em vez de escolher só uma e deixar a outra de fora.
- **Pergunta pouco clara.** Se nenhuma das situações acima se aplica e a dúvida continua, `THINK` tenta entender a pergunta de novo (focando no que é mais decisivo nela) antes de desistir.

<p align="justify">
Só depois de esgotar essas tentativas é que <code>THINK</code> considera que não tem uma resposta boa o suficiente:
</p>

- Se, ainda assim, nada bater com confiança suficiente, corre o `REPLY (...)` a seguir ao `OR`, tal como qualquer `REPLY` normal.
- Sem `OR REPLY (...)` nenhum, e sem confiança suficiente, `THINK` não responde nada — quem escreve o `.sql` decide se isso é aceitável, ou se prefere sempre acompanhar `THINK` com um fallback.

### WAITING: texto e animação enquanto algo demora

<p align="justify">
A busca do <code>THINK</code> não é instantânea como um <code>REPLY</code> comum — por isso, antes de procurar, <code>THINK</code> mostra um estado de "a processar" para quem está do outro lado da conversa. Por omissão, isto já funciona sem precisar de nada extra no <code>.sql</code>: um texto genérico tipo "Pensando..." e um tempo mínimo de 3 segundos, mesmo que a busca real seja mais rápida que isso — sem esse mínimo, a mensagem apareceria e desapareceria rápido demais para parecer natural.
</p>

<p align="justify">
<code>WAITING(...)</code> personaliza esse comportamento, e tem duas formas de uso:
</p>

<p align="justify">
<strong>1. Acoplado a um <code>THINK</code></strong>, encaixado logo a seguir a ele, antes do <code>OR</code> — aproveita o tempo da própria busca:
</p>

```sql
THINK(conhecimento.txt) WAITING(loading.txt, 2) OR
REPLY (fallback.txt, 1)
```

<p align="justify">
<strong>2. Sozinho, como ação independente</strong> em qualquer lugar do bloco — útil antes de qualquer outra coisa que também possa demorar e não tenha aviso próprio, como <code>Response()</code> (uma IA externa):
</p>

```sql
WHEN CONTAINS "vendas" {
    WAITING("Um momento...")
    REPLY Response(A)
}
```

<p align="justify">
Nos dois casos, os argumentos são os mesmos:
</p>

- **Primeiro argumento** (opcional) — texto direto entre aspas, ou nome de um ficheiro `.txt` (sem aspas) com o texto/marcação a mostrar enquanto se espera. Sem argumento nenhum (`WAITING()`), usa o texto padrão do interpretador.
- **Segundo argumento** (opcional) — segundos mínimos que esse estado fica visível, mesmo que a ação termine antes. Sem argumento (`WAITING()` ou só o texto/ficheiro), usa 3 segundos por omissão.

<p align="justify">
Quando usado com um ficheiro, este segue as mesmas regras de qualquer outro <code>.txt</code> do projeto — só <code>.txt</code> e <code>.sql</code> existem no sistema de ficheiros do BotQL, por isso uma animação em HTML/CSS fica escrita dentro de um <code>.txt</code> normal, não de um <code>.html</code> à parte:
</p>

```
<div class="pensando">
  <span>A verificar a melhor resposta...</span>
</div>
```

<p align="justify">
Plataformas que só mostram texto simples (como o WhatsApp) ignoram a marcação e usam só o texto; clientes que renderizam HTML (como o editor/preview do BotQL) mostram a animação completa.
</p>

### Como a relevância é calculada

<p align="justify">
O <code>THINK</code> combina vários sinais, todos calculados localmente:
</p>

- **Frequência ponderada** — uma palavra rara da mensagem que aparece no conteúdo pesa mais do que uma palavra comum; repetições adicionais da mesma palavra contam cada vez menos.
- **Correspondência de frase** — se um trecho de 2 ou mais palavras da mensagem aparece tal e qual no conteúdo, isso conta mais do que as mesmas palavras espalhadas e desconexas.
- **Tolerância a erros de escrita** — uma palavra da mensagem escrita com 1-2 letras trocadas ainda pode bater com uma palavra do conteúdo, com peso reduzido.
- **Variações de plural/sufixo** — "produtos" e "produto" contam como a mesma palavra.

<p align="justify">
O <code>THINK</code> <b>não</b> entende sinónimos que não partilhem raiz nem letras parecidas — "horas" e "horário" continuam a ser palavras diferentes para ele. Para esses casos, é possível ligar manualmente um termo a outro nas opções do interpretador.
</p>

<p align="justify">
O ficheiro de conhecimento é lido e processado uma vez (e mantido em cache), não a cada mensagem recebida.
</p>

---

## DEFAULT MESSAGE: saudação automática ao primeiro contacto

<p align="justify">
Sem nenhuma integração de plataforma, o BotQL não tem como "falar primeiro" por conta própria — só reage quando <code>ON MESSAGE</code> dispara, ao receber algo. <code>DEFAULT MESSAGE</code> resolve isto de outra forma: em vez de depender de um evento de "conversa nova" (que nem toda plataforma expõe), usa o próprio banco de dados do bot para detetar se é a primeira vez que um <code>client</code> aparece.
</p>

<p align="justify">
<code>DEFAULT MESSAGE</code> é um modificador do <code>CREATE TABLE</code>, ao lado de <code>PREVENT DEFAULT</code>:
</p>

```sql
CREATE TABLE Context() PREVENT DEFAULT
DEFAULT MESSAGE "Ola! Bem-vindo."
```

<p align="justify">
Funciona da mesma forma com tabela manual, desde que a tabela tenha uma coluna para o remetente (<code>client</code> ou <code>sender</code>, o mesmo nome usado no <code>INSERT</code>/<code>VALUES</code> do <code>ON MESSAGE</code>):
</p>

```sql
CREATE TABLE messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    sender TEXT,
    content TEXT,
    reply TEXT,
    created_at DATETIME
) PREVENT DEFAULT
DEFAULT MESSAGE "Ola! Bem-vindo."
```

<p align="justify">
Também aceita um ficheiro indexado, tal como <code>REPLY</code>:
</p>

```sql
DEFAULT MESSAGE (greets.txt, 1)
```

### Comportamento

<p align="justify">
Antes de correr o resto do <code>ON MESSAGE</code> (o <code>INSERT</code>, os <code>WHEN</code>, o <code>OTHERWISE</code>), o interpretador verifica se já existe alguma linha na tabela declarada com <code>DEFAULT MESSAGE</code> cujo valor do remetente bate com o <code>client</code> da mensagem recebida:
</p>

- Se **não existir nenhuma linha** — é a primeira mensagem desse remetente. O bot responde com a `DEFAULT MESSAGE` e **não** corre o resto do bloco dessa vez.
- Se **já existir alguma linha** — o bot já conhece esse remetente. O `ON MESSAGE` corre normalmente, do `INSERT` em diante, sem repetir a saudação.

<p align="justify">
Isto significa que a saudação só depende dos dados que o próprio bot já guarda — não precisa de nenhum connector especial de "conversa nova" para funcionar, mesmo sem nenhuma plataforma real ligada.
</p>

---

## A convenção `env.txt`

<p align="justify">
Para chaves de API, tokens, e qualquer outro dado sensível, a convenção do BotQL é concentrar tudo num único ficheiro chamado sempre <code>env.txt</code>, com uma entrada numerada por serviço:
</p>

```
1- sk-abc123suachaveaqui
2- outrachavesecreta
```

<p align="justify">
Cada <code>IMPORT {env.txt, N}</code> lê uma linha específica desse ficheiro. Isto mantém todos os segredos fora do <code>.sql</code> principal e fora de qualquer ficheiro que seja partilhado ou publicado — <code>env.txt</code> nunca deve ser enviado para um repositório público (ver secção seguinte).
</p>

---

## Segurança: `env.txt` nunca vai para o repositório

<p align="justify">
Um projeto BotQL pode ser público no GitHub (o interpretador, o <code>.sql</code> principal, os ficheiros de respostas e keywords) sem nunca expor nenhuma chave de API — desde que <code>env.txt</code> fique de fora do repositório.
</p>

<p align="justify">
Para isso, o projeto deve ter um <code>.gitignore</code> na raiz com a linha:
</p>

```
env.txt
```

<p align="justify">
Isto diz ao Git para nunca acompanhar ou enviar esse ficheiro. Cada pessoa que usa o projeto cria o <b>próprio</b> <code>env.txt</code> localmente, com as suas próprias chaves — o ficheiro nunca é partilhado nem fica público, mesmo que todo o resto do projeto seja.
</p>

---

## Eventos disponíveis

- `ON START` — corre uma vez, quando o bot liga.
- `ON MESSAGE` — corre sempre que chega uma mensagem.
- `ON SIGNAL FROM "<origem>"` — corre quando chega um sinal de um canal específico.

---

## Variáveis implícitas

<p align="justify">
BotQL não usa notação de ponto (ex: <code>MESSAGE.TEXT</code> não existe). Em vez disso, usa variáveis simples, sempre disponíveis dentro do bloco <code>ON MESSAGE</code>:
</p>

| Variável | Descrição |
|---|---|
| `client` | Remetente da mensagem recebida |
| `message` | Texto da mensagem recebida |
| `lastMsg` | Texto da última resposta enviada pelo bot |

---

## Integração com Banco de Dados

<p align="justify">
BotQL guarda dados reais de banco no mesmo ficheiro <code>.sql</code>, sem sair da linguagem. Há duas formas de criar uma tabela:
</p>

<p align="justify">
<b>1. Manual, com colunas explícitas:</b>
</p>

```sql
CREATE TABLE messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    sender TEXT,
    content TEXT,
    reply TEXT,
    created_at DATETIME
) PREVENT DEFAULT
```

<p align="justify">
<b>2. Automática, via nome reservado <code>Context()</code>:</b>
</p>

```sql
CREATE TABLE Context() PREVENT DEFAULT
```

<p align="justify">
Não é preciso declarar colunas — o interpretador já tem o schema de <code>Context()</code> pré-mapeado. O <code>INSERT</code> também é automático:
</p>

```sql
INSERT INTO Context()
```

<p align="justify">
Sem parâmetros — o interpretador captura <code>client</code>, <code>message</code> e a data automaticamente, tal como o <code>CREATE TABLE Context()</code> dispensa colunas.
</p>

### Regra fixa de ordem — INSERT sempre primeiro, UPDATE sempre no fim

<p align="justify">
Dentro de um bloco <code>ON MESSAGE</code>, quando o bot precisa de guardar a mensagem recebida <b>e depois</b> guardar a resposta que deu, a ordem é sempre a mesma, sem exceção:
</p>

1. `INSERT` acontece **logo no início** do bloco, antes de qualquer `WHEN` — guarda a mensagem recebida assim que ela chega.
2. Os blocos `WHEN` / `OTHERWISE` decidem a resposta normalmente.
3. `UPDATE` acontece **sempre no fim** do bloco, depois de todos os `WHEN` — grava a resposta final na mesma linha, usando `LAST_INSERT_ID()`.

```sql
ON MESSAGE {
    -- 1. INSERT primeiro: guarda a mensagem recebida
    INSERT INTO messages (sender, content, created_at)
    VALUES (client, message, NOW())

    -- 2. WHEN decide a resposta
    WHEN CONTAINS "preço" {
        REPLY "Confira o nosso catálogo: link.com"
    }

    WHEN CONTAINS "humano" {
        FORWARD TO "+244900000000"
        REPLY "A encaminhar para um atendente humano..."
    }

    OTHERWISE {
        REPLY "Desculpe, não entendi."
    }

    -- 3. UPDATE por último: grava a resposta na mesma linha
    UPDATE messages
    SET reply = lastMsg
    WHERE id = LAST_INSERT_ID()
}
```

<p align="justify">
O <code>UPDATE</code> não se repete dentro de cada <code>WHEN</code> — corre uma única vez, depois de decidida a resposta. Esta ordem (<code>INSERT</code> → <code>WHEN</code> → <code>UPDATE</code>) é a mesma em qualquer bot que precise de guardar pergunta e resposta juntas, incluindo quando se usa <code>Context()</code>.
</p>

---

## Exemplo 1 — Bot de Atendimento com Context()

```sql
CREATE BOT "LojaBot"
PLATFORM WHATSAPP

CREATE TABLE Context() PREVENT DEFAULT

ON MESSAGE {
    -- INSERT primeiro, sempre
    INSERT INTO Context()

    WHEN CONTAINS "preço" {
        REPLY "Confira o nosso catálogo: link.com"
    }

    WHEN CONTAINS "comprar" {
        REPLY "Pedido registrado!"
    }

    OTHERWISE {
        REPLY "Desculpe, não entendi."
    }
}

RUN BOT
```

---

## Exemplo 2 — Bot de Atendimento com tabela manual

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
    REPLY "Olá! Estou online."
}

ON MESSAGE {
    INSERT INTO messages (sender, content, created_at)
    VALUES (client, message, NOW())

    WHEN CONTAINS "preço" REPLY "Confira o nosso catálogo: link.com"
    WHEN CONTAINS "horário" REPLY "Estamos abertos das 9h às 18h"
    WHEN CONTAINS "humano" {
        FORWARD TO "+244900000000"
        REPLY "A encaminhar para um atendente humano..."
    }
    OTHERWISE REPLY "Desculpe, não entendi."

    UPDATE messages
    SET reply = lastMsg
    WHERE id = LAST_INSERT_ID()
}

RUN BOT
```

---

## Exemplo 3 — Bot com lista grande de saudações e respostas por ficheiro

```sql
CREATE BOT "AtendimentoBot"
PLATFORM WHATSAPP

CREATE TABLE Context() PREVENT DEFAULT

ON MESSAGE {
    INSERT INTO Context()

    WHEN CONTAINS KEYWORDS(saudacoes.txt) {
        REPLY (respostas.txt, 1)
    }

    WHEN CONTAINS ("preço", "quanto custa", "valor") {
        REPLY "Confira o nosso catálogo: link.com"
    }

    OTHERWISE {
        REPLY (respostas.txt, 2)
    }
}

RUN BOT
```

<p align="justify">
<code>saudacoes.txt</code>, no mesmo projeto:
</p>

```
oi
ola
boa tarde
boa noite
bom dia
```

<p align="justify">
<code>respostas.txt</code>, no mesmo projeto:
</p>

```
1- Ola! Como posso ajudar?
2- Desculpe, nao percebi. Escreve "ajuda".
```

---

## Exemplo 4 — Bot de Sinais (Trading)

```sql
CREATE BOT "SignalForwarder"

CONNECT TELEGRAM CHANNEL "@sinais_ouro"
CONNECT QUOTEX ACCOUNT "meu_token_aqui"

ON SIGNAL FROM "@sinais_ouro" {
    PARSE SIGNAL
    SEND TO QUOTEX
    REPLY TO ADMIN "Sinal enviado: " + SIGNAL.PAIR
}

ON MESSAGE {
    WHEN CONTAINS "status" REPLY "Bot ativo. A processar sinais em tempo real."
}

RUN BOT
```

---

## Exemplo 5 — Bot de Atendimento com fallback para IA

```sql
IMPORT {env.txt, 1} AS K
CONNECT RESPONSE K

CREATE BOT "AtendimentoInteligente"
PLATFORM WHATSAPP

CREATE TABLE Context() PREVENT DEFAULT

ON MESSAGE {
    INSERT INTO Context()

    WHEN CONTAINS "preço" {
        REPLY "Confira o nosso catálogo: link.com"
    }

    WHEN CONTAINS "horário" {
        REPLY "Estamos abertos das 9h às 18h"
    }

    OTHERWISE {
        WAITING("Um momento...")
        REPLY Response(K)
    }
}

RUN BOT
```

<p align="justify">
<code>env.txt</code>, no mesmo projeto (fora do repositório):
</p>

```
1- sk-abc123suachaveaqui
```

---

## Exemplo 6 — Resposta com opções e bloco de HTML

<p align="justify">
Mostra as duas formas do ficheiro indexado lado a lado: entradas de uma linha (<code>N- texto</code>) e entradas em bloco (<code>N-{ ... }</code>) para respostas mais longas, com lista de opções ou HTML.
</p>

```sql
CREATE BOT "AtendimentoBot"
PLATFORM WHATSAPP

ON MESSAGE {
    WHEN CONTAINS ("oi", "ola") {
        REPLY (respostas.txt, 1)
    }

    WHEN CONTAINS "servico" {
        REPLY (respostas.txt, 2)
    }

    WHEN CONTAINS "formulario" {
        REPLY (respostas.txt, 3)
    }

    OTHERWISE {
        REPLY (respostas.txt, 4)
    }
}

RUN BOT
```

<p align="justify">
<code>respostas.txt</code>, no mesmo projeto:
</p>

```
1- Ola! Como posso ajudar?
2-{
Qual serviço você quer?
- Suporte técnico
- Vendas
- Cancelar
}
3-{
<div style="{color:red}">
  <p>Formulário de contacto</p>
</div>
}
4- Desculpe, nao percebi.
```

---

## Exemplo 7 — Bot com conhecimento local (THINK e WAITING)

```sql
CREATE BOT "LojaBot"
PLATFORM WHATSAPP

CREATE TABLE Context() PREVENT DEFAULT
DEFAULT MESSAGE "Ola! Bem-vindo. Pergunte-me sobre entregas, pagamento ou horario."

ON MESSAGE {
    INSERT INTO Context()

    WHEN CONTAINS ("oi", "ola") {
        REPLY "Em que mais posso ajudar?"
    }

    OTHERWISE
        THINK(conhecimento.txt) WAITING(loading.txt, 2) OR
        REPLY (fallback.txt, 1)
}

RUN BOT
```

<p align="justify">
<code>conhecimento.txt</code>, no mesmo projeto:
</p>

```
Entregamos em toda Luanda, com prazo de 2 a 3 dias uteis apos confirmacao
do pagamento.

Aceitamos pagamento via transferencia bancaria, multicaixa express ou
dinheiro na entrega.

O horario de atendimento e de segunda a sexta, das 8h as 18h.
```

<p align="justify">
<code>loading.txt</code>, no mesmo projeto:
</p>

```
A verificar a melhor resposta...
```

<p align="justify">
<code>fallback.txt</code>, no mesmo projeto:
</p>

```
1- Desculpe, nao tenho essa informacao. Um atendente vai responder em breve.
```

<p align="justify">
Neste exemplo, a <code>DEFAULT MESSAGE</code> só é enviada na primeira mensagem de cada <code>client</code> novo (antes de qualquer <code>WHEN</code>/<code>THINK</code> correr); a partir da segunda mensagem desse mesmo remetente, o fluxo normal do <code>ON MESSAGE</code> já corre sempre.
</p>

---

## Regras de sintaxe

1. Todo comando é escrito em **MAIÚSCULAS**.
2. Texto literal vai sempre entre aspas `" "`.
3. Blocos com mais de uma ação usam chaves `{ }`, sempre a seguir a `ON` ou `WHEN`.
4. Uma única ação não precisa de chaves.
5. `WHEN` só pode ser usado dentro de um bloco `ON MESSAGE { }`.
6. `OTHERWISE` é opcional, mas recomendado — cobre qualquer mensagem que não bata com nenhum `WHEN`.
7. Não existe notação de ponto (`MESSAGE.TEXT`); usa-se as variáveis implícitas (`client`, `message`, `lastMsg`).
8. `PREVENT DEFAULT` no `CREATE TABLE` evita erro se a tabela já existir.
9. `Context()` é o único nome de tabela reservado — schema automático, sem colunas, e `INSERT INTO Context()` também é automático, sem parâmetros.
10. Quando um bloco `ON MESSAGE` precisa de guardar pergunta e resposta, a ordem é sempre `INSERT` no início → `WHEN`/`OTHERWISE` no meio → `UPDATE` no fim, referenciando `LAST_INSERT_ID()`.
11. `{ }` a seguir a `IMPORT` não é um bloco de ações — é uma referência a ficheiro. Sem índice (`IMPORT {ficheiro.sql}`) importa código; com índice (`IMPORT {ficheiro.txt, N}`) lê só uma entrada de valor.
12. `CONTAINS (...)` aceita uma lista de strings entre parênteses — basta uma bater para a condição ser verdadeira.
13. `CONTAINS KEYWORDS(ficheiro.txt)` carrega a lista de um ficheiro `.txt` do projeto; o nome do ficheiro não leva aspas. O `.txt` só pode conter palavras-chave, uma por linha — nenhuma outra sintaxe misturada.
14. `REPLY (ficheiro.txt, N)` lê a entrada N de um ficheiro indexado. Duas formas por entrada, nunca misturadas: `N- valor` (uma linha) ou `N-{ ... }` (bloco entre chaves, pode ter várias linhas). No bloco, chaves internas contam para o aninhamento — só fecha na `}` correspondente à `{` que abriu; uma chave por fechar é erro.
15. Segredos (chaves de API, tokens) vivem sempre num único ficheiro `env.txt`, uma entrada numerada por serviço, lido via `IMPORT {env.txt, N}`. Esse ficheiro nunca é incluído no repositório — deve estar sempre listado no `.gitignore`.
16. `IMPORT {..., N} AS <alias>` dá nome a um valor importado, acessível diretamente pelo nome do alias; sem `AS`, o valor cai na variável genérica `env` (acessível como `env.NOME_FICHEIRO`). Usar alias sempre que houver mais de um segredo importado no mesmo bot.
17. `CONNECT RESPONSE <alias>` só liga o bot a uma IA — não dispara nada sozinho. É `Response()` (ou `Response(<alias>)`, com mais de uma IA ligada) que aciona o ciclo (enviar mensagem atual, esperar, devolver resposta); por isso só faz sentido dentro de uma ação como `REPLY`, nunca sozinho. O alias em `Response(<alias>)` tem de corresponder a um `CONNECT RESPONSE <alias>` já feito antes no ficheiro.
18. Nomes de ficheiro em qualquer referência do `.sql` (`IMPORT`, `CONTAINS KEYWORDS`, `REPLY (ficheiro, N)`, `THINK`, `WAITING`, `DEFAULT MESSAGE`) só reconhecem letras, números e underscore antes/depois do ponto — um nome com hífen (`meus-dados.txt`) não é lido corretamente.
19. `THINK(ficheiro.txt)` sozinho já é a resposta quando encontra algo com confiança suficiente — não precisa de `REPLY` antes. Quando mais de uma parte do ficheiro parece relevante, `THINK` tenta primeiro perceber se é informação repetida ou complementar antes de decidir; só o fallback opcional (`OR REPLY ...`) precisa da palavra `REPLY`, e só corre quando `THINK` não consegue chegar a uma resposta com confiança suficiente.
20. `WAITING(...)` tem duas formas de uso: acoplado a um `THINK`, sempre logo a seguir a ele e antes do `OR`; ou sozinho, como ação independente em qualquer lugar do bloco. Os dois argumentos são opcionais e independentes em ambas as formas: sem nenhum, usa texto e tempo padrão; com texto/ficheiro, personaliza só a mensagem/animação; com o segundo argumento também, personaliza o tempo mínimo (em segundos) junto.
21. `DEFAULT MESSAGE`, quando usado, vai sempre dentro da declaração `CREATE TABLE`, ao lado de `PREVENT DEFAULT`. Aplica-se a qualquer `client`/`sender` que ainda não tenha nenhuma linha nessa tabela — nesse caso, o `ON MESSAGE` não corre o resto do bloco dessa vez, só responde com a mensagem padrão.

---

## Filosofia

<p align="justify">
BotQL não é uma linguagem de programação — é uma <b>linguagem de regras</b> para criar bots, tal como uma consulta SQL descreve o que queres buscar numa base de dados. Não precisas de saber programar para escrever BotQL; precisas apenas de saber o que queres que o teu bot faça.
</p>

---

## Onde o bot corre

<p align="justify">
O <b>interpretador</b> vive num sítio fixo (GitHub), e cada utilizador só precisa do seu próprio ficheiro <code>.sql</code> com as regras do bot. O interpretador lê e traduz esse ficheiro em ações reais.
</p>

<p align="justify">
O bot corre <b>localmente</b>, no computador ou servidor do próprio utilizador — não em servidores geridos por terceiros. Isto significa que o bot fica online enquanto esse processo estiver a correr; se o utilizador desligar o computador ou fechar o processo, o bot para. Manter o bot sempre online (por exemplo, com PM2, <code>screen</code>, ou um servidor próprio) é responsabilidade de quem o cria, tal como acontece com qualquer bot feito em Node.js puro.
</p>
