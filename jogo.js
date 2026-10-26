"use strict";
/* Epidemia: Paraguay contra el cáncer (beta).
   Dados de partida (taxas do Atlas 2015-2019, população do Censo 2022) e eventos de cada ano: reais, com fonte.
   Efeitos das ações, casos ocultos e pontos: ilustrativos (modelo do jogo). */

const $ = (s) => document.querySelector(s);
const ANOS = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024];
const ORC_BASE = 12;
const CHAVE = "epidemia-py-v1";
const DEP = Object.fromEntries(DEPS.map((d) => [d.id, d]));
const TEE_MIN = Math.min(...DEPS.map((d) => d.tee)), TEE_MAX = Math.max(...DEPS.map((d) => d.tee));

/* ---------- armazenamento local (pode falhar em aba anônima: o jogo segue sem salvar) ---------- */
const guardar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sem armazenamento */ } };
const ler = (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } };

/* ---------- ações: 3 por nível + centro de pesquisa ---------- */
const SLOTS = { P: ["vacuna", "tabaco", "habitos"], D: ["vph", "mamo", "registro"], T: ["quimio", "radio", "paliativos"] };
const ACOES = {
  vacuna: { nivel: "P", custo: 2, ico: "💉" },
  tabaco: { nivel: "P", custo: 1, ico: "🚭" },
  habitos: { nivel: "P", custo: 1, ico: "🍎" },
  vph: { nivel: "D", custo: 2, ico: "🔬", vis: 0.06 },
  mamo: { nivel: "D", custo: 3, ico: "🎗️", vis: 0.06 },
  registro: { nivel: "D", custo: 1, ico: "📋", vis: 0.08 },
  quimio: { nivel: "T", custo: 4, ico: "💊" },
  radio: { nivel: "T", custo: 8, ico: "☢️" },
  privado: { nivel: "T", custo: 3, ico: "🤝" },
  paliativos: { nivel: "T", custo: 2, ico: "🤲" },
  pesquisa: { nivel: "X", custo: 5, ico: "🎓" },
};

