# Epidemia: Paraguay contra el cáncer (beta)

Juego educativo para celular sobre la epidemiología del cáncer en Paraguay. El jugador conduce el control del cáncer de 2015 a 2024: cada año recibe un presupuesto y elige acciones de **prevención**, **diagnóstico** y **tratamiento** en los 18 departamentos.

El jugador elige un personaje: **Bob** (estudiante de Medicina, tecnología e IA), **Don Patrón** (empresario, alianzas público-privadas) o la **Dra. Beatriz** (médica). Cada uno tiene ventajas propias y un árbol de habilidades al estilo de XCOM 2: al subir de cargo con sus puntos, elige una nueva habilidad (3 ramas con 4, 3 y 3 habilidades; cada nivel pide el anterior de su rama).

Cada año se juega con calma y se cierra con un toque. En enero llega el presupuesto y se paga el mantenimiento de todo lo implementado; sin dinero, lo más caro se cierra. Implementar cuesta dinero y **prestigio**, que se gana con metas, misiones y respuestas a la sociedad. Cada acción tiene su nivel de atención (1.ª primaria, 2.ª secundaria, 3.ª terciaria): la secundaria necesita atención primaria en el departamento y la terciaria, secundaria cerca (derivación). Algunas acciones se habilitan solo a partir de cierto año. Los convenios no tienen compra ni prestigio, pero se pagan todos los años.

**Dinero y prestigio:** tocar 💰 abre las finanzas, con decisiones que traen dinero y tienen un costo (impuesto al tabaco, préstamo de un banco multilateral, atrasar pagos a proveedores, ensayo clínico patrocinado, patrocinio de una tabacalera). Tocar 🎖️ abre los favores que se pagan con prestigio, el capital político: ampliación presupuestaria del Congreso, brigada de la red del personaje, terreno de la Gobernación y notificación obligatoria del cáncer. Los hechos reales citan su fuente; el resto es escenario del juego.

El mapa y los contadores del país muestran incidencia, prevalencia, muertes y curas por año, y cambian en el acto con cada decisión. Cada año trae un hecho real, a veces un imprevisto (royalties de Itaipú, epidemias, donaciones de instituciones religiosas, académicas o de empresas, recortes del Congreso, premios internacionales) y una demanda de la sociedad, que el jugador atiende, rechaza o promete cumplir.

Para que den ganas de volver a jugar: **misiones** con premio (por ejemplo, test de VPH donde el cuello uterino es la 1.ª causa de muerte en las mujeres; «Ver en el mapa» marca sus departamentos con borde dorado y una **noticia** con datos reales del Atlas muestra el ranking de los departamentos para investigar), un **desafío relámpago** por año (verdadero o falso, con fuente), **logros** que quedan guardados en el celular, estrellas por año, cargo final y récord. El juego también reacciona a las decisiones: muestra las vidas salvadas, los casos evitados por la prevención y las personas que murieron sin diagnóstico (modelo del juego, comparado con no hacer nada).

**Arte (beta6):** «luz contra la niebla». El mapa empieza a oscuras, cubierto por la niebla del subregistro, con una sola gran luz: el INCAN, en Capiatá. Cada servicio que el jugador abre enciende una luz; diagnosticar disipa la niebla. Ilustraciones vectoriales hechas para el juego (cena principal, retratos en silueta, escenas en tinta de los hechos del año e íconos de trazo), con la renda ñandutí como emblema.

**Jugar:** https://gian-pandolfo.github.io/epidemia-cancer-paraguay/

## Créditos

- **Desarrollo:** Gianmarlon Pandolfo, estudiante de Medicina (UNINTER Tres Fronteras).
- **Trabajo base:** Silva GIS, Pandolfo GA, et al. *Mortalidad por Cáncer en Paraguay: Análisis Epidemiológico, Disparidades Geográficas y Desafíos para el Control*. Revisión sistemática, 2026.
- **Coautoría:** Claude Opus 5.5 (Anthropic), en el diseño del juego, la programación y la verificación de las fuentes.
- **Arte:** ilustraciones vectoriales hechas para el juego. Tipografías Big Shoulders Display y Atkinson Hyperlegible (licencia SIL OFL, vía Google Fonts).

