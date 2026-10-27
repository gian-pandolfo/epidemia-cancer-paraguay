"use strict";
/* Epidemia: Paraguay contra el cáncer (beta).
   Real, com fonte: taxas e óbitos do Atlas 2015-2019, população do Censo 2022 e o fato histórico de cada ano.
   Modelo do jogo (ilustrativo, avisado na tela): efeitos das ações, casos ocultos, incidência, prevalência, óbitos e
   curas ao vivo, imprevistos, demandas, confiança e pontos. */

const $ = (s) => document.querySelector(s);
const ANOS = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024];
const ORC_BASE = 15;   // receita por ano, que entra mês a mês
const RAZAO_INC = 2.1;             // incidência ≈ 2,1 × óbitos (GLOBOCAN 2022: 13.783 casos / 6.581 óbitos)
const CHAVE = "epidemia-py-v4";    // v4: personagens, habilidades, prestígio e manutenção (partidas salvas de versões anteriores não continuam)
const RANKS = [0, 1500, 4000, 7500, 11000];   // pontos de cada cargo; cada promoção libera uma habilidade
const CONV_DESDE = 2016;   // convênios a partir de 2016 (Don Patrón desde o começo)
const CHAVE_LOGROS = "epidemia-py-logros";   // conquistas deste celular, entre partidas
const MODOS_VIVOS = ["inc", "prev", "mort", "cura"];
const DEP = Object.fromEntries(DEPS.map((d) => [d.id, d]));
const TEE_MIN = Math.min(...DEPS.map((d) => d.tee)), TEE_MAX = Math.max(...DEPS.map((d) => d.tee));
const sortear = (lista) => lista[Math.floor(Math.random() * lista.length)];
const embaralhar = (lista) => lista.map((x) => [Math.random(), x]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
const limitar = (x) => Math.max(0, Math.min(100, Math.round(x)));

/* ---------- armazenamento local (pode falhar em aba anônima: o jogo segue sem salvar) ---------- */
const guardar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sem armazenamento */ } };
const ler = (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } };

/* ---------- ações: 3 por nível + centro de pesquisa. "conv" = anuidade do convênio que cumpre o mesmo papel ---------- */
const SLOTS = { P: ["vacuna", "tabaco", "habitos"], D: ["vph", "mamo", "registro"], T: ["quimio", "radio", "paliativos"] };
/* at = nível de atenção (1ª primária, 2ª secundária, 3ª terciária); manut = manutenção por ano; prest = prestígio para aprovar;
   desde = ano em que fica disponível; conv = anuidade do convênio que cumpre o mesmo papel */
const ACOES = {
  vacuna: { nivel: "P", at: 1, custo: 2, manut: 0.5, prest: 0, ico: "💉" },
  tabaco: { nivel: "P", at: 1, custo: 1, manut: 0.5, prest: 0, ico: "🚭" },
  habitos: { nivel: "P", at: 1, custo: 1, manut: 0.5, prest: 0, ico: "🍎" },
  vph: { nivel: "D", at: 1, custo: 2, manut: 0.5, prest: 0, ico: "🔬", vis: 0.06, conv: 1 },
  mamo: { nivel: "D", at: 2, custo: 3, manut: 1, prest: 1, ico: "🎗️", vis: 0.06, conv: 2 },
  registro: { nivel: "D", at: 2, custo: 1, manut: 0.5, prest: 0, ico: "📋", vis: 0.08 },
  quimio: { nivel: "T", at: 2, custo: 4, manut: 1.5, prest: 1, ico: "💊", conv: 2 },
  radio: { nivel: "T", at: 3, custo: 8, manut: 2.5, prest: 3, ico: "☢️", conv: 3, desde: 2020 },
  paliativos: { nivel: "T", at: 1, custo: 2, manut: 0.5, prest: 0, ico: "🤲", conv: 1 },
  pesquisa: { nivel: "X", at: 3, custo: 5, manut: 1.5, prest: 2, ico: "🎓", conv: 2, desde: 2016 },
};

/* ---------- textos ---------- */
const T = {
  es: {
    sub: "Paraguay contra el cáncer",
    h1: "Epidemia: Paraguay contra el cáncer",
    intro: "Eres responsable del control del cáncer en Paraguay de 2015 a 2024. Los primeros 5 años parten de los datos reales del Atlas de Mortalidad por Cáncer; los 5 siguientes son una proyección de tus decisiones.",
    passos: [
      "Elige tu personaje: Bob, Don Patrón o la Dra. Beatriz. Cada uno tiene ventajas propias y un árbol de habilidades: al subir de cargo con tus ⭐ eliges una nueva.",
      "Lee con calma, decide y toca «Cerrar el año» para avanzar. En enero llega el 💰 del año y se paga el mantenimiento de todo lo que implementaste; sin dinero, lo más caro se cierra.",
      "Implementar también cuesta 🎖️ prestigio, que ganas con metas, misiones y respuestas a la sociedad. Toca una acción para ver costos y requisitos antes de invertir.",
      "Toca 💰 en el marcador para ver tus <b>finanzas</b> y conseguir dinero (impuesto al tabaco, préstamo, ensayo clínico…). Toca 🎖️ para usar tu <b>prestigio</b> en favores: ampliación del Congreso, brigadas, terreno de la Gobernación o notificación obligatoria.",
      "Tres funciones: <b>Prevención</b>, <b>Diagnóstico</b> y <b>Tratamiento</b>. El <b>equilibrio</b> de un departamento es la más baja de las tres: solo las tres juntas curan más y multiplican los puntos. Diagnóstico sin tratamiento forma fila. En el mapa, el equilibrio es la <b>luz</b> y la <b>niebla</b> son los casos ocultos: diagnosticar la disipa.",
      "Cada acción tiene su nivel de atención: <b>1.ª primaria</b> (puerta de entrada), <b>2.ª secundaria</b> (hospital regional, por derivación) y <b>3.ª terciaria</b> (alta complejidad). La 2.ª necesita 1.ª en el departamento; la 3.ª, 2.ª cerca.",
      "🤝 Convenios: sin compra ni prestigio, pero se pagan todos los años.",
      "Arriba a la derecha: incidencia, prevalencia, muertes y curas del país por año; cambian en el acto con cada decisión. Tócalas para ver el mapa de cada una.",
      "Cada año trae un hecho real, a veces un imprevisto (royalties, epidemias, donaciones, recortes del Congreso) y una demanda de la sociedad.",
      "🎯 Misiones, ⚡ desafíos relámpago y 🏅 logros dan premios. ❤️ Vidas salvadas, 🍎 casos evitados y 🕯️ muertes sin diagnóstico muestran el efecto de tus decisiones (modelo del juego, comparado con no hacer nada).",
      "Donde la estadística es baja, falta diagnóstico, no cáncer: diagnosticar revela casos ocultos y la tasa registrada sube. ¡Es buena señal!",
    ],
    aviso: "Simulación educativa (beta). Los datos de partida y el hecho histórico de cada año son reales, con fuente. Los efectos de las acciones, los personajes, los números en tiempo real, los imprevistos, las demandas y los puntos son del modelo del juego.",
    creditosTit: "Créditos",
    creditos: [
      "<b>Desarrollo:</b> Gianmarlon Pandolfo, estudiante de Medicina (UNINTER Tres Fronteras).",
      "<b>Trabajo base:</b> Silva GIS, Pandolfo GA, et al. <i>Mortalidad por Cáncer en Paraguay: Análisis Epidemiológico, Disparidades Geográficas y Desafíos para el Control</i>. Revisión sistemática, 2026.",
      "<b>Coautoría:</b> Claude Opus 5.5 (Anthropic), en el diseño del juego, la programación y la verificación de las fuentes.",
      "<b>Arte:</b> ilustraciones vectoriales hechas para el juego (estilo «luz contra la niebla»). Tipografías Big Shoulders Display y Atkinson Hyperlegible (licencia OFL).",
    ],
    comecar: "Empezar", continuar: "Continuar partida", nova: "Nueva partida",
    ajuda: "Cómo se juega", fechar: "Cerrar",
    anoDe: (a, i) => `${a} · año ${i} de 10`,
    modoCob: "Luz", modoReg: "Tasas",
    verMapa: "Ver en el mapa", noMapa: "En el mapa", lerNoticia: "Leer la noticia", recKicker: "Datos reales · para investigar",
    recPoucos: "* Pocas muertes en 5 años: la tasa es inestable.", recFeito: "hecho", hab: "hab.", muertes: "muertes",
    misSeguir: "Toca un departamento de la noticia para verlo en el mapa.",
    finTit: "Finanzas", finIntro: (r, m) => `En enero entran 💰 ${r} y se pagan 💰 ${m} de mantenimiento y convenios. Estas decisiones traen dinero, pero cada una tiene un costo.`,
    prestTit: "Prestigio", prestIntro: "El prestigio es tu capital político: lo ganas atendiendo demandas, cumpliendo misiones y promesas, acertando desafíos y llevando departamentos al equilibrio. Lo gastas para aprobar estructuras grandes y para pedir favores. Con 🎖️ 20 o más, el Congreso suma +💰 3 cada enero.",
    faltaPrest: (n) => `Faltan 🎖️ ${n}.`, faltaPesq: "Necesitas un centro de investigación.", favorJaTem: (a, d) => `${d} ya tiene ${a}. Elige otro departamento en el mapa.`,
    ensCurso: (a) => (a ? `En curso: el resultado sale en enero de ${a}.` : "En curso: el resultado saldrá después de tu gestión."),
    ensOk: "Funcionó: +3% de cura en todo el país.", ensFalhou: "No funcionó: −🎖️ 3.",
    evProveedor: "Pagaste la deuda con los proveedores, con recargo: −💰 5 y −🎖️ 1 (faltaron insumos).",
    evEnsayo: { ok: "Ensayo clínico: el tratamiento funcionó. +3% de cura en todo el país (modelo del juego).", falhou: "Ensayo clínico: el tratamiento no funcionó. −🎖️ 3." },
    legCob: "Luz = equilibrio", legReg: "Tasa estandarizada /100 mil", legNevoa: "Niebla = casos ocultos",
    capaAlt: "Anochecer en Paraguay: un hospital encendido ilumina la red de salud; a la derecha, la niebla del subregistro.",
    curtas: { vacuna: "Vacuna VPH", tabaco: "Antitabaco", habitos: "Hábitos", vph: "Test VPH", mamo: "Mamógrafo", registro: "Registro",
      quimio: "Hospital Día", radio: "Acelerador", paliativos: "Paliativos", pesquisa: "Centro de investigación" },
    infoPop: (p) => `${p} hab. (Censo 2022)`,
    infoTaxa: (a, b) => `Tasa estandarizada /100 mil (Atlas 2015–19): <b>${a} → ${b}</b>`,
    infoOculto: (x) => `Casos ocultos: <b>${x}</b>`,
    filaCurta: "⚠ Fila: hay diagnóstico pero no tratamiento cerca; rinde la mitad.",
    compra: (ico, n, a) => `${ico} ${n} → ${a}`,
    escolher: "Elegir departamento…",
    ocultoQ: "?",
    poucos: "Pocas muertes en 5 años: la tasa es inestable.",
    niveis: { P: "1.º Prevención", D: "2.º Diagnóstico", T: "3.º Tratamiento", X: "Investigación" },
    acoes: {
      vacuna: ["Vacuna VPH en escuelas", "cuello uterino"],
      tabaco: ["Campaña antitabaco", "pulmón"],
      habitos: ["Alimentación y actividad física", "colorrectal"],
      vph: ["Test de VPH y Papanicolau en la USF", "cuello uterino"],
      mamo: ["Mamógrafo regional", "mama"],
      registro: ["Notificación y registro", "revela casos ocultos"],
      quimio: ["Hospital Día oncológico", "quimioterapia cerca de casa"],
      radio: ["Acelerador lineal público", "radioterapia, alta complejidad"],
      paliativos: ["Cuidados paliativos", "calidad de vida"],
      pesquisa: ["Centro de investigación y registro", "revela la carga real aquí y en los vecinos; +20% de puntos aquí"],
    },
    custo: (c) => (c ? `💰 ${c}` : "gratis"), custoAno: (c) => `💰 ${c}/año`, ativo: "✓ activo",
    semOrc: "Presupuesto insuficiente", jaAtivo: "Ya está activo (de años anteriores)", desfeito: (c) => `Deshecho: vuelven 💰 ${c}`,
    evBtn: "Jugar el año", evOrc: (o) => `Presupuesto disponible: 💰 ${o}`, fonte: "Fuente",
    fimAno: (a) => `Fin de ${a}`, ptsAno: (p) => `+${p} puntos`, prox: (a) => `Siguiente: ${a}`, verRes: "Ver resultado",
    resSubiu: (l) => `La tasa registrada subió en: ${l}. Son casos que estaban ocultos.`,
    resFila: (l) => `Filas en: ${l}.`,
    resEquil: (n) => `Departamentos con los 3 niveles: ${n} de 18.`,
    resTit: "Tu resultado", pontos: "puntos", recorde: (r) => `Tu récord en este celular: ${r}`, novoRec: "¡Nuevo récord!",
    resLinhas: (x) => [
      `Departamentos con los 3 niveles: <b>${x.equil3}</b> de 18 (población cubierta en equilibrio: <b>${x.popEq}%</b>).`,
      `Casos ocultos que salieron a la luz: <b>${x.revelados}%</b> de lo que faltaba.`,
      `Inversión por nivel: prevención ${x.gP}, diagnóstico ${x.gD}, tratamiento ${x.gT}, investigación ${x.gX} (💰).`,
    ],
    realTit: "En la vida real",
    real: [
      "GLOBOCAN 2022: 13.783 casos nuevos y 6.581 muertes por cáncer en Paraguay (IARC).",
      "Radioterapia pública: un único lugar para todo el país, el INCAN, en Capiatá (MSPBS, 2024).",
      "En 8 de los 18 departamentos, el cuello uterino es la 1.ª causa de muerte por cáncer en las mujeres: un cáncer evitable (Atlas 2015–2019).",
      "Cerca de 1 de cada 4 muertes no entraba en las estadísticas: subregistro de 26,2% en 2017 (Atlas 2015–2019).",
    ],
    fontesTit: "Fuentes",
    denovo: "Jugar de nuevo", compartir: "Compartir", copiado: "Enlace copiado",
    compTit: "Invita a otro jugador", compSub: "Que tu compañero apunte la cámara al código, o envíale el enlace.",
    compEnviar: "Enviar enlace", compCopiar: "Copiar enlace", compFalhou: "No se pudo copiar: mantén el dedo sobre el enlace y elige «Copiar».",
    qrAlt: "Código QR del juego",
    beta: "Versión beta para pruebas. Cuéntanos qué te pareció.",
    rankTit: "Ranking del congreso",
    rankNome: "Nombre", rankEmail: "E-mail", rankFac: "Facultad", rankTurma: "Curso",
    rankEnviando: "Enviando tu puntuación al ranking…",
    rankJa: (p) => `¡Listo! Estás en el ranking${p ? `, en el puesto ${p}` : ""}.`,
    rankPendente: "No se pudo enviar ahora: tu puntuación se enviará sola cuando haya conexión.",
    rankSemDados: "Jugaste sin datos: esta partida no entra en el ranking. Para entrar, completa tus datos al empezar la próxima.",
    rankFalhou: "No se pudo registrar esta partida en el ranking.",
    rankCheio: "El ranking del congreso llegó al límite de partidas.",
    rankFechado: "El ranking del congreso abre pronto.",
    rankEncerrado: "El ranking del congreso ya terminó.",
    rankVer: "Ver ranking",
    dadosTit: "Antes de empezar",
    dadosIntro: "Para entrar en el ranking del congreso, completa los cuatro datos y acepta los términos. Si prefieres, juega sin datos: la partida cuenta, pero no entra en el ranking.",
    dadosOk: "Leí y acepto los términos.",
    dadosJogar: "Aceptar y jugar", dadosSem: "Jugar sin datos",
    dadosCampos: "Completa nombre, e-mail, facultad y curso.",
    dadosEmail: "Revisa el e-mail: parece incompleto.",
    dadosSemOk: "Para entrar en el ranking, acepta los términos.",
    termosTit: "Términos y privacidad",
    termos: (c) => [
      `Responsable: Gianmarlon Pandolfo, autor del juego. Contacto: ${c}.`,
      "Si completas tus datos, guardamos nombre, e-mail, facultad y curso, con la hora de inicio y de fin y la puntuación de cada partida.",
      "Para qué: mostrar el ranking del congreso (nombre, facultad, curso y puntos; el e-mail nunca aparece), no repetir jugadores, contar quién jugó y terminó, calcular promedios por facultad y curso, y contactar a quienes ganen.",
      "Dónde: en una planilla privada de Google; solo el autor tiene acceso.",
      "Hasta cuándo: los nombres salen del ranking el 31/10/2026; nombre y e-mail se borran el 30/11/2026 y quedan solo totales y promedios.",
      "Puedes pedir ver, corregir o borrar tus datos escribiendo al contacto.",
      "En tu celular: el juego recuerda tus datos para la próxima partida; se borran solos el 31/10/2026.",
      "Sin datos: de toda partida registramos, sin identificarte, la hora de inicio y de fin, la puntuación y el idioma.",
    ],
    ultimo: "Ver mi último resultado",
    shareTxt: "Juega Epidemia: Paraguay contra el cáncer",
    meses: ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"],
    vivo: { inc: "Incidencia", prev: "Prevalencia", mort: "Muertes", cura: "Curas" },
    vivoTit: {
      inc: "Casos diagnosticados por año con lo que funciona hoy (modelo del juego). Toca para ver el mapa.",
      prev: "Personas que viven con un cáncer diagnosticado en los últimos 5 años (modelo del juego). Toca para ver el mapa.",
      mort: "Muertes por cáncer por año con lo que funciona hoy, estimadas (modelo del juego). Toca para ver el mapa.",
      cura: "Curas por año entre los pacientes diagnosticados (modelo del juego). Toca para ver el mapa.",
    },
    vivoAria: "País, por año (modelo del juego)",
    legVivo: { inc: "Incidencia /100 mil por año (modelo)", prev: "Prevalencia /100 mil (modelo)", mort: "Muertes /100 mil por año (modelo)", cura: "Curas /100 mil por año (modelo)" },
    nomesNivel: { P: "Prevención", D: "Diagnóstico", T: "Tratamiento" }, e: " y ",
    infoEq: (n) => `Equilibrio <b>${n}/3</b>`,
    eqFalta: (l) => `↑ Para subir: ${l}`, os3: "los 3 niveles",
    eqCompleto: "✓ Los 3 niveles completos",
    // v4: personagens, habilidades, prestígio, manutenção e níveis de atenção
    linksNota: "↗ abre una copia guardada de la fuente (Internet Archive) cuando existe; si no, la página original.",
    persTeaser: "Bob, Don Patrón o la Dra. Beatriz: elige quién lidera la lucha contra el cáncer en Paraguay.",
    pers: { escolher: "Elige tu personaje", jogarCom: (n) => `Jugar con ${n}`, passiva: "Lo que ya sabe hacer", lado: "Contactos" },
    cargos: ["Coordinador/a local", "Director/a regional", "Director/a nacional", "Viceministro/a", "Ministro/a de Salud"],
    arvTit: "Personaje y habilidades", arvAscenso: (c) => `¡Ascenso a ${c}! Elige una habilidad de esa columna.`,
    arvProx: (c, p) => `Próximo cargo: ${c} con ⭐ ${p}`, arvTopo: "Llegaste al cargo más alto.",
    arvEscolher: "Elegir esta habilidad", arvEscolhida: "Ya la elegiste.", arvBloq: "Se habilita al llegar al cargo de esa columna (una sola por cargo).",
    ascensoFaixa: (c) => `¡Ascenso: ${c}!`, ascensoTxt: "Elige una nueva habilidad.",
    niveisAt: ["", "1.ª atención primaria", "2.ª atención secundaria", "3.ª atención terciaria"], nivAtCurto: ["", "1.ª", "2.ª", "3.ª"],
    funcoes: { P: "Prevención", D: "Diagnóstico", T: "Tratamiento", X: "Investigación" },
    fichaCompra: "Compra", fichaPrest: "Prestigio", fichaManut: "Mantenimiento", porAnoCurto: "/año",
    fichaImplementar: (c, p) => `Implementar · 💰 ${c}${p ? ` · 🎖️ ${p}` : ""}`,
    fichaConv: (c) => `🤝 Convenio: 💰 ${c} por año (ahora y cada enero), sin compra ni prestigio`,
    fichaManutNota: "El mantenimiento se paga cada enero, a partir del año siguiente.",
    evEconomia: (r, m) => `Presupuesto del año: +💰 ${r} · mantenimiento y convenios: −💰 ${m}`,
    evFechou: (l) => `Sin dinero para el mantenimiento: se cerró ${l} (−🎖️ 2 cada uno).`,
    fichaDesfazer: (c, p) => `Deshacer: vuelven 💰 ${c}${p ? ` y 🎖️ ${p}` : ""}`,
    fichaCancelar: "Volver", fichaCancelarConv: "Terminar el convenio", convCancelado: "Convenio terminado",
    fichaAtivo: "Ya funciona en este departamento.", fichaConvAtivo: "Funciona por convenio en este departamento.",
    bloqAno: (a) => `🔒 ${a}`, bloqAnoTxt: (a) => `Disponible desde ${a}.`,
    bloqRef1: "🔒 1.ª", bloqRef1Txt: "La atención secundaria necesita atención primaria en el departamento (derivación).",
    bloqRef2: "🔒 2.ª", bloqRef2Txt: "La atención terciaria necesita atención secundaria en el departamento o en un vecino (derivación).",
    bloqPrest: (p) => `Necesitas 🎖️ ${p} de prestigio.`, bloqOrc: "Presupuesto insuficiente.", bloqConvAno: (a) => `🤝 Convenios desde ${a}`,
    semPrest: "Prestigio insuficiente",
    economia: (r) => `💰 ${r >= 0 ? "+" : "−"}${fmtM(Math.abs(r))}/año`,
    fechouTxt: (ico, n, d) => `Sin dinero: se cerró ${ico} ${n} en ${d} (−🎖️ 2)`,
    resPrestAno: (a, b) => `Prestigio: 🎖️ ${a} → ${b}`, resPrest: (c) => `Prestigio al final: 🎖️ <b>${c}</b>`,
    resFechou: (l) => `Cierres por falta de dinero: ${l}`, resHab: (l) => `Habilidades elegidas: ${l}`,
    congressoMais: "Prestigio alto: el Congreso aprueba +💰 3 para salud.",
    evPrest: (p, e) => `🎖️ ${p} de prestigio · ${e}`,
    niveisFonte: "Niveles de atención: la 1.ª es el primer contacto con el sistema de salud (Declaración de Alma-Ata, OMS/UNICEF, 1978); la red del Paraguay va «desde la atención primaria hasta los servicios de mayor complejidad» (OPS, 14/07/2026).",
    missoesTit: "Misiones", missaoOk: "¡Misión cumplida!", recompensa: "Premio", feitasTit: "Cumplidas", semMissao: "🎯 Todas las misiones cumplidas",
    voltar: "Volver al juego",
    premio: (p) => [p.orc ? `+💰 ${p.orc}` : "", p.prest ? `+🎖️ ${p.prest}` : "", p.mult ? `⭐×${String(p.mult).replace(".", ",")} este año` : ""].filter(Boolean).join(" · "),
    logrosTit: "Logros de este celular", logroOk: "¡Logro!", logrosConta: (n, m) => `${n} de ${m}`,
    inicioLogros: (n, m) => `🏅 Logros: ${n} de ${m}`, inicioRecorde: (r) => `🏆 Tu récord: ${r}`,
    quizTit: "Desafío relámpago", quizSub: "¿Verdadero o falso?", verdadeiro: "Verdadero", falso: "Falso",
    quizCerto: (o) => `¡Correcto! +⭐ ${BONUS_QUIZ} · +💰 ${o} · +🎖️ 1`, quizErrado: "No era así.", quizSeguir: "Seguir",
    racha: (n) => `Racha de ${n} aciertos 🔥`, rachaPremio: "+🎖️ 2 por la racha",
    nivelSobe: (n) => `¡Equilibrio ${n}/3!`, novoRecorde: "¡Nuevo récord!", recordeTxt: "Superaste tu mejor puntaje en este celular.",
    rodapeV4: (e, v, p) => `${e} · ❤️ ${v} · ⭐ +${p}`, rodapeTit: "Presupuesto anual menos mantenimiento · vidas salvadas (modelo) · puntos que suma este año",
    consTit: "Consecuencia de tus decisiones",
    metVidas: "vidas salvadas", vidasPerd: "vidas perdidas", metEvit: "casos evitados por la prevención", metSemDx: "murieron sin diagnóstico",
    metModelo: "Modelo del juego, comparado con no hacer nada.",
    misAno: (l) => `🎯 Misiones cumplidas: ${l}`, quizAno: (ok) => `⚡ Desafío relámpago: ${ok ? `acertaste (+${BONUS_QUIZ} ⭐)` : "fallaste"}`,
    cargo: (c) => `Tu cargo: ${c}`,
    resImpacto: (v, e, s) => `En 10 años (modelo): <b>${v}</b> vidas salvadas, <b>${e}</b> casos evitados por la prevención y <b>${s}</b> personas que murieron sin diagnóstico.`,
    resMis: (n, m) => `Misiones cumplidas: <b>${n}</b> de ${m}`, resQuiz: (n, m) => `Desafíos relámpago: <b>${n}</b> de ${m} correctos`,
    estrelasAria: (n) => `${n} de 3 estrellas (población en equilibrio)`,
    infoVivo: {
      inc: (n, x) => `Incidencia (modelo): <b>${n}</b> casos por año · <b>${x}</b>/100 mil`,
      prev: (n, x) => `Prevalencia (modelo): <b>${n}</b> personas · <b>${x}</b>/100 mil`,
      mort: (n, x, s) => `Muertes (modelo): <b>${n}</b> por año, ${s} sin diagnóstico · <b>${x}</b>/100 mil`,
      cura: (n, x) => `Curas (modelo): <b>${n}</b> por año · <b>${x}</b>/100 mil`,
    },
    infoComp: (n, a) => `📌 Prometiste ${n} hasta ${a}`,
    convNomes: { vph: "Convenio con laboratorio privado de VPH", mamo: "Convenio con clínica privada de mamografía", quimio: "Convenio con una fundación (Hospital Día)",
      radio: "Convenio con radioterapia privada", paliativos: "Convenio con ONG de cuidados paliativos", pesquisa: "Convenio con una universidad" },
    convFeito: "🤝 convenio", convAria: (n, c) => `${n}: 💰 ${c} por año`, porAno: "año",
    convTroca: "Inversión pública: el convenio termina",
    pausar: "Pausar", seguir: "Seguir",
    terminar: (a) => `Cerrar ${a} ▶`,
    imprevisto: "Imprevisto", escenario: "Escenario del juego (ilustrativo)",
    demandaTit: "Demanda del año", proxDemanda: "Ver la demanda del año",
    quem: { cid: "Ciudadanos", pub: "Institución pública", priv: "Institución privada", acad: "Institución académica", int: "Cooperación internacional" },
    semOrcOp: "sin presupuesto", inspirado: "Inspirado en",
    compOk: (n, d) => `Compromiso cumplido: ${n} en ${d} (+🎖️ 4)`,
    compFalhou: (n, d) => `Compromiso incumplido: ${n} en ${d} (−🎖️ 6)`,
    resPais: (c, m, k) => `País este año (modelo): ${c} casos diagnosticados, ${m} muertes y ${k} curas.`,
    resComp: (ok, tot) => `Compromisos cumplidos: <b>${ok}</b> de ${tot}`,
    resTot: (c, m, k) => `En 10 años (modelo del juego): <b>${c}</b> casos diagnosticados, <b>${m}</b> muertes y <b>${k}</b> curas.`,
    modeloNota: "Modelo del juego: incidencia ≈ 2,1 × muertes (proporción de GLOBOCAN 2022: 13.783 casos y 6.581 muertes); punto de partida: muertes registradas por departamento en el Atlas 2015–2019. Lo demás es ilustrativo.",
  },
  pt: {
    sub: "Paraguai contra o câncer",
    h1: "Epidemia: Paraguai contra o câncer",
    intro: "Você é responsável pelo controle do câncer no Paraguai de 2015 a 2024. Os primeiros 5 anos partem dos dados reais do Atlas de Mortalidad por Cáncer; os 5 seguintes são uma projeção das suas decisões.",
    passos: [
      "Escolha seu personagem: Bob, Don Patrón ou a Dra. Beatriz. Cada um tem vantagens próprias e uma árvore de habilidades: ao subir de cargo com suas ⭐ você escolhe uma nova.",
      "Leia com calma, decida e toque em «Fechar o ano» para avançar. Em janeiro chega o 💰 do ano e se paga a manutenção de tudo o que você implantou; sem dinheiro, o mais caro fecha.",
      "Implantar também custa 🎖️ prestígio, que você ganha com metas, missões e respostas à sociedade. Toque numa ação para ver custos e requisitos antes de investir.",
      "Toque em 💰 no placar para ver suas <b>finanças</b> e conseguir dinheiro (imposto sobre o tabaco, empréstimo, ensaio clínico…). Toque em 🎖️ para usar seu <b>prestígio</b> em favores: ampliação do Congresso, brigadas, terreno do governo departamental ou notificação obrigatória.",
      "Três funções: <b>Prevenção</b>, <b>Diagnóstico</b> e <b>Tratamento</b>. O <b>equilíbrio</b> de um departamento é a mais baixa das três: só as três juntas curam mais e multiplicam os pontos. Diagnóstico sem tratamento forma fila. No mapa, o equilíbrio é a <b>luz</b> e a <b>névoa</b> são os casos ocultos: diagnosticar a dissipa.",
      "Cada ação tem seu nível de atenção: <b>1ª primária</b> (porta de entrada), <b>2ª secundária</b> (hospital regional, por encaminhamento) e <b>3ª terciária</b> (alta complexidade). A 2ª precisa de 1ª no departamento; a 3ª, de 2ª perto.",
      "🤝 Convênios: sem compra nem prestígio, mas se pagam todo ano.",
      "No alto à direita: incidência, prevalência, óbitos e curas do país por ano; mudam na hora a cada decisão. Toque nelas para ver o mapa de cada uma.",
      "Cada ano traz um fato real, às vezes um imprevisto (royalties, epidemias, doações, cortes do Congresso) e uma demanda da sociedade.",
      "🎯 Missões, ⚡ desafios relâmpago e 🏅 conquistas dão prêmios. ❤️ Vidas salvas, 🍎 casos evitados e 🕯️ óbitos sem diagnóstico mostram o efeito das suas decisões (modelo do jogo, comparado com não fazer nada).",
      "Onde a estatística é baixa, falta diagnóstico, não câncer: diagnosticar revela casos ocultos e a taxa registrada sobe. É bom sinal!",
    ],
    aviso: "Simulação educativa (beta). Os dados de partida e o fato histórico de cada ano são reais, com fonte. Os efeitos das ações, os personagens, os números em tempo real, os imprevistos, as demandas e os pontos são do modelo do jogo.",
    creditosTit: "Créditos",
    creditos: [
      "<b>Desenvolvimento:</b> Gianmarlon Pandolfo, estudante de Medicina (UNINTER Tres Fronteras).",
      "<b>Trabalho base:</b> Silva GIS, Pandolfo GA, et al. <i>Mortalidad por Cáncer en Paraguay: Análisis Epidemiológico, Disparidades Geográficas y Desafíos para el Control</i>. Revisão sistemática, 2026.",
      "<b>Coautoria:</b> Claude Opus 5.5 (Anthropic), no desenho do jogo, na programação e na conferência das fontes.",
      "<b>Arte:</b> ilustrações vetoriais feitas para o jogo (estilo «luz contra a névoa»). Tipografias Big Shoulders Display e Atkinson Hyperlegible (licença OFL).",
    ],
    comecar: "Começar", continuar: "Continuar partida", nova: "Nova partida",
    ajuda: "Como se joga", fechar: "Fechar",
    anoDe: (a, i) => `${a} · ano ${i} de 10`,
    modoCob: "Luz", modoReg: "Taxas",
    verMapa: "Ver no mapa", noMapa: "No mapa", lerNoticia: "Ler a notícia", recKicker: "Dados reais · para investigar",
    recPoucos: "* Poucos óbitos em 5 anos: a taxa é instável.", recFeito: "feito", hab: "hab.", muertes: "óbitos",
    misSeguir: "Toque num departamento da notícia para vê-lo no mapa.",
    finTit: "Finanças", finIntro: (r, m) => `Em janeiro entram 💰 ${r} e se pagam 💰 ${m} de manutenção e convênios. Estas decisões trazem dinheiro, mas cada uma tem um custo.`,
    prestTit: "Prestígio", prestIntro: "O prestígio é o seu capital político: você o ganha atendendo demandas, cumprindo missões e promessas, acertando desafios e levando departamentos ao equilíbrio. Ele serve para aprovar estruturas grandes e para pedir favores. Com 🎖️ 20 ou mais, o Congresso soma +💰 3 todo janeiro.",
    faltaPrest: (n) => `Faltam 🎖️ ${n}.`, faltaPesq: "Você precisa de um centro de pesquisa.", favorJaTem: (a, d) => `${d} já tem ${a}. Escolha outro departamento no mapa.`,
    ensCurso: (a) => (a ? `Em andamento: o resultado sai em janeiro de ${a}.` : "Em andamento: o resultado sairá depois da sua gestão."),
    ensOk: "Funcionou: +3% de cura no país inteiro.", ensFalhou: "Não funcionou: −🎖️ 3.",
    evProveedor: "Você pagou a dívida com os fornecedores, com acréscimo: −💰 5 e −🎖️ 1 (faltaram insumos).",
    evEnsayo: { ok: "Ensaio clínico: o tratamento funcionou. +3% de cura no país inteiro (modelo do jogo).", falhou: "Ensaio clínico: o tratamento não funcionou. −🎖️ 3." },
    legCob: "Luz = equilíbrio", legReg: "Taxa padronizada /100 mil", legNevoa: "Névoa = casos ocultos",
    capaAlt: "Entardecer no Paraguai: um hospital aceso ilumina a rede de saúde; à direita, a névoa do sub-registro.",
    curtas: { vacuna: "Vacina HPV", tabaco: "Antitabaco", habitos: "Hábitos", vph: "Teste HPV", mamo: "Mamógrafo", registro: "Registro",
      quimio: "Hospital Día", radio: "Acelerador", paliativos: "Paliativos", pesquisa: "Centro de pesquisa" },
    infoPop: (p) => `${p} hab. (Censo 2022)`,
    infoTaxa: (a, b) => `Taxa padronizada /100 mil (Atlas 2015–19): <b>${a} → ${b}</b>`,
    infoOculto: (x) => `Casos ocultos: <b>${x}</b>`,
    filaCurta: "⚠ Fila: há diagnóstico mas não há tratamento perto; rende a metade.",
    compra: (ico, n, a) => `${ico} ${n} → ${a}`,
    escolher: "Escolher departamento…",
    ocultoQ: "?",
    poucos: "Poucos óbitos em 5 anos: a taxa é instável.",
    niveis: { P: "1º Prevenção", D: "2º Diagnóstico", T: "3º Tratamento", X: "Pesquisa" },
    acoes: {
      vacuna: ["Vacina HPV nas escolas", "colo do útero"],
      tabaco: ["Campanha antitabaco", "pulmão"],
      habitos: ["Alimentação e atividade física", "colorretal"],
      vph: ["Teste de HPV e Papanicolau na USF", "colo do útero"],
      mamo: ["Mamógrafo regional", "mama"],
      registro: ["Notificação e registro", "revela casos ocultos"],
      quimio: ["Hospital Día oncológico", "quimioterapia perto de casa"],
      radio: ["Acelerador linear público", "radioterapia, alta complexidade"],
      paliativos: ["Cuidados paliativos", "qualidade de vida"],
      pesquisa: ["Centro de pesquisa e registro", "revela a carga real aqui e nos vizinhos; +20% de pontos aqui"],
    },
    custo: (c) => (c ? `💰 ${c}` : "grátis"), custoAno: (c) => `💰 ${c}/ano`, ativo: "✓ ativo",
    semOrc: "Orçamento insuficiente", jaAtivo: "Já está ativo (de anos anteriores)", desfeito: (c) => `Desfeito: voltam 💰 ${c}`,
    evBtn: "Jogar o ano", evOrc: (o) => `Orçamento disponível: 💰 ${o}`, fonte: "Fonte",
    fimAno: (a) => `Fim de ${a}`, ptsAno: (p) => `+${p} pontos`, prox: (a) => `Próximo: ${a}`, verRes: "Ver resultado",
    resSubiu: (l) => `A taxa registrada subiu em: ${l}. São casos que estavam ocultos.`,
    resFila: (l) => `Filas em: ${l}.`,
    resEquil: (n) => `Departamentos com os 3 níveis: ${n} de 18.`,
    resTit: "Seu resultado", pontos: "pontos", recorde: (r) => `Seu recorde neste celular: ${r}`, novoRec: "Novo recorde!",
    resLinhas: (x) => [
      `Departamentos com os 3 níveis: <b>${x.equil3}</b> de 18 (população coberta em equilíbrio: <b>${x.popEq}%</b>).`,
      `Casos ocultos que vieram à luz: <b>${x.revelados}%</b> do que faltava.`,
      `Investimento por nível: prevenção ${x.gP}, diagnóstico ${x.gD}, tratamento ${x.gT}, pesquisa ${x.gX} (💰).`,
    ],
    realTit: "Na vida real",
    real: [
      "GLOBOCAN 2022: 13.783 casos novos e 6.581 mortes por câncer no Paraguai (IARC).",
      "Radioterapia pública: um único lugar para o país inteiro, o INCAN, em Capiatá (MSPBS, 2024).",
      "Em 8 dos 18 departamentos, o colo do útero é a 1ª causa de morte por câncer nas mulheres: um câncer evitável (Atlas 2015–2019).",
      "Cerca de 1 em cada 4 mortes não entrava nas estatísticas: sub-registro de 26,2% em 2017 (Atlas 2015–2019).",
    ],
    fontesTit: "Fontes",
    denovo: "Jogar de novo", compartir: "Compartilhar", copiado: "Link copiado",
    compTit: "Convide outro jogador", compSub: "Peça para o colega apontar a câmera para o código, ou mande o link.",
    compEnviar: "Enviar link", compCopiar: "Copiar link", compFalhou: "Não deu para copiar: segure o dedo sobre o link e escolha «Copiar».",
    qrAlt: "Código QR do jogo",
    beta: "Versão beta para testes. Conte o que achou.",
    rankTit: "Ranking do congresso",
    rankNome: "Nome", rankEmail: "E-mail", rankFac: "Faculdade", rankTurma: "Turma",
    rankEnviando: "Enviando sua pontuação ao ranking…",
    rankJa: (p) => `Pronto! Você está no ranking${p ? `, na posição ${p}` : ""}.`,
    rankPendente: "Não deu para enviar agora: sua pontuação vai sozinha quando houver conexão.",
    rankSemDados: "Você jogou sem dados: esta partida não entra no ranking. Para entrar, preencha seus dados ao começar a próxima.",
    rankFalhou: "Não deu para registrar esta partida no ranking.",
    rankCheio: "O ranking do congresso chegou ao limite de partidas.",
    rankFechado: "O ranking do congresso abre em breve.",
    rankEncerrado: "O ranking do congresso já terminou.",
    rankVer: "Ver ranking",
    dadosTit: "Antes de começar",
    dadosIntro: "Para entrar no ranking do congresso, preencha os quatro dados e aceite os termos. Se preferir, jogue sem dados: a partida conta, mas não entra no ranking.",
    dadosOk: "Li e aceito os termos.",
    dadosJogar: "Aceitar e jogar", dadosSem: "Jogar sem dados",
    dadosCampos: "Preencha nome, e-mail, faculdade e turma.",
    dadosEmail: "Confira o e-mail: parece incompleto.",
    dadosSemOk: "Para entrar no ranking, aceite os termos.",
    termosTit: "Termos e privacidade",
    termos: (c) => [
      `Responsável: Gianmarlon Pandolfo, autor do jogo. Contato: ${c}.`,
      "Se você preencher seus dados, guardamos nome, e-mail, faculdade e turma, com a hora de início e de fim e a pontuação de cada partida.",
      "Para quê: mostrar o ranking do congresso (nome, faculdade, turma e pontos; o e-mail nunca aparece), não repetir jogadores, contar quem jogou e terminou, calcular médias por faculdade e turma e contatar quem ganhar.",
      "Onde: numa planilha privada do Google; só o autor tem acesso.",
      "Até quando: os nomes saem do ranking em 31/10/2026; nome e e-mail são apagados em 30/11/2026 e ficam só totais e médias.",
      "Você pode pedir para ver, corrigir ou apagar seus dados escrevendo para o contato.",
      "No seu celular: o jogo lembra seus dados para a próxima partida; eles se apagam sozinhos em 31/10/2026.",
      "Sem dados: de toda partida registramos, sem identificar você, a hora de início e de fim, a pontuação e o idioma.",
    ],
    ultimo: "Ver meu último resultado",
    shareTxt: "Jogue Epidemia: Paraguai contra o câncer",
    meses: ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"],
    vivo: { inc: "Incidência", prev: "Prevalência", mort: "Óbitos", cura: "Curas" },
    vivoTit: {
      inc: "Casos diagnosticados por ano com o que funciona hoje (modelo do jogo). Toque para ver o mapa.",
      prev: "Pessoas que vivem com um câncer diagnosticado nos últimos 5 anos (modelo do jogo). Toque para ver o mapa.",
      mort: "Óbitos por câncer por ano com o que funciona hoje, estimados (modelo do jogo). Toque para ver o mapa.",
      cura: "Curas por ano entre os pacientes diagnosticados (modelo do jogo). Toque para ver o mapa.",
    },
    vivoAria: "País, por ano (modelo do jogo)",
    legVivo: { inc: "Incidência /100 mil por ano (modelo)", prev: "Prevalência /100 mil (modelo)", mort: "Óbitos /100 mil por ano (modelo)", cura: "Curas /100 mil por ano (modelo)" },
    nomesNivel: { P: "Prevenção", D: "Diagnóstico", T: "Tratamento" }, e: " e ",
    infoEq: (n) => `Equilíbrio <b>${n}/3</b>`,
    eqFalta: (l) => `↑ Para subir: ${l}`, os3: "os 3 níveis",
    eqCompleto: "✓ Os 3 níveis completos",
    // v4: personagens, habilidades, prestígio, manutenção e níveis de atenção
    linksNota: "↗ abre uma cópia guardada da fonte (Internet Archive) quando existe; se não, a página original.",
    persTeaser: "Bob, Don Patrón ou a Dra. Beatriz: escolha quem lidera a luta contra o câncer no Paraguai.",
    pers: { escolher: "Escolha seu personagem", jogarCom: (n) => `Jogar com ${n}`, passiva: "O que já sabe fazer", lado: "Contatos" },
    cargos: ["Coordenador/a local", "Diretor/a regional", "Diretor/a nacional", "Vice-ministro/a", "Ministro/a da Saúde"],
    arvTit: "Personagem e habilidades", arvAscenso: (c) => `Promoção a ${c}! Escolha uma habilidade dessa coluna.`,
    arvProx: (c, p) => `Próximo cargo: ${c} com ⭐ ${p}`, arvTopo: "Você chegou ao cargo mais alto.",
    arvEscolher: "Escolher esta habilidade", arvEscolhida: "Você já a escolheu.", arvBloq: "Libera ao chegar ao cargo dessa coluna (uma só por cargo).",
    ascensoFaixa: (c) => `Promoção: ${c}!`, ascensoTxt: "Escolha uma nova habilidade.",
    niveisAt: ["", "1ª atenção primária", "2ª atenção secundária", "3ª atenção terciária"], nivAtCurto: ["", "1ª", "2ª", "3ª"],
    funcoes: { P: "Prevenção", D: "Diagnóstico", T: "Tratamento", X: "Pesquisa" },
    fichaCompra: "Compra", fichaPrest: "Prestígio", fichaManut: "Manutenção", porAnoCurto: "/ano",
    fichaImplementar: (c, p) => `Implantar · 💰 ${c}${p ? ` · 🎖️ ${p}` : ""}`,
    fichaConv: (c) => `🤝 Convênio: 💰 ${c} por ano (agora e todo janeiro), sem compra nem prestígio`,
    fichaManutNota: "A manutenção se paga todo janeiro, a partir do ano seguinte.",
    evEconomia: (r, m) => `Orçamento do ano: +💰 ${r} · manutenção e convênios: −💰 ${m}`,
    evFechou: (l) => `Sem dinheiro para a manutenção: fechou ${l} (−🎖️ 2 cada).`,
    fichaDesfazer: (c, p) => `Desfazer: voltam 💰 ${c}${p ? ` e 🎖️ ${p}` : ""}`,
    fichaCancelar: "Voltar", fichaCancelarConv: "Encerrar o convênio", convCancelado: "Convênio encerrado",
    fichaAtivo: "Já funciona neste departamento.", fichaConvAtivo: "Funciona por convênio neste departamento.",
    bloqAno: (a) => `🔒 ${a}`, bloqAnoTxt: (a) => `Disponível a partir de ${a}.`,
    bloqRef1: "🔒 1ª", bloqRef1Txt: "A atenção secundária precisa de atenção primária no departamento (encaminhamento).",
    bloqRef2: "🔒 2ª", bloqRef2Txt: "A atenção terciária precisa de atenção secundária no departamento ou num vizinho (encaminhamento).",
    bloqPrest: (p) => `Você precisa de 🎖️ ${p} de prestígio.`, bloqOrc: "Orçamento insuficiente.", bloqConvAno: (a) => `🤝 Convênios a partir de ${a}`,
    semPrest: "Prestígio insuficiente",
    economia: (r) => `💰 ${r >= 0 ? "+" : "−"}${fmtM(Math.abs(r))}/ano`,
    fechouTxt: (ico, n, d) => `Sem dinheiro: fechou ${ico} ${n} em ${d} (−🎖️ 2)`,
    resPrestAno: (a, b) => `Prestígio: 🎖️ ${a} → ${b}`, resPrest: (c) => `Prestígio no fim: 🎖️ <b>${c}</b>`,
    resFechou: (l) => `Fechamentos por falta de dinheiro: ${l}`, resHab: (l) => `Habilidades escolhidas: ${l}`,
    congressoMais: "Prestígio alto: o Congresso aprova +💰 3 para a saúde.",
    evPrest: (p, e) => `🎖️ ${p} de prestígio · ${e}`,
    niveisFonte: "Níveis de atenção: a 1ª é o primeiro contato com o sistema de saúde (Declaração de Alma-Ata, OMS/UNICEF, 1978); a rede do Paraguai vai «desde la atención primaria hasta los servicios de mayor complejidad» (OPAS, 14/07/2026).",
    missoesTit: "Missões", missaoOk: "Missão cumprida!", recompensa: "Prêmio", feitasTit: "Cumpridas", semMissao: "🎯 Todas as missões cumpridas",
    voltar: "Voltar ao jogo",
    premio: (p) => [p.orc ? `+💰 ${p.orc}` : "", p.prest ? `+🎖️ ${p.prest}` : "", p.mult ? `⭐×${String(p.mult).replace(".", ",")} neste ano` : ""].filter(Boolean).join(" · "),
    logrosTit: "Conquistas deste celular", logroOk: "Conquista!", logrosConta: (n, m) => `${n} de ${m}`,
    inicioLogros: (n, m) => `🏅 Conquistas: ${n} de ${m}`, inicioRecorde: (r) => `🏆 Seu recorde: ${r}`,
    quizTit: "Desafio relâmpago", quizSub: "Verdadeiro ou falso?", verdadeiro: "Verdadeiro", falso: "Falso",
    quizCerto: (o) => `Correto! +⭐ ${BONUS_QUIZ} · +💰 ${o} · +🎖️ 1`, quizErrado: "Não era assim.", quizSeguir: "Continuar",
    racha: (n) => `Sequência de ${n} acertos 🔥`, rachaPremio: "+🎖️ 2 pela sequência",
    nivelSobe: (n) => `Equilíbrio ${n}/3!`, novoRecorde: "Novo recorde!", recordeTxt: "Você superou sua melhor pontuação neste celular.",
    rodapeV4: (e, v, p) => `${e} · ❤️ ${v} · ⭐ +${p}`, rodapeTit: "Orçamento anual menos manutenção · vidas salvas (modelo) · pontos que soma neste ano",
    consTit: "Consequência das suas decisões",
    metVidas: "vidas salvas", vidasPerd: "vidas perdidas", metEvit: "casos evitados pela prevenção", metSemDx: "morreram sem diagnóstico",
    metModelo: "Modelo do jogo, comparado com não fazer nada.",
    misAno: (l) => `🎯 Missões cumpridas: ${l}`, quizAno: (ok) => `⚡ Desafio relâmpago: ${ok ? `você acertou (+${BONUS_QUIZ} ⭐)` : "você errou"}`,
    cargo: (c) => `Seu cargo: ${c}`,
    resImpacto: (v, e, s) => `Em 10 anos (modelo): <b>${v}</b> vidas salvas, <b>${e}</b> casos evitados pela prevenção e <b>${s}</b> pessoas que morreram sem diagnóstico.`,
    resMis: (n, m) => `Missões cumpridas: <b>${n}</b> de ${m}`, resQuiz: (n, m) => `Desafios relâmpago: <b>${n}</b> de ${m} corretos`,
    estrelasAria: (n) => `${n} de 3 estrelas (população em equilíbrio)`,
    infoVivo: {
      inc: (n, x) => `Incidência (modelo): <b>${n}</b> casos por ano · <b>${x}</b>/100 mil`,
      prev: (n, x) => `Prevalência (modelo): <b>${n}</b> pessoas · <b>${x}</b>/100 mil`,
      mort: (n, x, s) => `Óbitos (modelo): <b>${n}</b> por ano, ${s} sem diagnóstico · <b>${x}</b>/100 mil`,
      cura: (n, x) => `Curas (modelo): <b>${n}</b> por ano · <b>${x}</b>/100 mil`,
    },
    infoComp: (n, a) => `📌 Você prometeu ${n} até ${a}`,
    convNomes: { vph: "Convênio com laboratório privado de HPV", mamo: "Convênio com clínica privada de mamografia", quimio: "Convênio com uma fundação (Hospital Día)",
      radio: "Convênio com radioterapia privada", paliativos: "Convênio com ONG de cuidados paliativos", pesquisa: "Convênio com uma universidade" },
    convFeito: "🤝 convênio", convAria: (n, c) => `${n}: 💰 ${c} por ano`, porAno: "ano",
    convTroca: "Investimento público: o convênio termina",
    pausar: "Pausar", seguir: "Continuar",
    terminar: (a) => `Fechar ${a} ▶`,
    imprevisto: "Imprevisto", escenario: "Cenário do jogo (ilustrativo)",
    demandaTit: "Demanda do ano", proxDemanda: "Ver a demanda do ano",
    quem: { cid: "Cidadãos", pub: "Instituição pública", priv: "Instituição privada", acad: "Instituição acadêmica", int: "Cooperação internacional" },
    semOrcOp: "sem orçamento", inspirado: "Inspirado em",
    compOk: (n, d) => `Compromisso cumprido: ${n} em ${d} (+🎖️ 4)`,
    compFalhou: (n, d) => `Compromisso não cumprido: ${n} em ${d} (−🎖️ 6)`,
    resPais: (c, m, k) => `País neste ano (modelo): ${c} casos diagnosticados, ${m} óbitos e ${k} curas.`,
    resComp: (ok, tot) => `Compromissos cumpridos: <b>${ok}</b> de ${tot}`,
    resTot: (c, m, k) => `Em 10 anos (modelo do jogo): <b>${c}</b> casos diagnosticados, <b>${m}</b> óbitos e <b>${k}</b> curas.`,
    modeloNota: "Modelo do jogo: incidência ≈ 2,1 × óbitos (proporção do GLOBOCAN 2022: 13.783 casos e 6.581 óbitos); ponto de partida: óbitos registrados por departamento no Atlas 2015–2019. O resto é ilustrativo.",
  },
};