/* ---------- textos ---------- */
const T = {
  es: {
    sub: "Paraguay contra el cáncer",
    h1: "Epidemia: Paraguay contra el cáncer",
    intro: "Eres responsable del control del cáncer en Paraguay de 2015 a 2024. Los primeros 5 años parten de los datos reales del Atlas de Mortalidad por Cáncer; los 5 siguientes son una proyección de tus decisiones.",
    passos: [
      "Toca un departamento y elige acciones con tu presupuesto 💰.",
      "Tres niveles: <b>1.º Prevención</b>, <b>2.º Diagnóstico</b> y <b>3.º Tratamiento</b>. Un departamento da muchos más puntos cuando tiene los tres (equilibrio), multiplicado por su población.",
      "Donde la estadística es baja, falta diagnóstico, no cáncer: diagnosticar revela casos ocultos y la tasa registrada sube. ¡Es buena señal!",
      "Diagnóstico sin tratamiento cerca forma fila: ese departamento rinde la mitad.",
      "Cada año trae un hecho real de la historia del cáncer en Paraguay.",
    ],
    aviso: "Simulación educativa (beta). Los efectos de las acciones y los puntos son ilustrativos; los datos de partida y los eventos son reales, con fuente. Basado en la revisión sistemática de Silva, Pandolfo et al. (2026) y sus fuentes.",
    comecar: "Empezar", continuar: "Continuar partida", nova: "Nueva partida",
    ajuda: "Cómo se juega", fechar: "Cerrar",
    anoDe: (a, i) => `${a} · año ${i} de 10`,
    modoCob: "Cobertura", modoReg: "Casos registrados",
    legCob: "Niveles en equilibrio:", legReg: "Tasa registrada por 100 mil:",
    escolher: "Elegir departamento…",
    hab: "hab. (Censo 2022)",
    causa: (h, m) => `1.ª causa de muerte por cáncer: ${h} (hombres), ${m} (mujeres) · Atlas 2015–2019`,
    kReg: "tasa registrada por 100 mil (Atlas 2015–2019 → hoy)",
    kOculto: "casos ocultos (estimación del juego)",
    ocultoQ: "?", ocultoDica: "diagnostica o investiga aquí para saber",
    poucos: "Pocas muertes en 5 años: la tasa es inestable.",
    fila: "Fila: hay diagnóstico pero no tratamiento cerca. Los pacientes viajan al INCAN (Capiatá) y este departamento rinde la mitad.",
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
      privado: ["Convenio con radioterapia privada", "se paga todos los años"],
      paliativos: ["Cuidados paliativos", "calidad de vida"],
      pesquisa: ["Centro de investigación y registro", "revela la carga real aquí y en los vecinos; +20% de puntos aquí"],
    },
    custo: (c) => (c ? `💰 ${c}` : "gratis"), custoAno: (c) => `💰 ${c}/año`, ativo: "✓ activo", desfazer: "toca para deshacer",
    fecharAno: (a) => `Cerrar ${a} ▶`,
    dicaSel: "Toca un departamento en el mapa o elígelo en la lista.",
    dicaOrc: (o) => `Te quedan 💰 ${o}. Lo que sobra pasa al año siguiente.`,
    dica1: "Pista: Central ya tiene el INCAN (tratamiento). Sumar prevención y diagnóstico ahí da muchos puntos.",
    projAno: (p) => `Este año sumas ⭐ ${p}.`,
    semOrc: "Presupuesto insuficiente", jaAtivo: "Ya está activo (de años anteriores)", desfeito: (c) => `Deshecho: vuelven 💰 ${c}`,
    privCancel: (n) => `Sin presupuesto: se cancelaron ${n} convenio(s) privado(s).`,
    privPago: (c) => `Convenios privados: −💰 ${c}`,
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
    beta: "Versión beta para pruebas: el ranking del congreso llega pronto. Cuéntanos qué te pareció.",
    shareTxt: "Juega Epidemia: Paraguay contra el cáncer",
    causas: { pulmao: "pulmón", prostata: "próstata", pancreas: "páncreas", mama: "mama", colo: "cuello uterino", empate: "empate mama = cuello uterino" },
  },
  pt: {
    sub: "Paraguai contra o câncer",
    h1: "Epidemia: Paraguai contra o câncer",
    intro: "Você é responsável pelo controle do câncer no Paraguai de 2015 a 2024. Os primeiros 5 anos partem dos dados reais do Atlas de Mortalidad por Cáncer; os 5 seguintes são uma projeção das suas decisões.",
    passos: [
      "Toque num departamento e escolha ações com o seu orçamento 💰.",
      "Três níveis: <b>1º Prevenção</b>, <b>2º Diagnóstico</b> e <b>3º Tratamento</b>. Um departamento dá muito mais pontos quando tem os três (equilíbrio), multiplicado pela população.",
      "Onde a estatística é baixa, falta diagnóstico, não câncer: diagnosticar revela casos ocultos e a taxa registrada sobe. É bom sinal!",
      "Diagnóstico sem tratamento perto forma fila: esse departamento rende a metade.",
      "Cada ano traz um fato real da história do câncer no Paraguai.",
    ],
    aviso: "Simulação educativa (beta). Os efeitos das ações e os pontos são ilustrativos; os dados de partida e os eventos são reais, com fonte. Baseado na revisão sistemática de Silva, Pandolfo et al. (2026) e nas suas fontes.",
    comecar: "Começar", continuar: "Continuar partida", nova: "Nova partida",
    ajuda: "Como se joga", fechar: "Fechar",
    anoDe: (a, i) => `${a} · ano ${i} de 10`,
    modoCob: "Cobertura", modoReg: "Casos registrados",
    legCob: "Níveis em equilíbrio:", legReg: "Taxa registrada por 100 mil:",
    escolher: "Escolher departamento…",
    hab: "hab. (Censo 2022)",
    causa: (h, m) => `1ª causa de morte por câncer: ${h} (homens), ${m} (mulheres) · Atlas 2015–2019`,
    kReg: "taxa registrada por 100 mil (Atlas 2015–2019 → hoje)",
    kOculto: "casos ocultos (estimativa do jogo)",
    ocultoQ: "?", ocultoDica: "diagnostique ou pesquise aqui para saber",
    poucos: "Poucos óbitos em 5 anos: a taxa é instável.",
    fila: "Fila: há diagnóstico mas não há tratamento perto. Os pacientes viajam ao INCAN (Capiatá) e este departamento rende a metade.",
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
      privado: ["Convênio com radioterapia privada", "paga-se todo ano"],
      paliativos: ["Cuidados paliativos", "qualidade de vida"],
      pesquisa: ["Centro de pesquisa e registro", "revela a carga real aqui e nos vizinhos; +20% de pontos aqui"],
    },
    custo: (c) => (c ? `💰 ${c}` : "grátis"), custoAno: (c) => `💰 ${c}/ano`, ativo: "✓ ativo", desfazer: "toque para desfazer",
    fecharAno: (a) => `Fechar ${a} ▶`,
    dicaSel: "Toque num departamento no mapa ou escolha na lista.",
    dicaOrc: (o) => `Restam 💰 ${o}. O que sobra passa para o ano seguinte.`,
    dica1: "Dica: Central já tem o INCAN (tratamento). Somar prevenção e diagnóstico ali dá muitos pontos.",
    projAno: (p) => `Neste ano você soma ⭐ ${p}.`,
    semOrc: "Orçamento insuficiente", jaAtivo: "Já está ativo (de anos anteriores)", desfeito: (c) => `Desfeito: voltam 💰 ${c}`,
    privCancel: (n) => `Sem orçamento: ${n} convênio(s) privado(s) cancelado(s).`,
    privPago: (c) => `Convênios privados: −💰 ${c}`,
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
    beta: "Versão beta para testes: o ranking do congresso vem em breve. Conte o que achou.",
    shareTxt: "Jogue Epidemia: Paraguai contra o câncer",
    causas: { pulmao: "pulmão", prostata: "próstata", pancreas: "pâncreas", mama: "mama", colo: "colo do útero", empate: "empate mama = colo do útero" },
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
    es: ["Dosis única de la vacuna VPH y notificación obligatoria", "Desde el 01/08/2024 basta una dosis de la vacuna; en noviembre, todo cáncer confirmado pasa a ser de notificación obligatoria (Res. S.G. N° 752). Concepción inaugura el 10.º Hospital Día oncológico del país.", "Vacuna 💰 1 más barata, registro gratis y Hospital Día gratis en Concepción.", "MSPBS, 2024"],
    pt: ["Dose única da vacina HPV e notificação obrigatória", "Desde 01/08/2024 basta uma dose da vacina; em novembro, todo câncer confirmado passa a ser de notificação obrigatória (Res. S.G. N° 752). Concepción inaugura o 10º Hospital Día oncológico do país.", "Vacina 💰 1 mais barata, registro grátis e Hospital Día grátis em Concepción.", "MSPBS, 2024"],
  },
};

