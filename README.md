# Epidemia: Paraguay contra el cáncer (beta)

Juego educativo para celular sobre la epidemiología del cáncer en Paraguay. El jugador conduce el control del cáncer de 2015 a 2024: cada año recibe un presupuesto y elige acciones de **prevención**, **diagnóstico** y **tratamiento** en los 18 departamentos.

El jugador elige un personaje: **Bob** (estudiante de Medicina, tecnología e IA), **Don Patrón** (empresario, alianzas público-privadas) o la **Dra. Beatriz** (médica). Cada uno tiene ventajas propias y un árbol de habilidades al estilo de XCOM 2: al subir de cargo con sus puntos, elige una nueva habilidad (3 especializaciones × 4 cargos).

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
- `arte/`: ilustraciones en SVG (cena principal, emblema, retratos y escenas). Las genera un script del proyecto; no editar a mano.
- `ranking.html`: ranking en vivo para la tablet del stand (se actualiza cada 5 s, con el QR del juego).
- `config.js`: dirección del ranking (`rankingUrl`) y del juego.
- `apps-script/`: código de la planilla de Google que guarda el ranking y cómo instalarlo.

**Datos personales (LGPD/privacidad):** nombre, facultad y curso solo con autorización del jugador; se usan para el ranking del congreso y se borran el 31/10/2026.

Beta para pruebas.

## Segurança e teto (beta7, 27/10/2026)

- **Sem servidor próprio:** o site é só arquivos (GitHub Pages). O único ponto compartilhado é o ranking (Google Apps Script + planilha).
- **CSP** em `index.html` e `ranking.html`: o navegador só roda scripts deste site e só conecta com o Apps Script (`script.google.com` / `script.googleusercontent.com`). Por isso o script do ranking fica em `ranking.js`, e não dentro do HTML.
- **QR sem biblioteca de fora:** `qr-jogo.svg` (e `mapa/qr-mapa.svg`) vêm desenhados de `_ferramentas/gerar_qr.py`, no vault, conferidos por leitor.
- **`mapa/`**: mapa público do congresso (gerado por `_ferramentas/gerar_pagina.py`), com CSP por hash e `sw.js` para abrir sem internet. Não editar à mão.
- **Teto do ranking** (`apps-script/Codigo.gs`):
  - 60 envios por minuto (`limite`) e até 3.000 partidas (`cheio`);
  - envio de até 2.000 bytes;
  - lista guardada 10 s;
  - envio repetido barrado;
  - campos curtos e sem fórmula;
  - pontos por ano até 3.100 (3.000 + 100 do Desafío relámpago).
- **Testes:** a cópia de teste tira a CSP (o roteiro de teste é um script na página); a CSP verdadeira é conferida no site publicado.

