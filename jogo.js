"use strict";
/* Epidemia: Paraguay contra el cáncer (beta).
   Real, com fonte: taxas e óbitos do Atlas 2015-2019, população do Censo 2022 e o fato histórico de cada ano.
   Modelo do jogo (ilustrativo, avisado na tela): efeitos das ações, casos ocultos, incidência, prevalência, óbitos e
   curas ao vivo, imprevistos, demandas, confiança e pontos. */

const $ = (s) => document.querySelector(s);
const ANOS = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024];
const ORC_BASE = 12;
const SEG_MES = 2;                 // relógio: 1 mês a cada 2 s (24 s por ano)
const RAZAO_INC = 2.1;             // incidência ≈ 2,1 × óbitos (GLOBOCAN 2022: 13.783 casos / 6.581 óbitos)
const CHAVE = "epidemia-py-v2";    // v2: relógio, convênios e demandas (partidas salvas da v1 não continuam)
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
const ACOES = {
  vacuna: { nivel: "P", custo: 2, ico: "💉" },
  tabaco: { nivel: "P", custo: 1, ico: "🚭" },
  habitos: { nivel: "P", custo: 1, ico: "🍎" },
  vph: { nivel: "D", custo: 2, ico: "🔬", vis: 0.06, conv: 1 },
  mamo: { nivel: "D", custo: 3, ico: "🎗️", vis: 0.06, conv: 2 },
  registro: { nivel: "D", custo: 1, ico: "📋", vis: 0.08 },
  quimio: { nivel: "T", custo: 4, ico: "💊", conv: 2 },
  radio: { nivel: "T", custo: 8, ico: "☢️", conv: 3 },
  paliativos: { nivel: "T", custo: 2, ico: "🤲", conv: 1 },
  pesquisa: { nivel: "X", custo: 5, ico: "🎓", conv: 2 },
};

