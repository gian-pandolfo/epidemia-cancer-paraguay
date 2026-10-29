/** @OnlyCurrentDoc */
// A linha acima limita o script a esta planilha (não pede acesso às outras planilhas da conta).

/**
 * Ranking e registro das partidas do jogo "Epidemia: Paraguay contra el cáncer" (congresso, 28/10/2026). Versão 3 (29/10/2026).
 *
 * Fica numa planilha do Google e é publicado como "App da Web" (executar como: eu; quem pode acessar: qualquer pessoa).
 * O jogo avisa quando uma partida começa e quando termina (POST); a página do ranking lê o top 20 (GET).
 * Antes de começar, o jogador escolhe: dar nome, e-mail, faculdade e turma e aceitar os termos (entra no ranking),
 * ou jogar sem dados (a partida só entra nas contagens).
 *
 * LGPD (decisões do Gi, 27/10/2026):
 * - o e-mail serve só para identificar o jogador e contatar quem ganhou; nunca sai da planilha;
 * - a partir de 31/10/2026 o ranking público não mostra nomes e o app não grava mais dados pessoais;
 * - em 30/11/2026 o menu "Ranking do jogo" apaga nome e e-mail (ficam os totais e as médias por faculdade e turma).
 *
 * Aceita também o envio da versão 1 do jogo (no fim da partida, sem "acao"): vira uma partida concluída, sem e-mail.
 *
 * Versão 3 (pedido do Gi, 29/10/2026):
 * - pessoas diferentes: cada aparelho avisa uma vez que abriu o jogo (aba Visitas: só data, idioma e versão) e marca
 *   a primeira partida dele (colunas aparelho_novo e aparelho_novo_sem_dados); nenhum identificador é guardado;
 * - menu «Zerar ranking»: as abas Partidas e Visitas vão para abas de arquivo e recomeçam vazias (nada é apagado).
 */
const ABA = "Partidas";
const CABECALHO = ["id", "inicio", "fim", "com_dados", "nome", "email", "faculdade", "turma", "pontos", "pontos_por_ano", "idioma", "versao", "termos",
  "aparelho_novo", "aparelho_novo_sem_dados"];   // as duas últimas: versão 3 (1ª partida deste aparelho; 1ª sem dados)
const C = {};
CABECALHO.forEach((c, i) => { C[c] = i; });   // posição de cada coluna numa linha (0 = primeira)
const ABA_RESUMO = "Resumo";
const ABA_VISITAS = "Visitas";       // um aviso por aparelho que abre o jogo (versão 3)
const SERVIDOR = 3;                   // versão deste código (aparece no GET, para conferir a implantação)
const MAX_POR_ANO = 3100;            // teto de um ano no jogo (3.000) + 100 do acerto no Desafío relámpago
const MAX_PONTOS = 10 * MAX_POR_ANO;
const FIM_RANKING = new Date("2026-10-31T00:00:00-03:00");   // ranking público sem nomes; o app não grava mais dados pessoais
const APAGAR_EM = "30/11/2026";                              // data combinada para apagar nome e e-mail pelo menu
const FUSO = "America/Asuncion";
const TOP = 20;
// Proteção contra congestionamento e abuso (decisão do Gi, 27/10/2026)
const TETO_POR_MINUTO = 60;           // avisos de início e de fim aceitos por minuto (cada um), somando todos os jogadores
const MAX_LINHAS = 3000;              // partidas guardadas; acima disso: "cheio"
const MAX_VISITAS = 20000;            // aparelhos que abriram o jogo; acima disso: "cheio"
const MAX_BYTES = 2000;               // um aviso legítimo tem uns 400 bytes
const CACHE_LISTA_S = 10;             // a lista do ranking é montada no máximo a cada 10 s, por mais gente que consulte
const EMAIL = /^[^\s@]{1,64}@[^\s@]+\.[^\s@]{2,}$/;