/* ---------- lições (fatos com fonte) ---------- */
const LICOES = {
  vacuna: { es: ["El VPH causa casi todos los cánceres de cuello uterino; en Paraguay, 58,9% de los casos son por los tipos 16 y 18.", "ICO/IARC HPV Information Centre, 2023"], pt: ["O HPV causa quase todos os cânceres do colo do útero; no Paraguai, 58,9% dos casos são pelos tipos 16 e 18.", "ICO/IARC HPV Information Centre, 2023"] },
  tabaco: { es: ["12,5% de los adultos fuman cigarrillo y 17% usan alguna forma de tabaco. El pulmón es la 1.ª causa de muerte por cáncer en los hombres.", "ENFR 2022; Atlas 2015–2019"], pt: ["12,5% dos adultos fumam cigarro e 17% usam alguma forma de tabaco. O pulmão é a 1ª causa de morte por câncer nos homens.", "ENFR 2022; Atlas 2015–2019"] },
  habitos: { es: ["Solo 3,9% comen 5 porciones de frutas y verduras por día. El colorrectal es el cáncer que más crece: cerca de 3% por año desde 1990.", "ENFR 2022; Leite et al., 2025"], pt: ["Só 3,9% comem 5 porções de frutas e verduras por dia. O colorretal é o câncer que mais cresce: cerca de 3% ao ano desde 1990.", "ENFR 2022; Leite et al., 2025"] },
  vph: { es: ["En 2024 el Ministerio de Salud hizo 72.133 tests de VPH y encontró 9.863 positivos (13,7%). Diagnosticar hace subir los casos visibles.", "MSPBS"], pt: ["Em 2024 o Ministério da Saúde fez 72.133 testes de HPV e encontrou 9.863 positivos (13,7%). Diagnosticar faz subir os casos visíveis.", "MSPBS"] },
  mamo: { es: ["La mama es la 1.ª causa de muerte por cáncer en las mujeres (1.945 muertes, 20,2%). 51,1% de las mujeres ya se hicieron una mamografía.", "Atlas 2015–2019; ENFR 2023"], pt: ["A mama é a 1ª causa de morte por câncer nas mulheres (1.945 mortes, 20,2%). 51,1% das mulheres já fizeram mamografia.", "Atlas 2015–2019; ENFR 2023"] },
  registro: { es: ["Tasa baja no es riesgo bajo: Canindeyú tiene la menor tasa (41,3) y la mayor proporción de muertes femeninas por cuello uterino (36,8%).", "Atlas 2015–2019"], pt: ["Taxa baixa não é risco baixo: Canindeyú tem a menor taxa (41,3) e a maior proporção de mortes femininas por colo do útero (36,8%).", "Atlas 2015–2019"] },
  quimio: { es: ["Los Hospitales Día oncológicos llevan la quimioterapia al interior; el 10.º se inauguró en Concepción en 2024.", "MSPBS, 21/11/2024"], pt: ["Os Hospitais Día oncológicos levam a quimioterapia ao interior; o 10º foi inaugurado em Concepción em 2024.", "MSPBS, 21/11/2024"] },
  radio: { es: ["Radioterapia pública: un único lugar para todo el país, el INCAN, en Capiatá, con 3 aceleradores lineales.", "MSPBS, 2024"], pt: ["Radioterapia pública: um único lugar para o país inteiro, o INCAN, em Capiatá, com 3 aceleradores lineares.", "MSPBS, 2024"] },
  privado: { es: ["El IPS contrata radioterapia de prestadores privados por licitación. Resuelve rápido, pero se paga todos los años.", "DNCP, licitación de radioterapia del IPS"], pt: ["O IPS contrata radioterapia de prestadores privados por licitação. Resolve rápido, mas se paga todo ano.", "DNCP, licitação de radioterapia do IPS"] },
  paliativos: { es: ["En Paraguay, los cuidados paliativos en la comunidad «generalmente no están disponibles».", "OMS, Cancer Country Profile Paraguay 2020"], pt: ["No Paraguai, os cuidados paliativos na comunidade «geralmente não estão disponíveis».", "OMS, Cancer Country Profile Paraguay 2020"] },
  pesquisa: { es: ["El único registro de cáncer de base poblacional se creó en 2020 para Asunción y Central; los datos preliminares de 2019 salieron recién en 2024.", "DGVS/MSPBS, 05/02/2024"], pt: ["O único registro de câncer de base populacional foi criado em 2020 para Asunción e Central; os dados preliminares de 2019 só saíram em 2024.", "DGVS/MSPBS, 05/02/2024"] },
  fila: { es: ["Diagnosticar sin tratar crea filas: en Ciudad del Este, de cada 10 pacientes diagnosticados, 6 necesitarán radioterapia y deben viajar.", "La Nación, 23/07/2024"], pt: ["Diagnosticar sem tratar cria filas: em Ciudad del Este, de cada 10 pacientes diagnosticados, 6 vão precisar de radioterapia e precisam viajar.", "La Nación, 23/07/2024"] },
  colo: { es: ["En 8 de los 18 departamentos, el cuello uterino es la 1.ª causa de muerte por cáncer en las mujeres: un cáncer evitable.", "Atlas 2015–2019"], pt: ["Em 8 dos 18 departamentos, o colo do útero é a 1ª causa de morte por câncer nas mulheres: um câncer evitável.", "Atlas 2015–2019"] },
  jovens: { es: ["La mortalidad por cuello uterino en mujeres de 20 a 44 años sube 3,7% por año (1997–2017).", "Torres-Roman et al., BMC Public Health 2022"], pt: ["A mortalidade por colo do útero em mulheres de 20 a 44 anos sobe 3,7% ao ano (1997–2017).", "Torres-Roman et al., BMC Public Health 2022"] },
  mapa: { es: ["El mapa del cáncer también es un mapa del acceso al diagnóstico: Asunción tiene tasa de 103,9 y Canindeyú de 41,3 por 100 mil.", "Atlas 2015–2019"], pt: ["O mapa do câncer também é um mapa do acesso ao diagnóstico: Asunción tem taxa de 103,9 e Canindeyú de 41,3 por 100 mil.", "Atlas 2015–2019"] },
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
  "MSPBS (2024–2026), DGVS (2024), OPS/OMS (2026), OIEA (2026), City Cancer Challenge (2022), ABC Color (2024), La Nación (2023, 2024), DNCP.",
  "Mapa: geoBoundaries (CC BY 4.0).",
];