/* ---------- textos ---------- */
const T = {
  es: {
    sub: "Paraguay contra el cáncer",
    h1: "Epidemia: Paraguay contra el cáncer",
    intro: "Eres responsable del control del cáncer en Paraguay de 2015 a 2024. Los primeros 5 años parten de los datos reales del Atlas de Mortalidad por Cáncer; los 5 siguientes son una proyección de tus decisiones.",
    passos: [
      "Cada año dura 12 meses (unos 24 segundos; toca la fecha ⏸ para pausar). Toca un departamento y elige acciones con tu presupuesto 💰: lo que haces temprano rinde más.",
      "Tres niveles: <b>1.º Prevención</b>, <b>2.º Diagnóstico</b> y <b>3.º Tratamiento</b>. El <b>equilibrio</b> de un departamento es su nivel más bajo: solo los tres juntos curan más y multiplican los puntos (por la población). Diagnóstico sin tratamiento forma fila.",
      "Arriba a la derecha: incidencia, prevalencia, muertes y curas del país, en tiempo real. Tócalas para ver el mapa de cada una.",
      "🤝 Convenios: más baratos para empezar, pero se pagan todos los años.",
      "Cada año trae un hecho real, a veces un imprevisto (royalties de Itaipú, epidemias, inversión extranjera) y una demanda de la sociedad. Tus respuestas cambian la confianza 👍, y la confianza cambia el presupuesto.",
      "Donde la estadística es baja, falta diagnóstico, no cáncer: diagnosticar revela casos ocultos y la tasa registrada sube. ¡Es buena señal!",
    ],
    aviso: "Simulación educativa (beta). Los datos de partida y el hecho histórico de cada año son reales, con fuente. Los efectos de las acciones, los números en tiempo real, los imprevistos, las demandas y los puntos son del modelo del juego.",
    creditosTit: "Créditos",
    creditos: [
      "<b>Desarrollo:</b> Gianmarlon Pandolfo, estudiante de Medicina (UNINTER Tres Fronteras).",
      "<b>Trabajo base:</b> Silva GIS, Pandolfo GA, et al. <i>Mortalidad por Cáncer en Paraguay: Análisis Epidemiológico, Disparidades Geográficas y Desafíos para el Control</i>. Revisión sistemática, 2026.",
      "<b>Coautoría:</b> Claude Opus 5.5 (Anthropic), en el diseño del juego, la programación y la verificación de las fuentes.",
    ],
    comecar: "Empezar", continuar: "Continuar partida", nova: "Nueva partida",
    ajuda: "Cómo se juega", fechar: "Cerrar",
    anoDe: (a, i) => `${a} · año ${i} de 10`,
    modoCob: "Equilibrio", modoReg: "Tasas",
    legCob: "Equilibrio = nivel más bajo", legReg: "Tasa estandarizada /100 mil",
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
      radio: ["Acelerador lineal público", "radioterapia; es para siempre"],
      paliativos: ["Cuidados paliativos", "calidad de vida"],
      pesquisa: ["Centro de investigación y registro", "revela la carga real aquí y en los vecinos; +20% de puntos aquí"],
    },
    custo: (c) => (c ? `💰 ${c}` : "gratis"), custoAno: (c) => `💰 ${c}/año`, ativo: "✓ activo",
    dica1: "Pista: Central ya tiene tratamiento (INCAN). Suma ahí prevención y diagnóstico.",
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
    beta: "Versión beta para pruebas. Cuéntanos qué te pareció.",
    rankTit: "Ranking del congreso",
    rankIntro: "Entra al ranking que se muestra en el stand. Puedes usar tu nombre o un apodo.",
    rankNome: "Nombre", rankFac: "Facultad", rankTurma: "Curso",
    rankConsent: "Acepto que mi nombre, facultad y curso aparezcan en el ranking del congreso. Los datos quedan en una planilla de Google de Gianmarlon Pandolfo, autor del juego, y se borran el 31/10/2026.",
    rankEnviar: "Entrar al ranking", rankEnviando: "Enviando…",
    rankJa: (p) => `¡Listo! Estás en el ranking${p ? `, en el puesto ${p}` : ""}.`,
    rankCampos: "Completa nombre, facultad y curso.",
    rankSemOk: "Para entrar al ranking, marca la autorización.",
    rankErro: "No se pudo enviar. Revisa la conexión e inténtalo de nuevo.",
    rankFechado: "El ranking del congreso abre pronto.",
    rankEncerrado: "El ranking del congreso ya terminó.",
    rankVer: "Ver ranking",
    ultimo: "Ver mi último resultado",
    shareTxt: "Juega Epidemia: Paraguay contra el cáncer",
    meses: ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"],
    vivo: { inc: "Incidencia", prev: "Prevalencia", mort: "Muertes", cura: "Curas" },
    vivoTit: {
      inc: "Casos diagnosticados en el país este año (modelo del juego). Toca para ver el mapa.",
      prev: "Personas que viven con un cáncer diagnosticado en los últimos 5 años (modelo del juego). Toca para ver el mapa.",
      mort: "Muertes por cáncer en el país este año, estimadas (modelo del juego). Toca para ver el mapa.",
      cura: "Curas entre los pacientes diagnosticados este año (modelo del juego). Toca para ver el mapa.",
    },
    vivoAria: "País, este año (modelo del juego)",
    legVivo: { inc: "Incidencia /100 mil por año (modelo)", prev: "Prevalencia /100 mil (modelo)", mort: "Muertes /100 mil por año (modelo)", cura: "Curas /100 mil por año (modelo)" },
    nomesNivel: { P: "Prevención", D: "Diagnóstico", T: "Tratamiento" }, e: " y ",
    infoEq: (n) => `Equilibrio <b>${n}/3</b>`,
    eqFalta: (l) => `↑ Para subir: ${l}`, os3: "los 3 niveles",
    eqCompleto: "✓ Los 3 niveles completos",
    infoVivo: {
      inc: (n, x) => `Incidencia (modelo): <b>${n}</b> casos este año · <b>${x}</b>/100 mil`,
      prev: (n, x) => `Prevalencia (modelo): <b>${n}</b> personas · <b>${x}</b>/100 mil`,
      mort: (n, x) => `Muertes (modelo): <b>${n}</b> este año · <b>${x}</b>/100 mil`,
      cura: (n, x) => `Curas (modelo): <b>${n}</b> este año · <b>${x}</b>/100 mil`,
    },
    infoComp: (n, a) => `📌 Prometiste ${n} hasta ${a}`,
    convNomes: { vph: "Convenio con laboratorio privado de VPH", mamo: "Convenio con clínica privada de mamografía", quimio: "Convenio con una fundación (Hospital Día)",
      radio: "Convenio con radioterapia privada", paliativos: "Convenio con ONG de cuidados paliativos", pesquisa: "Convenio con una universidad" },
    convFeito: "🤝 convenio", convAria: (n, c) => `${n}: 💰 ${c} por año`, porAno: "año",
    convTroca: "Inversión pública: el convenio termina",
    pausar: "Pausar", seguir: "Seguir",
    terminar: (a) => `Terminar ${a} ⏩`,
    rodape: (c, p) => `👍 Confianza ${c} · ⭐ +${p} este año`,
    imprevisto: "Imprevisto", escenario: "Escenario del juego (ilustrativo)",
    demandaTit: "Demanda del año", proxDemanda: "Ver la demanda del año",
    quem: { cid: "Ciudadanos", pub: "Institución pública", priv: "Institución privada", acad: "Institución académica", int: "Cooperación internacional" },
    semOrcOp: "sin presupuesto", inspirado: "Inspirado en",
    convPago: (c, n) => `Convenios: −💰 ${c} (${n})`,
    convCancel: (n) => `Sin presupuesto: ${n} convenio(s) cancelado(s).`,
    confOrc: (b) => `Confianza ${b > 0 ? "alta" : "baja"}: ${b > 0 ? "+" : "−"}💰 ${Math.abs(b)} en el presupuesto`,
    compOk: (n, d) => `Compromiso cumplido: ${n} en ${d} (+👍 8)`,
    compFalhou: (n, d) => `Compromiso incumplido: ${n} en ${d} (−👍 12)`,
    resPais: (c, m, k) => `País este año (modelo): ${c} casos diagnosticados, ${m} muertes y ${k} curas.`,
    resConfAno: (a, b) => `Confianza: 👍 ${a} → ${b}`,
    resConf: (c) => `Confianza al final: 👍 <b>${c}</b>`,
    resComp: (ok, tot) => `Compromisos cumplidos: <b>${ok}</b> de ${tot}`,
    resTot: (c, m, k) => `En 10 años (modelo del juego): <b>${c}</b> casos diagnosticados, <b>${m}</b> muertes y <b>${k}</b> curas.`,
    modeloNota: "Modelo del juego: incidencia ≈ 2,1 × muertes (proporción de GLOBOCAN 2022: 13.783 casos y 6.581 muertes); punto de partida: muertes registradas por departamento en el Atlas 2015–2019. Lo demás es ilustrativo.",
  },
  pt: {
    sub: "Paraguai contra o câncer",
    h1: "Epidemia: Paraguai contra o câncer",
    intro: "Você é responsável pelo controle do câncer no Paraguai de 2015 a 2024. Os primeiros 5 anos partem dos dados reais do Atlas de Mortalidad por Cáncer; os 5 seguintes são uma projeção das suas decisões.",
    passos: [
      "Cada ano dura 12 meses (uns 24 segundos; toque na data ⏸ para pausar). Toque num departamento e escolha ações com o seu orçamento 💰: o que você faz cedo rende mais.",
      "Três níveis: <b>1º Prevenção</b>, <b>2º Diagnóstico</b> e <b>3º Tratamento</b>. O <b>equilíbrio</b> de um departamento é o seu nível mais baixo: só os três juntos curam mais e multiplicam os pontos (pela população). Diagnóstico sem tratamento forma fila.",
      "No alto à direita: incidência, prevalência, óbitos e curas do país, em tempo real. Toque nelas para ver o mapa de cada uma.",
      "🤝 Convênios: mais baratos para começar, mas se pagam todo ano.",
      "Cada ano traz um fato real, às vezes um imprevisto (royalties de Itaipu, epidemias, investimento estrangeiro) e uma demanda da sociedade. Suas respostas mudam a confiança 👍, e a confiança muda o orçamento.",
      "Onde a estatística é baixa, falta diagnóstico, não câncer: diagnosticar revela casos ocultos e a taxa registrada sobe. É bom sinal!",
    ],
    aviso: "Simulação educativa (beta). Os dados de partida e o fato histórico de cada ano são reais, com fonte. Os efeitos das ações, os números em tempo real, os imprevistos, as demandas e os pontos são do modelo do jogo.",
    creditosTit: "Créditos",
    creditos: [
      "<b>Desenvolvimento:</b> Gianmarlon Pandolfo, estudante de Medicina (UNINTER Tres Fronteras).",
      "<b>Trabalho base:</b> Silva GIS, Pandolfo GA, et al. <i>Mortalidad por Cáncer en Paraguay: Análisis Epidemiológico, Disparidades Geográficas y Desafíos para el Control</i>. Revisão sistemática, 2026.",
      "<b>Coautoria:</b> Claude Opus 5.5 (Anthropic), no desenho do jogo, na programação e na conferência das fontes.",
    ],
    comecar: "Começar", continuar: "Continuar partida", nova: "Nova partida",
    ajuda: "Como se joga", fechar: "Fechar",
    anoDe: (a, i) => `${a} · ano ${i} de 10`,
    modoCob: "Equilíbrio", modoReg: "Taxas",
    legCob: "Equilíbrio = nível mais baixo", legReg: "Taxa padronizada /100 mil",
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
      radio: ["Acelerador linear público", "radioterapia; é para sempre"],
      paliativos: ["Cuidados paliativos", "qualidade de vida"],
      pesquisa: ["Centro de pesquisa e registro", "revela a carga real aqui e nos vizinhos; +20% de pontos aqui"],
    },
    custo: (c) => (c ? `💰 ${c}` : "grátis"), custoAno: (c) => `💰 ${c}/ano`, ativo: "✓ ativo",
    dica1: "Dica: Central já tem tratamento (INCAN). Some ali prevenção e diagnóstico.",
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
    beta: "Versão beta para testes. Conte o que achou.",
    rankTit: "Ranking do congresso",
    rankIntro: "Entre no ranking que aparece no estande. Pode usar seu nome ou um apelido.",
    rankNome: "Nome", rankFac: "Faculdade", rankTurma: "Turma",
    rankConsent: "Aceito que meu nome, faculdade e turma apareçam no ranking do congresso. Os dados ficam numa planilha do Google de Gianmarlon Pandolfo, autor do jogo, e são apagados em 31/10/2026.",
    rankEnviar: "Entrar no ranking", rankEnviando: "Enviando…",
    rankJa: (p) => `Pronto! Você está no ranking${p ? `, na posição ${p}` : ""}.`,
    rankCampos: "Preencha nome, faculdade e turma.",
    rankSemOk: "Para entrar no ranking, marque a autorização.",
    rankErro: "Não deu para enviar. Confira a conexão e tente de novo.",
    rankFechado: "O ranking do congresso abre em breve.",
    rankEncerrado: "O ranking do congresso já terminou.",
    rankVer: "Ver ranking",
    ultimo: "Ver meu último resultado",
    shareTxt: "Jogue Epidemia: Paraguai contra o câncer",
    meses: ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"],
    vivo: { inc: "Incidência", prev: "Prevalência", mort: "Óbitos", cura: "Curas" },
    vivoTit: {
      inc: "Casos diagnosticados no país neste ano (modelo do jogo). Toque para ver o mapa.",
      prev: "Pessoas que vivem com um câncer diagnosticado nos últimos 5 anos (modelo do jogo). Toque para ver o mapa.",
      mort: "Óbitos por câncer no país neste ano, estimados (modelo do jogo). Toque para ver o mapa.",
      cura: "Curas entre os pacientes diagnosticados neste ano (modelo do jogo). Toque para ver o mapa.",
    },
    vivoAria: "País, neste ano (modelo do jogo)",
    legVivo: { inc: "Incidência /100 mil por ano (modelo)", prev: "Prevalência /100 mil (modelo)", mort: "Óbitos /100 mil por ano (modelo)", cura: "Curas /100 mil por ano (modelo)" },
    nomesNivel: { P: "Prevenção", D: "Diagnóstico", T: "Tratamento" }, e: " e ",
    infoEq: (n) => `Equilíbrio <b>${n}/3</b>`,
    eqFalta: (l) => `↑ Para subir: ${l}`, os3: "os 3 níveis",
    eqCompleto: "✓ Os 3 níveis completos",
    infoVivo: {
      inc: (n, x) => `Incidência (modelo): <b>${n}</b> casos neste ano · <b>${x}</b>/100 mil`,
      prev: (n, x) => `Prevalência (modelo): <b>${n}</b> pessoas · <b>${x}</b>/100 mil`,
      mort: (n, x) => `Óbitos (modelo): <b>${n}</b> neste ano · <b>${x}</b>/100 mil`,
      cura: (n, x) => `Curas (modelo): <b>${n}</b> neste ano · <b>${x}</b>/100 mil`,
    },
    infoComp: (n, a) => `📌 Você prometeu ${n} até ${a}`,
    convNomes: { vph: "Convênio com laboratório privado de HPV", mamo: "Convênio com clínica privada de mamografia", quimio: "Convênio com uma fundação (Hospital Día)",
      radio: "Convênio com radioterapia privada", paliativos: "Convênio com ONG de cuidados paliativos", pesquisa: "Convênio com uma universidade" },
    convFeito: "🤝 convênio", convAria: (n, c) => `${n}: 💰 ${c} por ano`, porAno: "ano",
    convTroca: "Investimento público: o convênio termina",
    pausar: "Pausar", seguir: "Continuar",
    terminar: (a) => `Terminar ${a} ⏩`,
    rodape: (c, p) => `👍 Confiança ${c} · ⭐ +${p} neste ano`,
    imprevisto: "Imprevisto", escenario: "Cenário do jogo (ilustrativo)",
    demandaTit: "Demanda do ano", proxDemanda: "Ver a demanda do ano",
    quem: { cid: "Cidadãos", pub: "Instituição pública", priv: "Instituição privada", acad: "Instituição acadêmica", int: "Cooperação internacional" },
    semOrcOp: "sem orçamento", inspirado: "Inspirado em",
    convPago: (c, n) => `Convênios: −💰 ${c} (${n})`,
    convCancel: (n) => `Sem orçamento: ${n} convênio(s) cancelado(s).`,
    confOrc: (b) => `Confiança ${b > 0 ? "alta" : "baixa"}: ${b > 0 ? "+" : "−"}💰 ${Math.abs(b)} no orçamento`,
    compOk: (n, d) => `Compromisso cumprido: ${n} em ${d} (+👍 8)`,
    compFalhou: (n, d) => `Compromisso não cumprido: ${n} em ${d} (−👍 12)`,
    resPais: (c, m, k) => `País neste ano (modelo): ${c} casos diagnosticados, ${m} óbitos e ${k} curas.`,
    resConfAno: (a, b) => `Confiança: 👍 ${a} → ${b}`,
    resConf: (c) => `Confiança no fim: 👍 <b>${c}</b>`,
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
    aplicar: () => { for (const id in S.deps) S.deps[id].carga *= 1.05; },
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
    es: ["El INCAN anuncia un nuevo equipo de radioterapia", "Inversión de US$ 2 millones en radioterapia para el INCAN.", "El acelerador lineal público cuesta 💰 2 menos este año.", "La Nación, 25/04/2023"],
    pt: ["O INCAN anuncia um novo equipamento de radioterapia", "Investimento de US$ 2 milhões em radioterapia para o INCAN.", "O acelerador linear público custa 💰 2 a menos neste ano.", "La Nación, 25/04/2023"],
  },
  2024: {
    aplicar: () => { S.mod.vacuna = -1; S.mod.registro = -1; darGratis("concepcion", "quimio"); },
    es: ["Dosis única de la vacuna VPH y notificación obligatoria", "Desde el 01/08/2024 basta una dosis de la vacuna; en noviembre, el Ministerio anunció la notificación obligatoria de todo cáncer confirmado (Res. S.G. N° 752). Concepción inaugura el 10.º Hospital Día oncológico del país.", "Vacuna 💰 1 más barata, registro gratis y Hospital Día gratis en Concepción.", "MSPBS, 2024"],
    pt: ["Dose única da vacina HPV e notificação obrigatória", "Desde 01/08/2024 basta uma dose da vacina; em novembro, o Ministério anunciou a notificação obrigatória de todo câncer confirmado (Res. S.G. N° 752). Concepción inaugura o 10º Hospital Día oncológico do país.", "Vacina 💰 1 mais barata, registro grátis e Hospital Día grátis em Concepción.", "MSPBS, 2024"],
  },
};

