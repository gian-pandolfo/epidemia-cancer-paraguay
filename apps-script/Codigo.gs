/** @OnlyCurrentDoc */
// A linha acima limita o script a esta planilha (não pede acesso às outras planilhas da conta).

/**
 * Ranking do jogo "Epidemia: Paraguay contra el cáncer" (congresso, 28/10/2026).
 *
 * Fica numa planilha do Google e é publicado como "App da Web" (executar como: eu; quem pode acessar: qualquer pessoa).
 * O jogo envia a pontuação (POST) e a página do ranking lê o top 20 (GET).
 *
 * LGPD: nome, faculdade e turma são guardados só para o ranking do congresso. A partir de 31/10/2026 o app para de
 * aceitar novos envios e de mostrar nomes; o menu "Ranking do jogo" da planilha apaga esses dados (fica só a pontuação).
 */
const ABA = "Ranking";
const CABECALHO = ["data_hora", "nome", "faculdade", "turma", "pontos", "pontos_por_ano", "idioma", "versao", "id"];
const MAX_POR_ANO = 3000;            // limite de um ano no jogo (folga sobre o máximo possível)
const MAX_PONTOS = 10 * MAX_POR_ANO;
const FIM_DADOS_PESSOAIS = new Date("2026-10-31T00:00:00-03:00");
const FUSO = "America/Asuncion";
const TOP = 20;

function aba_() {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  let aba = planilha.getSheetByName(ABA);
  if (!aba) {
    aba = planilha.insertSheet(ABA);
    aba.appendRow(CABECALHO);
    aba.setFrozenRows(1);
  }
  return aba;
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

function posicao_(aba, pontos) {
  const n = aba.getLastRow() - 1;
  if (n < 1) return 1;
  const todos = aba.getRange(2, 5, n, 1).getValues();
  return 1 + todos.filter((l) => Number(l[0]) > pontos).length;
}

function doPost(e) {
  try {
    if (new Date() >= FIM_DADOS_PESSOAIS) return json_({ ok: false, erro: "encerrado" });
    const d = JSON.parse(e.postData.contents);
    const nome = texto_(d.nome, 40), faculdade = texto_(d.faculdade, 60), turma = texto_(d.turma, 20);
    if (nome.length < 2 || faculdade.length < 2 || turma.length < 1) return json_({ ok: false, erro: "campos" });
    if (d.consentimento !== true) return json_({ ok: false, erro: "consentimento" });
    const anos = Array.isArray(d.anos) ? d.anos.map(Number) : [];
    const pontos = Number(d.pontos);
    const soma = anos.reduce((a, b) => a + b, 0);
    const anosOk = anos.length === 10 && anos.every((p) => Number.isInteger(p) && p >= 0 && p <= MAX_POR_ANO);
    if (!anosOk || !Number.isInteger(pontos) || pontos !== soma || pontos > MAX_PONTOS) return json_({ ok: false, erro: "pontos" });
    const id = texto_(d.id, 40);
    const cache = CacheService.getScriptCache();
    const chave = "envio_" + Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, id || nome + "|" + turma));
    if (cache.get(chave)) return json_({ ok: false, erro: "repetido" });
    const trava = LockService.getScriptLock();
    trava.waitLock(10000);
    try {
      const aba = aba_();
      aba.appendRow([new Date(), nome, faculdade, turma, pontos, anos.join(" "), texto_(d.idioma, 5), texto_(d.versao, 20), id]);
      cache.put(chave, "1", 21600);
      cache.remove("ranking");
      return json_({ ok: true, posicao: posicao_(aba, pontos) });
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
  const aba = aba_();
  const n = aba.getLastRow() - 1;
  const linhas = n > 0 ? aba.getRange(2, 1, n, 5).getValues() : [];
  const encerrado = new Date() >= FIM_DADOS_PESSOAIS;
  const top = linhas
    .filter((l) => l[4] !== "")
    .sort((a, b) => Number(b[4]) - Number(a[4]) || new Date(a[0]) - new Date(b[0]))
    .slice(0, TOP)
    .map((l) => ({
      nome: encerrado ? "—" : String(l[1]),
      faculdade: encerrado ? "" : String(l[2]),
      turma: encerrado ? "" : String(l[3]),
      pontos: Number(l[4]),
      hora: Utilities.formatDate(new Date(l[0]), FUSO, "dd/MM HH:mm"),
    }));
  const texto = JSON.stringify({ ok: true, partidas: Math.max(n, 0), top, encerrado, atualizado: Utilities.formatDate(new Date(), FUSO, "HH:mm:ss") });
  cache.put("ranking", texto, 5);
  return ContentService.createTextOutput(texto).setMimeType(ContentService.MimeType.JSON);
}

/* Menu na planilha para apagar os dados pessoais (LGPD) */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Ranking do jogo")
    .addItem("Apagar nome, faculdade e turma (LGPD)", "apagarDadosPessoais")
    .addToUi();
}

function apagarDadosPessoais() {
  const aba = aba_();
  const n = aba.getLastRow() - 1;
  if (n > 0) aba.getRange(2, 2, n, 3).setValue("—");
  CacheService.getScriptCache().remove("ranking");
}