/* ---------- linha do tempo real (um evento por ano) ---------- */
const EVENTOS = {
  2015: {
    aplicar: () => darGratis("itapua", "quimio"),
    es: ["Nace el Hospital Día Oncológico de Encarnación", "Un convenio del Ministerio de Salud con la Fundación Lazos del Sur lleva la quimioterapia a Itapúa. En 8 años atendió 4.047 pacientes de 9 departamentos.", "Itapúa recibe gratis el Hospital Día (quimioterapia).", "ABC Color, 10/05/2024"],
    pt: ["Nasce o Hospital Día Oncológico de Encarnación", "Um convênio do Ministério da Saúde com a Fundação Lazos del Sur leva a quimioterapia a Itapúa. Em 8 anos atendeu 4.047 pacientes de 9 departamentos.", "Itapúa ganha de graça o Hospital Día (quimioterapia).", "ABC Color, 10/05/2024"],
  },
  2016: {
    aplicar: () => { S.orc += 3; },
    es: ["1.ª misión imPACT del OIEA", "Expertos del Organismo Internacional de Energía Atómica, la OMS y la IARC evalúan el control del cáncer en Paraguay.", "+💰 3 este año (apoyo técnico).", "OIEA, 2026"],
    pt: ["1ª missão imPACT da AIEA", "Especialistas da Agência Internacional de Energia Atômica, da OMS e da IARC avaliam o controle do câncer no Paraguai.", "+💰 3 neste ano (apoio técnico).", "AIEA, 2026"],
  },
  2017: {
    aplicar: () => { S.mod.pesquisa = -2; },
    es: ["Asunción entra en la City Cancer Challenge", "Más de 200 profesionales diagnostican el sistema: fragmentado, con poca coordinación y mucho gasto de bolsillo.", "El centro de investigación cuesta 💰 2 menos este año.", "City Cancer Challenge, 2022"],
    pt: ["Asunción entra na City Cancer Challenge", "Mais de 200 profissionais diagnosticam o sistema: fragmentado, pouco coordenado e com muito gasto do próprio bolso.", "O centro de pesquisa custa 💰 2 a menos neste ano.", "City Cancer Challenge, 2022"],
  },
  2018: {
    aplicar: () => { S.orcExtra += 2; },
    es: ["Ley 6.266 de atención integral a las personas con cáncer", "La ley garantiza atención oportuna e integral, de la prevención a los cuidados paliativos, y prevé un Fondo Solidario.", "+💰 2 por año a partir de 2019.", "Ley N° 6266/2018; Decreto N° 2064/2019"],
    pt: ["Ley 6.266 de atenção integral às pessoas com câncer", "A lei garante atenção oportuna e integral, da prevenção aos cuidados paliativos, e prevê um Fundo Solidário.", "+💰 2 por ano a partir de 2019.", "Ley N° 6266/2018; Decreto N° 2064/2019"],
  },
  2019: {
    aplicar: () => { S.mod.registro = -1; },
    es: ["El Decreto 2064 reglamenta la ley", "Crea el Registro Nacional de Personas con Cáncer, gestionado por el INCAN, y el Listado Nacional de Drogas Antineoplásicas.", "Notificación y registro: gratis este año.", "Decreto N° 2064, 03/07/2019, arts. 18 y 23"],
    pt: ["O Decreto 2064 regulamenta a lei", "Cria o Registro Nacional de Pessoas com Câncer, gerido pelo INCAN, e a Lista Nacional de Drogas Antineoplásicas.", "Notificação e registro: grátis neste ano.", "Decreto N° 2064, 03/07/2019, arts. 18 e 23"],
  },
  2020: {
    aplicar: () => { S.mod.vacuna = 1; S.mod.vph = 1; S.mod.mamo = 1; },
    es: ["Pandemia de COVID-19", "Los servicios se vuelcan a la pandemia y cae la vacunación contra el VPH.", "Vacuna, test de VPH y mamógrafo cuestan 💰 1 más este año.", "Pediatría (Asunción) 2024;51(2):72-80"],
    pt: ["Pandemia de COVID-19", "Os serviços se voltam para a pandemia e cai a vacinação contra o HPV.", "Vacina, teste de HPV e mamógrafo custam 💰 1 a mais neste ano.", "Pediatría (Asunción) 2024;51(2):72-80"],
  },
  2021: {
    aplicar: () => { for (const id in S.deps) { S.deps[id].carga *= 1.05; S.deps[id].cargaBase *= 1.05; } },
    es: ["La pandemia continúa", "La vacuna contra el VPH llega a 23% de las niñas con la 1.ª dosis y a 17% con la última; la meta de la OMS es 90%.", "Diagnósticos atrasados: la carga real sube 5% en todo el país (efecto ilustrativo).", "ICO/IARC HPV Information Centre, 2023"],
    pt: ["A pandemia continua", "A vacina contra o HPV chega a 23% das meninas na 1ª dose e a 17% na última; a meta da OMS é 90%.", "Diagnósticos atrasados: a carga real sobe 5% no país inteiro (efeito ilustrativo).", "ICO/IARC HPV Information Centre, 2023"],
  },
  2022: {
    aplicar: () => { for (const id in S.deps) S.deps[id].visEv += 0.03; },
    es: ["Se publica el Atlas de Mortalidad por Cáncer 2015–2019", "El Atlas muestra el mapa del cáncer y su subregistro: cerca de 1 de cada 4 muertes no entraba en las estadísticas (2017).", "Todos los departamentos ganan +3% de casos visibles.", "MSPBS/DVENT, Atlas 2015–2019 (2022)"],
    pt: ["Sai o Atlas de Mortalidad por Cáncer 2015–2019", "O Atlas mostra o mapa do câncer e o seu sub-registro: cerca de 1 em cada 4 mortes não entrava nas estatísticas (2017).", "Todos os departamentos ganham +3% de casos visíveis.", "MSPBS/DVENT, Atlas 2015–2019 (2022)"],
  },
  2023: {
    aplicar: () => { S.mod.radio = -2; },
    es: ["Llega al INCAN un nuevo acelerador lineal", "Un acelerador valuado en US$ 2 millones, donado por EE. UU. y el OIEA, llega al INCAN.", "El acelerador lineal público cuesta 💰 2 menos este año.", "La Nación, 25/04/2023"],
    pt: ["Chega ao INCAN um novo acelerador linear", "Um acelerador avaliado em US$ 2 milhões, doado pelos EUA e pela AIEA, chega ao INCAN.", "O acelerador linear público custa 💰 2 a menos neste ano.", "La Nación, 25/04/2023"],
  },
  2024: {
    aplicar: () => { S.mod.vacuna = -1; S.mod.registro = -1; darGratis("concepcion", "quimio"); },
    es: ["Dosis única de la vacuna VPH y notificación obligatoria", "Desde el 01/08/2024 basta una dosis de la vacuna; en noviembre, el Ministerio anunció la notificación obligatoria de todo cáncer confirmado (Res. S.G. N° 752). Concepción inaugura el 10.º Hospital Día oncológico del país.", "Vacuna 💰 1 más barata, registro gratis y Hospital Día gratis en Concepción.", "MSPBS, 2024"],
    pt: ["Dose única da vacina HPV e notificação obrigatória", "Desde 01/08/2024 basta uma dose da vacina; em novembro, o Ministério anunciou a notificação obrigatória de todo câncer confirmado (Res. S.G. N° 752). Concepción inaugura o 10º Hospital Día oncológico do país.", "Vacina 💰 1 mais barata, registro grátis e Hospital Día grátis em Concepción.", "MSPBS, 2024"],
  },
};