function aba_() {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  let aba = planilha.getSheetByName(ABA);
  if (!aba) {
    aba = planilha.insertSheet(ABA);
    aba.appendRow(CABECALHO);
    aba.setFrozenRows(1);
    // texto puro: a planilha não transforma id, turma ou pontos por ano em número nem em fórmula
    ["A:A", "D:H", "J:O"].forEach((faixa) => aba.getRange(faixa).setNumberFormat("@"));
  }
  if (aba.getLastColumn() < CABECALHO.length) {   // planilha da versão 2: acrescenta as colunas novas ao cabeçalho
    aba.getRange(1, 1, 1, CABECALHO.length).setValues([CABECALHO]);
    aba.getRange("N:O").setNumberFormat("@");
  }
  return aba;
}

function visitas_() {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  let aba = planilha.getSheetByName(ABA_VISITAS);
  if (!aba) {
    aba = planilha.insertSheet(ABA_VISITAS);
    aba.appendRow(["quando", "idioma", "versao"]);
    aba.setFrozenRows(1);
  }
  return aba;
}

/* Marca de aparelho novo (versão 3): «sim» na 1ª partida do aparelho e na 1ª sem dados; devolve true se mudou a linha */
function marcar_(l, novo, novoSem) {
  let mudou = false;
  if (novo && l[C.aparelho_novo] !== "sim") { l[C.aparelho_novo] = "sim"; mudou = true; }
  if (novoSem && l[C.com_dados] !== "sim" && l[C.aparelho_novo_sem_dados] !== "sim") { l[C.aparelho_novo_sem_dados] = "sim"; mudou = true; }
  return mudou;
}

/* Um aparelho avisa que abriu o jogo pela primeira vez: só data, idioma e versão (nada que identifique a pessoa) */
function visita_(d) {
  const cache = CacheService.getScriptCache();
  const minuto = "min_v" + Utilities.formatDate(new Date(), FUSO, "yyyyMMddHHmm");
  const trava = LockService.getScriptLock();
  trava.waitLock(10000);
  try {
    const noMinuto = Number(cache.get(minuto) || 0);
    if (noMinuto >= TETO_POR_MINUTO) return json_({ ok: false, erro: "limite" });
    const aba = visitas_();
    if (aba.getLastRow() - 1 >= MAX_VISITAS) return json_({ ok: false, erro: "cheio" });
    aba.appendRow([new Date(), texto_(d.idioma, 5), texto_(d.versao, 20)]);
    cache.put(minuto, String(noMinuto + 1), 120);
    return json_({ ok: true, contado: true });
  } finally {
    trava.releaseLock();
  }
}

function linhas_(aba) {
  const n = aba.getLastRow() - 1;
  return n > 0 ? aba.getRange(2, 1, n, CABECALHO.length).getValues() : [];
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/* Texto curto e limpo; tira sinais que a planilha leria como fórmula (=, +, -, @) */
function texto_(valor, max) {
  const s = String(valor == null ? "" : valor)
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^[=+\-@]+/, "")
    .trim();
  return s.slice(0, max);
}

/* Nome, e-mail, faculdade e turma conferidos; null se faltar algo ou depois de 31/10/2026 (não se grava mais) */
function dados_(d) {
  if (!d || typeof d !== "object" || new Date() >= FIM_RANKING) return null;
  const nome = texto_(d.nome, 40), faculdade = texto_(d.faculdade, 60), turma = texto_(d.turma, 20);
  const email = texto_(d.email, 254).toLowerCase();
  if (nome.length < 2 || faculdade.length < 2 || turma.length < 1 || !EMAIL.test(email)) return null;
  return { nome, email, faculdade, turma };
}

/* Pontos dos 10 anos: inteiros de 0 a 3.100 que somam o total */
function pontos_(d) {
  const anos = Array.isArray(d.anos) ? d.anos.map(Number) : [];
  const pontos = Number(d.pontos);
  const soma = anos.reduce((a, b) => a + b, 0);
  const ok = anos.length === 10 && anos.every((p) => Number.isInteger(p) && p >= 0 && p <= MAX_POR_ANO)
    && Number.isInteger(pontos) && pontos === soma && pontos <= MAX_PONTOS;
  return ok ? { pontos, anos } : null;
}