/* ---------- imprevistos: a partir de 2016, em metade dos anos, sem repetir ---------- */
const EVENTOS_ALEAT = [
  { id: "itaipu", alvo: () => sortear(DEPS).id, aplicar: (dep) => { S.orc += 2; S.regiao = { dep, valor: 1 }; },
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
    es: ["Cooperación de la OPS/OMS", "La OPS/OMS apoya el test de VPH en {dep}.", "{dep} recibe gratis el test de VPH.", "Ejemplo real: OPS/OMS, prueba de VPH para 100 mil mujeres de Alto Paraná (12/02/2024)."],
    pt: ["Cooperação da OPAS/OMS", "A OPAS/OMS apoia o teste de HPV em {dep}.", "{dep} ganha de graça o teste de HPV.", "Exemplo real: OPAS/OMS, teste de HPV para 100 mil mulheres de Alto Paraná (12/02/2024)."] },
  { id: "oiea", aplicar: () => { S.mod.radio = (S.mod.radio || 0) - 3; },
    es: ["Cooperación técnica para radioterapia", "Un organismo internacional ofrece apoyo técnico para nuevos aceleradores.", "Este año, el acelerador lineal cuesta 💰 3 menos.", ""],
    pt: ["Cooperação técnica para radioterapia", "Um organismo internacional oferece apoio técnico para novos aceleradores.", "Neste ano, o acelerador linear custa 💰 3 a menos.", ""] },
  { id: "yacyreta", alvo: () => (temSlot(S.deps.itapua, "radio") ? undefined : "itapua"), aplicar: () => { S.cupons.push({ dep: "itapua", a: "radio", valor: 4 }); },
    es: ["Fondos de Yacyretá para Itapúa", "La Entidad Binacional Yacyretá ofrece fondos para la radioterapia en Itapúa.", "Este año, el acelerador en Itapúa cuesta 💰 4 menos.", "Ejemplo real: el Gobierno se comprometió a comprar un acelerador para Encarnación con fondos de Yacyretá (ABC Color, 10/05/2024)."],
    pt: ["Recursos de Yacyretá para Itapúa", "A Entidad Binacional Yacyretá oferece recursos para a radioterapia em Itapúa.", "Neste ano, o acelerador em Itapúa custa 💰 4 a menos.", "Exemplo real: o governo se comprometeu a comprar um acelerador para Encarnación com recursos de Yacyretá (ABC Color, 10/05/2024)."] },
];

/* ---------- demandas da sociedade: uma por ano, estilo SimCity. Cada resposta custa, muda a confiança ou vira compromisso ---------- */
const DEMANDAS = [
  { id: "hd", quem: "cid", alvo: () => alvoSem("quimio"),
    es: "Pacientes de {dep} viajan horas para la quimioterapia y piden un Hospital Día.",
    pt: "Pacientes de {dep} viajam horas para a quimioterapia e pedem um Hospital Día.",
    opcoes: [
      { es: "Prometer un Hospital Día en {dep} hasta {ano2}", pt: "Prometer um Hospital Día em {dep} até {ano2}", conf: 4, aplicar: (dep) => prometer(dep, "quimio", 2) },
      { es: "Convenio con una fundación local", pt: "Convênio com uma fundação local", conv: "quimio", conf: 6 },
      { es: "Ahora no", pt: "Agora não", conf: -6 },
    ] },
  { id: "vacuna", quem: "cid", alvo: () => alvoSem("vacuna"),
    es: "Madres de {dep} piden la vacuna contra el VPH en las escuelas.",
    pt: "Mães de {dep} pedem a vacina contra o HPV nas escolas.",
    opcoes: [
      { es: "Campaña de vacunación en {dep}", pt: "Campanha de vacinação em {dep}", compra: "vacuna", conf: 6 },
      { es: "Ahora no", pt: "Agora não", conf: -5 },
    ] },
  { id: "terreno", quem: "pub", alvo: () => alvoSem("mamo"),
    es: "La Gobernación de {dep} ofrece terreno y personal para un mamógrafo.",
    pt: "O governo departamental de {dep} oferece terreno e pessoal para um mamógrafo.",
    opcoes: [
      { es: "Aceptar: este año el mamógrafo en {dep} cuesta 💰 2 menos", pt: "Aceitar: neste ano o mamógrafo em {dep} custa 💰 2 a menos", conf: 3, aplicar: (dep) => S.cupons.push({ dep, a: "mamo", valor: 2 }) },
      { es: "Rechazar", pt: "Recusar", conf: -2 },
    ] },
  { id: "subregistro", quem: "acad", alvo: () => alvoMenorVis(),
    es: "Una Facultad de Medicina propone medir el subregistro de muertes en {dep}.",
    pt: "Uma Faculdade de Medicina propõe medir o sub-registro de óbitos em {dep}.",
    opcoes: [
      { es: "Convenio con la universidad", pt: "Convênio com a universidade", conv: "pesquisa", conf: 3 },
      { es: "Centro de investigación propio", pt: "Centro de pesquisa próprio", compra: "pesquisa", conf: 3 },
      { es: "No", pt: "Não", conf: -1 },
    ] },
  { id: "clinica", quem: "priv", alvo: () => alvoSem("mamo"),
    es: "Una clínica privada de {dep} ofrece mamografías por convenio.",
    pt: "Uma clínica privada de {dep} oferece mamografias por convênio.",
    opcoes: [
      { es: "Firmar el convenio", pt: "Assinar o convênio", conv: "mamo", conf: 2 },
      { es: "Prefiero invertir en lo público", pt: "Prefiro investir no público", conf: 0 },
    ] },
  { id: "remedios", quem: "cid", alvo: () => null, fonte: "La Nación, 09/03/2026; Decreto N° 2064/2019, art. 23",
    es: "La asociación de pacientes denuncia falta de medicamentos oncológicos.",
    pt: "A associação de pacientes denuncia falta de remédios oncológicos.",
    opcoes: [
      { es: "Compra de urgencia", pt: "Compra de urgência", custo: 3, gasto: "T", conf: 8 },
      { es: "Actualizar el Listado Nacional de Drogas Antineoplásicas: el año que viene la quimioterapia cuesta 💰 1 menos", pt: "Atualizar o Listado Nacional de Drogas Antineoplásicas: no ano que vem a quimioterapia custa 💰 1 a menos", conf: 3, aplicar: () => { S.modProx.quimio = (S.modProx.quimio || 0) - 1; } },
      { es: "Ignorar", pt: "Ignorar", conf: -10 },
    ] },
  { id: "ops", quem: "int", alvo: () => alvoSem("vph"), fonte: "OPS/OMS, 12/02/2024",
    es: "La OPS/OMS ofrece apoyo al test de VPH en {dep} si el país pone el personal.",
    pt: "A OPAS/OMS oferece apoio ao teste de HPV em {dep} se o país puser o pessoal.",
    opcoes: [
      { es: "Aceptar: test de VPH en {dep}", pt: "Aceitar: teste de HPV em {dep}", custo: 1, gasto: "D", conf: 4, aplicar: (dep) => darGratis(dep, "vph") },
      { es: "No", pt: "Não", conf: -1 },
    ] },
  { id: "tabaco", quem: "cid", alvo: () => alvoSem("tabaco"),
    es: "Escuelas de {dep} piden charlas contra el tabaco.",
    pt: "Escolas de {dep} pedem palestras contra o tabaco.",
    opcoes: [
      { es: "Campaña antitabaco en {dep}", pt: "Campanha antitabaco em {dep}", compra: "tabaco", conf: 4 },
      { es: "No", pt: "Não", conf: -3 },
    ] },
  { id: "radio", quem: "cid", alvo: () => alvoSem("radio", ["alto-parana", "itapua"]), fonte: "La Nación, 23/07/2024",
    es: "La prensa muestra pacientes de {dep} que tienen que viajar a Capiatá para la radioterapia.",
    pt: "A imprensa mostra pacientes de {dep} que precisam viajar a Capiatá para a radioterapia.",
    opcoes: [
      { es: "Convenio con radioterapia privada", pt: "Convênio com radioterapia privada", conv: "radio", conf: 6 },
      { es: "Prometer un acelerador en {dep} hasta {ano3}", pt: "Prometer um acelerador em {dep} até {ano3}", conf: 4, aplicar: (dep) => prometer(dep, "radio", 3) },
      { es: "Ignorar", pt: "Ignorar", conf: -8 },
    ] },
  { id: "paliativos", quem: "pub", alvo: () => alvoSem("paliativos"),
    es: "El municipio de {dep} pide cuidados paliativos en casa.",
    pt: "O município de {dep} pede cuidados paliativos em casa.",
    opcoes: [
      { es: "Convenio con una ONG", pt: "Convênio com uma ONG", conv: "paliativos", conf: 4 },
      { es: "Servicio público", pt: "Serviço público", compra: "paliativos", conf: 4 },
      { es: "No", pt: "Não", conf: -3 },
    ] },
  { id: "formacion", quem: "acad", alvo: () => null,
    es: "Una universidad propone formar oncólogos para el interior.",
    pt: "Uma universidade propõe formar oncologistas para o interior.",
    opcoes: [
      { es: "Becas: por 3 años el tratamiento cuesta 💰 1 menos", pt: "Bolsas: por 3 anos o tratamento custa 💰 1 a menos", custo: 2, gasto: "T", conf: 3, aplicar: () => { S.descTrat = { ate: S.anoIdx + 3, valor: 1 }; } },
      { es: "No", pt: "Não", conf: 0 },
    ] },
  { id: "lab", quem: "priv", alvo: () => alvoSem("vph"),
    es: "Un laboratorio privado ofrece procesar los tests de VPH de {dep} por convenio.",
    pt: "Um laboratório privado oferece processar os testes de HPV de {dep} por convênio.",
    opcoes: [
      { es: "Firmar el convenio", pt: "Assinar o convênio", conv: "vph", conf: 2 },
      { es: "No", pt: "Não", conf: 0 },
    ] },
];