/* ---------- estado ---------- */
let lang = ler("epidemia-py-lang") === "pt" ? "pt" : "es";
const t = (k) => T[lang][k] ?? T.es[k];
let S = null;

function novoEstado() {
  const deps = {};
  for (const d of DEPS) {
    const vis0 = 0.55 + 0.45 * (d.tee - TEE_MIN) / (TEE_MAX - TEE_MIN);   // onde a taxa é baixa, falta diagnóstico
    deps[d.id] = { vis0, visEv: 0, carga: d.tee / vis0, feitas: {}, pago: {}, privado: false, privadoAno: null, pesquisa: false, pesquisaAno: null };
  }
  // Situação inicial simplificada: tratamento concentrado no INCAN (Central) e no IPS (Asunción)
  for (const a of ["quimio", "radio", "paliativos"]) deps.central.feitas[a] = -1;
  deps.asuncion.feitas.quimio = -1;
  return { deps, anoIdx: 0, orc: 0, orcExtra: 0, pontos: 0, mod: {}, sel: "central", modo: "cob", fase: "evento", gasto: { P: 0, D: 0, T: 0, X: 0 }, licoesVistas: [], log: [], compradasAno: [], fim: false };
}

function darGratis(id, a) {
  const d = S.deps[id];
  if (d.feitas[a] === undefined) { d.feitas[a] = S.anoIdx; d.pago[a] = 0; }
}

const ano = () => ANOS[S.anoIdx];
const temSlot = (d, a) => (a === "radio" ? d.feitas.radio !== undefined || d.privado : d.feitas[a] !== undefined);
const nivel = (d, n) => SLOTS[n].reduce((s, a) => s + (temSlot(d, a) ? 1 : 0), 0);
const equil = (id) => { const d = S.deps[id]; return Math.min(nivel(d, "P"), nivel(d, "D"), nivel(d, "T")); };
const custo = (a) => Math.max(0, ACOES[a].custo + (S.mod[a] || 0));

function vis(id) {
  const d = S.deps[id];
  let v = d.vis0 + d.visEv;
  for (const a of SLOTS.D) if (temSlot(d, a)) v += ACOES[a].vis;
  if (d.pesquisa) v += 0.10;
  for (const n of DEP[id].vizinhos) if (S.deps[n].pesquisa) v += 0.05;
  return Math.max(0.2, Math.min(1, v));
}
const taxaReg = (id) => S.deps[id].carga * vis(id);
const temFila = (id) => { const d = S.deps[id]; return nivel(d, "D") >= 2 && nivel(d, "T") === 0; };
const ocultoConhecido = (id) => { const d = S.deps[id]; return nivel(d, "D") >= 1 || d.pesquisa || DEP[id].vizinhos.some((n) => S.deps[n].pesquisa); };

function pontosDep(id) {
  const d = S.deps[id], P = nivel(d, "P"), D = nivel(d, "D"), Tn = nivel(d, "T");
  let p = (10 * Math.min(P, D, Tn) + P + D + Tn) * (DEP[id].pop / 100000);
  if (d.pesquisa) p *= 1.2;
  if (temFila(id)) p *= 0.5;
  return p;
}
const pontosAno = () => Math.round(DEPS.reduce((s, d) => s + pontosDep(d.id), 0));