function linhaDoId_(aba, id) {
  const n = aba.getLastRow() - 1;
  if (n < 1) return 0;
  const achou = aba.getRange(2, 1, n, 1).createTextFinder(id).matchCase(true).matchEntireCell(true).findNext();
  return achou ? achou.getRow() : 0;
}

/* Quem é o jogador: o e-mail (ou o número que o substitui depois da LGPD); sem e-mail, cada partida conta sozinha */
function chave_(l) {
  const e = String(l[C.email] || "");
  return e && e !== "—" ? e : "id:" + l[C.id];
}

/* Ranking: partidas concluídas com dados; cada jogador aparece uma vez, com a melhor pontuação (empate: quem terminou antes) */
function ranking_(linhas) {
  const melhor = {};
  linhas.forEach((l) => {
    if (l[C.com_dados] !== "sim" || l[C.fim] === "" || l[C.pontos] === "") return;
    const k = chave_(l), atual = melhor[k];
    if (!atual || Number(l[C.pontos]) > Number(atual[C.pontos])) melhor[k] = l;
  });
  return Object.keys(melhor).map((k) => melhor[k])
    .sort((a, b) => Number(b[C.pontos]) - Number(a[C.pontos]) || new Date(a[C.fim]) - new Date(b[C.fim]));
}

function posicao_(aba, registro) {
  const i = ranking_(linhas_(aba)).findIndex((l) => chave_(l) === chave_(registro));
  return i >= 0 ? i + 1 : null;
}

function doPost(e) {
  try {
    if (!e.postData || String(e.postData.contents).length > MAX_BYTES) return json_({ ok: false, erro: "campos" });
    const d = JSON.parse(e.postData.contents);
    if (d.acao === "visita") return visita_(d);   // versão 3: um aparelho abriu o jogo
    const acao = d.acao === "inicio" || d.acao === "fim" ? d.acao : "v1";
    if (acao === "v1" && new Date() >= FIM_RANKING) return json_({ ok: false, erro: "encerrado" });
    const id = /^[A-Za-z0-9_-]{4,40}$/.test(String(d.id || "")) ? String(d.id) : "";   // o jogo manda letras e números
    if (!id) return json_({ ok: false, erro: "campos" });
    let dados = null, termos = "";
    if (acao === "v1") {
      if (d.consentimento !== true) return json_({ ok: false, erro: "consentimento" });
      const nome = texto_(d.nome, 40), faculdade = texto_(d.faculdade, 60), turma = texto_(d.turma, 20);
      if (nome.length < 2 || faculdade.length < 2 || turma.length < 1) return json_({ ok: false, erro: "campos" });
      dados = { nome, email: "", faculdade, turma };
      termos = "v1";
    } else if (d.dados) {
      dados = dados_(d.dados);
      if (!dados && new Date() < FIM_RANKING) return json_({ ok: false, erro: "campos" });
      termos = texto_(d.termos, 20);
      if (dados && !termos) return json_({ ok: false, erro: "consentimento" });
    }
    const pts = acao === "inicio" ? null : pontos_(d);
    if (acao !== "inicio" && !pts) return json_({ ok: false, erro: "pontos" });
    const cache = CacheService.getScriptCache();
    const minuto = "min_" + (acao === "inicio" ? "i" : "f") + Utilities.formatDate(new Date(), FUSO, "yyyyMMddHHmm");
    const trava = LockService.getScriptLock();
    trava.waitLock(10000);
    try {
      const aba = aba_();
      const linha = linhaDoId_(aba, id);   // dentro da trava: dois reenvios juntos não gravam em dobro
      const faixa = linha ? aba.getRange(linha, 1, 1, CABECALHO.length) : null;
      const atual = faixa ? faixa.getValues()[0] : null;
      const novo = d.novo === true, novoSem = d.novoSemDados === true;   // versão 3: 1ª partida deste aparelho
      if (atual && (acao === "inicio" || atual[C.fim] !== "")) {   // aviso repetido: responde como da primeira vez
        if (marcar_(atual, novo, novoSem)) faixa.setValues([atual]);   // ...mas guarda a marca de aparelho novo, se ela veio agora
        return json_({ ok: true, repetido: true, contado: true, posicao: acao !== "inicio" && atual[C.com_dados] === "sim" ? posicao_(aba, atual) : null });
      }
      const noMinuto = Number(cache.get(minuto) || 0);
      if (noMinuto >= TETO_POR_MINUTO) return json_({ ok: false, erro: "limite" });   // teto de avisos por minuto
      if (!atual && aba.getLastRow() - 1 >= MAX_LINHAS) return json_({ ok: false, erro: "cheio" });
      const agora = new Date();
      let registro;
      if (atual) {   // fim de uma partida que avisou o começo: completa a mesma linha
        registro = atual;
        registro[C.fim] = agora;
        registro[C.pontos] = pts.pontos;
        registro[C.pontos_por_ano] = pts.anos.join(" ");
        marcar_(registro, novo, novoSem);
        faixa.setValues([registro]);
      } else {       // começo, ou fim sem começo registrado (sem conexão no começo, ou versão 1 do jogo)
        registro = CABECALHO.map(() => "");
        registro[C.id] = id;
        registro[acao === "inicio" ? C.inicio : C.fim] = agora;
        registro[C.com_dados] = dados ? "sim" : "não";
        if (dados) {
          registro[C.nome] = dados.nome; registro[C.email] = dados.email;
          registro[C.faculdade] = dados.faculdade; registro[C.turma] = dados.turma; registro[C.termos] = termos;
        }
        if (pts) { registro[C.pontos] = pts.pontos; registro[C.pontos_por_ano] = pts.anos.join(" "); }
        registro[C.idioma] = texto_(d.idioma, 5);
        registro[C.versao] = texto_(d.versao, 20);
        marcar_(registro, novo, novoSem);
        aba.appendRow(registro);
      }
      cache.put(minuto, String(noMinuto + 1), 120);
      if (acao === "inicio") return json_({ ok: true, contado: true });
      cache.remove("ranking");
      return json_({ ok: true, contado: true, posicao: registro[C.com_dados] === "sim" ? posicao_(aba, registro) : null });
    } finally {
      trava.releaseLock();
    }
  } catch (err) {
    return json_({ ok: false, erro: "servidor" });
  }
}