/* ---------- lições (fatos com fonte) ---------- */
const LICOES = {
  vacuna: { es: ["El VPH causa casi todos los cánceres de cuello uterino; en Paraguay, 58,9% de los casos son por los tipos 16 y 18.", "ICO/IARC HPV Information Centre, 2023"], pt: ["O HPV causa quase todos os cânceres do colo do útero; no Paraguai, 58,9% dos casos são pelos tipos 16 e 18.", "ICO/IARC HPV Information Centre, 2023"] },
  tabaco: { es: ["12,5% de los adultos fuman cigarrillo y 17% usan alguna forma de tabaco. El pulmón es la 1.ª causa de muerte por cáncer en los hombres.", "ENFR 2022; Atlas 2015–2019"], pt: ["12,5% dos adultos fumam cigarro e 17% usam alguma forma de tabaco. O pulmão é a 1ª causa de morte por câncer nos homens.", "ENFR 2022; Atlas 2015–2019"] },
  habitos: { es: ["Solo 3,9% comen 5 porciones de frutas y verduras por día. El colorrectal es el cáncer que más crece: cerca de 3% por año desde 1990.", "ENFR 2022; Leite et al., 2025"], pt: ["Só 3,9% comem 5 porções de frutas e verduras por dia. O colorretal é o câncer que mais cresce: cerca de 3% ao ano desde 1990.", "ENFR 2022; Leite et al., 2025"] },
  vph: { es: ["En 2024 el Ministerio de Salud hizo 72.133 tests de VPH y encontró 9.863 positivos (13,7%). Diagnosticar hace subir los casos visibles.", "MSPBS"], pt: ["Em 2024 o Ministério da Saúde fez 72.133 testes de HPV e encontrou 9.863 positivos (13,7%). Diagnosticar faz subir os casos visíveis.", "MSPBS"] },
  mamo: { es: ["La mama es la 1.ª causa de muerte por cáncer en las mujeres (1.945 muertes, 20,2%). 51,1% de las mujeres ya se hicieron una mamografía.", "Atlas 2015–2019; ENFR 2023"], pt: ["A mama é a 1ª causa de morte por câncer nas mulheres (1.945 mortes, 20,2%). 51,1% das mulheres já fizeram mamografia.", "Atlas 2015–2019; ENFR 2023"] },
  registro: { es: ["Tasa baja no es riesgo bajo: Canindeyú tiene la menor tasa estandarizada (41,3) y la mayor proporción de muertes femeninas por cuello uterino (36,8%).", "Atlas 2015–2019"], pt: ["Taxa baixa não é risco baixo: Canindeyú tem a menor taxa padronizada (41,3) e a maior proporção de mortes femininas por colo do útero (36,8%).", "Atlas 2015–2019"] },
  quimio: { es: ["Los Hospitales Día oncológicos llevan la quimioterapia al interior; el 10.º se inauguró en Concepción en 2024.", "MSPBS, 21/11/2024"], pt: ["Os Hospitais Día oncológicos levam a quimioterapia ao interior; o 10º foi inaugurado em Concepción em 2024.", "MSPBS, 21/11/2024"] },
  radio: { es: ["Radioterapia pública: un único lugar para todo el país, el INCAN, en Capiatá, con 3 aceleradores lineales.", "MSPBS, 2024"], pt: ["Radioterapia pública: um único lugar para o país inteiro, o INCAN, em Capiatá, com 3 aceleradores lineares.", "MSPBS, 2024"] },
  privado: { es: ["El IPS contrata radioterapia de prestadores privados por licitación. Resuelve rápido, pero se paga todos los años.", "DNCP, licitación de radioterapia del IPS"], pt: ["O IPS contrata radioterapia de prestadores privados por licitação. Resolve rápido, mas se paga todo ano.", "DNCP, licitação de radioterapia do IPS"] },
  paliativos: { es: ["En Paraguay, los cuidados paliativos en la comunidad «generalmente no están disponibles».", "OMS, Cancer Country Profile Paraguay 2020"], pt: ["No Paraguai, os cuidados paliativos na comunidade «geralmente não estão disponíveis».", "OMS, Cancer Country Profile Paraguay 2020"] },
  pesquisa: { es: ["El único registro de cáncer de base poblacional se creó en 2020 para Asunción y Central; los datos preliminares de 2019 salieron recién en 2024.", "DGVS/MSPBS, 05/02/2024"], pt: ["O único registro de câncer de base populacional foi criado em 2020 para Asunción e Central; os dados preliminares de 2019 só saíram em 2024.", "DGVS/MSPBS, 05/02/2024"] },
  fila: { es: ["Diagnosticar sin tratar crea filas: en Ciudad del Este, de cada 10 pacientes diagnosticados, 6 necesitarán radioterapia y deben viajar.", "La Nación, 23/07/2024"], pt: ["Diagnosticar sem tratar cria filas: em Ciudad del Este, de cada 10 pacientes diagnosticados, 6 vão precisar de radioterapia e precisam viajar.", "La Nación, 23/07/2024"] },
  colo: { es: ["En 8 de los 18 departamentos, el cuello uterino es la 1.ª causa de muerte por cáncer en las mujeres: un cáncer evitable.", "Atlas 2015–2019"], pt: ["Em 8 dos 18 departamentos, o colo do útero é a 1ª causa de morte por câncer nas mulheres: um câncer evitável.", "Atlas 2015–2019"] },
  jovens: { es: ["La mortalidad por cuello uterino en mujeres de 20 a 44 años sube 3,7% por año (1997–2017).", "Torres-Roman et al., BMC Public Health 2022"], pt: ["A mortalidade por colo do útero em mulheres de 20 a 44 anos sobe 3,7% ao ano (1997–2017).", "Torres-Roman et al., BMC Public Health 2022"] },
  mapa: { es: ["El mapa del cáncer también es un mapa del acceso al diagnóstico: Asunción tiene tasa estandarizada de 103,9 y Canindeyú de 41,3 por 100 mil (2015–2019).", "Atlas 2015–2019"], pt: ["O mapa do câncer também é um mapa do acesso ao diagnóstico: Asunción tem taxa padronizada de 103,9 e Canindeyú de 41,3 por 100 mil (2015–2019).", "Atlas 2015–2019"] },
};
const LICOES_GERAIS = ["mapa", "colo", "registro", "jovens"];

const FONTES = [
  "Silva GIS, Pandolfo GA, et al. Mortalidad por cáncer en Paraguay: análisis epidemiológico, disparidades geográficas y desafíos para el control. Revisión sistemática, 2026.",
  "MSPBS/DVENT. Atlas de Mortalidad por Cáncer en Paraguay 2015–2019. Asunción; 2022.",
  "IARC. GLOBOCAN 2022, Global Cancer Observatory.",
  "INE. Censo Nacional de Población y Viviendas 2022.",
  "MSPBS. Encuesta Nacional de Factores de Riesgo (ENFR) 2022; Sequera VG. An Fac Cienc Méd. 2025;58(3).",
  "ICO/IARC HPV Information Centre. Paraguay: HPV and related cancers, fact sheet 2023.",
  "Leite LF, et al. Cancer Res Commun. 2025;5(12):2236–2248.",
  "Torres-Roman JS, et al. BMC Public Health. 2022;22:113.",
  "Paraguay. Ley N° 6266/2018 y Decreto N° 2064/2019.",
  "OMS. Cancer Country Profile Paraguay, 2020. Pediatría (Asunción) 2024;51(2):72-80.",
  "MSPBS (2024–2026), DGVS (2024), OPS/OMS (2024, 2026), OIEA (2026), City Cancer Challenge (2022), ABC Color (2024), La Nación (2023, 2024, 2026), DNCP.",
  "Mapa: geoBoundaries (CC BY 4.0).",
];


