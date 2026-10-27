// Links das fontes do jogo, conferidos em 26/10/2026: "url" é a página original; "arquivo" é a cópia guardada no
// Internet Archive (Wayback Machine), usada quando não há recorte. "recorte" é o PDF do jogo (resumo próprio + link do site), aberto primeiro.
const LINKS_FONTES = {
 "abc_tabaco_2022": {
  "url": "https://www.abc.com.py/nacionales/2022/02/13/impuesto-selectivo-al-tabaco-todavia-sigue-siendo-el-mas-bajo-en-la-region/",
  "arquivo": "https://web.archive.org/web/20240811014539/https://www.abc.com.py/nacionales/2022/02/13/impuesto-selectivo-al-tabaco-todavia-sigue-siendo-el-mas-bajo-en-la-region/",
  "recorte": "../recortes/abc_tabaco_2022.pdf"
 },
 "abc_incan_2023": {
  "url": "https://www.abc.com.py/politica/2023/05/03/diputados-aprueban-ampliacion-presupuestaria-para-el-incan/",
  "arquivo": "https://web.archive.org/web/20260415010704/https://www.abc.com.py/politica/2023/05/03/diputados-aprueban-ampliacion-presupuestaria-para-el-incan/",
  "recorte": "../recortes/abc_incan_2023.pdf"
 },
 "lanacion_bid_2023": {
  "url": "https://www.lanacion.com.py/negocios/2023/04/13/aprueban-usd-45-millones-para-mejorar-red-de-servicios-de-salud-en-4-departamentos/",
  "arquivo": "https://web.archive.org/web/20251215210106/https://www.lanacion.com.py/negocios/2023/04/13/aprueban-usd-45-millones-para-mejorar-red-de-servicios-de-salud-en-4-departamentos/",
  "recorte": "../recortes/lanacion_bid_2023.pdf"
 },
 "ley_2969": {
  "url": "https://www.bacn.gov.py/leyes-paraguayas/2053/ley-n-2969-aprueba-el-convenio-marco-de-la-organizacion-mundial-de-la-salud-oms-para-el-control-del-tabaco-br",
  "arquivo": "https://web.archive.org/web/20260414155031/https://www.bacn.gov.py/leyes-paraguayas/2053/ley-n-2969-aprueba-el-convenio-marco-de-la-organizacion-mundial-de-la-salud-oms-para-el-control-del-tabaco-br"
 },
 "abc_encarnacion": {
  "url": "https://www.abc.com.py/policiales/2024/05/10/inauguran-nueva-sede-del-hospital-dia-oncologico-de-encarnacion/",
  "arquivo": "https://web.archive.org/web/20260216082809/https://www.abc.com.py/policiales/2024/05/10/inauguran-nueva-sede-del-hospital-dia-oncologico-de-encarnacion/",
  "recorte": "../recortes/abc_encarnacion.pdf"
 },
 "oiea_2026": {
  "url": "https://www.iaea.org/newscenter/news/paraguay-strengthens-national-cancer-control-international-review-finds",
  "arquivo": "https://web.archive.org/web/20260527034310/https://www.iaea.org/newscenter/news/paraguay-strengthens-national-cancer-control-international-review-finds",
  "recorte": "../recortes/oiea_2026.pdf"
 },
 "ops_impact_2026": {
  "url": "https://www.paho.org/es/noticias/24-4-2026-paraguay-identifica-brechas-oportunidades-respuesta-al-cancer-con-mision-impact",
  "arquivo": null,
  "recorte": "../recortes/ops_impact_2026.pdf"
 },
 "ccan_2022": {
  "url": "https://citycancerchallenge.org/uploads/2022/09/Locally-led-strategies-to-develop-and-implement-cancer-care-policy.pdf",
  "arquivo": "https://web.archive.org/web/20250327081158/https://citycancerchallenge.org/uploads/2022/09/Locally-led-strategies-to-develop-and-implement-cancer-care-policy.pdf"
 },
 "ley_6266": {
  "url": "https://www.bacn.gov.py/leyes-paraguayas/8708/ley-n-6266-de-atencion-integral-a-las-personas-con-cancer",
  "arquivo": "https://web.archive.org/web/20251008185548/https://www.bacn.gov.py/leyes-paraguayas/8708/ley-n-6266-de-atencion-integral-a-las-personas-con-cancer"
 },
 "decreto_2064": {
  "url": "https://alertas-v3.directoriolegislativo.org/wp-content/uploads/2019/07/DECRETO2064.pdf",
  "arquivo": null
 },
 "pediatria_2024": {
  "url": "https://doi.org/10.31698/ped.51022024002",
  "arquivo": null
 },
 "ico_2023": {
  "url": "https://hpvcentre.net/statistics/reports/PRY_FS.pdf",
  "arquivo": "https://web.archive.org/web/20240619003940/https://hpvcentre.net/statistics/reports/PRY_FS.pdf"
 },
 "atlas": {
  "url": "https://www.mspbs.gov.py/dependencias/portal/adjunto/c377f6-AtlasMortalidadporCancer20152019.pdf",
  "arquivo": "https://web.archive.org/web/20250828194538/https://www.mspbs.gov.py/dependencias/portal/adjunto/c377f6-AtlasMortalidadporCancer20152019.pdf"
 },
 "lanacion_2023": {
  "url": "https://www.lanacion.com.py/pais/2023/04/25/el-incan-incorporara-equipo-de-radioterapia-valuado-en-us-2-millones/",
  "arquivo": "https://web.archive.org/web/20250713043957/https://www.lanacion.com.py/pais/2023/04/25/el-incan-incorporara-equipo-de-radioterapia-valuado-en-us-2-millones/",
  "recorte": "../recortes/lanacion_2023.pdf"
 },
 "mspbs_dosis_unica": {
  "url": "https://www.mspbs.gov.py/portal/30707/a-partir-de-mantildeana-se-implementa-nuevo-esquema-de-dosis-unica-contra-el-vph-para-nintildeas-y-nintildeos.html",
  "arquivo": "https://web.archive.org/web/20250505091602/https://www.mspbs.gov.py/portal/30707/a-partir-de-mantildeana-se-implementa-nuevo-esquema-de-dosis-unica-contra-el-vph-para-nintildeas-y-nintildeos.html",
  "recorte": "../recortes/mspbs_dosis_unica.pdf"
 },
 "mspbs_registro_unico": {
  "url": "https://www.mspbs.gov.py/portal/31713/registro-unico-para-luchar-contra-el-cancer-salud-avanza-hacia-una-mejor-planificacion-y-atencion.html",
  "arquivo": "https://web.archive.org/web/20241120184805/https://www.mspbs.gov.py/portal/31713/registro-unico-para-luchar-contra-el-cancer-salud-avanza-hacia-una-mejor-planificacion-y-atencion.html",
  "recorte": "../recortes/mspbs_registro_unico.pdf"
 },
 "mspbs_concepcion": {
  "url": "https://www.mspbs.gov.py/portal/31729/decimo-hospital-dia-oncologico-del-pais-ya-es-una-realidad-en-concepcion.html",
  "arquivo": "https://web.archive.org/web/20241121201929/https://www.mspbs.gov.py/portal/31729/decimo-hospital-dia-oncologico-del-pais-ya-es-una-realidad-en-concepcion.html",
  "recorte": "../recortes/mspbs_concepcion.pdf"
 },
 "mspbs_incan_acelerador": {
  "url": "https://www.mspbs.gov.py/portal/29490/adios-a-las-listas-de-espera-incan-habilita-tercer-acelerador-lineal.html",
  "arquivo": "https://web.archive.org/web/20240314230032/https://www.mspbs.gov.py/portal/29490/adios-a-las-listas-de-espera-incan-habilita-tercer-acelerador-lineal.html",
  "recorte": "../recortes/mspbs_incan_acelerador.pdf"
 },
 "mspbs_vph_2025": {
  "url": "https://www.mspbs.gov.py/portal/32496/alientan-a-mujeres-a-realizarse-prueba-de-vph-en-forma-precoz.html",
  "arquivo": "https://web.archive.org/web/20260208022759/https://www.mspbs.gov.py/portal/32496/alientan-a-mujeres-a-realizarse-prueba-de-vph-en-forma-precoz.html",
  "recorte": "../recortes/mspbs_vph_2025.pdf"
 },
 "enfr": {
  "url": "https://www.mspbs.gov.py/portal/27507/segunda-encuesta-nacional-muestra-elevada-prevalencia-de-factores-de-riesgo.html",
  "arquivo": "https://web.archive.org/web/20250722154925/https://www.mspbs.gov.py/portal/27507/segunda-encuesta-nacional-muestra-elevada-prevalencia-de-factores-de-riesgo.html",
  "recorte": "../recortes/enfr.pdf"
 },
 "sequera_2025": {
  "url": "https://doi.org/10.18004/anales/2025.058.03.13",
  "arquivo": null
 },
 "leite_2025": {
  "url": "https://doi.org/10.1158/2767-9764.CRC-25-0564",
  "arquivo": null
 },
 "torres_2022": {
  "url": "https://doi.org/10.1186/s12889-021-12413-0",
  "arquivo": null
 },
 "oms_perfil_2020": {
  "url": "https://cdn.who.int/media/docs/default-source/country-profiles/cancer/pry-2020.pdf",
  "arquivo": null
 },
 "dgvs_2024": {
  "url": "https://dgvs.mspbs.gov.py/cerca-de-2-900-diagnosticos-de-cancer-se-registraron-en-asuncion-y-central/",
  "arquivo": "https://web.archive.org/web/20260606163328/https://dgvs.mspbs.gov.py/cerca-de-2-900-diagnosticos-de-cancer-se-registraron-en-asuncion-y-central/",
  "recorte": "../recortes/dgvs_2024.pdf"
 },
 "lanacion_2024": {
  "url": "https://www.lanacion.com.py/pais/2024/07/23/radioterapia-en-alto-parana-sera-de-gran-impacto-para-pacientes-segun-oncologo/",
  "arquivo": "https://web.archive.org/web/20260121033801/https://www.lanacion.com.py/pais/2024/07/23/radioterapia-en-alto-parana-sera-de-gran-impacto-para-pacientes-segun-oncologo/",
  "recorte": "../recortes/lanacion_2024.pdf"
 },
 "lanacion_2026": {
  "url": "https://www.lanacion.com.py/pais/2026/03/09/en-cde-pacientes-oncologicos-se-movilizaron-por-medicamentos-y-ampliacion-de-pabellon/",
  "arquivo": "https://web.archive.org/web/20260710102805/https://www.lanacion.com.py/pais/2026/03/09/en-cde-pacientes-oncologicos-se-movilizaron-por-medicamentos-y-ampliacion-de-pabellon/",
  "recorte": "../recortes/lanacion_2026.pdf"
 },
 "ops_vph_2024": {
  "url": "https://www.paho.org/es/noticias/12-2-2024-100-mil-mujeres-seran-beneficiadas-con-prueba-vph-sistema-salud-publica-alto",
  "arquivo": "https://web.archive.org/web/20250121174138/https://www.paho.org/es/noticias/12-2-2024-100-mil-mujeres-seran-beneficiadas-con-prueba-vph-sistema-salud-publica-alto",
  "recorte": "../recortes/ops_vph_2024.pdf"
 },
 "globocan_2022": {
  "url": "https://gco.iarc.who.int/media/globocan/factsheets/populations/600-paraguay-fact-sheet.pdf",
  "arquivo": "https://web.archive.org/web/20250530031717/https://gco.iarc.who.int/media/globocan/factsheets/populations/600-paraguay-fact-sheet.pdf"
 },
 "alma_ata": {
  "url": "https://paho.org/sites/default/files/APS_Alma_Ata-Declaracion-1978.pdf",
  "arquivo": "https://web.archive.org/web/20260206142403/https://www.paho.org/sites/default/files/APS_Alma_Ata-Declaracion-1978.pdf"
 },
 "ops_riiss_2026": {
  "url": "https://www.paho.org/es/noticias/14-7-2026-salud-avanza-adaptacion-herramienta-para-fortalecer-redes-integradas-servicios",
  "arquivo": null,
  "recorte": "../recortes/ops_riiss_2026.pdf"
 },
 "oms_colo_2020": {
  "url": "https://www.who.int/publications/i/item/9789240014107",
  "arquivo": "https://web.archive.org/web/20261012103912/https://www.who.int/publications/i/item/9789240014107"
 },
 "ine_censo": {
  "url": "https://www.ine.gov.py/noticias/2101/principales-resultados-finales-del-censo-2022",
  "arquivo": "https://web.archive.org/web/20260808100355/https://www.ine.gov.py/noticias/2101/principales-resultados-finales-del-censo-2022"
 },
 "dncp_ips": {
  "url": "https://www.contrataciones.gov.py/documentos/download/acta/352139-lpn-83-18-servicios-tratamientos-radiantes-ips-1",
  "arquivo": null
 },
 "geoboundaries": {
  "url": "https://www.geoboundaries.org",
  "arquivo": "https://web.archive.org/web/20261026214333/https://www.geoboundaries.org/"
 }
};