/* ---------- imprevistos: a partir de 2016, em metade dos anos, sem repetir ---------- */
const EVENTOS_ALEAT = [
  { id: "itaipu", alvo: () => sortear(DEPS).id, aplicar: (dep) => { S.orc += 2 + num("royaltyExtra"); S.regiao = { dep, valor: 1 }; },
    es: ["Royalties de Itaipú", "Los royalties de la represa impulsan el desarrollo de {dep}.", "+💰 2 y, este año, las acciones en {dep} cuestan 💰 1 menos.", "Ejemplo real: la Itaipú Binacional compró, vía Fundación Tesai, el mamógrafo del primer servicio de mamografía de Concepción (MSPBS, 21/11/2024)."],
    pt: ["Royalties de Itaipu", "Os royalties da usina impulsionam o desenvolvimento de {dep}.", "+💰 2 e, neste ano, as ações em {dep} custam 💰 1 a menos.", "Exemplo real: a Itaipu Binacional comprou, via Fundación Tesai, o mamógrafo do primeiro serviço de mamografia de Concepción (MSPBS, 21/11/2024)."] },
  { id: "dengue", aplicar: () => { S.orc = Math.max(0, S.orc - 3); },
    es: ["Epidemia de dengue", "Los hospitales se llenan de casos de dengue y parte del presupuesto del cáncer se desvía.", "−💰 3 este año.", ""],
    pt: ["Epidemia de dengue", "Os hospitais lotam de casos de dengue e parte do orçamento do câncer é desviada.", "−💰 3 neste ano.", ""] },
  { id: "respiratoria", aplicar: () => { for (const a of SLOTS.D) S.mod[a] = (S.mod[a] || 0) + 1; },
    es: ["Brote de enfermedad respiratoria", "Las consultas se llenan y el diagnóstico de cáncer se atrasa.", "Este año, las acciones de diagnóstico cuestan 💰 1 más.", ""],
    pt: ["Surto de doença respiratória", "As consultas lotam e o diagnóstico de câncer atrasa.", "Neste ano, as ações de diagnóstico custam 💰 1 a mais.", ""] },
  { id: "inversion", aplicar: () => { S.mod.mamo = (S.mod.mamo || 0) - 1; S.mod.vph = (S.mod.vph || 0) - 1; },
    es: ["Inversión extranjera en salud", "Un fondo internacional financia equipos de diagnóstico del cáncer.", "Este año, el mamógrafo y el test de VPH cuestan 💰 1 menos.", ""],
    pt: ["Investimento estrangeiro em saúde", "Um fundo internacional financia equipamentos de diagnóstico do câncer.", "Neste ano, o mamógrafo e o teste de HPV custam 💰 1 a menos.", ""] },
  { id: "ops", alvo: () => alvoSem("vph"), aplicar: (dep) => darGratis(dep, "vph"),
    es: ["Cooperación de la OPS/OMS", "La OPS/OMS apoya el test de VPH en {dep}.", "{dep} recibe gratis el test de VPH.", "Ejemplo real: prueba de VPH para 100 mil mujeres de Alto Paraná (OPS/OMS, 12/02/2024)."],
    pt: ["Cooperação da OPAS/OMS", "A OPAS/OMS apoia o teste de HPV em {dep}.", "{dep} ganha de graça o teste de HPV.", "Exemplo real: teste de HPV para 100 mil mulheres de Alto Paraná (OPAS/OMS, 12/02/2024)."] },
  { id: "oiea", aplicar: () => { S.mod.radio = (S.mod.radio || 0) - 3; },
    es: ["Cooperación técnica para radioterapia", "Un organismo internacional ofrece apoyo técnico para nuevos aceleradores.", "Este año, el acelerador lineal cuesta 💰 3 menos.", ""],
    pt: ["Cooperação técnica para radioterapia", "Um organismo internacional oferece apoio técnico para novos aceleradores.", "Neste ano, o acelerador linear custa 💰 3 a menos.", ""] },
  { id: "yacyreta", alvo: () => (temSlot(S.deps.itapua, "radio") ? undefined : "itapua"), aplicar: () => { S.cupons.push({ dep: "itapua", a: "radio", valor: 4 }); S.orc += num("royaltyExtra"); },
    es: ["Fondos de Yacyretá para Itapúa", "La Entidad Binacional Yacyretá ofrece fondos para la radioterapia en Itapúa.", "Este año, el acelerador en Itapúa cuesta 💰 4 menos.", "Ejemplo real: el Gobierno se comprometió a comprar un acelerador para Encarnación con fondos de Yacyretá (ABC Color, 10/05/2024)."],
    pt: ["Recursos de Yacyretá para Itapúa", "A Entidad Binacional Yacyretá oferece recursos para a radioterapia em Itapúa.", "Neste ano, o acelerador em Itapúa custa 💰 4 a menos.", "Exemplo real: o governo se comprometeu a comprar um acelerador para Encarnación com recursos de Yacyretá (ABC Color, 10/05/2024)."] },
  { id: "gobierno", cond: () => S.aleatUsados.includes("dengue") || S.aleatUsados.includes("respiratoria") || S.anoIdx >= 6, aplicar: () => { S.orc += 4; },
    es: ["Fondo de emergencia del Gobierno Nacional", "Después de la epidemia, el Gobierno Nacional refuerza el presupuesto de salud.", "+💰 4.", ""],
    pt: ["Fundo de emergência do Governo Nacional", "Depois da epidemia, o Governo Nacional reforça o orçamento da saúde.", "+💰 4.", ""] },
  { id: "global", cond: () => contar(COLO, (id) => temSlot(S.deps[id], "vph")) >= 4 && DEPS.filter((d) => temSlot(S.deps[d.id], "vacuna")).length >= 4,
    aplicar: () => { S.orc += 6; ganharPrest(3); },
    es: ["Premio internacional contra el cáncer de cuello uterino", "Un organismo internacional reconoce tus avances en vacunación y en test de VPH.", "+💰 6 y +🎖️ 3.", "Inspirado en la estrategia de la OMS para eliminar el cáncer de cuello uterino: metas 90-70-90 para 2030 (resolución WHA73.2, 2020)."],
    pt: ["Prêmio internacional contra o câncer do colo do útero", "Um organismo internacional reconhece seus avanços em vacinação e teste de HPV.", "+💰 6 e +🎖️ 3.", "Inspirado na estratégia da OMS para eliminar o câncer do colo do útero: metas 90-70-90 para 2030 (resolução WHA73.2, 2020)."] },
  { id: "recorte", alvo: () => { const r = S.log[S.log.length - 1], f = r && DEPS.find((d) => r.filas.includes(d.nome)); return f ? f.id : (S.comp.find((c) => c.estado === "falhou") || {}).dep; },
    aplicar: () => { S.orc = Math.max(0, S.orc - 3); ganharPrest(-1); },
    es: ["El Congreso recorta fondos de {dep}", "{dep} no alcanzó sus metas y el Congreso recorta parte del presupuesto de salud.", "−💰 3 y −🎖️ 1.", ""],
    pt: ["O Congresso corta verbas de {dep}", "{dep} não alcançou suas metas e o Congresso corta parte do orçamento da saúde.", "−💰 3 e −🎖️ 1.", ""] },
  { id: "religiosa", alvo: () => alvoSem("paliativos"), aplicar: (dep) => darGratis(dep, "paliativos"),
    es: ["Donación de instituciones religiosas", "Instituciones religiosas donan un servicio de cuidados paliativos en {dep}.", "{dep} recibe gratis los cuidados paliativos.", ""],
    pt: ["Doação de instituições religiosas", "Instituições religiosas doam um serviço de cuidados paliativos em {dep}.", "{dep} ganha de graça os cuidados paliativos.", ""] },
  { id: "academia", alvo: () => alvoSem("registro"), aplicar: (dep) => darGratis(dep, "registro"),
    es: ["Una universidad cede académicos", "Residentes e investigadores de una universidad organizan el registro de cáncer en {dep}.", "{dep} recibe gratis la notificación y el registro.", ""],
    pt: ["Uma universidade cede acadêmicos", "Residentes e pesquisadores de uma universidade organizam o registro de câncer em {dep}.", "{dep} ganha de graça a notificação e o registro.", ""] },
  { id: "empresa", aplicar: () => { S.orc += 4; },
    es: ["Donación de empresas privadas", "Empresas privadas donan dinero para la lucha contra el cáncer.", "+💰 4.", ""],
    pt: ["Doação de empresas privadas", "Empresas privadas doam dinheiro para a luta contra o câncer.", "+💰 4.", ""] },
  { id: "opensource", cond: () => S.pers === "bob", alvo: () => alvoMenorVisSem("registro"), aplicar: (dep) => { darGratis(dep, "registro"); ganharPrest(1); },
    es: ["La comunidad open source ayuda a Bob", "Programadores voluntarios instalan un registro digital de cáncer en {dep}.", "{dep} recibe gratis el registro y +🎖️ 1.", ""],
    pt: ["A comunidade open source ajuda o Bob", "Programadores voluntários instalam um registro digital de câncer em {dep}.", "{dep} ganha de graça o registro e +🎖️ 1.", ""] },
  { id: "medicas", cond: () => S.pers === "beatriz", alvo: () => alvoSem("vph"), aplicar: (dep) => { darGratis(dep, "vph"); ganharPrest(1); },
    es: ["Colegas de la Dra. Beatriz", "Sociedades médicas organizan una jornada de test de VPH en {dep}.", "{dep} recibe gratis el test de VPH y +🎖️ 1.", ""],
    pt: ["Colegas da Dra. Beatriz", "Sociedades médicas organizam uma jornada de teste de HPV em {dep}.", "{dep} ganha de graça o teste de HPV e +🎖️ 1.", ""] },
];

/* ---------- demandas da sociedade: uma por ano, estilo SimCity. Cada resposta custa, muda a confiança ou vira compromisso ---------- */
const DEMANDAS = [
  { id: "hd", quem: "cid", alvo: () => alvoSem("quimio"),
    es: "Pacientes de {dep} viajan horas para la quimioterapia y piden un Hospital Día.",
    pt: "Pacientes de {dep} viajam horas para a quimioterapia e pedem um Hospital Día.",
    opcoes: [
      { es: "Prometer un Hospital Día en {dep} hasta {ano2}", pt: "Prometer um Hospital Día em {dep} até {ano2}", prest: 2, aplicar: (dep) => prometer(dep, "quimio", 2) },
      { es: "Convenio con una fundación local", pt: "Convênio com uma fundação local", conv: "quimio", prest: 3 },
      { es: "Ahora no", pt: "Agora não", prest: -3 },
    ] },
  { id: "vacuna", quem: "cid", alvo: () => alvoSem("vacuna"),
    es: "Madres de {dep} piden la vacuna contra el VPH en las escuelas.",
    pt: "Mães de {dep} pedem a vacina contra o HPV nas escolas.",
    opcoes: [
      { es: "Campaña de vacunación en {dep}", pt: "Campanha de vacinação em {dep}", compra: "vacuna", prest: 3 },
      { es: "Ahora no", pt: "Agora não", prest: -3 },
    ] },
  { id: "terreno", quem: "pub", alvo: () => alvoSem("mamo"),
    es: "La Gobernación de {dep} ofrece terreno y personal para un mamógrafo.",
    pt: "O governo departamental de {dep} oferece terreno e pessoal para um mamógrafo.",
    opcoes: [
      { es: "Aceptar: este año el mamógrafo en {dep} cuesta 💰 2 menos", pt: "Aceitar: neste ano o mamógrafo em {dep} custa 💰 2 a menos", prest: 2, aplicar: (dep) => S.cupons.push({ dep, a: "mamo", valor: 2 }) },
      { es: "Rechazar", pt: "Recusar", prest: -1 },
    ] },
  { id: "subregistro", quem: "acad", alvo: () => alvoMenorVis(),
    es: "Una Facultad de Medicina propone medir el subregistro de muertes en {dep}.",
    pt: "Uma Faculdade de Medicina propõe medir o sub-registro de óbitos em {dep}.",
    opcoes: [
      { es: "Convenio con la universidad", pt: "Convênio com a universidade", conv: "pesquisa", prest: 2 },
      { es: "Centro de investigación propio", pt: "Centro de pesquisa próprio", compra: "pesquisa", prest: 2 },
      { es: "No", pt: "Não", prest: -1 },
    ] },
  { id: "clinica", quem: "priv", alvo: () => alvoSem("mamo"),
    es: "Una clínica privada de {dep} ofrece mamografías por convenio.",
    pt: "Uma clínica privada de {dep} oferece mamografias por convênio.",
    opcoes: [
      { es: "Firmar el convenio", pt: "Assinar o convênio", conv: "mamo", prest: 1 },
      { es: "Prefiero invertir en lo público", pt: "Prefiro investir no público", prest: 0 },
    ] },
  { id: "remedios", quem: "cid", alvo: () => null, fonte: "La Nación, 09/03/2026; Decreto N° 2064/2019, art. 23",
    es: "La asociación de pacientes denuncia falta de medicamentos oncológicos.",
    pt: "A associação de pacientes denuncia falta de remédios oncológicos.",
    opcoes: [
      { es: "Compra de urgencia", pt: "Compra de urgência", custo: 3, gasto: "T", prest: 4 },
      { es: "Actualizar el Listado Nacional de Drogas Antineoplásicas: el año que viene la quimioterapia cuesta 💰 1 menos", pt: "Atualizar o Listado Nacional de Drogas Antineoplásicas: no ano que vem a quimioterapia custa 💰 1 a menos", prest: 2, aplicar: () => { S.modProx.quimio = (S.modProx.quimio || 0) - 1; } },
      { es: "Ignorar", pt: "Ignorar", prest: -5 },
    ] },
  { id: "ops", quem: "int", alvo: () => alvoSem("vph"), fonte: "OPS/OMS, 12/02/2024",
    es: "La OPS/OMS ofrece apoyo al test de VPH en {dep} si el país pone el personal.",
    pt: "A OPAS/OMS oferece apoio ao teste de HPV em {dep} se o país puser o pessoal.",
    opcoes: [
      { es: "Aceptar: test de VPH en {dep}", pt: "Aceitar: teste de HPV em {dep}", custo: 1, gasto: "D", prest: 2, aplicar: (dep) => darGratis(dep, "vph") },
      { es: "No", pt: "Não", prest: -1 },
    ] },
  { id: "tabaco", quem: "cid", alvo: () => alvoSem("tabaco"),
    es: "Escuelas de {dep} piden charlas contra el tabaco.",
    pt: "Escolas de {dep} pedem palestras contra o tabaco.",
    opcoes: [
      { es: "Campaña antitabaco en {dep}", pt: "Campanha antitabaco em {dep}", compra: "tabaco", prest: 2 },
      { es: "No", pt: "Não", prest: -2 },
    ] },
  { id: "radio", quem: "cid", alvo: () => alvoSem("radio", ["alto-parana", "itapua"]), fonte: "La Nación, 23/07/2024",
    es: "La prensa muestra pacientes de {dep} que tienen que viajar a Capiatá para la radioterapia.",
    pt: "A imprensa mostra pacientes de {dep} que precisam viajar a Capiatá para a radioterapia.",
    opcoes: [
      { es: "Convenio con radioterapia privada", pt: "Convênio com radioterapia privada", conv: "radio", prest: 3 },
      { es: "Prometer un acelerador en {dep} hasta {ano3}", pt: "Prometer um acelerador em {dep} até {ano3}", prest: 2, aplicar: (dep) => prometer(dep, "radio", 3) },
      { es: "Ignorar", pt: "Ignorar", prest: -4 },
    ] },
  { id: "paliativos", quem: "pub", alvo: () => alvoSem("paliativos"),
    es: "El municipio de {dep} pide cuidados paliativos en casa.",
    pt: "O município de {dep} pede cuidados paliativos em casa.",
    opcoes: [
      { es: "Convenio con una ONG", pt: "Convênio com uma ONG", conv: "paliativos", prest: 2 },
      { es: "Servicio público", pt: "Serviço público", compra: "paliativos", prest: 2 },
      { es: "No", pt: "Não", prest: -2 },
    ] },
  { id: "formacion", quem: "acad", alvo: () => null,
    es: "Una universidad propone formar oncólogos para el interior.",
    pt: "Uma universidade propõe formar oncologistas para o interior.",
    opcoes: [
      { es: "Becas: por 3 años el tratamiento cuesta 💰 1 menos", pt: "Bolsas: por 3 anos o tratamento custa 💰 1 a menos", custo: 2, gasto: "T", prest: 2, aplicar: () => { S.descTrat = { ate: S.anoIdx + 3, valor: 1 }; } },
      { es: "No", pt: "Não", prest: 0 },
    ] },
  { id: "lab", quem: "priv", alvo: () => alvoSem("vph"),
    es: "Un laboratorio privado ofrece procesar los tests de VPH de {dep} por convenio.",
    pt: "Um laboratório privado oferece processar os testes de HPV de {dep} por convênio.",
    opcoes: [
      { es: "Firmar el convenio", pt: "Assinar o convênio", conv: "vph", prest: 1 },
      { es: "No", pt: "Não", prest: 0 },
    ] },
];

/* ---------- personagens: passiva + árvore de 3 especializações × 4 cargos (estilo XCOM 2); arvore[cargo][especialização] ---------- */
const PERSONAGENS = {
  bob: { ico: "🧑‍💻", cor: "#79B0DE",
    ef: { custo: { pesquisa: 0.6, n1: 0.8 }, ano: { radio: 3, pesquisa: 1 }, sorte: { opensource: 4, academia: 2 } },
    arvore: [["b_reg", "b_beca", "b_agentes"], ["b_ia", "b_uni", "b_tele"], ["b_vig", "b_ensaios", "b_movel"], ["b_pred", "b_paper", "b_aps40"]],
    es: { nome: "Bob", papel: "Estudiante de Medicina", lado: "Comunidad open source",
      bio: "Entusiasta de la epidemiología y de las nuevas tecnologías, aprendiz de inteligencia artificial. Ingenioso para inventar soluciones en la atención primaria.",
      ramos: ["🤖 Tecnología e IA", "🔬 Investigación", "🏘️ APS inventiva"],
      tracos: ["🎓 Centro de investigación 40% más barato", "☢️ Acelerador disponible 3 años antes", "🏘️ Atención primaria 20% más barata", "💻 La comunidad open source lo ayuda"] },
    pt: { nome: "Bob", papel: "Estudante de Medicina", lado: "Comunidade open source",
      bio: "Entusiasta da epidemiologia e das novas tecnologias, aprendiz de inteligência artificial. Engenhoso para inventar soluções na atenção primária.",
      ramos: ["🤖 Tecnologia e IA", "🔬 Pesquisa", "🏘️ APS inventiva"],
      tracos: ["🎓 Centro de pesquisa 40% mais barato", "☢️ Acelerador disponível 3 anos antes", "🏘️ Atenção primária 20% mais barata", "💻 A comunidade open source o ajuda"] } },
  patron: { ico: "🤵", cor: "#D9B25F",
    ef: { renda: 1 / 3, conv: { todos: 0.6 }, convDesde: 2015, sorte: { religiosa: 3, empresa: 3, itaipu: 2, yacyreta: 2, gobierno: 2 } },
    arvore: [["p_chave", "p_kermes", "p_camara"], ["p_concessao", "p_caridade", "p_royalties"], ["p_acelconc", "p_fundacao", "p_zona"], ["p_grande", "p_mecenas", "p_polo"]],
    es: { nome: "Don Patrón", papel: "Empresario", lado: "Instituciones religiosas",
      bio: "Exitoso en los negocios, ve en la salud una oportunidad para desarrollar la región. Su ambición termina haciendo el bien. Creyente.",
      ramos: ["🤝 Alianzas público-privadas", "🙏 Filantropía", "🏗️ Desarrollo regional"],
      tracos: ["💰 +4 por año", "🤝 Convenios 40% más baratos y desde 2015", "🍀 Más donaciones y royalties", "⛪ Las instituciones religiosas lo ayudan"] },
    pt: { nome: "Don Patrón", papel: "Empresário", lado: "Instituições religiosas",
      bio: "Bem-sucedido nos negócios, vê na saúde uma oportunidade de desenvolver a região. Sua ambição acaba fazendo o bem. Religioso.",
      ramos: ["🤝 Parcerias público-privadas", "🙏 Filantropia", "🏗️ Desenvolvimento regional"],
      tracos: ["💰 +4 por ano", "🤝 Convênios 40% mais baratos e desde 2015", "🍀 Mais doações e royalties", "⛪ As instituições religiosas o ajudam"] } },
  beatriz: { ico: "👩‍⚕️", cor: "#E08BC0",
    ef: { custo: { n1: 0.9, n2: 0.8, n3: 0.8 }, prest: { n2: -1, n3: -1 }, cura: 0.02, demMedPrest: 2, sorte: { medicas: 4, academia: 2 } },
    arvore: [["d_gestao", "d_colegas", "d_protocolos"], ["d_rede", "d_residentes", "d_mbe"], ["d_acel", "d_tamizaje", "d_rcbp"], ["d_centro", "d_lider", "d_excel"]],
    es: { nome: "Dra. Beatriz", papel: "Médica", lado: "Instituciones médicas",
      bio: "Altamente capacitada y articulada: ciencia básica y avanzada, metodología y medicina como un todo. Respetada entre colegas.",
      ramos: ["🏥 Hospitales", "🩺 Clínica", "📚 Ciencia y método"],
      tracos: ["🏥 Atención 2.ª y 3.ª 20% más barata y con 🎖️ 1 menos", "🩺 +2% de chance de cura", "🎓 Demandas académicas dan +🎖️ 2", "⚕️ Las instituciones médicas la ayudan"] },
    pt: { nome: "Dra. Beatriz", papel: "Médica", lado: "Instituições médicas",
      bio: "Altamente capacitada e articulada: ciência básica e avançada, metodologia e medicina como um todo. Respeitada entre colegas.",
      ramos: ["🏥 Hospitais", "🩺 Clínica", "📚 Ciência e método"],
      tracos: ["🏥 Atenção 2ª e 3ª 20% mais barata e com 🎖️ 1 a menos", "🩺 +2% de chance de cura", "🎓 Demandas acadêmicas dão +🎖️ 2", "⚕️ As instituições médicas a ajudam"] } },
};

/* ---------- habilidades (efeitos do jogo): ef = modificadores; aoEscolher = prêmio na hora ---------- */
const HAB = {
  b_reg: { ico: "📲", ef: { manut: { registro: 0.5 }, vis: { registro: 0.02 } }, es: ["Registro digital", "Notificación y registro: mantenimiento a la mitad y +2% de casos visibles."], pt: ["Registro digital", "Notificação e registro: manutenção pela metade e +2% de casos visíveis."] },
  b_beca: { ico: "📜", ef: { prestPesq: 1 }, es: ["Beca de iniciación", "Cada centro de investigación activo da +🎖️ 1 al empezar el año."], pt: ["Bolsa de iniciação", "Cada centro de pesquisa ativo dá +🎖️ 1 no começo do ano."] },
  b_agentes: { ico: "🧑‍🤝‍🧑", ef: { manut: { n1: 0.5 } }, es: ["Agentes comunitarios", "Atención primaria: mantenimiento a la mitad."], pt: ["Agentes comunitários", "Atenção primária: manutenção pela metade."] },
  b_ia: { ico: "🤖", ef: { vis: { vph: 0.04, mamo: 0.04 } }, es: ["IA en el tamizaje", "Test de VPH y mamógrafo revelan 4% más casos ocultos."], pt: ["IA no rastreamento", "Teste de HPV e mamógrafo revelam 4% mais casos ocultos."] },
  b_uni: { ico: "🏛️", ef: { conv: { pesquisa: 0.5 } }, es: ["Red de universidades", "Convenios con universidades a mitad de precio."], pt: ["Rede de universidades", "Convênios com universidades pela metade do preço."] },
  b_tele: { ico: "📡", ef: { refTele: 1 }, es: ["Telemedicina", "La atención primaria también habilita la terciaria: no hace falta secundaria cerca."], pt: ["Telemedicina", "A atenção primária também libera a terciária: não precisa de secundária perto."] },
  b_vig: { ico: "📈", ef: { filaMeia: 1 }, es: ["Vigilancia en tiempo real", "Las filas quitan la mitad de puntos y de prestigio."], pt: ["Vigilância em tempo real", "As filas tiram a metade de pontos e de prestígio."] },
  b_ensaios: { ico: "🧪", ef: { rendaPesq: 3 }, es: ["Ensayos clínicos", "Cada centro de investigación activo da +💰 3 por año."], pt: ["Ensaios clínicos", "Cada centro de pesquisa ativo dá +💰 3 por ano."] },
  b_movel: { ico: "🚐", ef: { custo: { vacuna: 0.6, tabaco: 0.6, habitos: 0.6 } }, es: ["Salud móvil", "Vacuna, antitabaco y hábitos: 40% más baratos."], pt: ["Saúde móvel", "Vacina, antitabaco e hábitos: 40% mais baratos."] },
  b_pred: { ico: "🔮", ef: { visTodos: 0.05 }, es: ["Predicción con IA", "+5% de casos visibles en todo el país."], pt: ["Predição com IA", "+5% de casos visíveis no país inteiro."] },
  b_paper: { ico: "🌐", aoEscolher: () => { S.orc += 8; ganharPrest(4); }, es: ["Publicación internacional", "Premio de una revista internacional: +💰 8 y +🎖️ 4 ahora."], pt: ["Publicação internacional", "Prêmio de uma revista internacional: +💰 8 e +🎖️ 4 agora."] },
  b_aps40: { ico: "✨", ef: { cura: 0.03 }, es: ["APS 4.0", "+3% de chance de cura en todo el país."], pt: ["APS 4.0", "+3% de chance de cura no país inteiro."] },
  p_chave: { ico: "🔑", ef: { conv: { todos: 0.75 } }, es: ["Contratos llave en mano", "Convenios: 25% más baratos."], pt: ["Contratos chave na mão", "Convênios: 25% mais baratos."] },
  p_kermes: { ico: "🎪", ef: { demOrc: 1 }, es: ["Kermés solidaria", "+💰 1 por cada demanda que atiendes."], pt: ["Quermesse solidária", "+💰 1 por demanda atendida."] },
  p_camara: { ico: "🏢", ef: { renda: 1 / 3 }, es: ["Cámara de comercio", "+💰 4 por año."], pt: ["Câmara de comércio", "+💰 4 por ano."] },
  p_concessao: { ico: "🏨", ef: { manut: { quimio: 0.5, mamo: 0.5 } }, es: ["Concesión hospitalaria", "Hospital Día y mamógrafo: mantenimiento a la mitad."], pt: ["Concessão hospitalar", "Hospital Día e mamógrafo: manutenção pela metade."] },
  p_caridade: { ico: "🙏", aoEscolher: () => { for (const d of DEPS.filter((x) => !temSlot(S.deps[x.id], "paliativos")).sort((x, y) => y.pop - x.pop).slice(0, 2)) darGratis(d.id, "paliativos"); },
    es: ["Obras de caridad", "Instituciones religiosas donan cuidados paliativos en los 2 departamentos más poblados que no los tienen (ahora)."], pt: ["Obras de caridade", "Instituições religiosas doam cuidados paliativos nos 2 departamentos mais populosos que não os têm (agora)."] },
  p_royalties: { ico: "⚡", ef: { sorte: { itaipu: 3, yacyreta: 3 }, royaltyExtra: 3 }, es: ["Royalties negociados", "Royalties de Itaipú y fondos de Yacyretá más frecuentes, con +💰 3 extra."], pt: ["Royalties negociados", "Royalties de Itaipu e recursos de Yacyretá mais frequentes, com +💰 3 extra."] },
  p_acelconc: { ico: "☢️", ef: { conv: { radio: 0.5 } }, es: ["Radioterapia concesionada", "Convenio de radioterapia a mitad de precio."], pt: ["Radioterapia concessionada", "Convênio de radioterapia pela metade do preço."] },
  p_fundacao: { ico: "🕊️", ef: { ganhoPrest: 1.5 }, es: ["Fundación propia", "Todo el prestigio que ganas, ×1,5."], pt: ["Fundação própria", "Todo o prestígio que você ganha, ×1,5."] },
  p_zona: { ico: "🏗️", ef: { custo: { todos: 0.85 } }, es: ["Zona franca de salud", "Todas las compras 15% más baratas."], pt: ["Zona franca da saúde", "Todas as compras 15% mais baratas."] },
  p_grande: { ico: "🤝", ef: { conv: { todos: 0.5 } }, es: ["Gran alianza", "Todos los convenios a mitad de precio."], pt: ["Grande aliança", "Todos os convênios pela metade do preço."] },
  p_mecenas: { ico: "💎", aoEscolher: () => { S.orc += 15; }, es: ["Mecenas", "Empresarios amigos donan +💰 15 ahora."], pt: ["Mecenas", "Empresários amigos doam +💰 15 agora."] },
  p_polo: { ico: "🌆", ef: { ptsEq: 1.2 }, es: ["Polo regional", "Los departamentos en equilibrio dan 20% más puntos."], pt: ["Polo regional", "Os departamentos em equilíbrio dão 20% mais pontos."] },
  d_gestao: { ico: "📊", ef: { manut: { n2: 0.75, n3: 0.75 } }, es: ["Gestión hospitalaria", "Atención 2.ª y 3.ª: mantenimiento 25% más barato."], pt: ["Gestão hospitalar", "Atenção 2ª e 3ª: manutenção 25% mais barata."] },
  d_colegas: { ico: "👥", ef: { demPrest: 1 }, es: ["Colegas de confianza", "+🎖️ 1 extra por cada demanda que atiendes."], pt: ["Colegas de confiança", "+🎖️ 1 extra por demanda atendida."] },
  d_protocolos: { ico: "📋", ef: { cura: 0.03 }, es: ["Protocolos clínicos", "+3% de chance de cura."], pt: ["Protocolos clínicos", "+3% de chance de cura."] },
  d_rede: { ico: "🗺️", ef: { semRef: 1 }, es: ["Red de derivación", "La atención terciaria ya no necesita secundaria cerca."], pt: ["Rede de encaminhamento", "A atenção terciária não precisa mais de secundária perto."] },
  d_residentes: { ico: "🧑‍⚕️", ef: { custo: { quimio: 0.75 }, manut: { quimio: 0.5 } }, es: ["Residentes al interior", "Hospital Día: 25% más barato y mantenimiento a la mitad."], pt: ["Residentes no interior", "Hospital Día: 25% mais barato e manutenção pela metade."] },
  d_mbe: { ico: "📚", ef: { quizOrc: 2 }, es: ["Medicina basada en evidencia", "Desafío relámpago: +💰 2 extra al acertar."], pt: ["Medicina baseada em evidências", "Desafio relâmpago: +💰 2 extra ao acertar."] },
  d_acel: { ico: "☢️", ef: { custo: { radio: 0.65 }, prest: { radio: -1 } }, es: ["Acelerador en el interior", "Acelerador lineal: 35% más barato y 🎖️ 1 menos."], pt: ["Acelerador no interior", "Acelerador linear: 35% mais barato e 🎖️ 1 a menos."] },
  d_tamizaje: { ico: "🔬", ef: { custo: { vph: 0.7 }, vis: { vph: 0.03 } }, es: ["Tamizaje organizado", "Test de VPH: 30% más barato y +3% de casos visibles."], pt: ["Rastreamento organizado", "Teste de HPV: 30% mais barato e +3% de casos visíveis."] },
  d_rcbp: { ico: "🧬", ef: { custo: { pesquisa: 0.7 }, visViz: 0.05 }, es: ["Registro poblacional", "Centro de investigación: 30% más barato y revela +5% en los vecinos."], pt: ["Registro populacional", "Centro de pesquisa: 30% mais barato e revela +5% nos vizinhos."] },
  d_centro: { ico: "🏥", aoEscolher: () => { const d = DEPS.filter((x) => !temSlot(S.deps[x.id], "radio")).sort((x, y) => y.pop - x.pop)[0]; if (d) { darGratis(d.id, "quimio"); darGratis(d.id, "radio"); } },
    es: ["Centro oncológico regional", "Hospital Día y acelerador gratis en el departamento más poblado sin radioterapia (ahora)."], pt: ["Centro oncológico regional", "Hospital Día e acelerador grátis no departamento mais populoso sem radioterapia (agora)."] },
  d_lider: { ico: "🎖️", ef: { ganhoPrest: 1.5 }, es: ["Liderazgo médico", "Todo el prestigio que ganas, ×1,5."], pt: ["Liderança médica", "Todo o prestígio que você ganha, ×1,5."] },
  d_excel: { ico: "🏆", ef: { cura: 0.05 }, es: ["Excelencia científica", "+5% de chance de cura."], pt: ["Excelência científica", "+5% de chance de cura."] },
};

/* Missão pessoal de cada personagem (entra em 4º lugar na fila) */
const MISSOES_PESSOAIS = {
  bob: { id: "m_bob", meta: 6, prog: () => DEPS.filter((d) => temSlot(S.deps[d.id], "registro") || temPesq(S.deps[d.id])).length, premio: { orc: 3, prest: 2 },
    es: ["Datos abiertos", "Registro o investigación en 6 departamentos: sin datos no hay epidemiología."], pt: ["Dados abertos", "Registro ou pesquisa em 6 departamentos: sem dados não há epidemiologia."] },
  patron: { id: "m_patron", meta: 4, prog: () => DEPS.reduce((s, d) => s + Object.keys(S.deps[d.id].conv).length, 0), premio: { orc: 4, prest: 1 },
    es: ["Socios para la salud", "4 convenios funcionando al mismo tiempo."], pt: ["Parceiros da saúde", "4 convênios funcionando ao mesmo tempo."] },
  beatriz: { id: "m_beatriz", meta: 1, prog: () => (INTERIOR.some((id) => redeCompleta(id)) ? 1 : 0), premio: { prest: 3, mult: 1.2 },
    es: ["Red completa en el interior", "Atención 1.ª, 2.ª y 3.ª en un mismo departamento fuera de Asunción y Central."], pt: ["Rede completa no interior", "Atenção 1ª, 2ª e 3ª num mesmo departamento fora de Asunción e Central."] },
};