/* ---------- estado ---------- */
let lang = ler("epidemia-py-lang") === "pt" ? "pt" : "es";
const t = (k) => T[lang][k] ?? T.es[k];
let S = null;
let tAnterior = performance.now(), acumulado = 0;   // relógio do jogo
const LIM = {};                                     // limites das classes das camadas ao vivo (fixos, do começo do jogo)

function novoEstado() {
  const deps = {};
  for (const d of DEPS) {
    const vis0 = 0.55 + 0.45 * (d.tee - TEE_MIN) / (TEE_MAX - TEE_MIN);   // onde a taxa é baixa, falta diagnóstico
    deps[d.id] = {
      vis0, visEv: 0, carga: d.tee / vis0, carga0: d.tee / vis0,
      mort0: d.obitos / 5 / vis0,   // óbitos por ano: os registrados no Atlas 2015-2019 divididos pela parte visível
      feitas: {}, pago: {}, conv: {}, ind: { casos: 0, mortes: 0, curas: 0 }, prev: 0, pc0: 0,
    };
  }
  // Situação inicial simplificada: tratamento concentrado no INCAN (Central) e no IPS (Asunción)
  for (const a of ["quimio", "radio", "paliativos"]) deps.central.feitas[a] = -1;
  deps.asuncion.feitas.quimio = -1;
  return {
    deps, id: Math.random().toString(36).slice(2, 10) + Date.now().toString(36), enviado: null,
    anoIdx: 0, mes: 0, orc: 0, orcExtra: 0, pontos: 0, ptsAno: 0, conf: 50, confInicio: 50,
    mod: {}, modProx: {}, cupons: [], regiao: null, descTrat: null, comp: [], usadas: [], aleatUsados: [], evAleat: null, demanda: null,
    sel: "central", modo: "cob", fase: "evento", pausa: false, gasto: { P: 0, D: 0, T: 0, X: 0 },
    tot: { casos: 0, mortes: 0, curas: 0 }, licoesVistas: [], log: [], compradasAno: [], fim: false,
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
  return x;
}
const custo = (a, id) => Math.max(0, ACOES[a].custo + (S.mod[a] || 0) - desconto(a, id));
const custoConv = (a, id) => Math.max(0, ACOES[a].conv - (S.regiao && S.regiao.dep === id ? S.regiao.valor : 0));
/* Só se desfaz o que foi pago neste ano (o que veio de graça, de uma demanda ou de renovação não) */
const pagoNoAno = (d, a) => (d.feitas[a] === S.anoIdx ? d.pago[a] || 0 : 0);
const convNoAno = (d, a) => (d.conv[a] && d.conv[a].ano === S.anoIdx ? d.conv[a].pago || 0 : 0);
const licaoDe = (a, conv) => (conv && a === "radio" ? "privado" : a);

function vis(id) {
  const d = S.deps[id];
  let v = d.vis0 + d.visEv;
  for (const a of SLOTS.D) if (temSlot(d, a)) v += ACOES[a].vis;
  if (temPesq(d)) v += 0.10;
  for (const n of DEP[id].vizinhos) if (temPesq(S.deps[n])) v += 0.05;
  return Math.max(0.2, Math.min(1, v));
}
const taxaReg = (id) => S.deps[id].carga * vis(id);
const temFila = (id) => { const d = S.deps[id]; return nivel(d, "D") >= 2 && nivel(d, "T") === 0; };
const ocultoConhecido = (id) => { const d = S.deps[id]; return nivel(d, "D") >= 1 || temPesq(d) || DEP[id].vizinhos.some((n) => temPesq(S.deps[n])); };

/* Chance de cura entre os diagnosticados: diagnóstico e tratamento juntos curam mais (é o que o equilíbrio mede) */
function chanceCura(id) {
  const d = S.deps[id], D = nivel(d, "D"), Tn = nivel(d, "T");
  let pc = 0.15 + 0.05 * D + 0.06 * Tn + 0.06 * Math.min(D, Tn);
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
  if (temFila(id)) p *= 0.5;
  return p;
}
const pontosAno = () => DEPS.reduce((s, d) => s + pontosDep(d.id), 0);
const bonusConf = () => Math.round((S.conf - 50) / 10);

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
  S.mes = 0; S.ptsAno = 0; acumulado = 0;
  S.mod = { ...S.modProx }; S.modProx = {}; S.cupons = []; S.regiao = null; S.compradasAno = []; S.confInicio = S.conf;
  for (const id in S.deps) { S.deps[id].ind = { casos: 0, mortes: 0, curas: 0 }; S.deps[id].eqInicio = equil(id); }
  const bonus = bonusConf();
  S.orc = Math.max(0, S.orc + ORC_BASE + S.orcExtra + bonus);
  S.avisoOrc = { bonus, convPago: 0, convN: 0, convCancel: 0 };
  EVENTOS[ano()].aplicar();
  S.evAleat = null;
  const livres = EVENTOS_ALEAT.filter((e) => !S.aleatUsados.includes(e.id));
  if (S.anoIdx > 0 && livres.length && Math.random() < 0.5) {
    const e = sortear(livres), dep = e.alvo ? e.alvo() : null;
    if (dep !== undefined) { e.aplicar(dep); S.evAleat = { id: e.id, dep }; S.aleatUsados.push(e.id); }
  }
  // convênios: a anuidade vence no começo do ano; sem dinheiro, o convênio acaba
  for (const id in S.deps) {
    const d = S.deps[id];
    for (const a of Object.keys(d.conv)) {
      if (d.conv[a].ano === S.anoIdx) continue;
      const c = ACOES[a].conv;
      if (S.orc >= c) { S.orc -= c; S.gasto[ACOES[a].nivel] += c; S.avisoOrc.convPago += c; S.avisoOrc.convN++; }
      else { delete d.conv[a]; S.avisoOrc.convCancel++; }
    }
  }
  S.demanda = escolherDemanda();
  S.fase = "evento";
  salvar();
  mostrarEvento();
}

function simularMes() {
  for (const d of DEPS) {
    const st = S.deps[d.id], f = fluxos(d.id);
    st.ind.casos += f.casos / 12; st.ind.mortes += f.mortes / 12; st.ind.curas += f.curas / 12;
    st.prev = Math.max(0, st.prev + (f.casos - f.mortes * f.v - st.prev / 5) / 12);   // entra quem é diagnosticado; sai quem morre ou passa de 5 anos
  }
  S.ptsAno += pontosAno() / 12;
}

function avancarMes() {
  simularMes();
  S.mes++;
  if (S.mes >= 12) { fecharAno(); return; }
  salvar();
  renderVivo();
}

function fecharAno() {
  if (!S || S.fase !== "jogando") return;
  while (S.mes < 12) { simularMes(); S.mes++; }   // ⏩ termina o ano com o que já está feito
  const pts = Math.round(S.ptsAno);
  S.pontos += pts;
  S.ptsAno = 0;
  const subiu = [], filas = [], comp = [], ind = { casos: 0, mortes: 0, curas: 0 };
  let novosEq = 0;
  for (const d of DEPS) {
    const st = S.deps[d.id];
    // "subiu" só pelo diagnóstico (mais casos visíveis), não pelo crescimento da carga
    if (vis(d.id) > (st.visAnterior ?? st.vis0) + 0.01) subiu.push(d.nome);
    if (temFila(d.id)) filas.push(d.nome);
    if (!st.eqInicio && equil(d.id) >= 1) novosEq++;
    st.visAnterior = vis(d.id);
    for (const k in ind) ind[k] += st.ind[k];
    st.carga *= 1 + 0.012 - 0.006 * nivel(st, "P");   // envelhecimento sobe a carga; prevenção freia (ilustrativo)
  }
  for (const k in ind) { ind[k] = Math.round(ind[k]); S.tot[k] += ind[k]; }
  for (const c of S.comp) {
    if (c.estado !== "aberto") continue;
    if (temSlot(S.deps[c.dep], c.a)) { c.estado = "cumprido"; S.conf += 8; comp.push({ ok: true, a: c.a, dep: c.dep }); }
    else if (S.anoIdx >= c.ate) { c.estado = "falhou"; S.conf -= 12; comp.push({ ok: false, a: c.a, dep: c.dep }); }
  }
  S.conf = limitar(S.conf + 2 * novosEq - 2 * filas.length);
  const n3 = DEPS.filter((d) => equil(d.id) >= 1).length;
  const licao = escolherLicao(filas.length > 0);
  S.log.push({ ano: ano(), pts, subiu, filas, n3, licao, ind, comp, conf0: S.confInicio, conf1: S.conf });
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
  if (S.anoIdx >= ANOS.length - 1) { S.fim = true; S.fase = "fim"; salvar(); mostrarFim(); return; }
  S.anoIdx++;
  iniciarAno();
  render();
}