function doGet() {
  const cache = CacheService.getScriptCache();
  const guardado = cache.get("ranking");
  if (guardado) return ContentService.createTextOutput(guardado).setMimeType(ContentService.MimeType.JSON);
  const linhas = linhas_(aba_());
  const encerrado = new Date() >= FIM_RANKING;
  const top = ranking_(linhas).slice(0, TOP).map((l) => ({
    nome: encerrado ? "—" : String(l[C.nome]),
    faculdade: encerrado ? "" : String(l[C.faculdade]),
    turma: encerrado ? "" : String(l[C.turma]),
    pontos: Number(l[C.pontos]),
    hora: Utilities.formatDate(new Date(l[C.fim]), FUSO, "dd/MM HH:mm"),
  }));
  const concluidas = linhas.filter((l) => l[C.fim] !== "").length;
  const texto = JSON.stringify({ ok: true, servidor: SERVIDOR, partidas: concluidas, top, encerrado, atualizado: Utilities.formatDate(new Date(), FUSO, "HH:mm:ss") });
  cache.put("ranking", texto, CACHE_LISTA_S);
  return ContentService.createTextOutput(texto).setMimeType(ContentService.MimeType.JSON);
}

/* ---------- menu da planilha (só o Gi vê) ---------- */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Ranking do jogo")
    .addItem("Atualizar resumo", "atualizarResumo")
    .addItem("Trazer as partidas da versão 1", "trazerVersao1")
    .addSeparator()
    .addItem("Zerar ranking (guarda tudo numa aba de arquivo)", "zerarRanking")
    .addSeparator()
    .addItem("Apagar nome e e-mail (LGPD, " + APAGAR_EM + ")", "apagarDadosPessoais")
    .addToUi();
}