/* ---------- missões paralelas: 3 em curso; cumprir dá prêmio (dinheiro, confiança ou pontos em dobro no ano, que não se ganham desfazendo) ---------- */
const COLO = DEPS.filter((d) => d.primM === "colo").map((d) => d.id);       // 8 departamentos (Atlas 2015-2019)
const PULMAO = DEPS.filter((d) => d.primH === "pulmao").map((d) => d.id);   // 11 departamentos (Atlas 2015-2019)
const CHACO = ["boqueron", "presidente-hayes", "alto-paraguay"];
const INTERIOR = DEPS.map((d) => d.id).filter((id) => id !== "asuncion" && id !== "central");
const contar = (ids, f) => ids.filter(f).length;
const pct = (p, m) => `${p}% / ${m}%`;
const MISSOES = [
  { id: "central", meta: 1, alvo: () => (equil("central") >= 1 ? [] : ["central"]), prog: () => (equil("central") >= 1 ? 1 : 0), premio: { orc: 2 },
    es: ["Equilibrio en Central", "Central ya tiene tratamiento (INCAN). Súmale prevención y diagnóstico."],
    pt: ["Equilíbrio em Central", "Central já tem tratamento (INCAN). Some prevenção e diagnóstico."] },
  { id: "colo", meta: 3, alvo: () => COLO.filter((id) => !temSlot(S.deps[id], "vph")), prog: () => contar(COLO, (id) => temSlot(S.deps[id], "vph")), premio: { orc: 3, prest: 2 }, fonte: "Atlas 2015–2019",
    es: ["La 1.ª causa evitable", "Test de VPH en 3 de los 8 departamentos donde el cuello uterino es la 1.ª causa de muerte por cáncer en las mujeres."],
    pt: ["A 1ª causa evitável", "Teste de HPV em 3 dos 8 departamentos onde o colo do útero é a 1ª causa de morte por câncer nas mulheres."] },
  { id: "pulmao", meta: 4, alvo: () => PULMAO.filter((id) => !temSlot(S.deps[id], "tabaco")), prog: () => contar(PULMAO, (id) => temSlot(S.deps[id], "tabaco")), premio: { orc: 2, prest: 2 }, fonte: "Atlas 2015–2019",
    es: ["Pulmón: 1.ª causa en los hombres", "Campaña antitabaco en 4 de los 11 departamentos donde el pulmón es la 1.ª causa de muerte por cáncer en los hombres."],
    pt: ["Pulmão: 1ª causa nos homens", "Campanha antitabaco em 4 dos 11 departamentos onde o pulmão é a 1ª causa de morte por câncer nos homens."] },
  { id: "radio", meta: 1, alvo: () => ["alto-parana", "itapua"], prog: () => (["alto-parana", "itapua"].some((id) => temSlot(S.deps[id], "radio")) ? 1 : 0), premio: { prest: 3, mult: 1.2 }, fonte: "La Nación, 23/07/2024",
    es: ["Radioterapia fuera de Capiatá", "Acelerador (público o por convenio) en Alto Paraná o Itapúa, donde el Ministerio anunció aceleradores en 2024."],
    pt: ["Radioterapia fora de Capiatá", "Acelerador (público ou por convênio) em Alto Paraná ou Itapúa, onde o Ministério anunciou aceleradores em 2024."] },
  { id: "chaco", meta: 1, alvo: () => CHACO, prog: () => (CHACO.some((id) => equil(id) >= 1) ? 1 : 0), premio: { orc: 1, prest: 4 },
    es: ["El Chaco también cuenta", "Equilibrio en Boquerón, Presidente Hayes o Alto Paraguay."],
    pt: ["O Chaco também conta", "Equilíbrio em Boquerón, Presidente Hayes ou Alto Paraguay."] },
  { id: "pesquisa", meta: 1, prog: () => (INTERIOR.some((id) => temPesq(S.deps[id])) ? 1 : 0), premio: { orc: 2, prest: 2 }, fonte: "DGVS/MSPBS, 05/02/2024",
    es: ["Datos fuera de la capital", "Centro de investigación (o convenio con una universidad) fuera de Asunción y Central: el único registro poblacional cubre solo esos dos."],
    pt: ["Dados fora da capital", "Centro de pesquisa (ou convênio com universidade) fora de Asunción e Central: o único registro populacional cobre só esses dois."] },
  { id: "ocultos", meta: 40, fmt: pct, prog: () => Math.floor(revelados()), premio: { orc: 3 },
    es: ["Sacar a la luz", "Revela el 40% de los casos ocultos del país con diagnóstico, registro e investigación."],
    pt: ["Trazer à luz", "Revele 40% dos casos ocultos do país com diagnóstico, registro e pesquisa."] },
  { id: "eq9", meta: 9, prog: () => DEPS.filter((d) => equil(d.id) >= 1).length, premio: { mult: 1.3 },
    es: ["Medio país en equilibrio", "Equilibrio en 9 departamentos."],
    pt: ["Meio país em equilíbrio", "Equilíbrio em 9 departamentos."] },
  { id: "prest", meta: 15, fmt: (p, m) => `🎖️ ${p}/${m}`, prog: () => S.prest, premio: { orc: 4 },
    es: ["Prestigio nacional", "Junta 🎖️ 15 de prestigio atendiendo demandas, cumpliendo promesas y misiones."],
    pt: ["Prestígio nacional", "Junte 🎖️ 15 de prestígio atendendo demandas, cumprindo promessas e missões."] },
  { id: "pop75", meta: 75, fmt: pct, prog: () => Math.floor(popEqPct()), premio: { mult: 1.5 },
    es: ["Tres de cada cuatro", "75% de la población viviendo en departamentos en equilibrio."],
    pt: ["Três em cada quatro", "75% da população vivendo em departamentos em equilíbrio."] },
];

/* ---------- notícia de cada missão: recorte de jornal com fatos e ranking reais, para o jogador investigar.
   rank() devolve os departamentos em ordem; feito(id) marca onde a missão já foi cumprida ---------- */
const rankSitio = (ids, k) => [...ids].sort((a, b) => DEP[b].sitio[k] - DEP[a].sitio[k]).map((id) => ({ id, valor: fmt1(DEP[id].sitio[k]) }));
const rankPop = (ids) => ids.map((id) => ({ id, valor: `${fmtInt(DEP[id].pop)} ${t("hab")}` }));
const menoresTee = (n) => [...DEPS].sort((a, b) => a.tee - b.tee).slice(0, n).map((d) => ({ id: d.id, valor: fmt1(d.tee) }));
const NOTICIAS = {
  central: { data: "Capiatá · 2024", fonte: "Censo 2022 (INE); MSPBS, INCAN 2024", rank: () => rankPop(["central"]),
    es: ["Central trata el cáncer de todo el país, pero le faltan prevención y diagnóstico", "Es el departamento más poblado y ahí está el INCAN, en Capiatá: la única radioterapia pública del país.", "Población (Censo 2022)"],
    pt: ["Central trata o câncer do país inteiro, mas faltam prevenção e diagnóstico", "É o departamento mais populoso e ali está o INCAN, em Capiatá: a única radioterapia pública do país.", "População (Censo 2022)"] },
  colo: { data: "Asunción · 12/03/2025", fonte: "Atlas 2015–2019; MSPBS, 12/03/2025", rank: () => rankSitio(COLO, "colo"), feito: (id) => temSlot(S.deps[id], "vph"),
    es: ["Cuello uterino: la 1.ª causa de muerte por cáncer de las mujeres en 8 departamentos", "Es un cáncer evitable: la vacuna y el test de VPH lo previenen o lo detectan a tiempo. Estos son los departamentos donde más mata.", "Tasa estandarizada de cuello uterino por 100 mil mujeres, 2015–2019"],
    pt: ["Colo do útero: a 1ª causa de morte por câncer das mulheres em 8 departamentos", "É um câncer evitável: a vacina e o teste de HPV o previnem ou o detectam a tempo. Estes são os departamentos onde ele mais mata.", "Taxa padronizada de colo do útero por 100 mil mulheres, 2015–2019"] },
  pulmao: { data: "Asunción · 13/02/2022", fonte: "Atlas 2015–2019; ENFR 2022; ABC Color, 13/02/2022", rank: () => rankSitio(PULMAO, "pulmao_h"), feito: (id) => temSlot(S.deps[id], "tabaco"),
    es: ["Pulmón: la 1.ª causa de muerte por cáncer de los hombres en 11 departamentos", "12,5% de los adultos fuma cigarrillo y 17% usa tabaco en alguna forma, y el impuesto al tabaco era el más bajo de la región. Estos son los departamentos donde el pulmón más mata a los hombres.", "Tasa estandarizada de pulmón por 100 mil hombres, 2015–2019"],
    pt: ["Pulmão: a 1ª causa de morte por câncer dos homens em 11 departamentos", "12,5% dos adultos fumam cigarro e 17% usam tabaco de alguma forma, e o imposto sobre o tabaco era o mais baixo da região. Estes são os departamentos onde o pulmão mais mata os homens.", "Taxa padronizada de pulmão por 100 mil homens, 2015–2019"] },
  radio: { data: "Asunción · 23/07/2024", fonte: "MSPBS, INCAN 2024; La Nación, 23/07/2024", rank: () => rankPop(["alto-parana", "itapua"]), feito: (id) => temSlot(S.deps[id], "radio"),
    es: ["Pacientes del interior viajan a Capiatá para la radioterapia", "La radioterapia pública está solo en el INCAN, en Capiatá. En 2024 el Ministerio anunció aceleradores para Alto Paraná e Itapúa.", "Población (Censo 2022)"],
    pt: ["Pacientes do interior viajam a Capiatá para a radioterapia", "A radioterapia pública está só no INCAN, em Capiatá. Em 2024 o Ministério anunciou aceleradores para Alto Paraná e Itapúa.", "População (Censo 2022)"] },
  chaco: { data: "Asunción · 2022", fonte: "Atlas 2015–2019", rank: () => CHACO.map((id) => ({ id, valor: `${fmtInt(DEP[id].obitos)} ${t("muertes")}` })), feito: (id) => equil(id) >= 1,
    es: ["El Chaco también cuenta", "Los tres departamentos del Chaco registraron {n} muertes por cáncer en 5 años. Con pocos casos, la tasa es inestable: cada diagnóstico cuenta.", "Muertes por cáncer registradas, 2015–2019 (Atlas, Tabla 1)"],
    pt: ["O Chaco também conta", "Os três departamentos do Chaco registraram {n} óbitos por câncer em 5 anos. Com poucos casos, a taxa é instável: cada diagnóstico conta.", "Óbitos por câncer registrados, 2015–2019 (Atlas, Tabla 1)"] },
  pesquisa: { data: "Asunción · 05/02/2024", fonte: "DGVS/MSPBS, 05/02/2024; Atlas 2015–2019", rank: () => menoresTee(5), feito: (id) => temPesq(S.deps[id]),
    es: ["Sin registro de cáncer fuera de la capital", "El único registro de cáncer de base poblacional, creado en 2020, cubre solo Asunción y Central. Donde la tasa es más baja puede faltar diagnóstico y registro.", "Las 5 tasas estandarizadas más bajas, 2015–2019 (por 100 mil)"],
    pt: ["Sem registro de câncer fora da capital", "O único registro de câncer de base populacional, criado em 2020, cobre só Asunción e Central. Onde a taxa é mais baixa pode faltar diagnóstico e registro.", "As 5 taxas padronizadas mais baixas, 2015–2019 (por 100 mil)"] },
  ocultos: { data: "Asunción · 2022", fonte: "Atlas 2015–2019", rank: () => menoresTee(5),
    es: ["Tasa baja no es riesgo bajo", "En 2017, cerca de 1 de cada 4 muertes no entraba en las estadísticas. Donde la tasa es más baja, diagnosticar puede sacar a la luz casos ocultos.", "Las 5 tasas estandarizadas más bajas, 2015–2019 (por 100 mil)"],
    pt: ["Taxa baixa não é risco baixo", "Em 2017, cerca de 1 em cada 4 mortes não entrava nas estatísticas. Onde a taxa é mais baixa, diagnosticar pode trazer à luz casos ocultos.", "As 5 taxas padronizadas mais baixas, 2015–2019 (por 100 mil)"] },
};
function noticiaHTML(id) {
  const n = NOTICIAS[id];
  if (!n) return "";
  const [manchete, lide, rankTit] = n[lang], linhas = n.rank();
  const lideTxt = lide.replace("{n}", fmtInt(CHACO.reduce((s, x) => s + DEP[x].obitos, 0)));
  const poucos = linhas.some((r) => DEP[r.id].poucos);
  const li = linhas.map((r, i) => `<li><button type="button" data-ir-dep="${r.id}"><span class="n">${i + 1}</span><span>${esc(DEP[r.id].nome)}${DEP[r.id].poucos ? " *" : ""}</span>`
    + `${n.feito && n.feito(r.id) ? `<span class="ok">✓ ${esc(t("recFeito"))}</span>` : "<span></span>"}<span class="v">${esc(r.valor)}</span></button></li>`).join("");
  return `<details class="noticia"><summary>${ico("jornal")} ${esc(t("lerNoticia"))}</summary><article class="recorte">
    <p class="rec-kicker">${esc(n.data)} · ${esc(t("recKicker"))}</p><h4>${esc(manchete)}</h4><p>${esc(lideTxt)}</p>
    <p class="rec-tit">${esc(rankTit)}</p><ol class="rec-rank">${li}</ol>
    ${poucos ? `<p class="rec-nota">${esc(t("recPoucos"))}</p>` : ""}<p class="rec-nota">${esc(t("misSeguir"))}</p>
    <p class="fonte">${esc(t("fonte"))}: ${fonteHTML(n.fonte)}</p></article></details>`;
}

/* ---------- finanças (tocar 💰) e favores de prestígio (tocar 🎖️): cada decisão traz dinheiro ou ajuda com um custo.
   Fato real com fonte quando há; sem fonte = cenário do jogo. Textos: [título, explicação, efeito, botão, quando já feito] ---------- */
const POL = () => (S.pol ||= {});
const ACAO_BRIGADA = { bob: "registro", patron: "paliativos", beatriz: "vph" };
const FIN = {
  tabaco: { ico: "tabaco", fonte: "ABC Color, 13/02/2022", prest: 4, estado: () => POL().tabaco !== undefined, fazer: () => { POL().tabaco = S.anoIdx; },
    es: ["Subir el impuesto al tabaco", "El impuesto selectivo al tabaco de Paraguay (20% en 2022) era el más bajo de la región, y los organismos de salud recomiendan subirlo para que se fume menos. Enfrentar a la industria cuesta prestigio.", "+💰 2 por año desde el próximo enero y un poco menos de cáncer en todo el país · 🎖️ 4 ahora", "Aprobar", "Vigente: +💰 2 por año."],
    pt: ["Aumentar o imposto sobre o tabaco", "O imposto seletivo sobre o tabaco do Paraguai (20% em 2022) era o mais baixo da região, e os organismos de saúde recomendam aumentá-lo para que se fume menos. Enfrentar a indústria custa prestígio.", "+💰 2 por ano a partir do próximo janeiro e um pouco menos de câncer no país inteiro · 🎖️ 4 agora", "Aprovar", "Em vigor: +💰 2 por ano."] },
  prestamo: { ico: "moeda", fonte: "La Nación, 13/04/2023", estado: () => !!POL().prestamo, fazer: () => { S.orc += 12; POL().prestamo = { desde: S.anoIdx + 1, ate: S.anoIdx + 7 }; },
    es: ["Préstamo de un banco multilateral", "Paraguay financia parte de su red de salud con préstamos: en 2023, Diputados aprobó un préstamo del BID de hasta US$ 45 millones para la red de Concepción, San Pedro, Caazapá y Alto Paraná.", "+💰 12 ahora · −💰 2 por año durante los 7 años siguientes", "Tomar el préstamo", "Tomado: se paga 💰 2 por año."],
    pt: ["Empréstimo de um banco multilateral", "O Paraguai financia parte da sua rede de saúde com empréstimos: em 2023, a Câmara aprovou um empréstimo do BID de até US$ 45 milhões para a rede de Concepción, San Pedro, Caazapá e Alto Paraná.", "+💰 12 agora · −💰 2 por ano nos 7 anos seguintes", "Pegar o empréstimo", "Pego: paga-se 💰 2 por ano."] },
  proveedor: { ico: "repete", estado: () => POL().proveedor === S.anoIdx, fazer: () => { S.orc += 4; POL().proveedor = S.anoIdx; },
    es: ["Atrasar el pago a los proveedores", "Pagar después libera dinero hoy, pero la cuenta vuelve con recargo y faltan insumos en los servicios.", "+💰 4 ahora · en enero: −💰 5 y −🎖️ 1", "Atrasar", "Atrasado este año: en enero se paga con recargo."],
    pt: ["Atrasar o pagamento aos fornecedores", "Pagar depois libera dinheiro hoje, mas a conta volta com acréscimo e faltam insumos nos serviços.", "+💰 4 agora · em janeiro: −💰 5 e −🎖️ 1", "Atrasar", "Atrasado neste ano: em janeiro paga-se com acréscimo."] },
  ensayo: { ico: "frasco", estado: () => !!POL().ensayo, bloq: () => (DEPS.some((d) => temPesq(S.deps[d.id])) ? null : t("faltaPesq")),
    fazer: () => { S.orc += 3; POL().ensayo = { ini: S.anoIdx, res: null }; POL().cura = -0.01; },
    feitoTxt: () => { const e = POL().ensayo; return e.res === "ok" ? t("ensOk") : e.res === "falhou" ? t("ensFalhou") : t("ensCurso")(ANOS[e.ini + 3]); },
    es: ["Ensayo clínico patrocinado", "Una farmacéutica paga por probar un tratamiento nuevo en tus centros de investigación. Mientras dura, se cura un poco menos; al final, puede funcionar o no.", "+💰 3 por año durante 3 años · −1% de cura mientras dura · al final: si funciona, +3% de cura en el país; si no, −🎖️ 3", "Firmar", ""],
    pt: ["Ensaio clínico patrocinado", "Uma farmacêutica paga para testar um tratamento novo nos seus centros de pesquisa. Enquanto dura, cura-se um pouco menos; no fim, pode funcionar ou não.", "+💰 3 por ano durante 3 anos · −1% de cura enquanto dura · no fim: se funcionar, +3% de cura no país; se não, −🎖️ 3", "Assinar", ""] },
  tabacalera: { ico: "diamante", fonte: "Ley N° 2969/2006", prest: 6, estado: () => !!POL().tabacalera,
    fazer: () => { S.orc += 8; POL().tabacalera = true; S.aleatUsados.push("ops", "oiea", "global", "inversion"); S.usadas.push("ops"); },
    es: ["Patrocinio de una tabacalera", "Una tabacalera ofrece financiar tu programa. Paraguay ratificó el Convenio Marco de la OMS para el Control del Tabaco: aceptar dinero de la industria te aleja de la cooperación internacional.", "+💰 8 ahora · −🎖️ 6 · no vuelven la OPS/OMS, el OIEA, la inversión extranjera ni los premios internacionales", "Aceptar", "Aceptado: la cooperación internacional se alejó."],
    pt: ["Patrocínio de uma tabacaleira", "Uma tabacaleira oferece financiar o seu programa. O Paraguai ratificou a Convenção-Quadro da OMS para o Controle do Tabaco: aceitar dinheiro da indústria afasta você da cooperação internacional.", "+💰 8 agora · −🎖️ 6 · não voltam a OPAS/OMS, a AIEA, o investimento estrangeiro nem os prêmios internacionais", "Aceitar", "Aceito: a cooperação internacional se afastou."] },
};
const FAVOR = {
  ampl: { ico: "predio", fonte: "ABC Color, 03/05/2023", prest: 3, estado: () => POL().ampl === S.anoIdx, fazer: () => { S.orc += 5; POL().ampl = S.anoIdx; },
    es: ["Pedir una ampliación presupuestaria al Congreso", "Con apoyo político, el Congreso aprueba más dinero para la salud. Ejemplo real: en 2023, Diputados aprobó una ampliación de G. 95.373 millones para medicamentos del INCAN.", "+💰 5 · 🎖️ 3 · una vez por año", "Pedir", "Ya pediste este año."],
    pt: ["Pedir uma ampliação orçamentária ao Congresso", "Com apoio político, o Congresso aprova mais dinheiro para a saúde. Exemplo real: em 2023, a Câmara aprovou uma ampliação de G. 95.373 milhões para remédios do INCAN.", "+💰 5 · 🎖️ 3 · uma vez por ano", "Pedir", "Você já pediu neste ano."] },
  brig: { ico: () => ACAO_BRIGADA[S.pers], prest: 4, estado: () => POL().brig === S.anoIdx,
    bloq: () => { const a = ACAO_BRIGADA[S.pers]; return temSlot(S.deps[S.sel], a) ? t("favorJaTem")(t("curtas")[a], DEP[S.sel].nome) : null; },
    fazer: () => { const a = ACAO_BRIGADA[S.pers]; darGratis(S.sel, a); POL().brig = S.anoIdx; destacar(S.sel, a); },
    porPers: {
      bob: { es: ["Llamar a la comunidad open source", "Programadores voluntarios instalan un registro digital de cáncer en {dep}.", "Registro gratis en {dep} · 🎖️ 4 · una vez por año", "Llamar", "Ya llamaste este año."],
             pt: ["Chamar a comunidade open source", "Programadores voluntários instalam um registro digital de câncer em {dep}.", "Registro grátis em {dep} · 🎖️ 4 · uma vez por ano", "Chamar", "Você já chamou neste ano."] },
      patron: { es: ["Llamar a las instituciones religiosas", "Instituciones religiosas donan un servicio de cuidados paliativos en {dep}.", "Paliativos gratis en {dep} · 🎖️ 4 · una vez por año", "Llamar", "Ya llamaste este año."],
                pt: ["Chamar as instituições religiosas", "Instituições religiosas doam um serviço de cuidados paliativos em {dep}.", "Paliativos grátis em {dep} · 🎖️ 4 · uma vez por ano", "Chamar", "Você já chamou neste ano."] },
      beatriz: { es: ["Llamar a tus colegas médicos", "Sociedades médicas organizan una jornada de test de VPH en {dep}.", "Test de VPH gratis en {dep} · 🎖️ 4 · una vez por año", "Llamar", "Ya llamaste este año."],
                 pt: ["Chamar seus colegas médicos", "Sociedades médicas organizam uma jornada de teste de HPV em {dep}.", "Teste de HPV grátis em {dep} · 🎖️ 4 · uma vez por ano", "Chamar", "Você já chamou neste ano."] },
    } },
  terr: { ico: "guindaste", prest: 2, estado: () => !!POL().terreno && POL().terreno.ano === S.anoIdx, fazer: () => { POL().terreno = { dep: S.sel, ano: S.anoIdx }; },
    feitoTxt: () => (lang === "es" ? `Este año, ${DEP[POL().terreno.dep].nome} tiene 💰 2 de descuento.` : `Neste ano, ${DEP[POL().terreno.dep].nome} tem 💰 2 de desconto.`),
    es: ["Pedir terreno y personal a la Gobernación", "La Gobernación de {dep} cede terreno y personal para tus obras.", "Este año, todo en {dep} cuesta 💰 2 menos · 🎖️ 2 · una vez por año", "Pedir", ""],
    pt: ["Pedir terreno e pessoal ao governo departamental", "O governo departamental de {dep} cede terreno e pessoal para as suas obras.", "Neste ano, tudo em {dep} custa 💰 2 a menos · 🎖️ 2 · uma vez por ano", "Pedir", ""] },
  notif: { ico: "protocolo", fonte: "Res. S.G. N° 752 (MSPBS, 2024)", prest: 8, estado: () => !!POL().notif,
    fazer: () => { POL().notif = true; for (const id in S.deps) S.deps[id].visEv += 0.05; },
    es: ["Notificación obligatoria del cáncer en todo el país", "Todo cáncer confirmado pasa a ser notificado, en todos los departamentos. En la vida real, el Ministerio lo anunció en noviembre de 2024.", "+5% de casos visibles en todo el país, para siempre · 🎖️ 8 · una sola vez", "Decretar", "Vigente en todo el país."],
    pt: ["Notificação obrigatória do câncer no país inteiro", "Todo câncer confirmado passa a ser notificado, em todos os departamentos. Na vida real, o Ministério a anunciou em novembro de 2024.", "+5% de casos visíveis no país inteiro, para sempre · 🎖️ 8 · uma única vez", "Decretar", "Em vigor no país inteiro."] },
};
function opcaoHTML(tipo, id, o) {
  const tx = (o.porPers ? o.porPers[S.pers] : o)[lang].map((x) => x.replaceAll("{dep}", DEP[S.sel].nome));
  const [tit, txt, ef, btn, feito] = tx, est = o.estado();
  const falta = est ? null : o.prest && S.prest < o.prest ? t("faltaPrest")(o.prest - S.prest) : o.bloq ? o.bloq() : null;
  return `<div class="opc${est ? " feito" : ""}"><b>${ico(typeof o.ico === "function" ? o.ico() : o.ico)} ${esc(tit)}</b><p>${esc(txt)}</p><p class="efeito">${esc(ef)}</p>
    <p class="fonte">${o.fonte ? `${esc(t("fonte"))}: ${fonteHTML(o.fonte)}` : esc(t("escenario"))}</p>
    ${est ? `<p class="feito-txt">✓ ${esc(o.feitoTxt ? o.feitoTxt() : feito)}</p>`
      : `<button class="btn mini" type="button" data-${tipo}="${id}"${falta ? " disabled" : ""}>${esc(btn)}</button>${falta ? `<p class="meta">${esc(falta)}</p>` : ""}`}</div>`;
}
function mostrarFinancas() {
  janela = "financas";
  abrirModal(`<h2>${esc(t("finTit"))}</h2><p>${esc(t("finIntro")(fmtM(rendaAno()), fmtM(manutAno())))}</p>
    ${Object.keys(FIN).map((id) => opcaoHTML("fin", id, FIN[id])).join("")}
    <button class="btn" type="button" data-fechar>${esc(t("voltar"))}</button>`);
}
function mostrarPrestigio() {
  janela = "prestigio";
  abrirModal(`<h2>${esc(t("prestTit"))} · ${ico("medalha")} ${S.prest}</h2><p>${esc(t("prestIntro"))}</p>
    ${Object.keys(FAVOR).map((id) => opcaoHTML("favor", id, FAVOR[id])).join("")}
    <button class="btn" type="button" data-fechar>${esc(t("voltar"))}</button>`);
}
function executarOpcao(tipo, id) {
  const o = (tipo === "fin" ? FIN : FAVOR)[id];
  if (!o || o.estado() || (o.prest && S.prest < o.prest) || (o.bloq && o.bloq())) return;
  if (o.prest) ganharPrest(-o.prest);
  o.fazer();
  vibrar();
  salvar();
  render();
  (tipo === "fin" ? mostrarFinancas : mostrarPrestigio)();
}

/* ---------- conquistas: ficam guardadas neste celular (nenhum dado pessoal) ---------- */
const META_VIDAS = 5000;
const LOGROS = [
  { id: "eq1", ico: "🌱", teste: () => DEPS.some((d) => equil(d.id) >= 1), es: ["Primer equilibrio", "Un departamento con los 3 niveles."], pt: ["Primeiro equilíbrio", "Um departamento com os 3 níveis."] },
  { id: "eq3", ico: "🏥", teste: () => DEPS.some((d) => equil(d.id) >= 3), es: ["Sistema completo", "Un departamento con 3/3 en los 3 niveles."], pt: ["Sistema completo", "Um departamento com 3/3 nos 3 níveis."] },
  { id: "eq9", ico: "🗺️", teste: () => DEPS.filter((d) => equil(d.id) >= 1).length >= 9, es: ["Medio país", "9 departamentos en equilibrio."], pt: ["Meio país", "9 departamentos em equilíbrio."] },
  { id: "eq18", ico: "🇵🇾", teste: () => DEPS.every((d) => equil(d.id) >= 1), es: ["Paraguay en equilibrio", "Los 18 departamentos en equilibrio."], pt: ["Paraguai em equilíbrio", "Os 18 departamentos em equilíbrio."] },
  { id: "ocultos", ico: "🔍", teste: () => revelados() >= 50, es: ["Cazador de lo oculto", "La mitad de los casos ocultos salió a la luz."], pt: ["Caçador do oculto", "Metade dos casos ocultos veio à luz."] },
  { id: "radio", ico: "☢️", teste: () => INTERIOR.some((id) => temSlot(S.deps[id], "radio")), es: ["Radioterapia en el interior", "Un acelerador fuera de Asunción y Central."], pt: ["Radioterapia no interior", "Um acelerador fora de Asunción e Central."] },
  { id: "vacuna", ico: "💉", teste: () => DEPS.filter((d) => temSlot(S.deps[d.id], "vacuna")).length >= 9, es: ["Generación protegida", "Vacuna VPH en 9 departamentos."], pt: ["Geração protegida", "Vacina HPV em 9 departamentos."] },
  { id: "conv", ico: "🤝", teste: () => DEPS.reduce((s, d) => s + Object.keys(S.deps[d.id].conv).length, 0) >= 5, es: ["Buen socio", "5 convenios al mismo tiempo."], pt: ["Bom parceiro", "5 convênios ao mesmo tempo."] },
  { id: "prest", ico: "🎖️", teste: () => S.prest >= 20, es: ["Prestigio de estadista", "🎖️ 20 de prestigio al mismo tiempo."], pt: ["Prestígio de estadista", "🎖️ 20 de prestígio ao mesmo tempo."] },
  { id: "quiz", ico: "🧠", teste: () => S.quiz.racha >= 5, es: ["Sabio del cáncer", "5 desafíos relámpago seguidos sin errar."], pt: ["Sábio do câncer", "5 desafios relâmpago seguidos sem errar."] },
  { id: "mis", ico: "🎯", teste: () => S.mis.feitas.length >= 6, es: ["Misionero/a", "6 misiones cumplidas en una partida."], pt: ["Missionário/a", "6 missões cumpridas numa partida."] },
  { id: "vidas", ico: "❤️", teste: () => vidasTotal() >= META_VIDAS, es: ["5.000 vidas", "5.000 vidas salvadas en una partida (modelo)."], pt: ["5.000 vidas", "5.000 vidas salvas numa partida (modelo)."] },
  { id: "rede", ico: "🕸️", teste: () => INTERIOR.some((id) => redeCompleta(id)), es: ["Red de derivación", "Atención 1.ª, 2.ª y 3.ª en un departamento del interior."], pt: ["Rede de encaminhamento", "Atenção 1ª, 2ª e 3ª num departamento do interior."] },
  { id: "ministro", ico: "🎩", teste: () => cargoAtual() >= 4, es: ["Ministro/a", "Llegaste al cargo más alto."], pt: ["Ministro/a", "Você chegou ao cargo mais alto."] },
  { id: "recorde", ico: "🏆", teste: () => S.recordeBatido, es: ["Nuevo récord", "Superaste tu récord en este celular."], pt: ["Novo recorde", "Você superou seu recorde neste celular."] },
];