## Qué es real y qué es simulación

- **Real, con fuente:** las tasas y las muertes de partida de cada departamento (Atlas de Mortalidad por Cáncer en Paraguay 2015–2019), la población (Censo 2022), la proporción entre casos y muertes (GLOBOCAN 2022: 13.783 casos y 6.581 muertes) y el hecho de cada año (ley, decreto, pandemia, misiones, servicios inaugurados). Los imprevistos y demandas que traen «ejemplo real» o «inspirado en» citan su fuente.
- **Simulación (ilustrativa):** el efecto de cada acción, los personajes y sus habilidades, los casos ocultos (subregistro), la incidencia, la prevalencia, las muertes y las curas, los imprevistos, las demandas, el prestigio y los puntos. Sirven para enseñar, no son estimaciones epidemiológicas.
- **Fuentes con enlace:** cada fuente citada en el juego tiene un enlace ↗ al lado. Cuando existe, abre una copia guardada en el Internet Archive (no depende de que el sitio original esté en línea); si no, abre la página original. Los enlaces se conferieron el 26/10/2026 (`links.js`).

## Base

Revisión sistemática de Silva GIS, Pandolfo GA, et al. *Mortalidad por cáncer en Paraguay: análisis epidemiológico, disparidades geográficas y desafíos para el control* (2026) y sus fuentes: MSPBS/DVENT (Atlas 2015–2019), IARC (GLOBOCAN 2022), INE (Censo 2022), ENFR 2022, ICO/IARC HPV Information Centre (2023), Leite et al. (2025), Torres-Roman et al. (2022), Ley N° 6266/2018, Decreto N° 2064/2019, MSPBS, OPS/OMS, OIEA y prensa paraguaya (lista completa dentro del juego, en «Fuentes»).