/* ---------- relógio: 1 mês a cada SEG_MES segundos; para com janela aberta, pausa ou aba escondida ---------- */
const relogioRodando = () => S && !S.fim && S.fase === "jogando" && !S.pausa && $("#modal").hidden && !$("#tela-jogo").hidden && document.visibilityState === "visible";
setInterval(() => {
  const agora = performance.now(), dt = Math.min(1, (agora - tAnterior) / 1000);
  tAnterior = agora;
  if (!relogioRodando()) return;
  acumulado += dt;
  if (acumulado >= SEG_MES) { acumulado -= SEG_MES; avancarMes(); }
}, 250);

/* ---------- compras: investimento público (para sempre) ou convênio (anuidade) ---------- */
function comprar(id, a) {
  const d = S.deps[id];
  if (publico(d, a)) return pagoNoAno(d, a) > 0 ? desfazer(id, a) : toast(t("jaAtivo"));
  if (d.conv[a] && convNoAno(d, a) > 0) return desfazerConv(id, a);
  const c = custo(a, id);
  if (c > S.orc) return toast(t("semOrc"));
  S.orc -= c;
  S.gasto[ACOES[a].nivel] += c;
  const tinhaConv = !!d.conv[a];
  if (tinhaConv) { d.convSubst = d.convSubst || {}; d.convSubst[a] = d.conv[a]; delete d.conv[a]; }   // o público substitui o convênio
  d.feitas[a] = S.anoIdx; d.pago[a] = c;
  S.compradasAno.push(a);
  salvar();
  render();
  const [nome, alvo] = t("acoes")[a];
  toast(tinhaConv ? t("convTroca") : t("compra")(ACOES[a].ico, nome, alvo));
  destacar(id, ACOES[a].ico);
}

function contratar(id, a) {
  const d = S.deps[id];
  if (temSlot(d, a)) return toast(t("jaAtivo"));
  const c = custoConv(a, id);
  if (c > S.orc) return toast(t("semOrc"));
  S.orc -= c;
  S.gasto[ACOES[a].nivel] += c;
  d.conv[a] = { ano: S.anoIdx, pago: c };
  S.compradasAno.push(licaoDe(a, true));
  salvar();
  render();
  toast(t("compra")("🤝", t("convNomes")[a], t("custoAno")(ACOES[a].conv)));
  destacar(id, "🤝");
}