/* ---------- desafio relâmpago: um por ano, no meio do ano; só fatos que o jogo já cita, com a mesma fonte ---------- */
const BONUS_QUIZ = 100;   // pontos do ranking por acerto (decisão do Gi, 27/10/2026); fica fora do teto de 3.000 do ano
const QUIZ = [
  { v: false, fonte: "Atlas 2015–2019",
    es: ["El pulmón es la 1.ª causa de muerte por cáncer en las mujeres paraguayas.", "En las mujeres lideran la mama y el cuello uterino; el pulmón es la 1.ª causa en los hombres."],
    pt: ["O pulmão é a 1ª causa de morte por câncer nas mulheres paraguaias.", "Nas mulheres lideram a mama e o colo do útero; o pulmão é a 1ª causa nos homens."] },
  { v: true, fonte: "MSPBS, INCAN 2024",
    es: ["La radioterapia pública está en un único lugar del país: el INCAN, en Capiatá.", "Un único lugar para todo el país, con 3 aceleradores lineales."],
    pt: ["A radioterapia pública está num único lugar do país: o INCAN, em Capiatá.", "Um único lugar para o país inteiro, com 3 aceleradores lineares."] },
  { v: false, fonte: "Atlas 2015–2019",
    es: ["Una tasa de mortalidad por cáncer baja siempre significa riesgo bajo.", "Puede ser subregistro: Canindeyú tiene la menor tasa estandarizada (41,3) y la mayor proporción de muertes femeninas por cuello uterino (36,8%)."],
    pt: ["Uma taxa de mortalidade por câncer baixa sempre significa risco baixo.", "Pode ser sub-registro: Canindeyú tem a menor taxa padronizada (41,3) e a maior proporção de mortes femininas por colo do útero (36,8%)."] },
  { v: true, fonte: "IARC, GLOBOCAN 2022",
    es: ["GLOBOCAN 2022 estimó 13.783 casos nuevos de cáncer en Paraguay.", "Y 6.581 muertes por cáncer."],
    pt: ["O GLOBOCAN 2022 estimou 13.783 casos novos de câncer no Paraguai.", "E 6.581 mortes por câncer."] },
  { v: true, fonte: "MSPBS, 2024",
    es: ["Desde el 01/08/2024 basta una dosis de la vacuna contra el VPH.", "Paraguay pasó a la dosis única en agosto de 2024."],
    pt: ["Desde 01/08/2024 basta uma dose da vacina contra o HPV.", "O Paraguai passou para a dose única em agosto de 2024."] },
  { v: false, fonte: "ICO/IARC HPV Information Centre, 2023",
    es: ["En 2021, la vacuna contra el VPH llegó al 90% de las niñas, la meta de la OMS.", "Llegó a 23% con la 1.ª dosis y a 17% con la última."],
    pt: ["Em 2021, a vacina contra o HPV chegou a 90% das meninas, a meta da OMS.", "Chegou a 23% na 1ª dose e a 17% na última."] },
  { v: true, fonte: "ICO/IARC HPV Information Centre, 2023",
    es: ["En Paraguay, 58,9% de los cánceres de cuello uterino se deben a los tipos 16 y 18 del VPH.", "Es el dato del ICO/IARC para el país."],
    pt: ["No Paraguai, 58,9% dos cânceres do colo do útero se devem aos tipos 16 e 18 do HPV.", "É o dado do ICO/IARC para o país."] },
  { v: false, fonte: "ENFR 2022",
    es: ["La mayoría de los adultos come 5 porciones de frutas y verduras por día.", "Solo 3,9% lo hace."],
    pt: ["A maioria dos adultos come 5 porções de frutas e verduras por dia.", "Só 3,9% fazem isso."] },
  { v: true, fonte: "Leite et al., 2025",
    es: ["El colorrectal es el cáncer que más crece en Paraguay: cerca de 3% por año desde 1990.", "Es el que más crece en el país."],
    pt: ["O colorretal é o câncer que mais cresce no Paraguai: cerca de 3% ao ano desde 1990.", "É o que mais cresce no país."] },
  { v: true, fonte: "Atlas 2015–2019",
    es: ["En 2017, cerca de 1 de cada 4 muertes no entraba en las estadísticas.", "Subregistro de 26,2%."],
    pt: ["Em 2017, cerca de 1 em cada 4 mortes não entrava nas estatísticas.", "Sub-registro de 26,2%."] },
  { v: false, fonte: "Torres-Roman et al., BMC Public Health 2022",
    es: ["La mortalidad por cuello uterino en mujeres de 20 a 44 años está bajando.", "Sube 3,7% por año (1997–2017)."],
    pt: ["A mortalidade por colo do útero em mulheres de 20 a 44 anos está caindo.", "Sobe 3,7% ao ano (1997–2017)."] },
  { v: true, fonte: "ENFR 2022",
    es: ["12,5% de los adultos fuman cigarrillo y 17% usan alguna forma de tabaco.", "Datos de la Encuesta Nacional de Factores de Riesgo."],
    pt: ["12,5% dos adultos fumam cigarro e 17% usam alguma forma de tabaco.", "Dados da Encuesta Nacional de Factores de Riesgo."] },
  { v: true, fonte: "Atlas 2015–2019",
    es: ["En 8 de los 18 departamentos, el cuello uterino es la 1.ª causa de muerte por cáncer en las mujeres.", "Un cáncer evitable."],
    pt: ["Em 8 dos 18 departamentos, o colo do útero é a 1ª causa de morte por câncer nas mulheres.", "Um câncer evitável."] },
  { v: false, fonte: "DGVS/MSPBS, 05/02/2024",
    es: ["El registro de cáncer de base poblacional cubre todo el país.", "Se creó en 2020 solo para Asunción y Central."],
    pt: ["O registro de câncer de base populacional cobre o país inteiro.", "Foi criado em 2020 só para Asunción e Central."] },
  { v: true, fonte: "Ley N° 6266/2018",
    es: ["La Ley 6.266/2018 garantiza atención integral a las personas con cáncer, de la prevención a los cuidados paliativos.", "También prevé un Fondo Solidario."],
    pt: ["A Ley 6.266/2018 garante atenção integral às pessoas com câncer, da prevenção aos cuidados paliativos.", "Também prevê um Fundo Solidário."] },
];

/* ---------- consequências: o jogo reage às escolhas (modelo do jogo; no máximo uma por ano, cada uma uma vez) ---------- */
const nPrev = () => DEPS.reduce((s, d) => s + nivel(S.deps[d.id], "P"), 0);
const CONSEQ = [
  { id: "modelo", achar: () => DEPS.find((d) => equil(d.id) >= 3)?.id, aplicar: () => { ganharPrest(3); S.orc += 2; },
    es: ["{dep}, modelo nacional", "{dep} tiene prevención, diagnóstico y tratamiento completos. Otros departamentos quieren copiarlo.", "+🎖️ 3 y +💰 2."],
    pt: ["{dep}, modelo nacional", "{dep} tem prevenção, diagnóstico e tratamento completos. Outros departamentos querem copiá-lo.", "+🎖️ 3 e +💰 2."] },
  { id: "fila", achar: () => { const [a, b] = S.log.slice(-2); return a && b ? DEPS.find((d) => temFila(d.id) && a.filas.includes(d.nome) && b.filas.includes(d.nome))?.id : undefined; },
    aplicar: () => { ganharPrest(-3); },
    es: ["La fila crece en {dep}", "Hace dos años que {dep} diagnostica pero no trata: los pacientes viajan a Capiatá y la prensa lo muestra.", "−🎖️ 3. Pon tratamiento en {dep}."],
    pt: ["A fila cresce em {dep}", "Há dois anos {dep} diagnostica mas não trata: os pacientes viajam a Capiatá e a imprensa mostra.", "−🎖️ 3. Ponha tratamento em {dep}."] },
  { id: "semdx", achar: () => { const r = S.log[S.log.length - 1]; return r && S.anoIdx >= 2 && r.ind.semdx >= 0.08 * r.ind.mortes ? "" : undefined; }, aplicar: () => {},
    es: ["Muertes sin diagnóstico", "En {ano} murieron {n} personas sin saber que tenían cáncer. Sin diagnóstico, ni siquiera entran en las estadísticas.", "Invierte en diagnóstico: test de VPH, mamógrafo y registro."],
    pt: ["Óbitos sem diagnóstico", "Em {ano} morreram {n} pessoas sem saber que tinham câncer. Sem diagnóstico, nem entram nas estatísticas.", "Invista em diagnóstico: teste de HPV, mamógrafo e registro."] },
  { id: "semprev", achar: () => (S.anoIdx >= 4 && nPrev() <= 3 ? "" : undefined),
    aplicar: () => { for (const d of DEPS) if (nivel(S.deps[d.id], "P") === 0) S.deps[d.id].carga *= 1.02; },
    es: ["Sin prevención, el cáncer avanza", "Casi no hubo campañas contra el tabaco, por la alimentación ni vacunación: los casos siguen subiendo.", "+2% de casos donde no hay prevención."],
    pt: ["Sem prevenção, o câncer avança", "Quase não houve campanhas contra o tabaco, pela alimentação nem vacinação: os casos continuam subindo.", "+2% de casos onde não há prevenção."] },
  { id: "prevok", achar: () => (nPrev() >= 12 ? "" : undefined),
    aplicar: () => { for (const d of DEPS) if (nivel(S.deps[d.id], "P") >= 1) S.deps[d.id].carga *= 0.98; ganharPrest(2); },
    es: ["La prevención da frutos", "Tus campañas llegan a escuelas, comedores y centros de salud: menos tabaco, mejor alimentación y más niñas vacunadas.", "−2% de casos donde hay prevención y +🎖️ 2."],
    pt: ["A prevenção dá frutos", "Suas campanhas chegam a escolas, refeitórios e postos de saúde: menos tabaco, melhor alimentação e mais meninas vacinadas.", "−2% de casos onde há prevenção e +🎖️ 2."] },
];

/* ---------- lições (fatos com fonte) ---------- */
const LICOES = {
  vacuna: { es: ["El VPH causa casi todos los cánceres de cuello uterino; en Paraguay, 58,9% de los casos son por los tipos 16 y 18.", "ICO/IARC HPV Information Centre, 2023"], pt: ["O HPV causa quase todos os cânceres do colo do útero; no Paraguai, 58,9% dos casos são pelos tipos 16 e 18.", "ICO/IARC HPV Information Centre, 2023"] },
  tabaco: { es: ["12,5% de los adultos fuman cigarrillo y 17% usan alguna forma de tabaco. El pulmón es la 1.ª causa de muerte por cáncer en los hombres.", "ENFR 2022; Atlas 2015–2019"], pt: ["12,5% dos adultos fumam cigarro e 17% usam alguma forma de tabaco. O pulmão é a 1ª causa de morte por câncer nos homens.", "ENFR 2022; Atlas 2015–2019"] },
  habitos: { es: ["Solo 3,9% comen 5 porciones de frutas y verduras por día. El colorrectal es el cáncer que más crece: cerca de 3% por año desde 1990.", "ENFR 2022; Leite et al., 2025"], pt: ["Só 3,9% comem 5 porções de frutas e verduras por dia. O colorretal é o câncer que mais cresce: cerca de 3% ao ano desde 1990.", "ENFR 2022; Leite et al., 2025"] },
  vph: { es: ["En 2024 el Ministerio de Salud hizo 72.133 tests de VPH y encontró 9.863 positivos (13,7%). Diagnosticar hace subir los casos visibles.", "MSPBS, 12/03/2025"], pt: ["Em 2024 o Ministério da Saúde fez 72.133 testes de HPV e encontrou 9.863 positivos (13,7%). Diagnosticar faz subir os casos visíveis.", "MSPBS, 12/03/2025"] },
  mamo: { es: ["La mama es la 1.ª causa de muerte por cáncer en las mujeres (1.945 muertes, 20,2%). 51,1% de las mujeres ya se hicieron una mamografía.", "Atlas 2015–2019; ENFR 2023"], pt: ["A mama é a 1ª causa de morte por câncer nas mulheres (1.945 mortes, 20,2%). 51,1% das mulheres já fizeram mamografia.", "Atlas 2015–2019; ENFR 2023"] },
  registro: { es: ["Tasa baja no es riesgo bajo: Canindeyú tiene la menor tasa estandarizada (41,3) y la mayor proporción de muertes femeninas por cuello uterino (36,8%).", "Atlas 2015–2019"], pt: ["Taxa baixa não é risco baixo: Canindeyú tem a menor taxa padronizada (41,3) e a maior proporção de mortes femininas por colo do útero (36,8%).", "Atlas 2015–2019"] },
  quimio: { es: ["Los Hospitales Día oncológicos llevan la quimioterapia al interior; el 10.º se inauguró en Concepción en 2024.", "MSPBS, 21/11/2024"], pt: ["Os Hospitais Día oncológicos levam a quimioterapia ao interior; o 10º foi inaugurado em Concepción em 2024.", "MSPBS, 21/11/2024"] },
  radio: { es: ["Radioterapia pública: un único lugar para todo el país, el INCAN, en Capiatá, con 3 aceleradores lineales.", "MSPBS, INCAN 2024"], pt: ["Radioterapia pública: um único lugar para o país inteiro, o INCAN, em Capiatá, com 3 aceleradores lineares.", "MSPBS, INCAN 2024"] },
  privado: { es: ["El IPS contrata servicios de radioterapia de prestadores privados por licitación pública, con contratos que se renuevan.", "DNCP, licitación de radioterapia del IPS"], pt: ["O IPS contrata serviços de radioterapia de prestadores privados por licitação pública, com contratos que se renovam.", "DNCP, licitação de radioterapia do IPS"] },
  paliativos: { es: ["En Paraguay, los cuidados paliativos en la comunidad «generalmente no están disponibles».", "OMS, Cancer Country Profile Paraguay 2020"], pt: ["No Paraguai, os cuidados paliativos na comunidade «geralmente não estão disponíveis».", "OMS, Cancer Country Profile Paraguay 2020"] },
  pesquisa: { es: ["El único registro de cáncer de base poblacional se creó en 2020 para Asunción y Central; los datos preliminares de 2019 salieron recién en 2024.", "DGVS/MSPBS, 05/02/2024"], pt: ["O único registro de câncer de base populacional foi criado em 2020 para Asunción e Central; os dados preliminares de 2019 só saíram em 2024.", "DGVS/MSPBS, 05/02/2024"] },
  fila: { es: ["Diagnosticar sin tratar crea filas: en Ciudad del Este, de cada 10 pacientes diagnosticados, 6 necesitarán radioterapia y deben viajar.", "La Nación, 23/07/2024"], pt: ["Diagnosticar sem tratar cria filas: em Ciudad del Este, de cada 10 pacientes diagnosticados, 6 vão precisar de radioterapia e precisam viajar.", "La Nación, 23/07/2024"] },
  colo: { es: ["En 8 de los 18 departamentos, el cuello uterino es la 1.ª causa de muerte por cáncer en las mujeres: un cáncer evitable.", "Atlas 2015–2019"], pt: ["Em 8 dos 18 departamentos, o colo do útero é a 1ª causa de morte por câncer nas mulheres: um câncer evitável.", "Atlas 2015–2019"] },
  jovens: { es: ["La mortalidad por cuello uterino en mujeres de 20 a 44 años sube 3,7% por año (1997–2017).", "Torres-Roman et al., BMC Public Health 2022"], pt: ["A mortalidade por colo do útero em mulheres de 20 a 44 anos sobe 3,7% ao ano (1997–2017).", "Torres-Roman et al., BMC Public Health 2022"] },
  mapa: { es: ["El mapa del cáncer también es un mapa del acceso al diagnóstico: Asunción tiene tasa estandarizada de 103,9 y Canindeyú de 41,3 por 100 mil (2015–2019).", "Atlas 2015–2019"], pt: ["O mapa do câncer também é um mapa do acesso ao diagnóstico: Asunción tem taxa padronizada de 103,9 e Canindeyú de 41,3 por 100 mil (2015–2019).", "Atlas 2015–2019"] },
};
const LICOES_GERAIS = ["mapa", "colo", "registro", "jovens"];

/* Lista de fontes: [texto, documentos com link em links.js] */
const FONTES = [
  ["Silva GIS, Pandolfo GA, et al. Mortalidad por cáncer en Paraguay: análisis epidemiológico, disparidades geográficas y desafíos para el control. Revisión sistemática, 2026.", []],
  ["MSPBS/DVENT. Atlas de Mortalidad por Cáncer en Paraguay 2015–2019. Asunción; 2022.", ["atlas"]],
  ["IARC. GLOBOCAN 2022: Paraguay, fact sheet.", ["globocan_2022"]],
  ["INE. Censo Nacional de Población y Viviendas 2022.", ["ine_censo"]],
  ["MSPBS. Segunda Encuesta Nacional de Factores de Riesgo (ENFR).", ["enfr"]],
  ["Sequera G. An Fac Cienc Méd (Asunción). 2025;58(3): tamizaje según la ENFR 2023.", ["sequera_2025"]],
  ["ICO/IARC HPV Information Centre. Paraguay: HPV and related cancers, fact sheet 2023.", ["ico_2023"]],
  ["Leite LF, et al. Cancer Res Commun. 2025;5(12):2236–2248.", ["leite_2025"]],
  ["Torres-Roman JS, et al. BMC Public Health. 2022;22:113.", ["torres_2022"]],
  ["Paraguay. Ley N° 6266/2018.", ["ley_6266"]],
  ["Paraguay. Decreto N° 2064/2019.", ["decreto_2064"]],
  ["OMS. Cancer Country Profile Paraguay, 2020.", ["oms_perfil_2020"]],
  ["Pediatría (Asunción). 2024;51(2):72-80.", ["pediatria_2024"]],
  ["OMS. Estrategia mundial para acelerar la eliminación del cáncer del cuello uterino (WHA73.2), 2020.", ["oms_colo_2020"]],
  ["OMS/UNICEF. Declaración de Alma-Ata, 1978.", ["alma_ata"]],
  ["OPS. Redes Integradas e Integrales de Servicios de Salud (RIISS) en Paraguay, 14/07/2026.", ["ops_riiss_2026"]],
  ["OPS/OMS. Prueba de VPH para 100 mil mujeres de Alto Paraná, 12/02/2024.", ["ops_vph_2024"]],
  ["OIEA y OPS/OMS. Misión imPACT en Paraguay, 2026.", ["oiea_2026", "ops_impact_2026"]],
  ["City Cancer Challenge. Locally-led strategies to develop and implement cancer care policy, 2022.", ["ccan_2022"]],
  ["MSPBS: dosis única de la vacuna VPH (2024); registro único (2024); Hospital Día de Concepción (21/11/2024); acelerador del INCAN (2024); test de VPH (12/03/2025).", ["mspbs_dosis_unica", "mspbs_registro_unico", "mspbs_concepcion", "mspbs_incan_acelerador", "mspbs_vph_2025"]],
  ["DGVS/MSPBS, 05/02/2024.", ["dgvs_2024"]],
  ["ABC Color, 10/05/2024.", ["abc_encarnacion"]],
  ["ABC Color, 13/02/2022: el impuesto selectivo al tabaco sigue siendo el más bajo de la región.", ["abc_tabaco_2022"]],
  ["ABC Color, 03/05/2023: Diputados aprueban ampliación presupuestaria para el INCAN.", ["abc_incan_2023"]],
  ["La Nación, 13/04/2023: préstamo del BID de hasta US$ 45 millones para la red de salud de 4 departamentos.", ["lanacion_bid_2023"]],
  ["Ley N° 2969/2006: aprueba el Convenio Marco de la OMS para el Control del Tabaco.", ["ley_2969"]],
  ["La Nación, 25/04/2023; 23/07/2024; 09/03/2026.", ["lanacion_2023", "lanacion_2024", "lanacion_2026"]],
  ["DNCP. Subasta LPN 83-18: servicios de tratamientos radiantes para el IPS, 06/12/2018.", ["dncp_ips"]],
  ["Mapa: geoBoundaries (CC BY 4.0).", ["geoboundaries"]],
];
/* Texto da fonte (como aparece no jogo) → documentos com link */
const FONTE_CHAVES = {
  "ABC Color, 10/05/2024": ["abc_encarnacion"], "OIEA, 2026": ["oiea_2026", "ops_impact_2026"], "AIEA, 2026": ["oiea_2026", "ops_impact_2026"],
  "City Cancer Challenge, 2022": ["ccan_2022"], "Ley N° 6266/2018": ["ley_6266"], "Decreto N° 2064": ["decreto_2064"],
  "Pediatría (Asunción) 2024;51(2):72-80": ["pediatria_2024"], "ICO/IARC HPV Information Centre, 2023": ["ico_2023"],
  "Atlas 2015–2019": ["atlas"], "La Nación, 25/04/2023": ["lanacion_2023"], "La Nación, 23/07/2024": ["lanacion_2024"], "La Nación, 09/03/2026": ["lanacion_2026"],
  "MSPBS, 2024": ["mspbs_dosis_unica", "mspbs_registro_unico", "mspbs_concepcion"], "MSPBS, INCAN 2024": ["mspbs_incan_acelerador"],
  "MSPBS, 21/11/2024": ["mspbs_concepcion"], "MSPBS, 12/03/2025": ["mspbs_vph_2025"], "ENFR 2022": ["enfr"], "ENFR 2023": ["sequera_2025"],
  "Leite et al., 2025": ["leite_2025"], "Torres-Roman et al., BMC Public Health 2022": ["torres_2022"],
  "DNCP, licitación de radioterapia del IPS": ["dncp_ips"], "DNCP, licitação de radioterapia do IPS": ["dncp_ips"],
  "OMS, Cancer Country Profile Paraguay 2020": ["oms_perfil_2020"], "DGVS/MSPBS, 05/02/2024": ["dgvs_2024"],
  "ABC Color, 13/02/2022": ["abc_tabaco_2022"], "ABC Color, 03/05/2023": ["abc_incan_2023"], "La Nación, 13/04/2023": ["lanacion_bid_2023"],
  "Ley N° 2969/2006": ["ley_2969"], "Censo 2022 (INE)": ["ine_censo"], "Res. S.G. N° 752 (MSPBS, 2024)": ["mspbs_registro_unico"],
  "OPS/OMS, 12/02/2024": ["ops_vph_2024"], "OPAS/OMS, 12/02/2024": ["ops_vph_2024"], "IARC, GLOBOCAN 2022": ["globocan_2022"],
  "WHA73.2, 2020": ["oms_colo_2020"], "Alma-Ata, OMS/UNICEF, 1978": ["alma_ata"], "OPS, 14/07/2026": ["ops_riiss_2026"], "OPAS, 14/07/2026": ["ops_riiss_2026"],
};
const CHAVES_FONTE = Object.keys(FONTE_CHAVES).sort((a, b) => b.length - a.length);
// ↗ abre o recorte do jogo (sem anúncios, com o link do site real); sem recorte, a cópia do Internet Archive; senão, a original
const urlFonte = (k) => (typeof LINKS_FONTES !== "undefined" && LINKS_FONTES[k] ? LINKS_FONTES[k].recorte || LINKS_FONTES[k].arquivo || LINKS_FONTES[k].url : null);
const linkFonte = (k, n = "") => { const u = urlFonte(k); return u ? ` <a class="lk" href="${esc(u)}" target="_blank" rel="noopener" title="${esc(LINKS_FONTES[k].url)}">${n}↗</a>` : ""; };
/* Cada trecho da fonte ganha o link do seu documento, ao lado */
function fonteHTML(texto) {
  return String(texto).split("; ").map((parte) => {
    const k = CHAVES_FONTE.find((c) => parte.includes(c)), ks = k ? FONTE_CHAVES[k] : [];
    return esc(parte) + ks.map((x, i) => linkFonte(x, ks.length > 1 ? i + 1 : "")).join("");
  }).join("; ");
}
const listaFontes = () => `<ol class="fontes">${FONTES.map(([txt, ks]) => `<li>${esc(txt)}${ks.map((k, i) => linkFonte(k, ks.length > 1 ? i + 1 : "")).join("")}</li>`).join("")}</ol><p class="fonte">${esc(t("linksNota"))}</p>`;


/* ---------- estado ---------- */
let lang = ler("epidemia-py-lang") === "pt" ? "pt" : "es";
const t = (k) => T[lang][k] ?? T.es[k];
let S = null;
const LIM = {};                                     // limites das classes das camadas ao vivo (fixos, do começo do jogo)

const novoInd = () => ({ casos: 0, mortes: 0, curas: 0, vidas: 0, evit: 0, semdx: 0 });

function novoEstado(pers = "bob") {
  const deps = {};
  for (const d of DEPS) {
    const vis0 = 0.55 + 0.45 * (d.tee - TEE_MIN) / (TEE_MAX - TEE_MIN);   // onde a taxa é baixa, falta diagnóstico
    deps[d.id] = {
      vis0, visEv: 0, carga: d.tee / vis0, carga0: d.tee / vis0, cargaBase: d.tee / vis0,   // cargaBase: sem nenhuma prevenção (comparação)
      mort0: d.obitos / 5 / vis0,   // óbitos por ano: os registrados no Atlas 2015-2019 divididos pela parte visível
      feitas: {}, pago: {}, prestPago: {}, conv: {}, ind: novoInd(), prev: 0, pc0: 0,
    };
  }
  // Situação inicial simplificada: tratamento concentrado no INCAN (Central) e no IPS (Asunción); o Estado já mantém essas estruturas
  for (const a of ["quimio", "radio", "paliativos"]) deps.central.feitas[a] = -1;
  deps.asuncion.feitas.quimio = -1;
  const fila = ["central", "colo", "pulmao", MISSOES_PESSOAIS[pers].id, "radio", "chaco", "pesquisa", "ocultos", "eq9", "prest", "pop75"];
  return {
    deps, pers, hab: [], habSel: null, cargoAvisado: 0, abrirArvore: false, fichaAtual: null,
    id: Math.random().toString(36).slice(2, 10) + Date.now().toString(36), enviado: null,
    anoIdx: 0, mes: 0, orc: 0, orcExtra: 0, pontos: 0, ptsAno: 0, prest: 5, prestInicio: 5,
    mod: {}, modProx: {}, cupons: [], regiao: null, descTrat: null, comp: [], usadas: [], aleatUsados: [], evAleat: null, demanda: null,
    sel: "central", modo: "cob", fase: "evento", pausa: false, gasto: { P: 0, D: 0, T: 0, X: 0 },
    tot: novoInd(), licoesVistas: [], log: [], compradasAno: [], fechadasAno: [], fim: false,
    mis: { fila, ativas: fila.slice(0, 3), feitas: [], prox: 3 }, quiz: { ordem: embaralhar(QUIZ.map((q, i) => i)), i: 0, racha: 0, acertos: 0, feitos: 0 },
    quizAno: -1, quizResp: null, quizOk: null, quizDepois: false, multAno: 1, cons: null, consUsadas: [], logrosPartida: [],
    recordeAntes: ler("epidemia-py-recorde") || 0, recordeBatido: false,
  };
}

/* Ponto de partida: chance de cura de hoje e prevalência de 5 anos em equilíbrio */
function prepararInicio() {
  for (const d of DEPS) {
    const st = S.deps[d.id];
    st.pc0 = chanceCura(d.id);
    const f = fluxos(d.id);
    st.prev = 5 * (f.casos - f.mortes * f.v);
  }
}

function darGratis(id, a) {
  const d = S.deps[id];
  if (d.feitas[a] === undefined) { d.feitas[a] = S.anoIdx; d.pago[a] = 0; delete d.conv[a]; }
}
function prometer(dep, a, anos) { S.comp.push({ dep, a, ate: Math.min(ANOS.length - 1, S.anoIdx + anos), estado: "aberto" }); }

const ano = () => ANOS[S.anoIdx];
const publico = (d, a) => d.feitas[a] !== undefined;
const temSlot = (d, a) => publico(d, a) || !!d.conv[a];
const nivel = (d, n) => SLOTS[n].reduce((s, a) => s + (temSlot(d, a) ? 1 : 0), 0);
const temPesq = (d) => temSlot(d, "pesquisa");
const equil = (id) => { const d = S.deps[id]; return Math.min(nivel(d, "P"), nivel(d, "D"), nivel(d, "T")); };
function desconto(a, id) {
  let x = S.regiao && S.regiao.dep === id ? S.regiao.valor : 0;
  for (const c of S.cupons) if (c.dep === id && c.a === a) x += c.valor;
  if (ACOES[a].nivel === "T" && S.descTrat && S.anoIdx < S.descTrat.ate) x += S.descTrat.valor;
  const tr = S.pol && S.pol.terreno;   // favor: terreno e pessoal do governo departamental
  if (tr && tr.dep === id && tr.ano === S.anoIdx) x += 2;
  return x;
}
const dec = (x) => Math.round(x * 10) / 10;
const custo = (a, id) => Math.max(0, dec(ACOES[a].custo * fator("custo", [a, "n" + ACOES[a].at, "todos"])) + (S.mod[a] || 0) - desconto(a, id));
const prestCusto = (a) => Math.max(0, ACOES[a].prest + soma("prest", a) + soma("prest", "n" + ACOES[a].at));
const manutAcao = (a) => dec(ACOES[a].manut * fator("manut", [a, "n" + ACOES[a].at, "todos"]));
const anuidadeConv = (a) => Math.max(0.5, dec(ACOES[a].conv * fator("conv", [a, "todos"])));
const desfazivel = (d, a) => d.feitas[a] === S.anoIdx && ((d.pago[a] || 0) + (d.prestPago[a] || 0)) > 0;
/* Só se desfaz o que foi pago neste ano (o que veio de graça, de uma demanda ou de renovação não) */
const pagoNoAno = (d, a) => (d.feitas[a] === S.anoIdx ? d.pago[a] || 0 : 0);
const convNoAno = (d, a) => (d.conv[a] && d.conv[a].ano === S.anoIdx ? d.conv[a].pago || 0 : 0);
const licaoDe = (a, conv) => (conv && a === "radio" ? "privado" : a);

function vis(id) {
  const d = S.deps[id];
  let v = d.vis0 + d.visEv + num("visTodos");
  for (const a of SLOTS.D) if (temSlot(d, a)) v += ACOES[a].vis + soma("vis", a);
  if (temPesq(d)) v += 0.10;
  for (const n of DEP[id].vizinhos) if (temPesq(S.deps[n])) v += 0.05 + num("visViz");
  return Math.max(0.2, Math.min(1, v));
}
const taxaReg = (id) => S.deps[id].carga * vis(id);
const temFila = (id) => { const d = S.deps[id]; return nivel(d, "D") >= 2 && nivel(d, "T") === 0; };
const ocultoConhecido = (id) => { const d = S.deps[id]; return nivel(d, "D") >= 1 || temPesq(d) || DEP[id].vizinhos.some((n) => temPesq(S.deps[n])); };

/* Chance de cura entre os diagnosticados: diagnóstico e tratamento juntos curam mais (é o que o equilíbrio mede) */
function chanceCura(id) {
  const d = S.deps[id], D = nivel(d, "D"), Tn = nivel(d, "T");
  let pc = 0.15 + 0.05 * D + 0.06 * Tn + 0.06 * Math.min(D, Tn) + num("cura") + ((S.pol && S.pol.cura) || 0);   // ensaio clínico: −1% enquanto dura
  if (temFila(id)) pc *= 0.5;
  return Math.min(0.75, pc);
}
/* Fluxos por ano no estado atual (modelo do jogo): casos diagnosticados, curas e óbitos */
function fluxos(id) {
  const st = S.deps[id], v = vis(id), pc = chanceCura(id);
  const inc = st.mort0 * RAZAO_INC * (st.carga / st.carga0);   // a prevenção freia a carga; o envelhecimento sobe
  const casos = inc * v;
  return { v, casos, curas: casos * pc, mortes: (inc / RAZAO_INC) * (1 - 0.8 * Math.max(0, pc - st.pc0) * v) };
}
function valorVivo(m, id) {
  const por = 100000 / DEP[id].pop;
  if (m === "prev") return S.deps[id].prev * por;
  const f = fluxos(id);
  return (m === "inc" ? f.casos : m === "mort" ? f.mortes : f.curas) * por;
}

function pontosDep(id) {
  const d = S.deps[id], P = nivel(d, "P"), D = nivel(d, "D"), Tn = nivel(d, "T");
  let p = (10 * Math.min(P, D, Tn) + P + D + Tn) * (DEP[id].pop / 100000);
  if (temPesq(d)) p *= 1.2;
  if (temFila(id)) p *= num("filaMeia") ? 0.75 : 0.5;
  if (Math.min(P, D, Tn) >= 1) p *= mul("ptsEq");
  return p;
}
const pontosAno = () => DEPS.reduce((s, d) => s + pontosDep(d.id), 0);

