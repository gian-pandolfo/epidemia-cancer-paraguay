# Epidemia: Paraguay contra el cáncer (beta)

Juego educativo para celular sobre la epidemiología del cáncer en Paraguay. El jugador conduce el control del cáncer de 2015 a 2024: cada año recibe un presupuesto y elige acciones de **prevención**, **diagnóstico** y **tratamiento** en los 18 departamentos.

**Jugar:** https://gian-pandolfo.github.io/epidemia-cancer-paraguay/

## Créditos

- **Desarrollo:** Gianmarlon Pandolfo, estudiante de Medicina (UNINTER Tres Fronteras).
- **Trabajo base:** Silva GIS, Pandolfo GA, et al. *Mortalidad por Cáncer en Paraguay: Análisis Epidemiológico, Disparidades Geográficas y Desafíos para el Control*. Revisión sistemática, 2026.
- **Coautoría:** Claude Opus 5.5 (Anthropic), en el diseño del juego, la programación y la verificación de las fuentes.

## Qué es real y qué es simulación

- **Real, con fuente:** las tasas de partida de cada departamento (Atlas de Mortalidad por Cáncer en Paraguay 2015–2019), la población (Censo 2022), la 1.ª causa de muerte por cáncer por sexo y el evento de cada año (ley, decreto, pandemia, misiones, servicios inaugurados).
- **Simulación (ilustrativa):** el efecto de cada acción, los casos ocultos (subregistro) y los puntos. Sirven para enseñar, no son estimaciones epidemiológicas.

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