/* ---------- formatação ---------- */
const fmtInt = (n) => new Intl.NumberFormat(lang === "pt" ? "pt-BR" : "es-PY", { maximumFractionDigits: 0 }).format(n);
const fmt1 = (n) => new Intl.NumberFormat(lang === "pt" ? "pt-BR" : "es-PY", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(n);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/* ---------- fluxo do ano ---------- */
function iniciarAno() {
  S.mod = {};
  S.orc += ORC_BASE + S.orcExtra;
  EVENTOS[ano()].aplicar();
  // convênios privados: pagam todo ano; sem dinheiro, são cancelados
  let pago = 0, cancel = 0;
  for (const id in S.deps) {
    const d = S.deps[id];
    if (!d.privado) continue;
    if (S.orc >= ACOES.privado.custo) { S.orc -= ACOES.privado.custo; pago += ACOES.privado.custo; S.gasto.T += ACOES.privado.custo; d.privadoAno = S.anoIdx; d.privadoPago = 0; }
    else { d.privado = false; cancel++; }
  }
  S.avisoPriv = { pago, cancel };
  S.fase = "evento";
  salvar();
  mostrarEvento();
}

function fecharAno() {
  const pts = pontosAno();
  S.pontos += pts;
  const subiu = [], filas = [];
  for (const d of DEPS) {
    const st = S.deps[d.id];
    // "subiu" só pelo diagnóstico (mais casos visíveis), não pelo crescimento da carga
    if (vis(d.id) > (st.visAnterior ?? st.vis0) + 0.01) subiu.push(d.nome);
    if (temFila(d.id)) filas.push(d.nome);
    st.visAnterior = vis(d.id);
    st.carga *= 1 + 0.012 - 0.006 * nivel(st, "P");   // envelhecimento sobe a carga; prevenção freia (ilustrativo)
  }
  const n3 = DEPS.filter((d) => equil(d.id) >= 1).length;
  const licao = escolherLicao(filas.length > 0);
  S.log.push({ ano: ano(), pts, subiu, filas, n3, licao });
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

/* ---------- compras ---------- */
function comprar(id, a) {
  const d = S.deps[id];
  const nivelA = ACOES[a].nivel;
  // desfazer o que foi comprado neste ano
  if (a === "pesquisa" && d.pesquisa) return d.pesquisaAno === S.anoIdx ? desfazer(id, a, d.pesquisaPago) : toast(t("jaAtivo"));
  if (a === "privado" && d.privado) return d.privadoAno === S.anoIdx && d.privadoPago > 0 ? desfazer(id, a, d.privadoPago) : toast(t("jaAtivo"));
  if (a !== "pesquisa" && a !== "privado" && d.feitas[a] !== undefined) {
    return d.feitas[a] === S.anoIdx && d.pago[a] > 0 ? desfazer(id, a, d.pago[a]) : toast(t("jaAtivo"));
  }
  const c = custo(a);
  if (c > S.orc) return toast(t("semOrc"));
  S.orc -= c;
  S.gasto[nivelA] += c;
  if (a === "pesquisa") { d.pesquisa = true; d.pesquisaAno = S.anoIdx; d.pesquisaPago = c; }
  else if (a === "privado") { d.privado = true; d.privadoAno = S.anoIdx; d.privadoPago = c; }
  else {
    d.feitas[a] = S.anoIdx; d.pago[a] = c;
    if (a === "radio" && d.privado) { d.privado = false; d.privadoSubst = true; }   // o acelerador público substitui o convênio
  }
  (S.compradasAno = S.compradasAno || []).push(a);
  salvar();
  render();
}

function desfazer(id, a, valor) {
  const d = S.deps[id];
  S.orc += valor;
  S.gasto[ACOES[a].nivel] -= valor;
  if (a === "pesquisa") { d.pesquisa = false; d.pesquisaAno = null; }
  else if (a === "privado") { d.privado = false; d.privadoAno = null; }
  else {
    delete d.feitas[a]; delete d.pago[a];
    if (a === "radio" && d.privadoSubst) { d.privado = true; d.privadoSubst = false; }   // volta o convênio que o acelerador tinha substituído
  }
  S.compradasAno = (S.compradasAno || []).filter((x, i, arr) => !(x === a && i === arr.lastIndexOf(a)));
  toast(t("desfeito")(valor));
  salvar();
  render();
}

/* ---------- mapa ---------- */
function montarMapa() {
  $("#mapa-wrap").innerHTML = `<svg id="mapa" viewBox="${MAPA.viewBox}" role="group" aria-label="Paraguay"><g id="g-deps">${MAPA.deps}</g><g id="g-lbl">${MAPA.lbl}</g><g id="g-alerta" class="alerta"></g></svg>`;
  const mk = document.querySelector("#mapa .dep-marker");
  if (mk) mk.setAttribute("r", "36");
  document.querySelectorAll("#mapa .dep").forEach((el) => {
    el.setAttribute("tabindex", "0");
    el.setAttribute("role", "button");
    el.setAttribute("aria-label", DEP[el.dataset.dep].nome);
  });
}

const classeReg = (x) => (x < 60 ? 1 : x < 80 ? 2 : x < 100 ? 3 : 4);

function pintarMapa() {
  document.querySelectorAll("#mapa .dep").forEach((el) => {
    const id = el.dataset.dep;
    el.style.fill = S.modo === "cob" ? `var(--cob${equil(id)})` : `var(--reg${classeReg(taxaReg(id))})`;
    el.classList.toggle("sel", id === S.sel);
  });
  const sel = document.querySelector(`#mapa path.dep[data-dep="${S.sel}"]`);
  if (sel) sel.parentNode.appendChild(sel);
  document.querySelectorAll("#mapa .lbl").forEach((el) => el.classList.toggle("sel", el.dataset.dep === S.sel));
  // alerta de fila perto do nome
  const g = $("#g-alerta");
  g.innerHTML = DEPS.filter((d) => temFila(d.id)).map((d) => {
    const l = document.querySelector(`#mapa .lbl[data-dep="${d.id}"]`);
    const x = +l.getAttribute("x"), y = +l.getAttribute("y") - 70;
    return `<circle cx="${x}" cy="${y}" r="30"/><text x="${x}" y="${y + 16}">!</text>`;
  }).join("");
  $("#legenda").innerHTML = S.modo === "cob"
    ? `${esc(t("legCob"))} ${[0, 1, 2, 3].map((n) => `<span><i style="background:var(--cob${n})"></i>${n}</span>`).join("")}`
    : `${esc(t("legReg"))} ${["< 60", "60–80", "80–100", "≥ 100"].map((r, i) => `<span><i style="background:var(--reg${i + 1})"></i>${r}</span>`).join("")}`;
  document.querySelectorAll("#modos button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.modo === S.modo)));
}

/* ---------- painel do departamento ---------- */
function botaoAcao(id, a, extra = "") {
  const d = S.deps[id];
  const [nome, alvo] = t("acoes")[a];
  let ativo, desfazivel = false, preco;
  if (a === "pesquisa") { ativo = d.pesquisa; desfazivel = ativo && d.pesquisaAno === S.anoIdx; }
  else if (a === "privado") { ativo = d.privado; desfazivel = ativo && d.privadoAno === S.anoIdx && d.privadoPago !== undefined; }
  else { ativo = d.feitas[a] !== undefined; desfazivel = ativo && d.feitas[a] === S.anoIdx && d.pago[a] > 0; }
  preco = ativo ? (desfazivel ? `${t("ativo")}` : t("ativo")) : a === "privado" ? t("custoAno")(custo(a)) : t("custo")(custo(a));
  const semDinheiro = !ativo && custo(a) > S.orc;
  const nv = ACOES[a].nivel;
  return `<button type="button" class="acao${ativo ? " feita" : ""}${desfazivel ? " desfaz" : ""} ${extra}" data-acao="${a}" ${semDinheiro ? "disabled" : ""}
    style="--nv: var(--nv-${nv === "X" ? "d" : nv.toLowerCase()})" aria-pressed="${ativo}" title="${desfazivel ? esc(t("desfazer")) : ""}">
    <span class="ico" aria-hidden="true">${ACOES[a].ico}</span><span class="nome">${esc(nome)}</span><span class="alvo">${esc(alvo)}</span><span class="custo">${esc(preco)}</span></button>`;
}

function renderPainel() {
  const id = S.sel, dd = DEP[id], d = S.deps[id];
  const causa = t("causas");
  const oculto = ocultoConhecido(id) ? `~${fmtInt((1 - vis(id)) * 100)}%` : t("ocultoQ");
  const linhaNivel = (n) => {
    const v = nivel(d, n);
    let botoes;
    if (n === "T") {
      const radio = d.feitas.radio !== undefined ? botaoAcao(id, "radio")
        : `<div class="radio-op">${botaoAcao(id, "radio")}${botaoAcao(id, "privado")}</div>`;
      botoes = botaoAcao(id, "quimio") + radio + botaoAcao(id, "paliativos");
    } else botoes = SLOTS[n].map((a) => botaoAcao(id, a)).join("");
    return `<div class="nivel" data-n="${n}"><h3>${esc(t("niveis")[n])} <span class="barras" aria-label="${v}/3">${[0, 1, 2].map((i) => `<i class="${i < v ? "on" : ""}"></i>`).join("")}</span></h3><div class="acoes">${botoes}</div></div>`;
  };
  $("#painel").innerHTML = `
    <div><h2>${esc(dd.nome)}</h2>
      <p class="meta">${fmtInt(dd.pop)} ${esc(t("hab"))}</p>
      <p class="meta">${esc(t("causa")(causa[dd.primH] || dd.primH, causa[dd.primM] || dd.primM))}</p></div>
    <div class="numeros">
      <div class="num"><b>${fmt1(dd.tee)} → ${fmt1(taxaReg(id))}</b><span>${esc(t("kReg"))}</span></div>
      <div class="num"><b>${esc(oculto)}</b><span>${esc(t("kOculto"))}${ocultoConhecido(id) ? "" : ` · ${esc(t("ocultoDica"))}`}</span></div>
    </div>
    ${dd.poucos ? `<p class="meta">${esc(t("poucos"))}</p>` : ""}
    ${temFila(id) ? `<p class="fila">${esc(t("fila"))}</p>` : ""}
    ${linhaNivel("P")}${linhaNivel("D")}${linhaNivel("T")}
    <div class="nivel extra" data-n="X"><h3>${esc(t("niveis").X)}</h3><div class="acoes">${botaoAcao(id, "pesquisa")}</div></div>`;
}

/* ---------- topo, barra e telas ---------- */
function renderHud() {
  const jogando = S && !S.fim && $("#tela-jogo").hidden === false;
  $("#h-sub").textContent = t("sub");
  $("#btn-idioma").textContent = lang === "es" ? "PT" : "ES";
  $("#btn-ajuda").setAttribute("aria-label", t("ajuda"));
  for (const k of ["#h-ano", "#h-dinheiro", "#h-pontos"]) $(k).hidden = !jogando;
  document.querySelector(".hud .marca").hidden = jogando;
  if (!jogando) return;
  $("#h-ano").textContent = `${ano()} · ${S.anoIdx + 1}/10`;
  $("#h-dinheiro").textContent = `💰 ${S.orc}`;
  $("#h-pontos").textContent = `⭐ ${fmtInt(S.pontos)}`;
}

function render() {
  if (!S || S.fim) return renderHud();
  $("#tela-inicio").hidden = true; $("#tela-fim").hidden = true; $("#tela-jogo").hidden = false; $("#barra").hidden = false;
  document.querySelectorAll("#modos button").forEach((b) => { b.textContent = b.dataset.modo === "cob" ? t("modoCob") : t("modoReg"); });
  const sel = $("#escolher");
  sel.innerHTML = `<option value="">${esc(t("escolher"))}</option>` + [...DEPS].sort((a, b) => a.nome.localeCompare(b.nome)).map((d) => `<option value="${d.id}" ${d.id === S.sel ? "selected" : ""}>${esc(d.nome)}</option>`).join("");
  pintarMapa();
  renderPainel();
  renderHud();
  $("#btn-fechar").textContent = t("fecharAno")(ano());
  const nadaComprado = !(S.compradasAno || []).length;
  $("#dica").textContent = S.anoIdx === 0 && nadaComprado ? t("dica1") : `${t("dicaOrc")(S.orc)} ${t("projAno")(fmtInt(pontosAno()))}`;
}

function telaInicio() {
  $("#tela-jogo").hidden = true; $("#tela-fim").hidden = true; $("#barra").hidden = true; $("#tela-inicio").hidden = false;
  const salvo = ler(CHAVE);
  const temSalvo = salvo && !salvo.fim && salvo.deps;
  $("#tela-inicio").innerHTML = `
    <h1>${esc(t("h1"))}</h1>
    <p class="sub">${esc(t("intro"))}</p>
    <div class="cartao"><ol class="passos">${t("passos").map((p) => `<li>${p}</li>`).join("")}</ol></div>
    <div class="btns">${temSalvo ? `<button class="btn" id="btn-continuar" type="button">${esc(t("continuar"))}</button><button class="btn sec" id="btn-nova" type="button">${esc(t("nova"))}</button>`
      : `<button class="btn" id="btn-nova" type="button">${esc(t("comecar"))}</button>`}</div>
    <p class="aviso">${esc(t("aviso"))}</p>`;
  renderHud();
}

function mostrarFim() {
  $("#tela-jogo").hidden = true; $("#barra").hidden = true; $("#tela-inicio").hidden = true; $("#tela-fim").hidden = false;
  const recAnt = ler("epidemia-py-recorde") || 0;
  const novo = S.pontos > recAnt;
  if (novo) guardar("epidemia-py-recorde", S.pontos);
  const popTot = DEPS.reduce((s, d) => s + d.pop, 0);
  const eq = DEPS.filter((d) => equil(d.id) >= 1);
  const faltava = DEPS.reduce((s, d) => s + (1 - S.deps[d.id].vis0) * d.pop, 0);
  const achado = DEPS.reduce((s, d) => s + (vis(d.id) - S.deps[d.id].vis0) * d.pop, 0);
  const x = {
    equil3: eq.length, popEq: fmtInt(100 * eq.reduce((s, d) => s + d.pop, 0) / popTot),
    revelados: fmtInt(Math.max(0, Math.min(100, 100 * achado / faltava))),
    gP: S.gasto.P, gD: S.gasto.D, gT: S.gasto.T, gX: S.gasto.X,
  };
  $("#tela-fim").innerHTML = `
    <h1>${esc(t("resTit"))}</h1>
    <div class="cartao"><div class="placar">⭐ ${fmtInt(S.pontos)}</div><p class="meta">${esc(t("pontos"))} · ${novo ? esc(t("novoRec")) : esc(t("recorde")(fmtInt(Math.max(recAnt, S.pontos))))}</p></div>
    <div class="cartao"><ul class="linhas">${t("resLinhas")(x).map((l) => `<li>${l}</li>`).join("")}</ul></div>
    <div class="cartao"><h2>${esc(t("realTit"))}</h2><ul class="linhas">${t("real").map((l) => `<li>${esc(l)}</li>`).join("")}</ul></div>
    <div class="btns"><button class="btn" id="btn-nova" type="button">${esc(t("denovo"))}</button><button class="btn sec" id="btn-compartir" type="button">${esc(t("compartir"))}</button></div>
    <p class="aviso">${esc(t("beta"))}</p>
    <div class="cartao"><h2>${esc(t("fontesTit"))}</h2><ol class="fontes">${FONTES.map((f) => `<li>${esc(f)}</li>`).join("")}</ol></div>`;
  renderHud();
  window.scrollTo(0, 0);
}

/* ---------- janelas ---------- */
function abrirModal(html) { $("#janela").innerHTML = html; $("#modal").hidden = false; $("#janela").scrollTop = 0; const b = $("#janela .btn"); if (b) b.focus(); }
function fecharModal() { $("#modal").hidden = true; }

function mostrarEvento() {
  const [tit, txt, efeito, fonte] = EVENTOS[ano()][lang];
  const priv = S.avisoPriv || {};
  abrirModal(`
    <p class="ano">${esc(t("anoDe")(ano(), S.anoIdx + 1))}</p>
    <h2>${esc(tit)}</h2><p>${esc(txt)}</p>
    <p class="efeito">${esc(efeito)}</p>
    ${priv.pago ? `<p class="meta">${esc(t("privPago")(priv.pago))}</p>` : ""}${priv.cancel ? `<p class="fila">${esc(t("privCancel")(priv.cancel))}</p>` : ""}
    <p class="fonte">${esc(t("fonte"))}: ${esc(fonte)}</p>
    <p><b>${esc(t("evOrc")(S.orc))}</b></p>
    <button class="btn" type="button" data-fechar>${esc(t("evBtn"))}</button>`);
}

function mostrarResumo(r) {
  const [licao, fonte] = LICOES[r.licao][lang];
  const ultimo = S.anoIdx >= ANOS.length - 1;
  abrirModal(`
    <p class="ano">${esc(t("fimAno")(r.ano))}</p>
    <h2>${esc(t("ptsAno")(fmtInt(r.pts)))}</h2>
    <ul class="linhas">
      ${r.subiu.length ? `<li>${esc(t("resSubiu")(r.subiu.length > 6 ? `${r.subiu.slice(0, 6).join(", ")} +${r.subiu.length - 6}` : r.subiu.join(", ")))}</li>` : ""}
      ${r.filas.length ? `<li>${esc(t("resFila")(r.filas.join(", ")))}</li>` : ""}
      <li>${esc(t("resEquil")(r.n3))}</li>
    </ul>
    <div class="licao"><p>${esc(licao)}</p><p class="fonte">${esc(t("fonte"))}: ${esc(fonte)}</p></div>
    <button class="btn" type="button" data-proximo>${esc(ultimo ? t("verRes") : t("prox")(ANOS[S.anoIdx + 1]))}</button>`);
}

function mostrarAjuda() {
  abrirModal(`
    <h2>${esc(t("ajuda"))}</h2>
    <ol class="passos">${t("passos").map((p) => `<li>${p}</li>`).join("")}</ol>
    <p class="aviso">${esc(t("aviso"))}</p>
    <h2>${esc(t("fontesTit"))}</h2><ol class="fontes">${FONTES.map((f) => `<li>${esc(f)}</li>`).join("")}</ol>
    <button class="btn" type="button" data-fechar>${esc(t("fechar"))}</button>`);
}

let timerToast;
function toast(msg) {
  const el = $("#toast");
  el.textContent = msg; el.hidden = false;
  clearTimeout(timerToast); timerToast = setTimeout(() => { el.hidden = true; }, 2200);
}

/* ---------- salvar e começar ---------- */
function salvar() { guardar(CHAVE, S); }

function novoJogo() {
  S = novoEstado();
  iniciarAno();
  render();
}

/* Depois de tocar no mapa, mostra o começo do painel se ele estiver escondido embaixo da tela */
function mostrarPainel() {
  const topo = $("#painel").getBoundingClientRect().top;
  if (topo > window.innerHeight * 0.8) window.scrollBy({ top: topo - window.innerHeight * 0.45, behavior: "smooth" });
}

function continuar() {
  S = ler(CHAVE);
  if (!S || S.fim) return novoJogo();
  render();
  if (S.fase === "evento") mostrarEvento();
  else if (S.fase === "resumo") mostrarResumo(S.log[S.log.length - 1]);
}

/* ---------- eventos da página ---------- */
document.addEventListener("click", (ev) => {
  const alvo = ev.target;
  const dep = alvo.closest && alvo.closest("#mapa .dep");
  if (dep && S && !S.fim) { S.sel = dep.dataset.dep; salvar(); render(); mostrarPainel(); return; }
  const ac = alvo.closest && alvo.closest("#painel .acao");
  if (ac && !ac.disabled) { comprar(S.sel, ac.dataset.acao); return; }
  if (dep === null && alvo.closest && alvo.closest("#mapa")) return;
  const modo = alvo.closest && alvo.closest("#modos button");
  if (modo) { S.modo = modo.dataset.modo; salvar(); pintarMapa(); return; }
  if (alvo.closest && alvo.closest("[data-fechar]")) { fecharModal(); if (S && S.fase === "evento") { S.fase = "jogando"; salvar(); render(); } return; }
  if (alvo.closest && alvo.closest("[data-proximo]")) { proximoAno(); return; }
  if (alvo.id === "btn-nova") { novoJogo(); return; }
  if (alvo.id === "btn-continuar") { continuar(); return; }
  if (alvo.id === "btn-fechar") { fecharAno(); return; }
  if (alvo.id === "btn-ajuda") { mostrarAjuda(); return; }
  if (alvo.id === "btn-compartir") { compartilhar(); return; }
  if (alvo.id === "btn-idioma") {
    lang = lang === "es" ? "pt" : "es"; guardar("epidemia-py-lang", lang);
    document.documentElement.lang = lang === "es" ? "es" : "pt-BR";
    if (!$("#modal").hidden && S) { if (S.fase === "evento") mostrarEvento(); else if (S.fase === "resumo") mostrarResumo(S.log[S.log.length - 1]); }
    if (!S) telaInicio(); else if (S.fim) mostrarFim(); else render();
  }
});
document.addEventListener("keydown", (ev) => {
  const dep = ev.target.closest && ev.target.closest("#mapa .dep");
  if (dep && (ev.key === "Enter" || ev.key === " ")) { ev.preventDefault(); S.sel = dep.dataset.dep; salvar(); render(); }
});
$("#escolher").addEventListener("change", (ev) => { if (ev.target.value) { S.sel = ev.target.value; salvar(); render(); $("#painel").scrollIntoView({ behavior: "smooth", block: "start" }); } });

async function compartilhar() {
  const url = location.href.split("#")[0];
  try {
    if (navigator.share) await navigator.share({ title: t("h1"), text: t("shareTxt"), url });
    else { await navigator.clipboard.writeText(url); toast(t("copiado")); }
  } catch (e) { /* o jogador cancelou */ }
}

document.documentElement.lang = lang === "es" ? "es" : "pt-BR";
montarMapa();
telaInicio();