/* ---------- formatação ---------- */
const fmtInt = (n) => new Intl.NumberFormat(lang === "pt" ? "pt-BR" : "es-PY", { maximumFractionDigits: 0 }).format(n);
const fmt1 = (n) => new Intl.NumberFormat(lang === "pt" ? "pt-BR" : "es-PY", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(n);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const lista = (xs) => (xs.length > 1 ? `${xs.slice(0, -1).join(", ")}${t("e")}${xs[xs.length - 1]}` : xs[0] || "");
const redondo = (x) => { const p = 10 ** Math.max(0, Math.floor(Math.log10(Math.max(x, 1))) - 1); return Math.round(x / p) * p; };

/* Classes das camadas ao vivo: quartis dos 18 departamentos no começo do jogo, fixos para mostrar a mudança */
function calcularLimites() {
  const salvo = S;
  try {
    S = novoEstado();
    prepararInicio();
    for (const m of MODOS_VIVOS) {
      const v = DEPS.map((d) => valorVivo(m, d.id)).sort((a, b) => a - b);
      LIM[m] = [v[4], v[9], v[13]].map(redondo);
    }
  } finally { S = salvo; }
}

/* ---------- alvos de imprevistos e demandas ---------- */
function alvoSem(a, pref) {
  const sem = DEPS.filter((d) => !temSlot(S.deps[d.id], a));
  if (!sem.length) return undefined;
  const p = pref && sem.filter((d) => pref.includes(d.id));
  if (p && p.length) return sortear(p).id;
  const pesos = sem.map((d) => Math.sqrt(d.pop));   // mais chance onde mora mais gente, mas o interior também aparece
  let r = Math.random() * pesos.reduce((x, y) => x + y, 0);
  for (let i = 0; i < sem.length; i++) { r -= pesos[i]; if (r <= 0) return sem[i].id; }
  return sem[sem.length - 1].id;
}
function alvoMenorVis() {
  const sem = DEPS.filter((d) => !temPesq(S.deps[d.id])).sort((x, y) => vis(x.id) - vis(y.id)).slice(0, 4);
  return sem.length ? sortear(sem).id : undefined;
}
function escolherDemanda() {
  for (const dm of embaralhar(DEMANDAS.filter((x) => !S.usadas.includes(x.id)))) {
    const dep = dm.alvo();
    if (dep !== undefined) { S.usadas.push(dm.id); return { id: dm.id, dep }; }
  }
  return null;
}

/* ---------- ano: fato real (+ imprevisto) → demanda → 12 meses → resumo ---------- */
function iniciarAno() {
  S.mes = 0; S.ptsAno = 0; S.multAno = 1; S.quizOk = null; S.fechadasAno = [];
  S.mod = { ...S.modProx }; S.modProx = {}; S.cupons = []; S.regiao = null; S.compradasAno = []; S.prestInicio = S.prest;
  for (const id in S.deps) { S.deps[id].ind = novoInd(); S.deps[id].eqInicio = equil(id); }
  const receita = rendaAno();
  S.orc += receita;
  S.avisoOrc = { receita, manut: 0, congresso: 0 };
  if (S.anoIdx > 0 && S.prest >= 20) { S.orc += 3; S.avisoOrc.congresso = 3; }   // prestígio alto: o Congresso aprova mais verba
  const P = S.pol || {};
  if (P.proveedor !== undefined && S.anoIdx === P.proveedor + 1) { ganharPrest(-1); S.avisoOrc.proveedor = 5; }   // faltaram insumos
  if (P.ensayo && P.ensayo.res === null && S.anoIdx >= P.ensayo.ini + 3) {   // fim do ensaio: funciona ou não
    const ok = Math.random() < 0.55;
    P.ensayo.res = ok ? "ok" : "falhou"; P.cura = ok ? 0.03 : 0;
    if (!ok) ganharPrest(-3);
    S.avisoOrc.ensayo = P.ensayo.res;
  }
  const nPesq = DEPS.filter((d) => temPesq(S.deps[d.id])).length;
  if (S.anoIdx > 0 && nPesq && num("prestPesq")) ganharPrest(nPesq * num("prestPesq"));
  EVENTOS[ano()].aplicar();
  S.evAleat = null;
  const livres = EVENTOS_ALEAT.filter((e) => !S.aleatUsados.includes(e.id) && (!e.cond || e.cond()));
  if (S.anoIdx > 0 && livres.length && Math.random() < 0.65) {
    const e = sortearPeso(livres, (x) => fator("sorte", [x.id])), dep = e.alvo ? e.alvo() : null;
    if (dep !== undefined) { e.aplicar(dep); S.evAleat = { id: e.id, dep }; S.aleatUsados.push(e.id); }
  }
  if (S.anoIdx > 0) S.avisoOrc.manut = cobrarManutencao();   // janeiro: manutenção e convênios do ano
  S.cons = escolherConsequencia();   // o jogo reage ao que o jogador fez (ou não fez)
  S.demanda = escolherDemanda();
  S.fase = "evento";
  salvar();
  mostrarEvento();
}

function simularMes() {
  for (const d of DEPS) {
    const st = S.deps[d.id], f = fluxos(d.id);
    st.ind.casos += f.casos / 12; st.ind.mortes += f.mortes / 12; st.ind.curas += f.curas / 12;
    const base = st.mort0 * st.cargaBase / st.carga0;   // óbitos se nada tivesse sido feito
    st.ind.vidas += (base - f.mortes) / 12;
    st.ind.evit += st.mort0 * RAZAO_INC * (st.cargaBase - st.carga) / st.carga0 / 12;   // casos que a prevenção evitou
    st.ind.semdx += f.mortes * (1 - f.v) / 12;   // morreram sem saber que tinham câncer
    st.prev = Math.max(0, st.prev + (f.casos - f.mortes * f.v - st.prev / 5) / 12);   // entra quem é diagnosticado; sai quem morre ou passa de 5 anos
  }
  S.ptsAno += pontosAno() * S.multAno / 12;
}


function fecharAno() {
  if (!S || S.fase !== "jogando") return;
  if (S.quizAno !== S.anoIdx) { S.quizDepois = true; abrirQuiz(); return; }   // o desafio do ano vem antes do resumo
  while (S.mes < 12) { simularMes(); S.mes++; }   // ⏩ termina o ano com o que já está feito
  const pts = Math.min(3000, Math.round(S.ptsAno)) + (S.quizOk ? BONUS_QUIZ : 0);   // teto por ano do ranking + acerto do desafio
  S.pontos += pts;
  S.ptsAno = 0;
  const subiu = [], filas = [], comp = [], ind = novoInd();
  let novosEq = 0;
  for (const d of DEPS) {
    const st = S.deps[d.id];
    // "subiu" só pelo diagnóstico (mais casos visíveis), não pelo crescimento da carga
    if (vis(d.id) > (st.visAnterior ?? st.vis0) + 0.01) subiu.push(d.nome);
    if (temFila(d.id)) filas.push(d.nome);
    if (!st.eqInicio && equil(d.id) >= 1) novosEq++;
    st.visAnterior = vis(d.id);
    for (const k in ind) ind[k] += st.ind[k];
    st.carga *= 1 + 0.012 - 0.006 * nivel(st, "P") - (S.pol && S.pol.tabaco !== undefined ? 0.002 : 0);   // envelhecimento sobe a carga; prevenção e imposto sobre o tabaco freiam (ilustrativo)
    st.cargaBase *= 1.012;   // comparação: o mesmo envelhecimento, sem prevenção
  }
  for (const k in ind) { ind[k] = Math.round(ind[k]); S.tot[k] += ind[k]; }
  for (const c of S.comp) {
    if (c.estado !== "aberto") continue;
    if (temSlot(S.deps[c.dep], c.a)) { c.estado = "cumprido"; ganharPrest(4); comp.push({ ok: true, a: c.a, dep: c.dep }); }
    else if (S.anoIdx >= c.ate) { c.estado = "falhou"; ganharPrest(-6); comp.push({ ok: false, a: c.a, dep: c.dep }); }
  }
  ganharPrest(novosEq);
  ganharPrest(-Math.round(filas.length * (num("filaMeia") ? 0.5 : 1)));   // fila tira prestígio
  const n3 = DEPS.filter((d) => equil(d.id) >= 1).length;
  const licao = escolherLicao(filas.length > 0);
  S.log.push({ ano: ano(), pts, subiu, filas, n3, licao, ind, comp, prest0: S.prestInicio, prest1: S.prest, fechadas: [...S.fechadasAno],
    mis: S.mis.feitas.filter((f) => f.ano === ano()).map((f) => f.id), quiz: S.quizOk, est: estrelas(popEqPct()) });
  S.compradasAno = [];
  S.fase = "resumo";
  salvar();
  mostrarResumo(S.log[S.log.length - 1]);
}

function escolherLicao(houveFila) {
  const vistas = S.licoesVistas;
  const cand = [];
  if (houveFila) cand.push("fila");
  for (const a of S.compradasAno || []) cand.push(a);
  cand.push(...LICOES_GERAIS);
  const k = cand.find((c) => LICOES[c] && !vistas.includes(c)) || LICOES_GERAIS[S.anoIdx % LICOES_GERAIS.length];
  vistas.push(k);
  return k;
}

function proximoAno() {
  fecharModal();
  if (S.anoIdx >= ANOS.length - 1) { S.fim = true; S.fase = "fim"; salvar(); avisar("fim"); mostrarFim(); return; }
  S.anoIdx++;
  iniciarAno();
  render();
}


/* ---------- compras: investimento público (para sempre) ou convênio (anuidade) ---------- */
function comprar(id, a) {
  const d = S.deps[id];
  if (publico(d, a)) return desfazivel(d, a) ? desfazer(id, a) : toast(t("jaAtivo"));
  const b = bloqueio(id, a);
  if (b) return toast(b.txt);
  const c = custo(a, id), p = prestCusto(a);
  if (c > S.orc) return toast(t("semOrc"));
  if (p > S.prest) return toast(t("semPrest"));
  const eq0 = equil(id);
  S.orc -= c; S.prest -= p;
  S.gasto[ACOES[a].nivel] += c;
  const tinhaConv = !!d.conv[a];
  if (tinhaConv) { d.convSubst = d.convSubst || {}; d.convSubst[a] = d.conv[a]; delete d.conv[a]; }   // o público substitui o convênio
  d.feitas[a] = S.anoIdx; d.pago[a] = c; d.prestPago[a] = p;
  S.compradasAno.push(a);
  salvar();
  render();
  const [nome, alvo] = t("acoes")[a];
  toast(tinhaConv ? t("convTroca") : t("compra")(ACOES[a].ico, nome, alvo));
  destacar(id, a);
  if (equil(id) > eq0) festejarNivel(id, equil(id));
}

function contratar(id, a) {
  const d = S.deps[id];
  if (temSlot(d, a)) return toast(t("jaAtivo"));
  if (ano() < convLib()) return toast(t("bloqConvAno")(convLib()));
  const c = anuidadeConv(a);
  if (c > S.orc) return toast(t("semOrc"));
  const eq0 = equil(id);
  S.orc -= c;   // o 1º ano se paga agora; depois, cada janeiro
  S.gasto[ACOES[a].nivel] += c;
  d.conv[a] = { ano: S.anoIdx, pago: c };
  S.compradasAno.push(licaoDe(a, true));
  salvar();
  render();
  toast(t("compra")("🤝", t("convNomes")[a], t("custoAno")(fmtM(c))));
  destacar(id, "convenio");
  if (equil(id) > eq0) festejarNivel(id, equil(id));
}
function cancelarConv(id, a) {
  if (convNoAno(S.deps[id], a) > 0) return desfazerConv(id, a);   // contratado neste ano: devolve o pagamento
  delete S.deps[id].conv[a];
  tirarCompra(licaoDe(a, true));
  toast(t("convCancelado"));
  salvar();
  render();
}

function tirarCompra(a) { const i = S.compradasAno.lastIndexOf(a); if (i >= 0) S.compradasAno.splice(i, 1); }
function desfazer(id, a) {
  const d = S.deps[id], v = d.pago[a] || 0;
  S.orc += v; S.gasto[ACOES[a].nivel] -= v; S.prest += d.prestPago[a] || 0;
  delete d.feitas[a]; delete d.pago[a]; delete d.prestPago[a];
  if (d.convSubst && d.convSubst[a]) { d.conv[a] = d.convSubst[a]; delete d.convSubst[a]; }   // volta o convênio que o público tinha substituído
  tirarCompra(a);
  toast(t("desfeito")(v));
  salvar();
  render();
}
function desfazerConv(id, a) {
  const d = S.deps[id], v = convNoAno(d, a);
  S.orc += v; S.gasto[ACOES[a].nivel] -= v;
  delete d.conv[a];
  tirarCompra(licaoDe(a, true));
  toast(t("desfeito")(v));
  salvar();
  render();
}

/* ---------- mapa ---------- */
const CENTRO = {};   // centro e tamanho de cada departamento no desenho (para a luz e a névoa)
function montarMapa() {
  $("#mapa-wrap").innerHTML = `<svg id="mapa" viewBox="${MAPA.viewBox}" role="group" aria-label="Paraguay"><defs>`
    + `<radialGradient id="m-luz"><stop offset="0" stop-color="#FFD27A" stop-opacity=".8"/><stop offset=".35" stop-color="#F6B04C" stop-opacity=".38"/><stop offset="1" stop-color="#F0A43A" stop-opacity="0"/></radialGradient>`
    + `<radialGradient id="m-nevoa"><stop offset="0" stop-color="#AEBDCD" stop-opacity=".5"/><stop offset=".6" stop-color="#9FB0C2" stop-opacity=".24"/><stop offset="1" stop-color="#9FB0C2" stop-opacity="0"/></radialGradient></defs>`
    + `<g id="g-deps">${MAPA.deps}</g><g id="g-nevoa"></g><g id="g-luz"></g><g id="g-alvo"></g><g id="g-lbl">${MAPA.lbl}</g><g id="g-alerta" class="alerta"></g><g id="g-fx"></g></svg>`;
  const mk = document.querySelector("#mapa .dep-marker");
  if (mk) mk.setAttribute("r", "36");
  document.querySelectorAll("#mapa .dep").forEach((el) => {
    el.setAttribute("tabindex", "0");
    el.setAttribute("role", "button");
    el.setAttribute("aria-label", DEP[el.dataset.dep].nome);
  });
  // tirado do próprio traçado (o mapa ainda está escondido, então sem getBBox); fica a maior parte de cada departamento
  document.querySelectorAll("#mapa path.dep").forEach((p) => {
    const n = (p.getAttribute("d").match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (let i = 0; i + 1 < n.length; i += 2) { x0 = Math.min(x0, n[i]); x1 = Math.max(x1, n[i]); y0 = Math.min(y0, n[i + 1]); y1 = Math.max(y1, n[i + 1]); }
    const id = p.dataset.dep, c = CENTRO[id];
    if (!c || (x1 - x0) * (y1 - y0) > c.w * c.h) CENTRO[id] = { x: (x0 + x1) / 2, y: (y0 + y1) / 2, w: x1 - x0, h: y1 - y0 };
  });
  if (mk) CENTRO[mk.dataset.dep] = { x: +mk.getAttribute("cx"), y: +mk.getAttribute("cy"), w: 90, h: 90 };
}

/* Renda ñandutí acesa: o INCAN, em Capiatá (única radioterapia pública), é a grande luz do país */
let incanSVG = "";
function nanduti(cx, cy, r, raios = 16, aneis = 3) {
  const f = (x) => Math.round(x * 10) / 10;
  let g = '<g fill="none" stroke="#FFE2A0" stroke-linecap="round" opacity=".9">';
  for (let i = 0; i < raios; i++) {
    const a = 2 * Math.PI * i / raios;
    g += `<line x1="${f(cx + 0.18 * r * Math.cos(a))}" y1="${f(cy + 0.18 * r * Math.sin(a))}" x2="${f(cx + r * Math.cos(a))}" y2="${f(cy + r * Math.sin(a))}" stroke-width="2.4"/>`;
  }
  for (let k = 1; k <= aneis; k++) {
    const rr = r * (0.18 + 0.82 * k / aneis);
    g += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(rr)}" stroke-width="3" stroke-dasharray="${f(rr * 0.05)} ${f(rr * 0.07)}"/>`;
  }
  for (let i = 0; i < raios; i++) {
    const a = 2 * Math.PI * (i + 0.5) / raios, rr = r * 0.6;
    g += `<circle cx="${f(cx + rr * Math.cos(a))}" cy="${f(cy + rr * Math.sin(a))}" r="${f(r * 0.075)}" stroke-width="2.4"/>`;
  }
  return `${g}</g><circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r * 0.14)}" fill="#FFF0C8"/>`;
}
/* Luz: cada departamento brilha conforme o equilíbrio (0 a 3) */
function luzesHTML() {
  const h = DEPS.map((d) => {
    const e = equil(d.id), c = CENTRO[d.id];
    if (!e || !c) return "";
    return `<circle cx="${Math.round(c.x)}" cy="${Math.round(c.y)}" r="${[0, 120, 180, 260][e]}" fill="url(#m-luz)" opacity="${[0, 0.5, 0.75, 1][e]}"/>`;
  }).join("");
  if (!incanSVG && CENTRO.central) incanSVG = nanduti(CENTRO.central.x + 40, CENTRO.central.y - 30, 110);
  return h + incanSVG;
}
/* Névoa: sem diagnóstico nem pesquisa ninguém sabe o tamanho do subregistro (névoa cheia); com diagnóstico, ela mostra os casos ocultos */
function nevoaHTML() {
  return DEPS.map((d) => {
    const c = CENTRO[d.id];
    if (!c) return "";
    const op = ocultoConhecido(d.id) ? Math.min(1, (1 - vis(d.id)) / 0.4) : 0.85;
    if (op < 0.06) return "";
    return `<ellipse cx="${Math.round(c.x)}" cy="${Math.round(c.y)}" rx="${Math.round(Math.max(120, c.w * 0.5))}" ry="${Math.round(Math.max(100, c.h * 0.46))}" fill="url(#m-nevoa)" opacity="${op.toFixed(2)}"/>`;
  }).join("");
}

const classeReg = (x) => (x < 60 ? 1 : x < 80 ? 2 : x < 100 ? 3 : 4);
const posLbl = (id) => { const l = document.querySelector(`#mapa .lbl[data-dep="${id}"]`); return [+l.getAttribute("x"), +l.getAttribute("y")]; };

function corDep(id) {
  if (S.modo === "cob") return `var(--cob${equil(id)})`;
  if (S.modo === "reg") return `var(--reg${classeReg(taxaReg(id))})`;
  const L = LIM[S.modo], x = valorVivo(S.modo, id);
  return `var(--${S.modo === "cura" ? "cur" : "reg"}${x < L[0] ? 1 : x < L[1] ? 2 : x < L[2] ? 3 : 4})`;
}

function legendaHTML() {
  const caixa = (cor, txt) => `<span><i style="background:var(${cor})"></i>${txt}</span>`;
  if (S.modo === "cob") return `<span class="leg-tit">${esc(t("legCob"))}</span>${[0, 1, 2, 3].map((n) => caixa(`--cob${n}`, n)).join("")}<span class="leg-nevoa"><i></i>${esc(t("legNevoa"))}</span>`;
  if (S.modo === "reg") return `<span class="leg-tit">${esc(t("legReg"))}</span>${["<60", "60–80", "80–100", "≥100"].map((r, i) => caixa(`--reg${i + 1}`, r)).join("")}`;
  const L = LIM[S.modo].map(fmtInt), cor = S.modo === "cura" ? "--cur" : "--reg";
  return `<span class="leg-tit">${esc(t("legVivo")[S.modo])}</span>${[`<${L[0]}`, `${L[0]}–${L[1]}`, `${L[1]}–${L[2]}`, `≥${L[2]}`].map((r, i) => caixa(`${cor}${i + 1}`, r)).join("")}`;
}

function pintarMapa() {
  document.querySelectorAll("#mapa .dep").forEach((el) => {
    const id = el.dataset.dep;
    el.style.fill = corDep(id);
    el.classList.toggle("sel", id === S.sel);
  });
  const sel = document.querySelector(`#mapa path.dep[data-dep="${S.sel}"]`);
  if (sel && sel !== sel.parentNode.lastElementChild) sel.parentNode.appendChild(sel);
  document.querySelectorAll("#mapa .lbl").forEach((el) => el.classList.toggle("sel", el.dataset.dep === S.sel));
  const modoLuz = S.modo === "cob";   // a camada de luz também mostra a névoa dos casos ocultos
  $("#g-luz").innerHTML = modoLuz ? luzesHTML() : "";
  $("#g-nevoa").innerHTML = modoLuz ? nevoaHTML() : "";
  // contorno dourado: os departamentos da missão seguida
  $("#g-alvo").innerHTML = alvosMissao().map((id) => {
    const p = document.querySelector(`#mapa path.dep[data-dep="${id}"]`), mk = document.querySelector(`#mapa .dep-marker[data-dep="${id}"]`);
    return p ? `<path class="alvo-dep" d="${p.getAttribute("d")}"/>` : mk ? `<circle class="alvo-dep" cx="${mk.getAttribute("cx")}" cy="${mk.getAttribute("cy")}" r="52"/>` : "";
  }).join("");
  // losango "!" onde há fila; bandeira onde há promessa em aberto
  $("#g-alerta").innerHTML = DEPS.filter((d) => temFila(d.id)).map((d) => {
    const [x, y0] = posLbl(d.id), y = y0 - 70;
    return `<path class="losango" d="M${x},${y - 34} l34,34 -34,34 -34,-34z"/><text x="${x}" y="${y + 16}">!</text>`;
  }).join("") + S.comp.filter((c) => c.estado === "aberto").map((c) => {
    const [x, y] = posLbl(c.dep);
    return `<path class="pino" d="M${x + 70},${y - 10} v-74 h46 l-12,16 12,16 h-46"/>`;
  }).join("");
  $("#legenda").innerHTML = legendaHTML();
  $("#legenda").classList.toggle("q4", S.modo === "cob");   // 0 1 2 3 cabem numa linha só
  document.querySelectorAll("[data-modo]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.modo === S.modo)));
}

/* Cada ação faz o departamento piscar no mapa, com o ícone de traço subindo (nome do ícone; outro texto sobe como texto) */
function destacar(id, nome) {
  if (!id || !$("#mapa")) return;
  const els = document.querySelectorAll(`#mapa .dep[data-dep="${id}"]`);
  els.forEach((el) => el.classList.remove("pulso"));
  void $("#mapa").getBoundingClientRect();
  els.forEach((el) => el.classList.add("pulso"));
  if (!nome) return;
  const [x, y] = posLbl(id), NS = "http://www.w3.org/2000/svg";
  let el;
  if (ICONES[nome]) {
    el = document.createElementNS(NS, "g");
    el.setAttribute("class", "fx-ico");
    const p = document.createElementNS(NS, "path");
    p.setAttribute("d", ICONES[nome]);
    p.setAttribute("transform", `translate(${x - 48} ${y - 150}) scale(4)`);
    el.appendChild(p);
  } else {
    el = document.createElementNS(NS, "text");
    el.setAttribute("x", x);
    el.setAttribute("y", y - 40);
    el.textContent = nome;
  }
  $("#g-fx").appendChild(el);
  setTimeout(() => el.remove(), 1600);
}

/* ---------- painel do departamento ---------- */
function slotHTML(id, a) {
  const d = S.deps[id];
  const [nome, alvo] = t("acoes")[a];
  const pub = publico(d, a), cv = !!d.conv[a], b = !pub && !cv ? bloqueio(id, a) : null;
  const c = custo(a, id), p = prestCusto(a), at = ACOES[a].at, nv = ACOES[a].nivel;
  const preco = pub ? t("ativo") : cv ? t("convFeito") : b ? b.curto : `💰${fmtM(c)}${p ? ` 🎖️${p}` : ""}`;
  const precoHTML = pub || cv || b ? esc(preco) : `${ico("moeda")}${fmtM(c)}${p ? ` ${ico("medalha")}${p}` : ""}`;
  const falta = !pub && !cv && !b && (c > S.orc || p > S.prest);
  return `<div class="slot" style="--nv: ${nv === "X" ? "var(--ouro)" : `var(--nv-${nv.toLowerCase()})`}"><button type="button" class="acao${pub || cv ? " feita" : ""}${cv ? " conv-on" : ""}${desfazivel(d, a) ? " desfaz" : ""}${b ? " bloq" : ""}${falta ? " falta" : ""}" data-acao="${a}"
    aria-pressed="${pub || cv}" aria-label="${esc(`${nome} (${alvo}) · ${t("niveisAt")[at]}: ${preco}`)}">
    <span class="ico" aria-hidden="true">${ico(a)}</span><span class="nome">${esc(t("curtas")[a])}</span><span class="custo">${precoHTML}</span><span class="nat n${at}" aria-hidden="true">${t("nivAtCurto")[at]}</span></button></div>`;
}

/* Linha do departamento que acompanha a camada do mapa: taxa do Atlas ou o número ao vivo da camada escolhida */
function linhaDep() {
  const id = S.sel, st = S.deps[id];
  if (!MODOS_VIVOS.includes(S.modo)) return t("infoTaxa")(fmt1(DEP[id].tee), fmt1(taxaReg(id)));
  const f = fluxos(id), n = S.modo === "inc" ? f.casos : S.modo === "prev" ? st.prev : S.modo === "mort" ? f.mortes : f.curas;
  return t("infoVivo")[S.modo](fmtInt(n), fmtInt(valorVivo(S.modo, id)), fmtInt(f.mortes * (1 - f.v)));
}

function renderPainel() {
  const id = S.sel, dd = DEP[id], d = S.deps[id];
  const oculto = ocultoConhecido(id) ? `~${fmtInt((1 - vis(id)) * 100)}%` : t("ocultoQ");
  const eq = equil(id);
  const baixos = ["P", "D", "T"].filter((n) => nivel(d, n) === eq);
  const faltam = baixos.length === 3 ? t("os3") : lista(baixos.map((n) => t("nomesNivel")[n]));
  const comp = S.comp.find((c) => c.dep === id && c.estado === "aberto");
  const linhaNivel = (n) => {
    const v = nivel(d, n);
    return `<div class="nivel" data-n="${n}"><h3>${esc(t("niveis")[n])} <span class="barras" aria-label="${v}/3">${[0, 1, 2].map((i) => `<i class="${i < v ? "on" : ""}"></i>`).join("")}</span></h3><div class="acoes">${SLOTS[n].map((a) => slotHTML(id, a)).join("")}</div></div>`;
  };
  const opcoes = [...DEPS].sort((a, b) => a.nome.localeCompare(b.nome)).map((x) => `<option value="${x.id}" ${x.id === id ? "selected" : ""}>${esc(x.nome)}</option>`).join("");
  $("#painel-info").innerHTML = `
    <select class="dep-tit" id="dep-tit" aria-label="${esc(t("escolher"))}">${opcoes}</select>
    <p class="info"><span>${esc(t("infoPop")(fmtInt(dd.pop)))}</span>
      <span class="eq">${t("infoEq")(eq)} · ${esc(eq >= 3 ? t("eqCompleto") : t("eqFalta")(faltam))}</span>
      <span id="dep-linha">${linhaDep()}</span>
      <span>${t("infoOculto")(esc(oculto))}</span>
      ${comp ? `<span>${esc(t("infoComp")(t("curtas")[comp.a], ANOS[comp.ate]))}</span>` : ""}
      ${dd.poucos ? `<span>${esc(t("poucos"))}</span>` : ""}</p>
    ${temFila(id) ? `<p class="fila">${esc(t("filaCurta"))}</p>` : ""}`;
  $("#painel").innerHTML = `${linhaNivel("P")}${linhaNivel("D")}${linhaNivel("T")}
    <div class="nivel extra" data-n="X"><h3>${esc(t("niveis").X)}</h3><div class="acoes">${slotHTML(id, "pesquisa")}</div></div>`;
}

/* ---------- topo, números ao vivo, barra e telas ---------- */
function renderHud() {
  const jogando = S && !S.fim && !$("#tela-jogo").hidden, aj = $("#btn-ajuda");
  $("#h-sub").textContent = t("sub");
  $("#btn-idioma").textContent = lang === "es" ? "PT" : "ES";
  if (jogando) {
    if (aj.dataset.retrato !== S.pers) { aj.innerHTML = `<img src="arte/${S.pers}.svg" alt="">`; aj.dataset.retrato = S.pers; }   // não usar data-pers: é o atributo dos cartões de escolha
    aj.classList.add("retrato"); aj.style.setProperty("--cor", PERSONAGENS[S.pers].cor);
    aj.setAttribute("aria-label", t("arvTit")); aj.classList.toggle("alerta-asc", pendentes() > 0);
  } else { aj.textContent = "?"; delete aj.dataset.retrato; aj.classList.remove("retrato", "alerta-asc"); aj.setAttribute("aria-label", t("ajuda")); }
  for (const k of ["#h-ano", "#h-dinheiro", "#h-prest", "#h-pontos"]) $(k).hidden = !jogando;
  document.querySelector(".hud .marca").hidden = jogando;
}

function montarVivo() {
  const v = t("vivo"), tit = t("vivoTit");
  $("#vivo").innerHTML = MODOS_VIVOS.map((m) => `<button type="button" data-modo="${m}" class="v-${m}" aria-pressed="${S.modo === m}" title="${esc(tit[m])}"><span>${esc(v[m])}</span><b></b></button>`).join("");
  $("#vivo").setAttribute("aria-label", t("vivoAria"));
}

const SR_PLACAR = { es: ["Año", "Dinero", "Prestigio", "Puntos"], pt: ["Ano", "Dinheiro", "Prestígio", "Pontos"] };
/* Atualizado a cada mês: placar, contadores do país, números do departamento e barra de baixo */
function renderVivo() {
  if (!S || S.fim) return;
  const sr = SR_PLACAR[lang];   // o ícone é só desenho: o nome vai escondido para o leitor de tela
  $("#h-ano").innerHTML = `${ico("ano")}<span class="sr">${sr[0]} </span><b>${ano()}</b>`;
  $("#h-ano").title = t("anoDe")(ano(), S.anoIdx + 1);
  $("#h-dinheiro").innerHTML = `${ico("moeda")}<span class="sr">${sr[1]} </span><b>${fmtM(S.orc)}</b><span class="mais" aria-hidden="true">+</span>`;
  $("#h-prest").innerHTML = `${ico("medalha")}<span class="sr">${sr[2]} </span><b>${S.prest}</b><span class="mais" aria-hidden="true">›</span>`;
  $("#h-dinheiro").title = t("finTit"); $("#h-prest").title = t("prestTit");
  $("#btn-ajuda").classList.toggle("alerta-asc", pendentes() > 0);
  $("#h-pontos").innerHTML = `${ico("estrela")}<span class="sr">${sr[3]} </span><b>${fmtInt(S.pontos + S.ptsAno)}</b>`;
  const tot = { inc: 0, prev: 0, mort: 0, cura: 0 };   // por ano, com o que funciona agora: muda na hora a cada decisão
  for (const d of DEPS) { const f = fluxos(d.id); tot.inc += f.casos; tot.prev += S.deps[d.id].prev; tot.mort += f.mortes; tot.cura += f.curas; }
  for (const m of MODOS_VIVOS) { const b = document.querySelector(`#vivo [data-modo="${m}"] b`); if (b) b.textContent = fmtInt(tot[m]); }
  if (MODOS_VIVOS.includes(S.modo)) { pintarMapa(); const el = $("#dep-linha"); if (el) el.innerHTML = linhaDep(); }
  renderRodape();
  $("#btn-fechar").textContent = t("terminar")(ano());
}

function render() {
  if (!S || S.fim) return renderHud();
  S.orc = dec(S.orc);   // dinheiro em múltiplos de 0,1, igual ao que aparece na tela
  verificar();
  $("#tela-inicio").hidden = true; $("#tela-fim").hidden = true; $("#tela-jogo").hidden = false; $("#barra").hidden = false;
  document.querySelectorAll("#modos button").forEach((b) => { b.textContent = b.dataset.modo === "cob" ? t("modoCob") : t("modoReg"); });
  montarVivo();
  pintarMapa();
  renderPainel();
  renderHud();
  renderVivo();
  talvezAbrirArvore();
}

/* Retrato em silhueta do personagem (arte/<id>.svg), recortado em círculo */
const avatarHTML = (k) => `<span class="avatar" style="--cor:${PERSONAGENS[k].cor}" aria-hidden="true"><img src="arte/${k}.svg" alt=""></span>`;

function telaInicio() {
  $("#tela-jogo").hidden = true; $("#tela-fim").hidden = true; $("#barra").hidden = true; $("#tela-inicio").hidden = false;
  const salvo = ler(CHAVE);
  const temSalvo = salvo && !salvo.fim && salvo.deps;
  const ultimoFim = salvo && salvo.fim && salvo.jogador && !salvo.enviado && CFG.rankingUrl && !rankingEncerrado();
  $("#tela-inicio").innerHTML = `
    <img class="capa" src="arte/capa.svg" alt="${esc(t("capaAlt"))}">
    <h1>${esc(t("h1"))}</h1>
    <p class="sub">${esc(t("intro"))}</p>
    <details class="cartao regras"><summary>${esc(t("ajuda"))}</summary><ol class="passos">${t("passos").map((p) => `<li>${p}</li>`).join("")}</ol></details>
    <div class="pers-teaser">${Object.keys(PERSONAGENS).map(avatarHTML).join("")}<span>${esc(t("persTeaser"))}</span></div>
    <div class="btns">${temSalvo ? `<button class="btn" id="btn-continuar" type="button">${esc(t("continuar"))}</button><button class="btn sec" id="btn-nova" type="button">${esc(t("nova"))}</button>`
      : `<button class="btn" id="btn-nova" type="button">${esc(t("comecar"))}</button>`}${ultimoFim ? `<button class="btn sec" id="btn-ultimo" type="button">${esc(t("ultimo"))}</button>` : ""}<button class="btn sec" id="btn-compartir-inicio" type="button">${esc(t("compartir"))}</button></div>
    ${inicioExtra()}
    <p class="aviso">${esc(t("aviso"))}</p>
    ${creditosHTML(false)}`;
  renderHud();
}

const rolador = () => { const el = $("#tela"); return el && getComputedStyle(el).overflowY === "auto" ? el : null; };
function rolarTopo() { window.scrollTo(0, 0); if (rolador()) rolador().scrollTop = 0; }

function mostrarFim() {
  $("#tela-jogo").hidden = true; $("#barra").hidden = true; $("#tela-inicio").hidden = true; $("#tela-fim").hidden = false;
  if (S.recordeAnterior === undefined) {
    S.recordeAnterior = ler("epidemia-py-recorde") || 0;
    if (S.pontos > S.recordeAnterior) guardar("epidemia-py-recorde", S.pontos);
    salvar();
  }
  const recAnt = S.recordeAnterior;
  const novo = S.pontos > recAnt;
  const popTot = DEPS.reduce((s, d) => s + d.pop, 0);
  const eq = DEPS.filter((d) => equil(d.id) >= 1);
  const faltava = DEPS.reduce((s, d) => s + (1 - S.deps[d.id].vis0) * d.pop, 0);
  const achado = DEPS.reduce((s, d) => s + (vis(d.id) - S.deps[d.id].vis0) * d.pop, 0);
  const x = {
    equil3: eq.length, popEq: fmtInt(100 * eq.reduce((s, d) => s + d.pop, 0) / popTot),
    revelados: fmtInt(Math.max(0, Math.min(100, 100 * achado / faltava))),
    gP: S.gasto.P, gD: S.gasto.D, gT: S.gasto.T, gX: S.gasto.X,
  };
  const linhas = [...t("resLinhas")(x), t("resMis")(S.mis.feitas.length, S.mis.fila.length), t("resQuiz")(S.quiz.acertos, S.quiz.feitos), t("resPrest")(S.prest), t("resHab")(S.hab.map((id) => HAB[id][lang][0]).join(", ") || "—"),
    t("resComp")(S.comp.filter((c) => c.estado === "cumprido").length, S.comp.length), t("resTot")(fmtInt(S.tot.casos), fmtInt(S.tot.mortes), fmtInt(S.tot.curas))];
  const cargo = t("cargos")[Math.max(0, RANKS.filter((p) => S.pontos >= p).length - 1)], P = PERSONAGENS[S.pers];
  const nL = LOGROS.filter((l) => logros[l.id]).length;
  $("#tela-fim").innerHTML = `
    <h1>${esc(t("resTit"))}</h1>
    <div class="cartao"><div class="topo-res"><div class="placar">⭐ ${fmtInt(S.pontos)}</div>${estrelasHTML(estrelas(popEqPct()))}</div>
      <p class="cargo">${esc(t("cargo")(cargo))}</p>
      <p class="meta"><span class="retrato-mini" style="--cor:${P.cor}" aria-hidden="true"><img src="arte/${S.pers}.svg" alt=""></span> ${esc(P[lang].nome)}${S.hab.length ? ` · ${S.hab.map((id) => ico(HAB_ICO[id])).join(" ")}` : ""}</p>
      <p class="meta">${esc(t("pontos"))} · ${novo ? esc(t("novoRec")) : esc(t("recorde")(fmtInt(Math.max(recAnt, S.pontos))))}</p></div>
    <div class="cartao"><div class="metricas">${metrica("❤️", Math.abs(S.tot.vidas), S.tot.vidas >= 0 ? t("metVidas") : t("vidasPerd"), "ok")}${metrica("🍎", S.tot.evit, t("metEvit"), "ok")}${metrica("🕯️", S.tot.semdx, t("metSemDx"))}</div>
      <p class="fonte">${esc(t("metModelo"))}</p></div>
    ${cartaoRanking()}
    <div class="cartao"><ul class="linhas">${linhas.map((l) => `<li>${l}</li>`).join("")}</ul></div>
    <div class="cartao"><h2>🏅 ${esc(t("logrosTit"))}</h2><p class="meta">${esc(t("logrosConta")(nL, LOGROS.length))}</p><div class="logros">${LOGROS.map(selo).join("")}</div></div>
    <div class="cartao"><h2>${esc(t("realTit"))}</h2><ul class="linhas">${t("real").map((l) => `<li>${esc(l)}</li>`).join("")}</ul></div>
    <div class="btns"><button class="btn" id="btn-nova" type="button">${esc(t("denovo"))}</button><button class="btn sec" id="btn-compartir" type="button">${esc(t("compartir"))}</button></div>
    <p class="aviso">${esc(t("beta"))} ${esc(t("modeloNota"))}</p>
    <div class="cartao">${creditosHTML(true)}</div>
    <div class="cartao"><h2>${esc(t("fontesTit"))}</h2>${listaFontes()}</div>`;
  renderHud();
  rolarTopo();
  if (novo && recAnt > 0 && !S.festaFim) { S.festaFim = true; salvar(); confete(); faixa("🏆", t("novoRecorde"), t("recordeTxt"), "ouro"); }
}

/* ---------- personagem: efeitos da passiva e das habilidades escolhidas ---------- */
const efeitos = () => (S ? [PERSONAGENS[S.pers].ef, ...S.hab.map((id) => HAB[id].ef || {})] : []);
const fator = (k, chaves) => efeitos().reduce((f, e) => chaves.reduce((g, c) => g * ((e[k] && e[k][c]) ?? 1), f), 1);   // multiplicadores por chave
const soma = (k, c) => efeitos().reduce((s, e) => s + ((e[k] && e[k][c]) || 0), 0);                                       // somas por chave
const num = (k) => efeitos().reduce((s, e) => s + (typeof e[k] === "number" ? e[k] : 0), 0);                              // somas simples
const mul = (k) => efeitos().reduce((f, e) => f * (typeof e[k] === "number" ? e[k] : 1), 1);                              // multiplicadores simples
const fmtM = (x) => fmt1(Math.round(x * 10) / 10);   // dinheiro: sempre com vírgula e 1 casa decimal (15,0 · 13,5)
let escolhaPers = ["bob", "patron", "beatriz"].includes(ler("epidemia-py-pers")) ? ler("epidemia-py-pers") : "beatriz";
function ganharPrest(n) {
  if (n > 0) n = Math.round(n * mul("ganhoPrest"));
  S.prest = Math.max(0, Math.min(99, S.prest + n));
  return n;
}
function sortearPeso(lista, peso) {
  const p = lista.map(peso);
  let r = Math.random() * p.reduce((a, b) => a + b, 0);
  for (let i = 0; i < lista.length; i++) { r -= p[i]; if (r <= 0) return lista[i]; }
  return lista[lista.length - 1];
}
function alvoMenorVisSem(a) {
  const sem = DEPS.filter((d) => !temSlot(S.deps[d.id], a)).sort((x, y) => vis(x.id) - vis(y.id)).slice(0, 4);
  return sem.length ? sortear(sem).id : undefined;
}

/* ---------- níveis de atenção e encaminhamento; o que ainda não está disponível ---------- */
const temNivelAt = (d, n) => Object.keys(ACOES).some((a) => ACOES[a].at === n && temSlot(d, a));
const redeCompleta = (id) => [1, 2, 3].every((n) => temNivelAt(S.deps[id], n));
const anoLib = (a) => (ACOES[a].desde || ANOS[0]) - soma("ano", a);
const convLib = () => PERSONAGENS[S.pers].ef.convDesde || CONV_DESDE;
function bloqueio(id, a) {
  if (ano() < anoLib(a)) return { curto: t("bloqAno")(anoLib(a)), txt: t("bloqAnoTxt")(anoLib(a)) };
  const at = ACOES[a].at, d = S.deps[id];
  if (at === 2 && !temNivelAt(d, 1)) return { curto: t("bloqRef1"), txt: t("bloqRef1Txt") };
  if (at === 3 && !num("semRef") && ![id, ...DEP[id].vizinhos].some((v) => temNivelAt(S.deps[v], 2) || (num("refTele") && temNivelAt(S.deps[v], 1))))
    return { curto: t("bloqRef2"), txt: t("bloqRef2Txt") };
  return null;
}

/* ---------- economia do ano: em janeiro entra a receita e se paga a manutenção e os convênios; sem dinheiro, fecha o mais caro ---------- */
function rendaAno() {
  const nPesq = DEPS.filter((d) => temPesq(S.deps[d.id])).length, P = S.pol || {}, i = S.anoIdx;
  return ORC_BASE + S.orcExtra + nPesq * num("rendaPesq") + 12 * num("renda")
    + (P.tabaco !== undefined && i > P.tabaco ? 2 : 0)                                   // imposto sobre o tabaco
    + (P.ensayo && i > P.ensayo.ini && i <= P.ensayo.ini + 2 ? 3 : 0)                     // ensaio clínico patrocinado
    - (P.prestamo && i >= P.prestamo.desde && i <= P.prestamo.ate ? 2 : 0)               // parcelas do empréstimo
    - (P.proveedor !== undefined && i === P.proveedor + 1 ? 5 : 0);                       // fornecedores atrasados, com acréscimo
}
function estruturas() {
  const l = [];
  for (const d of DEPS) {
    const st = S.deps[d.id];
    for (const a in ACOES) {
      if (st.conv[a]) l.push({ dep: d.id, a, conv: true, ano: anuidadeConv(a) });
      else if (publico(st, a) && st.feitas[a] >= 0) l.push({ dep: d.id, a, conv: false, ano: manutAcao(a) });   // o que já existia é mantido pelo Estado
    }
  }
  return l;
}
const manutAno = () => estruturas().reduce((s, e) => s + e.ano, 0);
function cobrarManutencao() {
  const total = dec(manutAno());
  S.orc = dec(S.orc - total);
  while (S.orc < 0) {
    const e = estruturas().sort((x, y) => y.ano - x.ano)[0];
    if (!e) { S.orc = 0; break; }
    const st = S.deps[e.dep];
    if (e.conv) delete st.conv[e.a]; else { delete st.feitas[e.a]; delete st.pago[e.a]; delete st.prestPago[e.a]; }
    S.orc = dec(S.orc + e.ano);
    ganharPrest(-2);
    S.fechadasAno.push(`${ACOES[e.a].ico} ${t("curtas")[e.a]} (${DEP[e.dep].nome})`);
  }
  return total;
}

/* ---------- cargos e árvore de habilidades ---------- */
const cargoAtual = () => RANKS.filter((p) => S.pontos + S.ptsAno >= p).length - 1;
const pendentes = () => Math.min(4, cargoAtual()) - S.hab.length;
function talvezAbrirArvore() {
  if (S && !S.fim && S.abrirArvore && S.fase === "jogando" && $("#modal").hidden) { S.abrirArvore = false; mostrarArvore(); }
}
function mostrarArvore() {
  janela = "arvore";
  const P = PERSONAGENS[S.pers], tx = P[lang], cargo = cargoAtual(), pend = pendentes(), col = S.hab.length, sel = S.habSel;
  const pts = S.pontos + S.ptsAno, topo = cargo >= RANKS.length - 1;
  const pct = topo ? 100 : Math.max(0, Math.min(100, Math.round(100 * (pts - RANKS[cargo]) / (RANKS[cargo + 1] - RANKS[cargo]))));
  const celula = (r, c) => {
    const id = P.arvore[c][r], h = HAB[id];
    const estado = S.hab.includes(id) ? "escolhida" : c < col ? "perdida" : c === col && pend > 0 ? "opcao" : "bloqueada";
    return `<button type="button" class="hab ${estado}${sel === id ? " sel" : ""}" data-hab="${id}"><span class="hab-ico" aria-hidden="true">${ico(HAB_ICO[id])}</span><small>${esc(h[lang][0])}</small></button>`;
  };
  const ramos = tx.ramos.map((ramo, r) => `<div class="ramo"><p class="ramo-tit" style="--cor:${P.cor}">${esc(semEmoji(ramo))}</p><div class="ramo-cels">${[0, 1, 2, 3].map((c) => celula(r, c)).join("")}</div></div>`).join("");
  const h = sel && HAB[sel];
  const pode = h && pend > 0 && P.arvore[col] && P.arvore[col].includes(sel);
  abrirModal(`
    <div class="perfil">${avatarHTML(S.pers)}<div><h2>${esc(tx.nome)}</h2><p class="meta">${esc(tx.papel)} · <b>${esc(t("cargos")[cargo])}</b></p></div></div>
    ${pend > 0 ? `<p class="efeito">${esc(t("arvAscenso")(t("cargos")[col + 1]))}</p>` : ""}
    <div class="prog"><i style="width:${pct}%"></i></div><p class="meta">${esc(topo ? t("arvTopo") : t("arvProx")(t("cargos")[cargo + 1], fmtInt(RANKS[cargo + 1])))}</p>
    <div class="arvore"><div class="cargos-cab">${[1, 2, 3, 4].map((i) => `<small>${esc(t("cargos")[i])}</small>`).join("")}</div>${ramos}</div>
    ${h ? `<div class="hab-desc"><b>${ico(HAB_ICO[sel])} ${esc(h[lang][0])}</b><p>${esc(h[lang][1])}</p>${pode ? `<button class="btn" type="button" data-hab-ok="${sel}">${esc(t("arvEscolher"))}</button>` : `<p class="meta">${esc(S.hab.includes(sel) ? t("arvEscolhida") : t("arvBloq"))}</p>`}</div>` : ""}
    <div class="cartao mini-lista"><b>${esc(t("pers").passiva)}</b><ul class="linhas">${tx.tracos.map((x) => `<li>${esc(semEmoji(x))}</li>`).join("")}</ul><p class="meta">${esc(t("pers").lado)}: ${esc(tx.lado)}</p></div>
    <div class="btns"><button class="btn sec" type="button" data-abrir="missoes">${ico("alvo")} ${esc(t("missoesTit"))}</button><button class="btn sec" type="button" data-abrir="ajuda">${esc(t("ajuda"))}</button></div>
    <button class="btn" type="button" data-fechar>${esc(t("voltar"))}</button>`);
}
function escolherHab(id) {
  const P = PERSONAGENS[S.pers], col = S.hab.length;
  if (pendentes() <= 0 || !P.arvore[col] || !P.arvore[col].includes(id)) return;
  S.hab.push(id);
  S.habSel = null;
  const h = HAB[id];
  if (h.aoEscolher) h.aoEscolher();
  faixa(ico(HAB_ICO[id]), h[lang][0], h[lang][1], "ouro");
  confete();
  vibrar();
  salvar();
  if (pendentes() > 0) mostrarArvore(); else { fecharModal(); render(); }
}

/* ---------- escolha do personagem ---------- */
function mostrarPersonagens() {
  janela = "pers";
  const cartao = (k) => {
    const P = PERSONAGENS[k], tx = P[lang];
    return `<button type="button" class="pers${k === escolhaPers ? " sel" : ""}" style="--cor:${P.cor}" data-pers="${k}" aria-pressed="${k === escolhaPers}">${avatarHTML(k)}
      <span class="pers-txt"><b>${esc(tx.nome)}</b><small>${esc(tx.papel)}</small><span class="pers-bio">${esc(tx.bio)}</span><span class="pers-tracos">${tx.tracos.map((x) => esc(semEmoji(x))).join("<br>")}</span></span></button>`;
  };
  abrirModal(`
    <h2>${esc(t("pers").escolher)}</h2>
    <div class="pers-lista">${Object.keys(PERSONAGENS).map(cartao).join("")}</div>
    <button class="btn" type="button" id="btn-pers-ok">${esc(t("pers").jogarCom(PERSONAGENS[escolhaPers][lang].nome))}</button>
    <button class="btn sec" type="button" data-fechar>${esc(t("fichaCancelar"))}</button>`);
}

/* ---------- ficha da ação: custos e requisitos antes de investir ---------- */
function mostrarAcao(id, a) {
  janela = "acao";
  S.fichaAtual = { id, a };
  const d = S.deps[id], [nome, alvo] = t("acoes")[a], at = ACOES[a].at;
  const pub = publico(d, a), cv = !!d.conv[a], b = !pub && !cv ? bloqueio(id, a) : null;
  const c = custo(a, id), p = prestCusto(a), m = manutAcao(a);
  const pode = !pub && !b && c <= S.orc && p <= S.prest;
  const motivo = pub ? t("fichaAtivo") : b ? b.txt : c > S.orc ? t("bloqOrc") : p > S.prest ? t("bloqPrest")(p) : "";
  const temConv = ACOES[a].conv && !pub, convOk = ano() >= convLib();
  abrirModal(`
    <div class="ficha-topo"><span class="ficha-ico" aria-hidden="true" style="--nv: ${ACOES[a].nivel === "X" ? "var(--ouro)" : `var(--nv-${ACOES[a].nivel.toLowerCase()})`}">${ico(a)}</span><div><h2>${esc(nome)}</h2><p class="meta">${esc(DEP[id].nome)} · ${esc(t("funcoes")[ACOES[a].nivel])} → ${esc(alvo)}</p></div></div>
    <p><span class="nat n${at}">${esc(t("niveisAt")[at])}</span></p>
    <div class="ficha-custos" title="${esc(t("fichaManutNota"))}">
      <div><small>${esc(t("fichaCompra"))}</small><b>${ico("moeda")} ${fmtM(c)}</b></div>
      <div><small>${esc(t("fichaPrest"))}</small><b>${ico("medalha")} ${p}</b></div>
      <div><small>${esc(t("fichaManut"))}</small><b>${ico("moeda")} ${fmtM(m)}${esc(t("porAnoCurto"))}</b></div>
    </div>
    <p class="meta">${esc(t("fichaManutNota"))}</p>
    ${motivo && !cv ? `<p class="fila">${esc(motivo)}</p>` : ""}
    ${cv ? `<p class="meta">${esc(t("fichaConvAtivo"))}</p>` : ""}
    <div class="ficha-btns">
      ${desfazivel(d, a) ? `<button class="btn sec" type="button" data-ficha="desfazer">${esc(t("fichaDesfazer")(fmtM(d.pago[a] || 0), d.prestPago[a] || 0))}</button>`
        : !pub ? `<button class="btn" type="button" data-ficha="implementar" ${pode ? "" : "disabled"}>${esc(t("fichaImplementar")(fmtM(c), p))}</button>` : ""}
      ${temConv && !cv ? `<button class="btn sec" type="button" data-ficha="conv" ${convOk && anuidadeConv(a) <= S.orc ? "" : "disabled"}>${esc(convOk ? t("fichaConv")(fmtM(anuidadeConv(a))) : t("bloqConvAno")(convLib()))}</button>` : ""}
      ${cv ? `<button class="btn sec" type="button" data-ficha="cancelarConv">${esc(convNoAno(d, a) > 0 ? t("fichaDesfazer")(fmtM(convNoAno(d, a)), 0) : t("fichaCancelarConv"))}</button>` : ""}
      <button class="btn sec" type="button" data-fechar>${esc(t("fichaCancelar"))}</button>
    </div>`);
}

/* ---------- metas, prêmios e festa ---------- */
let logros = ler(CHAVE_LOGROS) || {};
const missao = (id) => MISSOES.find((m) => m.id === id) || Object.values(MISSOES_PESSOAIS).find((m) => m.id === id);
const popEqPct = () => 100 * DEPS.reduce((s, d) => s + (equil(d.id) >= 1 ? d.pop : 0), 0) / DEPS.reduce((s, d) => s + d.pop, 0);
function revelados() {
  const faltava = DEPS.reduce((s, d) => s + (1 - S.deps[d.id].vis0) * d.pop, 0);
  const achado = DEPS.reduce((s, d) => s + (vis(d.id) - S.deps[d.id].vis0) * d.pop, 0);
  return Math.max(0, Math.min(100, 100 * achado / faltava));
}
const vidasTotal = () => S.tot.vidas + DEPS.reduce((s, d) => s + S.deps[d.id].ind.vidas, 0);
const estrelas = (p) => (p >= 30) + (p >= 50) + (p >= 75);   // população em equilíbrio: 30%, 50% e 75%
const estrelasHTML = (n) => `<span class="estrelas" role="img" aria-label="${esc(t("estrelasAria")(n))}">${[0, 1, 2].map((i) => `<span class="${i < n ? "on" : ""}" style="animation-delay:${0.3 + i * 0.2}s">★</span>`).join("")}</span>`;
const progTxt = (m) => { const p = Math.min(m.prog(), m.meta); return (m.fmt || ((a, b) => `${a}/${b}`))(p, m.meta); };
/* A missão seguida (escolhida em "Ver no mapa"; senão, a primeira) fica no rodapé e marca seus departamentos no mapa */
const missaoSeguida = () => { const id = S.mis.ativas.includes(S.misSeguida) ? S.misSeguida : S.mis.ativas[0]; return id ? missao(id) : null; };
const alvosMissao = () => { const m = missaoSeguida(); return m && m.alvo ? m.alvo() : []; };
function seguirMissao(id) {
  S.misSeguida = id;
  const alvos = alvosMissao();
  if (alvos.length && !alvos.includes(S.sel)) S.sel = alvos[0];
  fecharModal();
  salvar();
  render();
  alvos.slice(0, 3).forEach((x) => destacar(x));
}
const vibrar = () => { try { if (navigator.vibrate) navigator.vibrate(40); } catch (e) { /* sem vibração */ } };

/* Confere missões, conquistas e recorde; devolve true se algo mudou o orçamento */
function verificar() {
  if (!S || S.fim) return false;
  let mudou = false;
  for (const id of [...S.mis.ativas]) {
    const m = missao(id);
    if (m.prog() >= m.meta) { cumprirMissao(m); mudou = true; }
  }
  for (const l of LOGROS) if (!logros[l.id] && l.teste()) desbloquear(l);
  if (!S.recordeBatido && S.recordeAntes > 0 && S.pontos + S.ptsAno > S.recordeAntes) {
    S.recordeBatido = true;
    faixa("🏆", t("novoRecorde"), t("recordeTxt"), "ouro");
    confete();
  }
  if (cargoAtual() > S.cargoAvisado) {   // promoção: faixa, confete e a árvore abre no próximo momento livre
    S.cargoAvisado = cargoAtual();
    faixa("🎖️", t("ascensoFaixa")(t("cargos")[S.cargoAvisado]), t("ascensoTxt"), "ouro");
    confete();
    vibrar();
    S.abrirArvore = true;
  }
  return mudou;
}
function cumprirMissao(m) {
  S.mis.ativas = S.mis.ativas.filter((x) => x !== m.id);
  S.mis.feitas.push({ id: m.id, ano: ano() });
  if (S.mis.prox < S.mis.fila.length) S.mis.ativas.push(S.mis.fila[S.mis.prox++]);
  const p = m.premio;
  if (p.orc) S.orc += p.orc;
  if (p.prest) ganharPrest(p.prest);
  if (p.mult) S.multAno = Math.max(S.multAno, p.mult);
  faixa("🎯", `${t("missaoOk")} ${m[lang][0]}`, t("premio")(p));
  confete();
  vibrar();
}
function desbloquear(l) {
  logros[l.id] = new Date().toISOString().slice(0, 10);
  guardar(CHAVE_LOGROS, logros);
  S.logrosPartida.push(l.id);
  faixa(l.ico, `${t("logroOk")} ${l[lang][0]}`, l[lang][1], "ouro");
  confete();
  vibrar();
}

/* Faixa de prêmio no alto da tela, uma de cada vez */
const filaFaixas = [];
let faixaAtiva = false;
function faixa(ico, tit, txt, tipo = "") {
  filaFaixas.push({ ico, tit, txt, tipo });
  if (!faixaAtiva) proximaFaixa();
}
function proximaFaixa() {
  const f = filaFaixas.shift(), el = $("#faixa");
  if (!f) { faixaAtiva = false; return; }
  faixaAtiva = true;
  el.className = `faixa ${f.tipo}`;
  el.innerHTML = `<span class="ico" aria-hidden="true">${f.ico}</span><span><b>${esc(f.tit)}</b><small>${esc(f.txt)}</small></span>`;
  el.hidden = false;
  void el.offsetWidth;
  el.classList.add("on");
  setTimeout(() => { el.classList.remove("on"); setTimeout(() => { el.hidden = true; proximaFaixa(); }, 400); }, 2600);
}

/* Confete: na moldura de celular (tela larga) os elementos fixos se posicionam pela moldura */
const CORES = ["#f07a5c", "#3aa99f", "#f6b27a", "#6f9bd2", "#c48ee0", "#5cc48a", "#f2c14e"];
function confete(px, py, n = 26) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const box = $(".aparelho"), cs = getComputedStyle(box), r = box.getBoundingClientRect();
  const moldura = cs.transform !== "none";
  const ox = moldura ? r.left + parseFloat(cs.borderLeftWidth) : 0, oy = moldura ? r.top + parseFloat(cs.borderTopWidth) : 0;
  const x = (px ?? ox + (moldura ? box.clientWidth : innerWidth) / 2) - ox, y = (py ?? oy + 90) - oy;
  for (let i = 0; i < n; i++) {
    const c = document.createElement("i"), ang = Math.random() * Math.PI * 2, dist = 50 + Math.random() * 120;
    c.className = "confete";
    c.style.cssText = `left:${x}px;top:${y}px;background:${CORES[i % CORES.length]};--dx:${Math.round(Math.cos(ang) * dist)}px;--dy:${Math.round(Math.sin(ang) * dist + 80)}px;--rot:${Math.round(Math.random() * 720 - 360)}deg`;
    box.appendChild(c);
    setTimeout(() => c.remove(), 1500);
  }
}

/* O equilíbrio de um departamento subiu: texto dourado no mapa e confete */
function festejarNivel(id, n) {
  const l = document.querySelector(`#mapa .lbl[data-dep="${id}"]`);
  if (!l) return;
  const r = l.getBoundingClientRect();
  confete(r.left + r.width / 2, r.top, n >= 3 ? 36 : 18);
  const [x, y] = posLbl(id);
  const tx = document.createElementNS("http://www.w3.org/2000/svg", "text");
  tx.setAttribute("x", x);
  tx.setAttribute("y", y - 100);
  tx.setAttribute("class", "sobe-nivel");
  tx.textContent = t("nivelSobe")(n);
  $("#g-fx").appendChild(tx);
  setTimeout(() => tx.remove(), 1600);
  vibrar();
}

/* "+N" saindo da estrela do placar a cada mês */
function maisPontos(n) {
  const chip = $("#h-pontos"), hud = $(".hud");
  if (n < 1 || chip.hidden) return;
  const r = chip.getBoundingClientRect(), h = hud.getBoundingClientRect();
  const m = document.createElement("span");
  m.className = "mais";
  m.textContent = `+${fmtInt(n)}`;
  m.style.left = `${r.left - h.left + r.width / 2}px`;
  m.style.top = `${r.bottom - h.top}px`;
  hud.appendChild(m);
  setTimeout(() => m.remove(), 1200);
}

function contarAte(el, alvo, fmt, ms = 900) {
  if (!el) return;
  const t0 = performance.now();
  const passo = (agora) => {
    const k = Math.min(1, (agora - t0) / ms);
    el.textContent = fmt(Math.round(alvo * (1 - (1 - k) ** 3)));
    if (k < 1 && el.isConnected) requestAnimationFrame(passo);
  };
  requestAnimationFrame(passo);
}

/* Missão em destaque no rodapé + confiança, vidas salvas e pontos do ano */
function renderRodape() {
  const m = missaoSeguida(), b = $("#btn-missoes");
  if (m) {
    const p = Math.min(m.prog(), m.meta);
    b.innerHTML = `<span class="m-tit">${ico("alvo")}<span>${esc(m[lang][0])}</span></span><span class="m-n">${esc(progTxt(m))}</span><i class="m-barra"><i style="width:${Math.round(100 * p / m.meta)}%"></i></i>`;
  } else b.innerHTML = `<span class="m-tit">${esc(t("semMissao"))}</span>`;
  b.setAttribute("aria-label", `${t("missoesTit")}: ${m ? `${m[lang][0]} ${progTxt(m)}` : t("semMissao")}`);
  const txt = $("#dica-txt");
  txt.textContent = t("rodapeV4")(t("economia")(rendaAno() - manutAno()), fmtInt(Math.max(0, vidasTotal())), fmtInt(S.ptsAno + pontosAno() * S.multAno * (12 - S.mes) / 12));
  txt.title = t("rodapeTit");
}

function escolherConsequencia() {
  for (const c of CONSEQ) {
    if (S.consUsadas.includes(c.id)) continue;
    const dep = c.achar();
    if (dep === undefined) continue;
    const r = S.log[S.log.length - 1];
    S.consUsadas.push(c.id);
    c.aplicar(dep);
    return { id: c.id, dep, n: r ? Math.round(r.ind.semdx) : 0, ano: r ? r.ano : "" };
  }
  return null;
}
function consHTML() {
  const c = S.cons && CONSEQ.find((x) => x.id === S.cons.id);
  if (!c) return "";
  const sub = (s) => s.replaceAll("{dep}", S.cons.dep ? DEP[S.cons.dep].nome : "").replaceAll("{n}", fmtInt(S.cons.n || 0)).replaceAll("{ano}", S.cons.ano || "");
  const [tit, txt, ef] = c[lang];
  return `<div class="imprevisto cons"><p class="ano">🔁 ${esc(t("consTit"))}</p><h3>${esc(sub(tit))}</h3><p>${esc(sub(txt))}</p><p class="efeito">${esc(sub(ef))}</p><p class="fonte">${esc(t("escenario"))}</p></div>`;
}

const selo = (l) => `<div class="selo${logros[l.id] ? " on" : ""}${S && S.logrosPartida.includes(l.id) ? " novo" : ""}" title="${esc(l[lang][1])}"><span aria-hidden="true">${logros[l.id] ? l.ico : "🔒"}</span><small>${esc(l[lang][0])}</small></div>`;
const metrica = (ico, n, txt, cls = "") => `<div class="met ${cls}"><span aria-hidden="true">${ico}</span><b>${fmtInt(Math.max(0, n))}</b><small>${esc(txt)}</small></div>`;
function inicioExtra() {
  const rec = ler("epidemia-py-recorde") || 0, n = LOGROS.filter((l) => logros[l.id]).length;
  const partes = [rec ? t("inicioRecorde")(fmtInt(rec)) : "", n ? t("inicioLogros")(n, LOGROS.length) : ""].filter(Boolean);
  return partes.length ? `<p class="meta trofeus">${esc(partes.join(" · "))}</p>` : "";
}

/* ---------- ranking do congresso: dados antes de começar e registro das partidas ---------- */
const CFG = window.EPIDEMIA_CONFIG || {};
const rankingEncerrado = () => CFG.fimDadosPessoais && new Date() >= new Date(CFG.fimDadosPessoais);
const pedeDados = () => !!CFG.rankingUrl && !rankingEncerrado();
const contato = () => (Array.isArray(CFG.contato) ? CFG.contato.join("@") : CFG.contato || "—");
const TERMOS = "2026-10-27";   // versão dos termos aceitos: mudar quando o texto dos termos mudar
const emailOk = (e) => e.length <= 254 && /^[^\s@]{1,64}@[^\s@]+\.[^\s@]{2,}$/.test(e);   // a mesma regra do Codigo.gs
let jogadorEscolhido = null;   // dados confirmados em "Antes de empezar", para a partida que vai começar

/* Antes de começar (decisão do Gi, 27/10/2026): nome, e-mail, faculdade e turma + aceite dos termos para entrar
   no ranking, ou jogar sem dados (a partida só conta) */
function mostrarDados(v = ler("epidemia-py-jogador") || {}) {
  janela = "dados";
  abrirModal(`<h2>${esc(t("dadosTit"))}</h2><p class="meta">${esc(t("dadosIntro"))}</p>
    <div class="form-rank">
      <label>${esc(t("rankNome"))}<input type="text" id="d-nome" maxlength="40" autocomplete="name" value="${esc(v.nome || "")}"></label>
      <label>${esc(t("rankEmail"))}<input type="email" id="d-email" maxlength="254" autocomplete="email" value="${esc(v.email || "")}"></label>
      <label>${esc(t("rankFac"))}<input type="text" id="d-fac" maxlength="60" value="${esc(v.faculdade || "")}"></label>
      <label>${esc(t("rankTurma"))}<input type="text" id="d-turma" maxlength="20" value="${esc(v.turma || "")}"></label>
      <details class="termos"${v.termosAbertos ? " open" : ""}><summary>${esc(t("termosTit"))}</summary><ul>${t("termos")(contato()).map((l) => `<li>${esc(l)}</li>`).join("")}</ul></details>
      <label class="consent"><input type="checkbox" id="d-ok"${v.ok ? " checked" : ""}><span>${esc(t("dadosOk"))}</span></label>
      <p class="msg-rank" id="d-msg" role="status"></p>
      <button class="btn" type="button" id="btn-dados-ok">${esc(t("dadosJogar"))}</button>
      <button class="btn sec" type="button" id="btn-dados-sem">${esc(t("dadosSem"))}</button>
    </div>`, "dados");
}
/* O que já foi digitado (para trocar de idioma sem perder) */
const valoresDados = () => ({ nome: $("#d-nome").value, email: $("#d-email").value, faculdade: $("#d-fac").value, turma: $("#d-turma").value,
  ok: $("#d-ok").checked, termosAbertos: $(".termos").open });

function confirmarDados() {
  const v = valoresDados();
  const j = { nome: v.nome.trim(), email: v.email.trim().toLowerCase(), faculdade: v.faculdade.trim(), turma: v.turma.trim() };
  const erro = (k) => { const m = $("#d-msg"); m.textContent = t(k); m.className = "msg-rank erro"; };
  if (j.nome.length < 2 || !j.email || j.faculdade.length < 2 || !j.turma) return erro("dadosCampos");
  if (!emailOk(j.email)) return erro("dadosEmail");
  if (!v.ok) return erro("dadosSemOk");
  guardar("epidemia-py-jogador", j);
  jogadorEscolhido = j;
  mostrarPersonagens();
}

/* Registro das partidas: os avisos de começo e de fim entram numa fila no celular e seguem para a planilha.
   Sem conexão, ou com a planilha no teto, o jogo não trava: a fila tenta de novo em 30 s e quando a conexão volta. */
const FILA = "epidemia-py-fila";
let enviandoFila = false, filaParada = false, esperaFila = null;
function avisar(acao) {
  if (!CFG.rankingUrl || !S) return;
  const ev = { acao, id: S.id, idioma: lang, versao: CFG.versao || "" };
  if (S.jogador) { ev.dados = S.jogador; ev.termos = S.termos; }
  if (acao === "fim") { ev.pontos = S.pontos; ev.anos = S.log.map((x) => x.pts); }
  const fila = (ler(FILA) || []).filter((x) => !(x.acao === acao && x.id === ev.id)).slice(-19);   // até 20 avisos guardados
  fila.push(ev);
  guardar(FILA, fila);
  enviarFila();
}
async function enviarFila() {
  if (enviandoFila || !CFG.rankingUrl) return;
  enviandoFila = true; filaParada = false;
  clearTimeout(esperaFila);
  let fila = ler(FILA) || [];
  while (fila.length) {
    const ev = fila[0];
    let d;
    try {
      const r = await fetch(CFG.rankingUrl, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(ev) });
      d = await r.json();
    } catch (e) { d = { ok: false, erro: "rede" }; }
    if (!d.ok && ["rede", "limite", "servidor"].includes(d.erro)) { filaParada = true; break; }   // passageiro: tenta depois
    fila = (ler(FILA) || []).filter((x) => !(x.acao === ev.acao && x.id === ev.id));   // relê: pode ter entrado aviso novo
    guardar(FILA, fila);
    if (ev.acao === "fim" && S && S.id === ev.id) { S.enviado = d.ok ? { posicao: d.posicao || null } : { erro: d.erro || "erro" }; salvar(); }
  }
  enviandoFila = false;
  if (filaParada) esperaFila = setTimeout(enviarFila, 30000);
  atualizarCartaoRanking();
}
window.addEventListener("online", enviarFila);