function tirarCompra(a) { const i = S.compradasAno.lastIndexOf(a); if (i >= 0) S.compradasAno.splice(i, 1); }
function desfazer(id, a) {
  const d = S.deps[id], v = pagoNoAno(d, a);
  S.orc += v; S.gasto[ACOES[a].nivel] -= v;
  delete d.feitas[a]; delete d.pago[a];
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
function montarMapa() {
  $("#mapa-wrap").innerHTML = `<svg id="mapa" viewBox="${MAPA.viewBox}" role="group" aria-label="Paraguay"><g id="g-deps">${MAPA.deps}</g><g id="g-lbl">${MAPA.lbl}</g><g id="g-alerta" class="alerta"></g><g id="g-fx"></g></svg>`;
  const mk = document.querySelector("#mapa .dep-marker");
  if (mk) mk.setAttribute("r", "36");
  document.querySelectorAll("#mapa .dep").forEach((el) => {
    el.setAttribute("tabindex", "0");
    el.setAttribute("role", "button");
    el.setAttribute("aria-label", DEP[el.dataset.dep].nome);
  });
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
  if (S.modo === "cob") return `<span class="leg-tit">${esc(t("legCob"))}</span>${[0, 1, 2, 3].map((n) => caixa(`--cob${n}`, n)).join("")}`;
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
  // "!" onde há fila; 📌 onde há promessa em aberto
  $("#g-alerta").innerHTML = DEPS.filter((d) => temFila(d.id)).map((d) => {
    const [x, y0] = posLbl(d.id), y = y0 - 70;
    return `<circle cx="${x}" cy="${y}" r="30"/><text x="${x}" y="${y + 16}">!</text>`;
  }).join("") + S.comp.filter((c) => c.estado === "aberto").map((c) => {
    const [x, y] = posLbl(c.dep);
    return `<text class="pino" x="${x + 80}" y="${y - 30}">📌</text>`;
  }).join("");
  $("#legenda").innerHTML = legendaHTML();
  $("#legenda").classList.toggle("q4", S.modo === "cob");   // 0 1 2 3 cabem numa linha só
  document.querySelectorAll("[data-modo]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.modo === S.modo)));
}

/* Cada ação faz o departamento piscar no mapa, com o ícone subindo */
function destacar(id, ico) {
  if (!id || !$("#mapa")) return;
  const els = document.querySelectorAll(`#mapa .dep[data-dep="${id}"]`);
  els.forEach((el) => el.classList.remove("pulso"));
  void $("#mapa").getBoundingClientRect();
  els.forEach((el) => el.classList.add("pulso"));
  if (!ico) return;
  const [x, y] = posLbl(id);
  const tx = document.createElementNS("http://www.w3.org/2000/svg", "text");
  tx.setAttribute("x", x);
  tx.setAttribute("y", y - 40);
  tx.textContent = ico;
  $("#g-fx").appendChild(tx);
  setTimeout(() => tx.remove(), 1600);
}

/* ---------- painel do departamento ---------- */
function slotHTML(id, a) {
  const d = S.deps[id];
  const [nome, alvo] = t("acoes")[a];
  const pub = publico(d, a), cv = !!d.conv[a];
  const desfaz = (pub && pagoNoAno(d, a) > 0) || (cv && convNoAno(d, a) > 0);
  const preco = pub ? t("ativo") : cv ? t("convFeito") : t("custo")(custo(a, id));
  const semDinheiro = !pub && !cv && custo(a, id) > S.orc;
  const nv = ACOES[a].nivel;
  const principal = `<button type="button" class="acao${pub || cv ? " feita" : ""}${cv ? " conv-on" : ""}${desfaz ? " desfaz" : ""}" data-acao="${a}" ${semDinheiro ? "disabled" : ""}
    aria-pressed="${pub || cv}" aria-label="${esc(`${nome} (${alvo}): ${preco}`)}" title="${esc(`${nome} → ${alvo}`)}">
    <span class="ico" aria-hidden="true">${ACOES[a].ico}</span><span class="nome">${esc(t("curtas")[a])}</span><span class="custo">${esc(preco)}</span></button>`;
  const cc = ACOES[a].conv && !pub && !cv ? custoConv(a, id) : null;
  const conv = cc === null ? "" : `<button type="button" class="conv" data-conv="${a}" ${cc > S.orc ? "disabled" : ""} aria-label="${esc(t("convAria")(t("convNomes")[a], cc))}" title="${esc(t("convAria")(t("convNomes")[a], cc))}">🤝${cc}</button>`;
  return `<div class="slot" style="--nv: var(--nv-${nv === "X" ? "d" : nv.toLowerCase()})">${principal}${conv}</div>`;
}

/* Linha do departamento que acompanha a camada do mapa: taxa do Atlas ou o número ao vivo da camada escolhida */
function linhaDep() {
  const id = S.sel, st = S.deps[id];
  if (!MODOS_VIVOS.includes(S.modo)) return t("infoTaxa")(fmt1(DEP[id].tee), fmt1(taxaReg(id)));
  const n = S.modo === "inc" ? st.ind.casos : S.modo === "prev" ? st.prev : S.modo === "mort" ? st.ind.mortes : st.ind.curas;
  return t("infoVivo")[S.modo](fmtInt(n), fmtInt(valorVivo(S.modo, id)));
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
  const jogando = S && !S.fim && !$("#tela-jogo").hidden;
  $("#h-sub").textContent = t("sub");
  $("#btn-idioma").textContent = lang === "es" ? "PT" : "ES";
  $("#btn-ajuda").setAttribute("aria-label", t("ajuda"));
  for (const k of ["#h-ano", "#h-dinheiro", "#h-pontos"]) $(k).hidden = !jogando;
  document.querySelector(".hud .marca").hidden = jogando;
}

function montarVivo() {
  const v = t("vivo"), tit = t("vivoTit");
  $("#vivo").innerHTML = MODOS_VIVOS.map((m) => `<button type="button" data-modo="${m}" class="v-${m}" aria-pressed="${S.modo === m}" title="${esc(tit[m])}"><span>${esc(v[m])}</span><b></b></button>`).join("");
  $("#vivo").setAttribute("aria-label", t("vivoAria"));
}

/* Atualizado a cada mês: placar, contadores do país, números do departamento e barra de baixo */
function renderVivo() {
  if (!S || S.fim) return;
  const data = `${ano()} · ${t("meses")[Math.min(11, S.mes)]}`, h = $("#h-ano");   // a data também é o botão de pausa
  h.textContent = `${S.pausa ? "▶" : "⏸"} ${data}`;
  h.setAttribute("aria-label", `${S.pausa ? t("seguir") : t("pausar")} (${data})`);
  h.setAttribute("aria-pressed", String(!!S.pausa));
  $("#h-dinheiro").textContent = `💰 ${S.orc}`;
  $("#h-pontos").textContent = `⭐ ${fmtInt(S.pontos + S.ptsAno)}`;
  const tot = { inc: 0, prev: 0, mort: 0, cura: 0 };
  for (const id in S.deps) { const st = S.deps[id]; tot.inc += st.ind.casos; tot.prev += st.prev; tot.mort += st.ind.mortes; tot.cura += st.ind.curas; }
  for (const m of MODOS_VIVOS) { const b = document.querySelector(`#vivo [data-modo="${m}"] b`); if (b) b.textContent = fmtInt(tot[m]); }
  if (MODOS_VIVOS.includes(S.modo)) { pintarMapa(); const el = $("#dep-linha"); if (el) el.innerHTML = linhaDep(); }
  $("#dica").textContent = S.anoIdx === 0 && !S.compradasAno.length ? t("dica1") : t("rodape")(S.conf, fmtInt(S.ptsAno + pontosAno() * (12 - S.mes) / 12));
  $("#btn-fechar").textContent = t("terminar")(ano());
}

function render() {
  if (!S || S.fim) return renderHud();
  $("#tela-inicio").hidden = true; $("#tela-fim").hidden = true; $("#tela-jogo").hidden = false; $("#barra").hidden = false;
  document.querySelectorAll("#modos button").forEach((b) => { b.textContent = b.dataset.modo === "cob" ? t("modoCob") : t("modoReg"); });
  montarVivo();
  pintarMapa();
  renderPainel();
  renderHud();
  renderVivo();
}

function telaInicio() {
  $("#tela-jogo").hidden = true; $("#tela-fim").hidden = true; $("#barra").hidden = true; $("#tela-inicio").hidden = false;
  const salvo = ler(CHAVE);
  const temSalvo = salvo && !salvo.fim && salvo.deps;
  const ultimoFim = salvo && salvo.fim && !salvo.enviado && CFG.rankingUrl && !rankingEncerrado();
  $("#tela-inicio").innerHTML = `
    <h1>${esc(t("h1"))}</h1>
    <p class="sub">${esc(t("intro"))}</p>
    <details class="cartao regras"><summary>${esc(t("ajuda"))}</summary><ol class="passos">${t("passos").map((p) => `<li>${p}</li>`).join("")}</ol></details>
    <div class="btns">${temSalvo ? `<button class="btn" id="btn-continuar" type="button">${esc(t("continuar"))}</button><button class="btn sec" id="btn-nova" type="button">${esc(t("nova"))}</button>`
      : `<button class="btn" id="btn-nova" type="button">${esc(t("comecar"))}</button>`}${ultimoFim ? `<button class="btn sec" id="btn-ultimo" type="button">${esc(t("ultimo"))}</button>` : ""}</div>
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
  const linhas = [...t("resLinhas")(x), t("resConf")(S.conf), t("resComp")(S.comp.filter((c) => c.estado === "cumprido").length, S.comp.length),
    t("resTot")(fmtInt(S.tot.casos), fmtInt(S.tot.mortes), fmtInt(S.tot.curas))];
  $("#tela-fim").innerHTML = `
    <h1>${esc(t("resTit"))}</h1>
    <div class="cartao"><div class="placar">⭐ ${fmtInt(S.pontos)}</div><p class="meta">${esc(t("pontos"))} · ${novo ? esc(t("novoRec")) : esc(t("recorde")(fmtInt(Math.max(recAnt, S.pontos))))}</p></div>
    ${cartaoRanking()}
    <div class="cartao"><ul class="linhas">${linhas.map((l) => `<li>${l}</li>`).join("")}</ul></div>
    <div class="cartao"><h2>${esc(t("realTit"))}</h2><ul class="linhas">${t("real").map((l) => `<li>${esc(l)}</li>`).join("")}</ul></div>
    <div class="btns"><button class="btn" id="btn-nova" type="button">${esc(t("denovo"))}</button><button class="btn sec" id="btn-compartir" type="button">${esc(t("compartir"))}</button></div>
    <p class="aviso">${esc(t("beta"))} ${esc(t("modeloNota"))}</p>
    <div class="cartao">${creditosHTML(true)}</div>
    <div class="cartao"><h2>${esc(t("fontesTit"))}</h2><ol class="fontes">${FONTES.map((f) => `<li>${esc(f)}</li>`).join("")}</ol></div>`;
  renderHud();
  rolarTopo();
}

/* ---------- ranking do congresso ---------- */
const CFG = window.EPIDEMIA_CONFIG || {};
const rankingEncerrado = () => CFG.fimDadosPessoais && new Date() >= new Date(CFG.fimDadosPessoais);

function cartaoRanking() {
  const tit = `<h2>${esc(t("rankTit"))}</h2>`;
  if (!CFG.rankingUrl) return `<div class="cartao">${tit}<p class="meta">${esc(t("rankFechado"))}</p></div>`;
  if (S.enviado) return `<div class="cartao form-rank">${tit}<p class="msg-rank ok">${esc(t("rankJa")(S.enviado.posicao))}</p><div class="btns"><a class="btn sec" href="ranking.html">${esc(t("rankVer"))}</a></div></div>`;
  if (rankingEncerrado()) return `<div class="cartao">${tit}<p class="meta">${esc(t("rankEncerrado"))}</p></div>`;
  const j = ler("epidemia-py-jogador") || {};
  return `<div class="cartao form-rank" id="form-rank">${tit}<p class="meta">${esc(t("rankIntro"))}</p>
    <label>${esc(t("rankNome"))}<input type="text" id="r-nome" maxlength="40" autocomplete="name" value="${esc(j.nome || "")}"></label>
    <label>${esc(t("rankFac"))}<input type="text" id="r-fac" maxlength="60" value="${esc(j.faculdade || "")}"></label>
    <label>${esc(t("rankTurma"))}<input type="text" id="r-turma" maxlength="20" value="${esc(j.turma || "")}"></label>
    <label class="consent"><input type="checkbox" id="r-ok"><span>${esc(t("rankConsent"))}</span></label>
    <div class="btns"><button class="btn" type="button" id="btn-enviar">${esc(t("rankEnviar"))}</button></div>
    <p class="msg-rank" id="r-msg" role="status"></p></div>`;
}

async function enviarRanking() {
  const nome = $("#r-nome").value.trim(), faculdade = $("#r-fac").value.trim(), turma = $("#r-turma").value.trim();
  const msg = $("#r-msg"), btn = $("#btn-enviar");
  const erro = (k) => { msg.textContent = t(k); msg.className = "msg-rank erro"; };
  if (nome.length < 2 || faculdade.length < 2 || !turma) return erro("rankCampos");
  if (!$("#r-ok").checked) return erro("rankSemOk");
  guardar("epidemia-py-jogador", { nome, faculdade, turma });
  btn.disabled = true; btn.textContent = t("rankEnviando"); msg.textContent = "";
  try {
    const r = await fetch(CFG.rankingUrl, {
      method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ nome, faculdade, turma, consentimento: true, pontos: S.pontos, anos: S.log.map((x) => x.pts), idioma: lang, versao: CFG.versao || "", id: S.id }),
    });
    const d = await r.json();
    if (d.ok || d.erro === "repetido") { S.enviado = { posicao: d.posicao || null }; salvar(); mostrarFim(); return; }
    if (d.erro === "encerrado") { btn.hidden = true; return erro("rankEncerrado"); }
    if (d.erro === "campos") throw new Error("campos");
    throw new Error(d.erro || "erro");
  } catch (e) {
    btn.disabled = false; btn.textContent = t("rankEnviar");
    erro(e.message === "campos" ? "rankCampos" : "rankErro");
  }
}

const creditosHTML = (comTitulo) => `<div class="creditos">${comTitulo ? `<h2>${esc(t("creditosTit"))}</h2>` : ""}${t("creditos").map((c) => `<p>${c}</p>`).join("")}</div>`;

/* ---------- janelas ---------- */
function abrirModal(html) { $("#janela").innerHTML = html; $("#modal").hidden = false; $("#janela").scrollTop = 0; const b = $("#janela .btn, #janela [data-opcao]:not([disabled])"); if (b) b.focus(); }
function fecharModal() { $("#modal").hidden = true; }

function mostrarEvento() {
  const [tit, txt, efeito, fonte] = EVENTOS[ano()][lang];
  const ev = S.evAleat && EVENTOS_ALEAT.find((e) => e.id === S.evAleat.id);
  const nomeDep = S.evAleat && S.evAleat.dep ? DEP[S.evAleat.dep].nome : "";
  const sub = (s) => s.replaceAll("{dep}", nomeDep);
  const ao = S.avisoOrc || {};
  let imp = "";
  if (ev) {
    const [it, ix, ie, ifo] = ev[lang];
    imp = `<div class="imprevisto"><p class="ano">⚡ ${esc(t("imprevisto"))}</p><h3>${esc(sub(it))}</h3><p>${esc(sub(ix))}</p><p class="efeito">${esc(sub(ie))}</p><p class="fonte">${esc(ifo || t("escenario"))}</p></div>`;
  }
  abrirModal(`
    <p class="ano">${esc(t("anoDe")(ano(), S.anoIdx + 1))}</p>
    <h2>${esc(tit)}</h2><p>${esc(txt)}</p>
    <p class="efeito">${esc(efeito)}</p>
    <p class="fonte">${esc(t("fonte"))}: ${esc(fonte)}</p>
    ${imp}
    ${ao.bonus ? `<p class="meta">${esc(t("confOrc")(ao.bonus))}</p>` : ""}
    ${ao.convPago ? `<p class="meta">${esc(t("convPago")(ao.convPago, ao.convN))}</p>` : ""}${ao.convCancel ? `<p class="fila">${esc(t("convCancel")(ao.convCancel))}</p>` : ""}
    <p><b>${esc(t("evOrc")(S.orc))}</b></p>
    <button class="btn" type="button" data-fechar>${esc(S.demanda ? t("proxDemanda") : t("evBtn"))}</button>`);
}

function opcaoCusto(o, dep) {
  if (o.compra) return { valor: custo(o.compra, dep) };
  if (o.conv) return { valor: custoConv(o.conv, dep), anual: true };
  return { valor: o.custo || 0 };
}

function mostrarDemanda() {
  const dm = DEMANDAS.find((x) => x.id === S.demanda.id), dep = S.demanda.dep;
  const sub = (s) => s.replaceAll("{dep}", dep ? DEP[dep].nome : "").replaceAll("{ano2}", ANOS[Math.min(9, S.anoIdx + 2)]).replaceAll("{ano3}", ANOS[Math.min(9, S.anoIdx + 3)]);
  const ops = dm.opcoes.map((o, i) => {
    const c = opcaoCusto(o, dep), pode = c.valor <= S.orc;
    const detalhe = [c.anual ? t("custoAno")(c.valor) : c.valor ? t("custo")(c.valor) : "", o.conf ? `${o.conf > 0 ? "+" : "−"}👍 ${Math.abs(o.conf)}` : "", pode ? "" : t("semOrcOp")].filter(Boolean).join(" · ");
    return `<button type="button" data-opcao="${i}" ${pode ? "" : "disabled"}><span>${esc(sub(o[lang]))}</span>${detalhe ? `<small>${esc(detalhe)}</small>` : ""}</button>`;
  }).join("");
  abrirModal(`
    <p class="ano">📣 ${esc(t("quem")[dm.quem])}</p>
    <h2>${esc(t("demandaTit"))}</h2>
    <p>${esc(sub(dm[lang]))}</p>
    <div class="opcoes">${ops}</div>
    ${dm.fonte ? `<p class="fonte">${esc(t("inspirado"))}: ${esc(dm.fonte)}</p>` : ""}
    <p class="meta">👍 ${S.conf} · 💰 ${S.orc}</p>`);
}

/* Resposta à demanda: o que se compra ou contrata aqui não se desfaz depois (a confiança já foi ganha) */
function escolherOpcao(i) {
  const dm = DEMANDAS.find((x) => x.id === S.demanda.id), dep = S.demanda.dep, o = dm.opcoes[i];
  const c = opcaoCusto(o, dep);
  if (c.valor > S.orc) return;
  S.orc -= c.valor;
  if (o.compra) { const d = S.deps[dep]; S.gasto[ACOES[o.compra].nivel] += c.valor; d.feitas[o.compra] = S.anoIdx; d.pago[o.compra] = 0; delete d.conv[o.compra]; S.compradasAno.push(o.compra); }
  else if (o.conv) { S.gasto[ACOES[o.conv].nivel] += c.valor; S.deps[dep].conv[o.conv] = { ano: S.anoIdx, pago: 0 }; S.compradasAno.push(licaoDe(o.conv, true)); }
  else if (o.custo) S.gasto[o.gasto || "T"] += o.custo;
  if (o.aplicar) o.aplicar(dep);
  S.conf = limitar(S.conf + (o.conf || 0));
  S.demanda = null;
  S.fase = "jogando";
  if (dep) S.sel = dep;
  fecharModal();
  salvar();
  render();
  if (dep) destacar(dep, o.conv ? "🤝" : o.compra ? ACOES[o.compra].ico : "📣");
  if (S.evAleat && S.evAleat.dep && S.evAleat.dep !== dep) destacar(S.evAleat.dep, "⚡");
}

function mostrarResumo(r) {
  const [licao, fonte] = LICOES[r.licao][lang];
  const ultimo = S.anoIdx >= ANOS.length - 1;
  const comps = (r.comp || []).map((c) => `<li>${esc((c.ok ? t("compOk") : t("compFalhou"))(t("curtas")[c.a], DEP[c.dep].nome))}</li>`).join("");
  abrirModal(`
    <p class="ano">${esc(t("fimAno")(r.ano))}</p>
    <h2>${esc(t("ptsAno")(fmtInt(r.pts)))}</h2>
    <ul class="linhas">
      <li>${esc(t("resPais")(fmtInt(r.ind.casos), fmtInt(r.ind.mortes), fmtInt(r.ind.curas)))}</li>
      ${r.subiu.length ? `<li>${esc(t("resSubiu")(r.subiu.length > 6 ? `${r.subiu.slice(0, 6).join(", ")} +${r.subiu.length - 6}` : r.subiu.join(", ")))}</li>` : ""}
      ${r.filas.length ? `<li>${esc(t("resFila")(r.filas.join(", ")))}</li>` : ""}
      <li>${esc(t("resEquil")(r.n3))}</li>
      ${comps}
      <li>${esc(t("resConfAno")(r.conf0, r.conf1))}</li>
    </ul>
    <div class="licao"><p>${esc(licao)}</p><p class="fonte">${esc(t("fonte"))}: ${esc(fonte)}</p></div>
    <button class="btn" type="button" data-proximo>${esc(ultimo ? t("verRes") : t("prox")(ANOS[S.anoIdx + 1]))}</button>`);
}

function mostrarAjuda() {
  abrirModal(`
    <h2>${esc(t("ajuda"))}</h2>
    <ol class="passos">${t("passos").map((p) => `<li>${p}</li>`).join("")}</ol>
    <p class="aviso">${esc(t("aviso"))} ${esc(t("modeloNota"))}</p>
    <h2>${esc(t("fontesTit"))}</h2><ol class="fontes">${FONTES.map((f) => `<li>${esc(f)}</li>`).join("")}</ol>
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

function novoJogo() {
  S = novoEstado();
  prepararInicio();
  iniciarAno();
  render();
}

function mostrarModalDaFase() {
  if (S.fase === "evento") mostrarEvento();
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
  const cv = alvo.closest("#painel .conv");
  if (cv && !cv.disabled) { contratar(S.sel, cv.dataset.conv); return; }
  const ac = alvo.closest("#painel .acao");
  if (ac && !ac.disabled) { comprar(S.sel, ac.dataset.acao); return; }
  const op = alvo.closest("[data-opcao]");
  if (op && !op.disabled) { escolherOpcao(+op.dataset.opcao); return; }
  const modo = alvo.closest("[data-modo]");
  if (modo && S && !S.fim) { S.modo = modo.dataset.modo; salvar(); pintarMapa(); const el = $("#dep-linha"); if (el) el.innerHTML = linhaDep(); return; }
  if (alvo.closest("[data-fechar]")) {
    const eraEvento = S && !S.fim && S.fase === "evento";
    if (eraEvento && S.demanda) { S.fase = "demanda"; salvar(); mostrarDemanda(); return; }
    if (eraEvento) S.fase = "jogando";
    fecharModal();
    if (S && !S.fim) { salvar(); render(); if (eraEvento && S.evAleat && S.evAleat.dep) destacar(S.evAleat.dep, "⚡"); }
    return;
  }
  if (alvo.closest("[data-proximo]")) { proximoAno(); return; }
  if (alvo.id === "btn-nova") { novoJogo(); return; }
  if (alvo.id === "btn-continuar") { continuar(); return; }
  if (alvo.id === "btn-fechar") { fecharAno(); return; }
  if (alvo.closest("#h-ano") && S && !S.fim) { S.pausa = !S.pausa; salvar(); renderVivo(); return; }
  if (alvo.id === "btn-ajuda") { mostrarAjuda(); return; }
  if (alvo.id === "btn-compartir") { compartilhar(); return; }
  if (alvo.id === "btn-enviar") { enviarRanking(); return; }
  if (alvo.id === "btn-ultimo") { S = ler(CHAVE); mostrarFim(); return; }
  if (alvo.id === "btn-idioma") {
    lang = lang === "es" ? "pt" : "es"; guardar("epidemia-py-lang", lang);
    document.documentElement.lang = lang === "es" ? "es" : "pt-BR";
    if (!$("#modal").hidden) { if (S && !S.fim && S.fase !== "jogando") mostrarModalDaFase(); else mostrarAjuda(); }
    if (!S) telaInicio();
    else if (S.fim) {
      const ids = ["#r-nome", "#r-fac", "#r-turma"], campos = ids.map((c) => $(c) && $(c).value), ok = $("#r-ok") && $("#r-ok").checked;
      mostrarFim();
      ids.forEach((c, i) => { if ($(c) && campos[i] != null) $(c).value = campos[i]; });
      if ($("#r-ok")) $("#r-ok").checked = !!ok;
    } else render();
  }
});
document.addEventListener("keydown", (ev) => {
  const dep = ev.target.closest && ev.target.closest("#mapa .dep");
  if (dep && S && !S.fim && (ev.key === "Enter" || ev.key === " ")) { ev.preventDefault(); S.sel = dep.dataset.dep; salvar(); render(); }
});
document.addEventListener("change", (ev) => { if (ev.target.id === "dep-tit" && ev.target.value) { S.sel = ev.target.value; salvar(); render(); } });

async function compartilhar() {
  const url = CFG.jogoUrl || location.href.split("#")[0];   // sempre o link público, também na cópia de revisão
  try {
    if (navigator.share) await navigator.share({ title: t("h1"), text: t("shareTxt"), url });
    else { await navigator.clipboard.writeText(url); toast(t("copiado")); }
  } catch (e) { /* o jogador cancelou */ }
}

if (rankingEncerrado()) { try { localStorage.removeItem("epidemia-py-jogador"); } catch (e) { /* sem armazenamento */ } }
document.documentElement.lang = lang === "es" ? "es" : "pt-BR";
montarMapa();
calcularLimites();
telaInicio();