/* Partidas com dados agrupadas por faculdade (e turma), sem diferenciar maiúsculas nem espaços extras */
function grupos_(linhas, campos) {
  const g = {};
  linhas.filter((l) => l[C.com_dados] === "sim").forEach((l) => {
    const nomes = campos.map((c) => String(l[C[c]]).replace(/\s+/g, " ").trim());
    const k = nomes.join("|").toUpperCase();
    const x = g[k] || (g[k] = { nomes, jogadores: {}, iniciadas: 0, concluidas: 0, soma: 0, melhor: 0 });
    x.iniciadas++;
    x.jogadores[chave_(l)] = true;
    if (l[C.fim] !== "" && l[C.pontos] !== "") {
      x.concluidas++;
      x.soma += Number(l[C.pontos]);
      x.melhor = Math.max(x.melhor, Number(l[C.pontos]));
    }
  });
  return Object.keys(g).map((k) => g[k])
    .sort((a, b) => b.concluidas - a.concluidas || b.iniciadas - a.iniciadas)
    .map((x) => x.nomes.concat([Object.keys(x.jogadores).length, x.iniciadas, x.concluidas,
      x.concluidas ? Math.round(x.soma / x.concluidas) : "", x.concluidas ? x.melhor : ""]));
}

/* Resumo para o Gi: partidas iniciadas e concluídas (com e sem dados), jogadores e médias por faculdade e turma */
function atualizarResumo() {
  const linhas = linhas_(aba_());
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const aba = planilha.getSheetByName(ABA_RESUMO) || planilha.insertSheet(ABA_RESUMO);
  aba.clear();
  const com = (l) => l[C.com_dados] === "sim", fim = (l) => l[C.fim] !== "";
  const conta = (f) => linhas.filter(f).length;
  const jogadores = (f) => Object.keys(linhas.filter((l) => com(l) && f(l)).reduce((s, l) => { s[chave_(l)] = true; return s; }, {})).length;
  const colunas = ["Jogadores", "Partidas iniciadas", "Concluídas", "Média de pontos (concluídas)", "Melhor"];
  const blocos = [
    [["Resumo do jogo Epidemia", "Atualizado em " + Utilities.formatDate(new Date(), FUSO, "dd/MM/yyyy HH:mm")]],
    [["Partidas", "Total", "Com dados", "Sem dados"],
      ["Iniciadas", linhas.length, conta(com), conta((l) => !com(l))],
      ["Concluídas", conta(fim), conta((l) => fim(l) && com(l)), conta((l) => fim(l) && !com(l))]],
    [["Jogadores com dados (e-mails diferentes)", jogadores(() => true)],
      ["... que concluíram ao menos uma partida", jogadores(fim)]],
    [["Pessoas diferentes (aparelhos; ninguém é identificado)", "Total"],
      ["Abriram o jogo", Math.max(0, visitas_().getLastRow() - 1)],
      ["Jogaram ao menos uma partida", conta((l) => l[C.aparelho_novo] === "sim")],
      ["... das quais ao menos uma sem dados", conta((l) => l[C.aparelho_novo_sem_dados] === "sim")],
      ["Aparelho = celular ou navegador; quem limpa os dados do navegador ou troca de aparelho conta de novo. Desde a versão 3 (29/10/2026).", ""]],
    [["Faculdade"].concat(colunas)].concat(grupos_(linhas, ["faculdade"])),
    [["Faculdade", "Turma"].concat(colunas)].concat(grupos_(linhas, ["faculdade", "turma"])),
  ];
  let r = 1;
  blocos.forEach((bloco) => {
    const largura = Math.max.apply(null, bloco.map((l) => l.length));
    const ret = bloco.map((l) => l.concat(Array(largura - l.length).fill("")));
    aba.getRange(r, 1, ret.length, largura).setValues(ret);
    aba.getRange(r, 1, 1, largura).setFontWeight("bold");
    r += ret.length + 1;
  });
  aba.autoResizeColumns(1, 7);
}