function cartaoRanking() {
  const tit = `<h2>${esc(t("rankTit"))}</h2>`, ver = `<div class="btns"><a class="btn sec" href="ranking.html">${esc(t("rankVer"))}</a></div>`;
  if (!CFG.rankingUrl) return `<div class="cartao" id="cartao-rank">${tit}<p class="meta">${esc(t("rankFechado"))}</p></div>`;
  if (!S.jogador) return `<div class="cartao" id="cartao-rank">${tit}<p class="meta">${esc(t(rankingEncerrado() ? "rankEncerrado" : "rankSemDados"))}</p>${ver}</div>`;
  const e = S.enviado;
  const [cls, txt] = !e ? ["", t(filaParada ? "rankPendente" : "rankEnviando")]
    : e.erro ? ["erro", t(e.erro === "cheio" ? "rankCheio" : e.erro === "encerrado" ? "rankEncerrado" : "rankFalhou")]
    : ["ok", t("rankJa")(e.posicao)];
  return `<div class="cartao form-rank" id="cartao-rank">${tit}<p class="msg-rank ${cls}" role="status">${esc(txt)}</p>${ver}</div>`;
}
function atualizarCartaoRanking() {
  const el = $("#cartao-rank");
  if (el && S && S.fim) el.outerHTML = cartaoRanking();
}