Mapa: límites de [geoBoundaries](https://www.geoboundaries.org) (CC BY 4.0; Runfola D, et al. PLoS One 2020;15(4):e0231866).

## Archivos

- `index.html`: pantalla y estilos.
- `jogo.js`: reglas, textos (español y portugués) y fuentes.
- `dados.js`: mapa y datos de los departamentos. Lo genera un script del proyecto a partir de la página del mapa del congreso; no editar a mano.
- `links.js`: enlaces de las fuentes (página original y copia del Internet Archive).
- `icones.js`: íconos de trazo de la interfaz (acciones, marcador, árbol de habilidades).
- `musica.js`: música de fondo original, generada en el propio celular (Web Audio); sin archivos de audio ni obras de terceros. Botón 🔊/🔇.
- `arte/`: ilustraciones en SVG (cena principal, emblema, retratos y escenas). Las genera un script del proyecto; no editar a mano.
- `ranking.html`: ranking en vivo para la tablet del stand (se actualiza cada 5 s, con el QR del juego).
- `config.js`: dirección del ranking (`rankingUrl`) y del juego.
- `apps-script/`: código de la planilla de Google que guarda el ranking y cómo instalarlo.

**Datos personales (LGPD/privacidad):** antes de jugar, nombre, e-mail, facultad y curso, solo si el jugador acepta los términos (también se puede jugar sin datos). Sirven para el ranking del congreso (sin el e-mail), para contar partidas y para contactar a quienes ganen. Los nombres salen del ranking el 31/10/2026; nombre y e-mail se borran el 30/11/2026.

Beta para pruebas.

## Segurança e teto (beta7, 27/10/2026)

- **Sem servidor próprio:** o site é só arquivos (GitHub Pages). O único ponto compartilhado é o ranking (Google Apps Script + planilha).
- **CSP** em `index.html` e `ranking.html`: o navegador só roda scripts deste site e só conecta com o Apps Script (`script.google.com` / `script.googleusercontent.com`). Por isso o script do ranking fica em `ranking.js`, e não dentro do HTML.
- **QR sem biblioteca de fora:** `qr-jogo.svg` (e `mapa/qr-mapa.svg`) vêm desenhados de `_ferramentas/gerar_qr.py`, no vault, conferidos por leitor.
- **`mapa/`**: mapa público do congresso (gerado por `_ferramentas/gerar_pagina.py`), com CSP por hash e `sw.js` para abrir sem internet. Não editar à mão.
- **Teto do ranking** (`apps-script/Codigo.gs`):
  - 60 avisos de começo e 60 de fim por minuto (`limite`) e até 3.000 partidas (`cheio`);
  - envio de até 2.000 bytes;
  - lista guardada 10 s;
  - envio repetido barrado;
  - campos curtos e sem fórmula;
  - pontos por ano até 3.100 (3.000 + 100 do Desafío relámpago).
- **Testes:** a cópia de teste tira a CSP (o roteiro de teste é um script na página); a CSP verdadeira é conferida no site publicado.

## Dados antes de começar (beta8, 27/10/2026)

Pedido do Gi: sem login. Ao tocar em Comenzar, a janela **Antes de empezar** pede nome, e-mail, faculdade e turma e o aceite dos termos (com o texto completo em «Términos y privacidad»), ou deixa **jugar sin datos**: a partida conta, mas não entra no ranking.

- O jogo avisa a planilha no começo e no fim de cada partida (`acao: "inicio"` / `"fim"`). Os avisos ficam numa fila no celular (`epidemia-py-fila`): sem conexão, ou com o teto atingido, o jogo não trava e reenvia em 30 s e quando a conexão volta.
- `apps-script/Codigo.gs` (versão 2): aba **Partidas** (uma linha por partida), ranking com a melhor partida de cada e-mail, aba **Resumo** pelo menu, apagar nome e e-mail em 30/11/2026. Aceita também o envio da versão 1 do jogo.
- Sem o `rankingUrl` (ranking desligado) ou depois de 31/10/2026, a janela não aparece e ninguém dá dados.


## Pontos pelo resultado, demandas com risco e música (beta9, 27/10/2026)

Pedidos do Gi depois de jogar: muitos pontos sem jogar bem; a demanda precisava de prêmio e de pena; música de fundo.

- **Pontos do ano** (`partesAno` e `totalAno` em `jogo.js`): ¼ da estrutura + 1 por vida salva + ½ por caso evitado − ½ por óbito sem diagnóstico (modelo do jogo, comparado com não fazer nada). Os bônus do departamento (pesquisa, fila, equilíbrio com o Polo regional) valem também sobre vidas e casos evitados; a missão de ⭐× multiplica o ano inteiro. O ano fica entre 0 e 3.000 (+100 do desafio relâmpago), o mesmo limite que o servidor confere. O resumo do ano mostra a conta parte por parte.
- **Demanda do ano:** cumprir dá ⭐ (50 por 💰 de valor da proposta) e 🎖️; recusar custa só 🎖️ 1; prometer e não cumprir no prazo tira 1,5 vez o prêmio em ⭐ e mais 🎖️. A proposta maior vale mais e pune mais. Aceitar o terreno do mamógrafo virou compromisso de construí-lo no mesmo ano.
- Calibrado com 42 partidas automáticas (7 estratégias × 3 personagens × 2 sorteios): não fazer nada ≈ 600 (só o desafio), só tratamento ≈ 900, ao acaso ≈ 4.900, só diagnóstico ≈ 5.400, só prevenção ≈ 7.200, equilibrado ≈ 10.100, construir tudo nos departamentos maiores ≈ 15.100.
- **Fontes:** o link de cada fonte virou um botão «ver ↗».
- **Música** (`musica.js`): composição original tocada pelo próprio celular (Web Audio): violão de cordas duplas, como o ronroco, em ré menor, no clima de *The Last of Us*, sem copiar melodia. Sem arquivo de áudio nem obra de terceiros. Botão 🔊/🔇 no topo; começa no primeiro toque e para quando o jogo sai da tela.
- Partidas salvas na beta8 continuam na beta9 (mesma chave `epidemia-py-v4`; testado).

## Revisão com 10 partidas no celular (beta10, 27/10/2026)

Pedido do Gi: revisar o código e jogar 10 partidas como uma pessoa no celular, melhorando um pouco a cada partida, sem nada drástico. Um «jogador» automático tocou nos botões pelas coordenadas (como um dedo), em 390×844, 360×740 e no tablet do estande (1280×800), em espanhol e em português.

- **Pontos:** meta do país de menos de **400 óbitos sem diagnóstico por ano** (−½ ⭐ por óbito acima, +½ abaixo). Antes, os ~680 do começo tiravam ~340 de todo mundo e o ano ficava no piso de 0, engolindo compras, prêmios e penas. Mesma ordem das estratégias nas 42 partidas automáticas.
- **Saldo do ano:** o rodapé mostra o saldo (pode ser negativo) e o resumo explica «= 0 (el año no baja de 0)».
- **Promessas:** mostram o requisito que falta («⚠️ requisito: 🔒 1.ª» ou «🔒 2020»), com prêmio, pena e requisito em linhas separadas.
- **Manutenção:** a ficha avisa quando a compra faz a manutenção de janeiro passar do orçamento; o rodapé fica laranja com ⚠️. Com pouco dinheiro em janeiro, o fato do ano lembra das finanças (💰) e do Congresso (🎖️).
- **Toque:** o aviso de compra não rouba mais o toque do botão «Implementar»; tocar no nome do departamento o escolhe; chips do topo, «Cómo se juega», Luz/Tasas e camadas ao vivo mais altos; a lista de departamentos mostra a setinha.
- **Ranking:** a página do ranking tem «← Volver al juego» (escondido em `#estande`).
- **Topo:** numa linha só também dentro da moldura do tablet.
- **Defeitos corrigidos:** vidas salvas contadas em dobro no resumo; trocar o idioma com «Compartir» aberto abria a ajuda; faixas em fila passam mais rápido.
- Partidas salvas na beta8 e na beta9 continuam na beta10 (mesma chave `epidemia-py-v4`; testado).

## Economia, desafios, carreira e árvore (beta11, 28/10/2026)

Pedidos do Gi na noite de 27/10, com os colegas já testando: «os jogadores estão ficando sem dinheiro», «os campos demoram a habilitar», «mais moedas nos desafios», «perguntas baseadas nos tabloides», «assimetria nas habilidades» e «dopamina».

- **Manutenção = 20% do custo** (era de 25% a 50%): vacina 0,4 · antitabaco 0,2 · hábitos 0,2 · teste de HPV 0,4 · mamógrafo 0,6 · registro 0,2 · Hospital Día 0,8 · acelerador 1,6 · paliativos 0,4 · centro de pesquisa 1,0 por ano. As habilidades que dividem a manutenção continuam valendo em cima.
- **Desafío relámpago:** 💰 4 por acerto (era 2), além de ⭐ 100 e 🎖️ 1. **27 perguntas novas:** 19 fixas, para interpretar os dados dos recortes de imprensa e do Atlas (impostos do tabaco, Hospital Día, INCAN, teste de HPV, ENFR, BID, registro…), e 8 **geradas dos dados** a cada partida: população (Censo 2022), taxa padronizada, óbitos, 1.ª causa por sexo, vizinhos no mapa, Chaco e causas mal definidas. Cada partida alterna pergunta fixa e gerada. Partidas salvas recebem as perguntas novas a partir do próximo desafio.
- **Carreira:** o cargo sobe por ⭐ pontos + 🎯 500 por missão cumprida + ⚡ 250 por desafio acertado; cargos em 1.000 / 3.000 / 6.000 / 9.000 (eram 1.200 / 4.000 / 7.500 / 11.000, só por pontos). O ranking não muda. Cada promoção dá 💰 2.
- **Árvore 4/3/3:** cada personagem tem um ramo principal com 4 habilidades e dois com 3; um nível só abre depois do anterior do mesmo ramo (uma escolha por cargo). Quem se especializa chega ao 4.º nível (Predicción con IA, Gran alianza, Centro oncológico regional); quem espalha ganha amplitude. Saíram da árvore (mas valem nas partidas salvas): Publicación internacional, APS 4.0, Mecenas, Polo regional, Liderazgo médico, Excelencia científica.
- **Ranking:** abaixo do QR, botões «Abrir el juego» e «Copiar enlace» (também no modo `#estande`).
- Partidas salvas na beta8, beta9 e beta10 continuam na beta11 (mesma chave `epidemia-py-v4`; testado).

## Imprevistos com base real, dicas de dinheiro, manchetes do ano e o «Luz» explicado (beta12, 28/10/2026)

Pedidos do Gi na manhã do congresso: «os cenários aleatórios precisam ter base na realidade, apontando para matérias; o foco é a epidemiologia do câncer no Paraguai», «ainda ficamos sem dinheiro: intuir o clique em Prestígio e Finanças», «clicando no ano, manchetes do ano» e «o Luz ainda está confuso».

- **Imprevistos:** os 15 trazem um exemplo real com fonte e botão «ver ↗»: epidemia de dengue (Clínicas saturado, La Nación 20/10/2020), pandemia respiratória (INCAN em modo COVID, OPS 14/12/2020; 1.942 casos de mama em 2020–2021, ABC 18/10/2022), cooperação internacional (Direct Relief/Amgen/C-Can, 2022), cooperação técnica (acelerador do OIEA, 2023), fundo de emergência (Ley 6524/2020), recorte do Congresso (US$ 13 milhões do INCAN em 2023, ABC 11/01/2023), doação religiosa (Fundación San Rafael, La Nación 22/11/2021), universidade (estudo de Itapúa, Codas et al. 2016), doação privada (Hospital Día de Encarnación), open source (registro único), colegas (72.133 testes de HPV), Itaipú (30 mamógrafos, La Nación 19/10/2024). Nove fontes novas em `links.js` e cinco recortes novos (resumos próprios).
- **Dinheiro:** uma dica única ao começar a jogar («Toca 💰 … y 🎖️ …»); com menos de 💰 4 ou janeiro no vermelho, os chips 💰 e 🎖️ piscam.
- **Manchetes do ano:** tocar no ano (ou no «📰» da ajuda) abre o fato do ano, o imprevisto e a demanda em curso e os títulos reais da imprensa e dos documentos daquele ano, com «ver ↗»; dá para voltar aos anos anteriores.
- **Luz:** a 1.ª vez que se toca em Luz | Tasas abre a explicação com um desenho em três quadros (névoa = casos ocultos → diagnóstico revela → luz = equilíbrio 0–3) e a nota sobre Tasas (Atlas 2015–2019); o «?» ao lado dos botões e o título da legenda reabrem; a troca de camada dá um brilho curto no mapa.
- Partidas salvas continuam (mesma chave `epidemia-py-v4`).

## Ranking a um toque e mapa a partir do ranking (beta13, 28/10/2026)

- **No jogo:** 🏆 discreto na barra de baixo, em qualquer fase, e «🏆 Ranking» na tela de início; a partida fica salva e o ranking tem «Volver al juego».
- **No ranking:** botão «Mapa del cáncer», que abre o mapa público do congresso (`/mapa/`), ao lado de «Abrir el juego» e «Copiar enlace».

## Pessoas diferentes e «Zerar ranking» (beta14 + planilha versão 3, 29/10/2026)

Pedido do Gi: «zerar o ranking» e «contar o jogador que acessa sem logar, para sabermos quantas pessoas diferentes acessaram».

- **Sem identificar ninguém:** cada aparelho avisa uma vez que abriu o jogo (aba Visitas da planilha: só data, idioma e versão) e marca a sua primeira partida e a primeira sem dados. O celular guarda só que já avisou (`epidemia-py-contagem`); nada é enviado que identifique a pessoa. O Resumo mostra: aparelhos que abriram o jogo, que jogaram e que jogaram sem dados.
- **Zerar sem apagar:** menu «Zerar ranking» na planilha; Partidas e Visitas vão para abas de arquivo e recomeçam vazias. O menu da LGPD (30/11) apaga nome e e-mail também nessas abas.
- **Evento novo:** mudar `edicao` no `config.js` para os aparelhos contarem de novo.
- **Compatível:** com a planilha ainda na versão 2, o jogo continua funcionando; a visita é recusada e o aparelho tenta de novo na próxima abertura. Partidas salvas continuam (mesma chave `epidemia-py-v4`).
