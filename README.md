# Epidemia: Paraguay contra el cáncer (beta)

Juego educativo para celular sobre la epidemiología del cáncer en Paraguay. El jugador conduce el control del cáncer de 2015 a 2024: cada año recibe un presupuesto y elige acciones de **prevención**, **diagnóstico** y **tratamiento** en los 18 departamentos.

Cada año dura 12 meses en tiempo real (unos 24 segundos, con pausa). El mapa y los contadores del país muestran incidencia, prevalencia, muertes y curas mientras el año corre. Cada año trae un hecho real, a veces un imprevisto (royalties de Itaipú, epidemias, inversión extranjera) y una demanda de la sociedad, que el jugador atiende, rechaza o promete cumplir. Las respuestas cambian la confianza, y la confianza cambia el presupuesto. Los convenios con instituciones privadas, fundaciones o universidades cuestan menos al principio, pero se pagan todos los años.

Para que den ganas de volver a jugar: **misiones** con premio (por ejemplo, test de VPH donde el cuello uterino es la 1.ª causa de muerte en las mujeres), un **desafío relámpago** por año (verdadero o falso, con fuente), **logros** que quedan guardados en el celular, estrellas por año, cargo final y récord. El juego también reacciona a las decisiones: muestra las vidas salvadas, los casos evitados por la prevención y las personas que murieron sin diagnóstico (modelo del juego, comparado con no hacer nada).

**Jugar:** https://gian-pandolfo.github.io/epidemia-cancer-paraguay/

## Créditos

- **Desarrollo:** Gianmarlon Pandolfo, estudiante de Medicina (UNINTER Tres Fronteras).
- **Trabajo base:** Silva GIS, Pandolfo GA, et al. *Mortalidad por Cáncer en Paraguay: Análisis Epidemiológico, Disparidades Geográficas y Desafíos para el Control*. Revisión sistemática, 2026.
- **Coautoría:** Claude Opus 5.5 (Anthropic), en el diseño del juego, la programación y la verificación de las fuentes.

## Qué es real y qué es simulación

- **Real, con fuente:** las tasas y las muertes de partida de cada departamento (Atlas de Mortalidad por Cáncer en Paraguay 2015–2019), la población (Censo 2022), la proporción entre casos y muertes (GLOBOCAN 2022: 13.783 casos y 6.581 muertes) y el hecho de cada año (ley, decreto, pandemia, misiones, servicios inaugurados). Los imprevistos y demandas que traen «ejemplo real» o «inspirado en» citan su fuente.
- **Simulación (ilustrativa):** el efecto de cada acción, los casos ocultos (subregistro), la incidencia, la prevalencia, las muertes y las curas en tiempo real, los imprevistos, las demandas, la confianza y los puntos. Sirven para enseñar, no son estimaciones epidemiológicas.

## Base

Revisión sistemática de Silva GIS, Pandolfo GA, et al. *Mortalidad por cáncer en Paraguay: análisis epidemiológico, disparidades geográficas y desafíos para el control* (2026) y sus fuentes: MSPBS/DVENT (Atlas 2015–2019), IARC (GLOBOCAN 2022), INE (Censo 2022), ENFR 2022, ICO/IARC HPV Information Centre (2023), Leite et al. (2025), Torres-Roman et al. (2022), Ley N° 6266/2018, Decreto N° 2064/2019, MSPBS, OPS/OMS, OIEA y prensa paraguaya (lista completa dentro del juego, en «Fuentes»).

Mapa: límites de [geoBoundaries](https://www.geoboundaries.org) (CC BY 4.0; Runfola D, et al. PLoS One 2020;15(4):e0231866).

## Archivos

- `index.html`: pantalla y estilos.
- `jogo.js`: reglas, textos (español y portugués) y fuentes.
- `dados.js`: mapa y datos de los departamentos. Lo genera un script del proyecto a partir de la página del mapa del congreso; no editar a mano.
- `ranking.html`: ranking en vivo para la tablet del stand (se actualiza cada 5 s, con el QR del juego).
- `config.js`: dirección del ranking (`rankingUrl`) y del juego.
- `apps-script/`: código de la planilla de Google que guarda el ranking y cómo instalarlo.

**Datos personales (LGPD/privacidad):** nombre, facultad y curso solo con autorización del jugador; se usan para el ranking del congreso y se borran el 31/10/2026.

Beta para pruebas.