const creditosHTML = (comTitulo) => `<div class="creditos">${comTitulo ? `<h2>${esc(t("creditosTit"))}</h2>` : ""}${t("creditos").map((c) => `<p>${c}</p>`).join("")}</div>`;

/* ---------- janelas ---------- */
let janela = null;   // qual janela está aberta (para trocar de idioma sem perder o lugar)
function abrirModal(html, classe = "") { $("#janela").className = classe ? `janela ${classe}` : "janela"; $("#janela").innerHTML = html; $("#modal").hidden = false; $("#janela").scrollTop = 0; const b = $("#janela .btn, #janela [data-opcao]:not([disabled])"); if (b) b.focus(); }
function fecharModal() { $("#modal").hidden = true; janela = null; }

/* Cenas em nanquim dos fatos do ano e de alguns imprevistos (arte/cena-*.svg) */
const CENA_ANO = { 2015: "cena-hospital-dia", 2018: "cena-ley", 2019: "cena-ley", 2023: "cena-acelerador", 2024: "cena-hospital-dia" };
const CENA_ALEAT = { itaipu: "cena-itaipu", yacyreta: "cena-itaipu", oiea: "cena-acelerador" };
const ALT_CENA = {
  "cena-hospital-dia": ["Un Hospital Día iluminado en el interior", "Um Hospital Día iluminado no interior"],
  "cena-ley": ["Una ley sobre la mesa, con un sello de ñandutí", "Uma lei sobre a mesa, com um selo de ñandutí"],
  "cena-acelerador": ["Un acelerador lineal en funcionamiento", "Um acelerador linear em funcionamento"],
  "cena-itaipu": ["Una represa hidroeléctrica al atardecer", "Uma represa hidrelétrica ao entardecer"],
};
function mostrarEvento() {
  janela = "evento";
  const [tit, txt, efeito, fonte] = EVENTOS[ano()][lang];
  const ev = S.evAleat && EVENTOS_ALEAT.find((e) => e.id === S.evAleat.id);
  const nomeDep = S.evAleat && S.evAleat.dep ? DEP[S.evAleat.dep].nome : "";
  const sub = (s) => s.replaceAll("{dep}", nomeDep);
  const ao = S.avisoOrc || {};
  let imp = "";
  if (ev) {
    const [it, ix, ie, ifo] = ev[lang];
    imp = `<div class="imprevisto"><p class="ano">⚡ ${esc(t("imprevisto"))}</p><h3>${esc(sub(it))}</h3><p>${esc(sub(ix))}</p><p class="efeito">${esc(sub(ie))}</p><p class="fonte">${ifo ? fonteHTML(sub(ifo)) : esc(t("escenario"))}</p></div>`;
  }
  const cena = CENA_ANO[ano()] || (ev && CENA_ALEAT[ev.id]);
  abrirModal(`
    ${cena ? `<img class="cena" src="arte/${cena}.svg" alt="${esc(ALT_CENA[cena][lang === "es" ? 0 : 1])}"><div class="selo-ano" aria-hidden="true">${ano()}</div>` : ""}
    <p class="ano">${esc(t("anoDe")(ano(), S.anoIdx + 1))}</p>
    <h2>${esc(tit)}</h2><p>${esc(txt)}</p>
    <p class="efeito">${esc(efeito)}</p>
    <p class="fonte">${esc(t("fonte"))}: ${fonteHTML(fonte)}</p>
    ${imp}
    ${consHTML()}
    ${ao.receita ? `<p class="meta">${esc(t("evEconomia")(fmtM(ao.receita), fmtM(ao.manut || 0)))}</p>` : ""}
    ${S.fechadasAno.length ? `<p class="fila">${esc(t("evFechou")(S.fechadasAno.join(", ")))}</p>` : ""}
    ${ao.congresso ? `<p class="meta">${esc(t("congressoMais"))}</p>` : ""}
    ${ao.proveedor ? `<p class="fila">${esc(t("evProveedor"))}</p>` : ""}
    ${ao.ensayo ? `<p class="efeito">${esc(t("evEnsayo")[ao.ensayo])}</p>` : ""}
    <p><b>${esc(t("evOrc")(fmtM(S.orc)))}</b> · 🎖️ ${S.prest}</p>
    <button class="btn" type="button" data-fechar>${esc(S.demanda ? t("proxDemanda") : t("evBtn"))}</button>`, "papel");
}

function opcaoCusto(o, dep) {
  if (o.compra) return { valor: custo(o.compra, dep), bloq: bloqueio(dep, o.compra) };
  if (o.conv) return { valor: anuidadeConv(o.conv), anual: true };
  return { valor: o.custo || 0 };
}

function mostrarDemanda() {
  janela = "demanda";
  const dm = DEMANDAS.find((x) => x.id === S.demanda.id), dep = S.demanda.dep;
  const sub = (s) => s.replaceAll("{dep}", dep ? DEP[dep].nome : "").replaceAll("{ano2}", ANOS[Math.min(9, S.anoIdx + 2)]).replaceAll("{ano3}", ANOS[Math.min(9, S.anoIdx + 3)]);
  const ops = dm.opcoes.map((o, i) => {
    const c = opcaoCusto(o, dep), pode = c.valor <= S.orc && !c.bloq;
    const detalhe = [c.anual ? t("custoAno")(fmtM(c.valor)) : c.valor ? t("custo")(fmtM(c.valor)) : "", o.prest ? `${o.prest > 0 ? "+" : "−"}🎖️ ${Math.abs(o.prest)}` : "", c.bloq ? c.bloq.curto : pode ? "" : t("semOrcOp")].filter(Boolean).join(" · ");
    return `<button type="button" data-opcao="${i}" ${pode ? "" : "disabled"}><span>${esc(sub(o[lang]))}</span>${detalhe ? `<small>${esc(detalhe)}</small>` : ""}</button>`;
  }).join("");
  abrirModal(`
    <p class="ano">📣 ${esc(t("quem")[dm.quem])}</p>
    <h2>${esc(t("demandaTit"))}</h2>
    <p>${esc(sub(dm[lang]))}</p>
    <div class="opcoes">${ops}</div>
    ${dm.fonte ? `<p class="fonte">${esc(t("inspirado"))}: ${fonteHTML(dm.fonte)}</p>` : ""}
    <p class="meta">🎖️ ${S.prest} · 💰 ${fmtM(S.orc)}</p>`);
}

/* Resposta à demanda: o que se compra ou contrata aqui não se desfaz depois (a confiança já foi ganha) */
function escolherOpcao(i) {
  const dm = DEMANDAS.find((x) => x.id === S.demanda.id), dep = S.demanda.dep, o = dm.opcoes[i];
  const c = opcaoCusto(o, dep);
  if (c.valor > S.orc || c.bloq) return;
  const eq0 = dep ? equil(dep) : 0;
  S.orc -= c.valor;
  if (o.compra) { const d = S.deps[dep]; S.gasto[ACOES[o.compra].nivel] += c.valor; d.feitas[o.compra] = S.anoIdx; d.pago[o.compra] = 0; delete d.conv[o.compra]; S.compradasAno.push(o.compra); }
  else if (o.conv) { S.gasto[ACOES[o.conv].nivel] += c.valor; S.deps[dep].conv[o.conv] = { ano: S.anoIdx, pago: 0 }; S.compradasAno.push(licaoDe(o.conv, true)); }
  else if (o.custo) S.gasto[o.gasto || "T"] += o.custo;
  if (o.aplicar) o.aplicar(dep);
  const atendeu = (o.prest || 0) > 0;   // respostas positivas rendem os bônus do personagem
  ganharPrest((o.prest || 0) + (atendeu ? num("demPrest") + (dm.quem === "acad" ? num("demMedPrest") : 0) : 0));
  if (atendeu) S.orc += num("demOrc");
  S.demanda = null;
  S.fase = "jogando";
  if (dep) S.sel = dep;
  fecharModal();
  salvar();
  render();
  if (dep) destacar(dep, o.conv ? "convenio" : o.compra || "demanda");
  if (S.evAleat && S.evAleat.dep && S.evAleat.dep !== dep) destacar(S.evAleat.dep, "raio");
  if (dep && equil(dep) > eq0) festejarNivel(dep, equil(dep));
}

function mostrarResumo(r) {
  janela = "resumo";
  const [licao, fonte] = LICOES[r.licao][lang];
  const mis = (r.mis || []).map((id) => missao(id)[lang][0]).join(", ");
  const ultimo = S.anoIdx >= ANOS.length - 1;
  const comps = (r.comp || []).map((c) => `<li>${esc((c.ok ? t("compOk") : t("compFalhou"))(t("curtas")[c.a], DEP[c.dep].nome))}</li>`).join("");
  abrirModal(`
    <p class="ano">${esc(t("fimAno")(r.ano))}</p>
    <div class="topo-res"><h2 id="pts-ano">${esc(t("ptsAno")(0))}</h2>${estrelasHTML(r.est || 0)}</div>
    <div class="metricas">${metrica("❤️", Math.abs(r.ind.vidas), r.ind.vidas >= 0 ? t("metVidas") : t("vidasPerd"), "ok")}${metrica("🍎", r.ind.evit, t("metEvit"), "ok")}${metrica("🕯️", r.ind.semdx, t("metSemDx"))}</div>
    <p class="fonte">${esc(t("metModelo"))}</p>
    <ul class="linhas">
      <li>${esc(t("resPais")(fmtInt(r.ind.casos), fmtInt(r.ind.mortes), fmtInt(r.ind.curas)))}</li>
      ${r.subiu.length ? `<li>${esc(t("resSubiu")(r.subiu.length > 6 ? `${r.subiu.slice(0, 6).join(", ")} +${r.subiu.length - 6}` : r.subiu.join(", ")))}</li>` : ""}
      ${r.filas.length ? `<li>${esc(t("resFila")(r.filas.join(", ")))}</li>` : ""}
      <li>${esc(t("resEquil")(r.n3))}</li>
      ${comps}
      ${mis ? `<li>${esc(t("misAno")(mis))}</li>` : ""}
      ${r.quiz != null ? `<li>${esc(t("quizAno")(r.quiz))}</li>` : ""}
      ${r.fechadas && r.fechadas.length ? `<li>${esc(t("resFechou")(r.fechadas.join(", ")))}</li>` : ""}
      <li>${esc(t("resPrestAno")(r.prest0, r.prest1))}</li>
    </ul>
    <div class="licao"><p>${esc(licao)}</p><p class="fonte">${esc(t("fonte"))}: ${fonteHTML(fonte)}</p></div>
    <button class="btn" type="button" data-proximo>${esc(ultimo ? t("verRes") : t("prox")(ANOS[S.anoIdx + 1]))}</button>`);
  contarAte($("#pts-ano"), r.pts, (v) => t("ptsAno")(fmtInt(v)));
}

function mostrarMissoes() {
  janela = "missoes";
  const seguida = missaoSeguida();
  const cartao = (id) => {
    const m = missao(id), p = Math.min(m.prog(), m.meta), eSeguida = seguida && seguida.id === id;
    const temAlvo = m.alvo && m.alvo().length;
    return `<div class="missao${eSeguida ? " seguida" : ""}"><b>${ico("alvo")} ${esc(m[lang][0])}</b><p>${esc(m[lang][1])}</p><div class="prog"><i style="width:${Math.round(100 * p / m.meta)}%"></i></div>
      <p class="meta">${esc(progTxt(m))} · ${esc(t("recompensa"))}: ${esc(t("premio")(m.premio))}${m.fonte ? ` · ${esc(t("fonte"))}: ${fonteHTML(m.fonte)}` : ""}</p>
      ${temAlvo ? `<div class="mis-acoes"><button class="btn mini${eSeguida ? "" : " sec"}" type="button" data-seguir="${id}" aria-pressed="${!!eSeguida}">${ico(eSeguida ? "luz" : "alvo")} ${esc(eSeguida ? t("noMapa") : t("verMapa"))}</button></div>` : ""}
      ${noticiaHTML(id)}</div>`;
  };
  const feitas = S.mis.feitas.map((f) => `<li>✓ ${esc(missao(f.id)[lang][0])} (${f.ano})</li>`).join("");
  const nL = LOGROS.filter((l) => logros[l.id]).length;
  abrirModal(`
    <h2>${esc(t("missoesTit"))}</h2>
    ${S.mis.ativas.map(cartao).join("") || `<p>${esc(t("semMissao"))}</p>`}
    ${feitas ? `<h3>${esc(t("feitasTit"))}</h3><ul class="linhas feitas">${feitas}</ul>` : ""}
    <h3>🏅 ${esc(t("logrosTit"))} · ${esc(t("logrosConta")(nL, LOGROS.length))}</h3>
    <div class="logros">${LOGROS.map(selo).join("")}</div>
    <button class="btn" type="button" data-fechar>${esc(t("voltar"))}</button>`);
}

/* Desafio relâmpago: o relógio para; acertar dá 💰 2 e sequências de 3 dão 👍 5 */
function abrirQuiz() { S.fase = "quiz"; S.quizResp = null; salvar(); renderVivo(); mostrarQuiz(); }
function mostrarQuiz() {
  janela = "quiz";
  const q = QUIZ[S.quiz.ordem[S.quiz.i % QUIZ.length]], [frase, expl] = q[lang], r = S.quizResp;
  abrirModal(`
    <p class="ano">⚡ ${esc(t("quizTit"))}</p>
    <h2>${esc(t("quizSub"))}</h2>
    <p class="quiz-frase">${esc(frase)}</p>
    ${r == null ? `<div class="quiz-op"><button type="button" class="btn sec" data-quiz="1">${esc(t("verdadeiro"))}</button><button type="button" class="btn sec" data-quiz="0">${esc(t("falso"))}</button></div>`
      : `<div class="quiz-res ${r === q.v ? "ok" : "erro"}"><b>${esc(r === q.v ? t("quizCerto")(2 + num("quizOrc")) : t("quizErrado"))}</b> ${esc(q.v ? t("verdadeiro") : t("falso"))}: ${esc(expl)}</div>
      ${r === q.v && S.quiz.racha >= 2 ? `<p class="meta">${esc(t("racha")(S.quiz.racha))}</p>` : ""}
      <p class="fonte">${esc(t("fonte"))}: ${fonteHTML(q.fonte)}</p>
      <button class="btn" type="button" data-quiz-seguir>${esc(t("quizSeguir"))}</button>`}`);
}
function responderQuiz(v) {
  const q = QUIZ[S.quiz.ordem[S.quiz.i % QUIZ.length]];
  S.quizResp = v;
  S.quizOk = v === q.v;
  S.quiz.feitos++;
  if (S.quizOk) {
    S.orc += 2 + num("quizOrc"); ganharPrest(1); S.quiz.acertos++; S.quiz.racha++;
    if (S.quiz.racha % 3 === 0) { ganharPrest(2); faixa("🔥", t("racha")(S.quiz.racha), t("rachaPremio"), "ouro"); }
    confete();
    vibrar();
  } else S.quiz.racha = 0;
  verificar();
  salvar();
  renderVivo();
  mostrarQuiz();
}
function seguirQuiz() {
  S.quiz.i++; S.quizResp = null; S.quizAno = S.anoIdx; S.fase = "jogando";
  fecharModal();
  if (S.quizDepois) { S.quizDepois = false; fecharAno(); return; }   // o ⏩ tinha pedido para terminar o ano
  salvar();
  render();
}


function mostrarAjuda() {
  janela = "ajuda";
  abrirModal(`
    <h2>${esc(t("ajuda"))}</h2>
    <ol class="passos">${t("passos").map((p) => `<li>${p}</li>`).join("")}</ol>
    <p class="fonte">${fonteHTML(t("niveisFonte"))}</p>
    <p class="aviso">${esc(t("aviso"))} ${esc(t("modeloNota"))}</p>
    <h2>${esc(t("fontesTit"))}</h2>${listaFontes()}
    ${creditosHTML(true)}
    <button class="btn" type="button" data-fechar>${esc(t("fechar"))}</button>`);
}

let timerToast;
function toast(msg) {
  const el = $("#toast");
  el.textContent = msg; el.hidden = false;
  clearTimeout(timerToast); timerToast = setTimeout(() => { el.hidden = true; }, 2400);
}

/* ---------- salvar e começar ---------- */
function salvar() { guardar(CHAVE, S); }

function novoJogo(pers = escolhaPers) {
  S = novoEstado(pers);
  S.jogador = jogadorEscolhido;   // null: jogou sem dados (a partida conta, mas não entra no ranking)
  S.termos = jogadorEscolhido ? TERMOS : "";
  jogadorEscolhido = null;
  prepararInicio();
  iniciarAno();
  render();
  avisar("inicio");
}

function mostrarModalDaFase() {
  if (S.fase === "quiz") mostrarQuiz();
  else if (S.fase === "evento") mostrarEvento();
  else if (S.fase === "demanda") mostrarDemanda();
  else if (S.fase === "resumo") mostrarResumo(S.log[S.log.length - 1]);
}

function continuar() {
  S = ler(CHAVE);
  if (!S || S.fim) return novoJogo();
  render();
  mostrarModalDaFase();
}

/* ---------- eventos da página ---------- */
document.addEventListener("click", (ev) => {
  const alvo = ev.target;
  if (!alvo.closest) return;
  const dep = alvo.closest("#mapa .dep");
  if (dep && S && !S.fim) { S.sel = dep.dataset.dep; salvar(); render(); return; }
  const ac = alvo.closest("#painel .acao");
  if (ac && S && !S.fim) { mostrarAcao(S.sel, ac.dataset.acao); return; }
  const fi = alvo.closest("[data-ficha]");
  if (fi && !fi.disabled && S && S.fichaAtual) {
    const { id, a } = S.fichaAtual, op = fi.dataset.ficha;
    fecharModal();
    if (op === "implementar") comprar(id, a); else if (op === "conv") contratar(id, a); else if (op === "desfazer") desfazer(id, a); else cancelarConv(id, a);
    return;
  }
  const pc = alvo.closest("[data-pers]");
  if (pc) { escolhaPers = pc.dataset.pers; mostrarPersonagens(); return; }
  const fin = alvo.closest("[data-fin]");
  if (fin && S && !S.fim) { executarOpcao("fin", fin.dataset.fin); return; }
  const fav = alvo.closest("[data-favor]");
  if (fav && S && !S.fim) { executarOpcao("favor", fav.dataset.favor); return; }
  if (alvo.closest("#h-dinheiro") && S && !S.fim) { mostrarFinancas(); return; }
  if (alvo.closest("#h-prest") && S && !S.fim) { mostrarPrestigio(); return; }
  const sg = alvo.closest("[data-seguir]");
  if (sg && S && !S.fim) { seguirMissao(sg.dataset.seguir); return; }
  const irDep = alvo.closest("[data-ir-dep]");
  if (irDep && S && !S.fim) { fecharModal(); S.sel = irDep.dataset.irDep; salvar(); render(); destacar(S.sel); return; }
  const hok = alvo.closest("[data-hab-ok]");
  if (hok && S) { escolherHab(hok.dataset.habOk); return; }
  const hb = alvo.closest("[data-hab]");
  if (hb && S) { S.habSel = hb.dataset.hab; mostrarArvore(); return; }
  const abr = alvo.closest("[data-abrir]");
  if (abr && S) { if (abr.dataset.abrir === "missoes") mostrarMissoes(); else mostrarAjuda(); return; }
  const op = alvo.closest("[data-opcao]");
  if (op && !op.disabled) { escolherOpcao(+op.dataset.opcao); return; }
  const qz = alvo.closest("[data-quiz]");
  if (qz && S && S.fase === "quiz" && S.quizResp == null) { responderQuiz(qz.dataset.quiz === "1"); return; }
  if (alvo.closest("[data-quiz-seguir]") && S && S.fase === "quiz") { seguirQuiz(); return; }
  if (alvo.closest("#btn-missoes") && S && !S.fim) { mostrarMissoes(); return; }
  const modo = alvo.closest("[data-modo]");
  if (modo && S && !S.fim) { S.modo = modo.dataset.modo; salvar(); pintarMapa(); const el = $("#dep-linha"); if (el) el.innerHTML = linhaDep(); return; }
  if (alvo.closest("[data-fechar]")) {
    const eraEvento = S && !S.fim && S.fase === "evento";
    if (eraEvento && S.demanda) { S.fase = "demanda"; salvar(); mostrarDemanda(); return; }
    if (eraEvento) S.fase = "jogando";
    fecharModal();
    if (S && !S.fim) {
      salvar(); render();
      if (eraEvento && S.evAleat && S.evAleat.dep) destacar(S.evAleat.dep, "raio");
      if (eraEvento && S.cons && S.cons.dep) destacar(S.cons.dep, "repete");
    }
    return;
  }
  if (alvo.closest("[data-proximo]")) { proximoAno(); return; }
  if (alvo.id === "btn-nova") { if (pedeDados()) mostrarDados(); else mostrarPersonagens(); return; }
  if (alvo.id === "btn-dados-ok") { confirmarDados(); return; }
  if (alvo.id === "btn-dados-sem") { jogadorEscolhido = null; mostrarPersonagens(); return; }
  if (alvo.id === "btn-pers-ok") { guardar("epidemia-py-pers", escolhaPers); fecharModal(); novoJogo(escolhaPers); return; }
  if (alvo.id === "btn-continuar") { continuar(); return; }
  if (alvo.id === "btn-fechar") { fecharAno(); return; }
  if (alvo.closest("#btn-ajuda")) { if (S && !S.fim && !$("#tela-jogo").hidden) mostrarArvore(); else mostrarAjuda(); return; }
  if (alvo.id === "btn-compartir" || alvo.id === "btn-compartir-inicio") { compartilhar(); return; }
  if (alvo.id === "btn-comp-enviar") { enviarLink(); return; }
  if (alvo.id === "btn-comp-copiar") { copiarLink(); return; }
  if (alvo.id === "btn-comp-fechar") { fecharModal(); return; }   // só fecha: na tela de início não volta para a partida
  if (alvo.id === "btn-ultimo") { S = ler(CHAVE); mostrarFim(); return; }
  if (alvo.id === "btn-idioma") {
    lang = lang === "es" ? "pt" : "es"; guardar("epidemia-py-lang", lang);
    document.documentElement.lang = lang === "es" ? "es" : "pt-BR";
    if (!$("#modal").hidden) ({ evento: mostrarEvento, demanda: mostrarDemanda, quiz: mostrarQuiz, missoes: mostrarMissoes, arvore: mostrarArvore, pers: mostrarPersonagens, financas: mostrarFinancas, prestigio: mostrarPrestigio, acao: () => mostrarAcao(S.fichaAtual.id, S.fichaAtual.a),
      resumo: () => mostrarResumo(S.log[S.log.length - 1]), dados: () => mostrarDados(valoresDados()) }[janela] || mostrarAjuda)();
    if (!S) telaInicio();
    else if (S.fim) mostrarFim();
    else render();
  }
});
document.addEventListener("keydown", (ev) => {
  const dep = ev.target.closest && ev.target.closest("#mapa .dep");
  if (dep && S && !S.fim && (ev.key === "Enter" || ev.key === " ")) { ev.preventDefault(); S.sel = dep.dataset.dep; salvar(); render(); }
});
document.addEventListener("change", (ev) => { if (ev.target.id === "dep-tit" && ev.target.value) { S.sel = ev.target.value; salvar(); render(); } });

/* Compartilhar: janela com o QR do jogo (qr-jogo.svg, desenhado por _ferramentas/gerar_qr.py e conferido por leitor),
   o link por extenso e enviar/copiar. Um jogador mostra o QR na tela e o colega aponta a câmera. */
const urlJogo = () => CFG.jogoUrl || location.href.split("#")[0];   // sempre o link público, também na cópia de revisão
function compartilhar() {
  const url = urlJogo();
  abrirModal(`<h2>${esc(t("compTit"))}</h2><p class="meta">${esc(t("compSub"))}</p>
    <img class="qr-jogo" src="qr-jogo.svg" alt="${esc(t("qrAlt"))}" width="240" height="240">
    <p class="link-jogo"><a href="${esc(url)}" target="_blank" rel="noopener">${esc(url.replace(/^https?:\/\//, "").replace(/\/$/, ""))}</a></p>
    <div class="btns">${navigator.share ? `<button class="btn" id="btn-comp-enviar" type="button">${esc(t("compEnviar"))}</button>` : ""}<button class="btn sec" id="btn-comp-copiar" type="button">${esc(t("compCopiar"))}</button></div>
    <p class="msg-rank" id="comp-msg" role="status"></p>
    <div class="btns"><a class="btn sec" href="ranking.html">${esc(t("rankVer"))}</a><button class="btn sec" id="btn-comp-fechar" type="button">${esc(t("voltar"))}</button></div>`, "compartir");
}
async function enviarLink() {
  try { await navigator.share({ title: t("h1"), text: t("shareTxt"), url: urlJogo() }); } catch (e) { /* o jogador cancelou */ }
}
async function copiarLink() {
  try { await navigator.clipboard.writeText(urlJogo()); $("#comp-msg").textContent = t("copiado"); }
  catch (e) { $("#comp-msg").textContent = t("compFalhou"); }
}

// Depois de 31/10/2026 o celular esquece os dados do jogador (termos), também na partida salva e na fila de envio
if (rankingEncerrado()) {
  try { localStorage.removeItem("epidemia-py-jogador"); localStorage.removeItem(FILA); } catch (e) { /* sem armazenamento */ }
  const salvo = ler(CHAVE);
  if (salvo && salvo.jogador) { salvo.jogador = null; guardar(CHAVE, salvo); }
}
document.documentElement.lang = lang === "es" ? "es" : "pt-BR";
montarMapa();
calcularLimites();
telaInicio();
enviarFila();   // avisos que ficaram na fila (sem conexão da última vez)