/* Depois de trocar a versão 1 pela 2: copia as partidas da aba "Ranking" (versão 1) para "Partidas" */
function trazerVersao1() {
  const antiga = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Ranking");
  if (!antiga || antiga.getLastRow() < 2) return;
  const aba = aba_();
  const ja = {};
  linhas_(aba).forEach((l) => { ja[String(l[C.id])] = true; });
  const novas = antiga.getRange(2, 1, antiga.getLastRow() - 1, 9).getValues()
    .filter((l) => l[8] && !ja[String(l[8])])
    .map((l) => {
      const r = CABECALHO.map(() => "");
      r[C.id] = String(l[8]); r[C.fim] = l[0]; r[C.com_dados] = "sim";
      r[C.nome] = l[1]; r[C.faculdade] = l[2]; r[C.turma] = l[3]; r[C.pontos] = l[4]; r[C.pontos_por_ano] = l[5];
      r[C.idioma] = l[6]; r[C.versao] = l[7]; r[C.termos] = "v1";
      return r;
    });
  if (novas.length) aba.getRange(aba.getLastRow() + 1, 1, novas.length, CABECALHO.length).setValues(novas);
  CacheService.getScriptCache().remove("ranking");
}

/* LGPD: nome vira "—" e cada e-mail vira um número (J1, J2…), para os totais de jogadores continuarem certos */
function apagarDadosPessoais() {
  const ui = SpreadsheetApp.getUi();
  const resp = ui.alert("Apagar nome e e-mail de todas as partidas?",
    "Cada e-mail vira um número (J1, J2…) e o nome vira \"—\". Faculdade, turma e pontos ficam. Não dá para desfazer.", ui.ButtonSet.YES_NO);
  if (resp !== ui.Button.YES) return;
  aba_();
  // a aba atual e as de arquivo (versão 3: «Zerar ranking»); o mesmo e-mail vira o mesmo número em todas
  const abas = SpreadsheetApp.getActiveSpreadsheet().getSheets().filter((a) => a.getName() === ABA || a.getName().indexOf(ABA + " - arquivo") === 0);
  const faixas = abas.filter((a) => a.getLastRow() > 1).map((a) => a.getRange(2, C.nome + 1, a.getLastRow() - 1, 2));   // colunas nome e email, lado a lado
  const valores = faixas.map((f) => f.getValues());
  const numero = {};
  // se o menu já rodou antes, continua a numeração de onde parou
  let prox = 1 + Math.max.apply(null, [0].concat(...valores.map((v) => v.map((l) => Number((/^J(\d+)$/.exec(String(l[1])) || [0, 0])[1])))));
  faixas.forEach((faixa, i) => faixa.setValues(valores[i].map((l) => {
    const e = String(l[1]);
    if (!e.includes("@")) return ["—", e];          // sem e-mail ou já apagado
    if (!numero[e]) numero[e] = "J" + prox++;
    return ["—", numero[e]];
  })));
  CacheService.getScriptCache().remove("ranking");
  atualizarResumo();
}

/* Zerar ranking (versão 3, pedido do Gi em 29/10/2026): nada é apagado. «Partidas» e «Visitas» ganham o nome
   «… - arquivo AAAA.MM.DD HH.mm.ss» e abas novas, vazias, recomeçam o ranking e as contagens.
   Para os aparelhos contarem de novo num evento novo, mudar também «edicao» no config.js do jogo. */
function zerarRanking() {
  const ui = SpreadsheetApp.getUi();
  const resp = ui.alert("Zerar o ranking?",
    "As abas Partidas e Visitas vão para abas de arquivo (nada é apagado). O ranking e as contagens recomeçam do zero.", ui.ButtonSet.YES_NO);
  if (resp !== ui.Button.YES) return;
  const trava = LockService.getScriptLock();
  trava.waitLock(30000);
  try {
    const planilha = SpreadsheetApp.getActiveSpreadsheet();
    const quando = Utilities.formatDate(new Date(), FUSO, "yyyy.MM.dd HH.mm.ss");
    [ABA, ABA_VISITAS].forEach((nome) => {
      const aba = planilha.getSheetByName(nome);
      if (aba) aba.setName(nome + " - arquivo " + quando);
    });
    aba_();
    visitas_();
    CacheService.getScriptCache().remove("ranking");
  } finally {
    trava.releaseLock();
  }
  atualizarResumo();
}
