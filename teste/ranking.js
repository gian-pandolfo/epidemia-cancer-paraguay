// Página do ranking do jogo (tablet do estande e celulares). Separado do HTML para a CSP só deixar rodar
// scripts do próprio site. O QR do jogo vem desenhado em qr-jogo.svg (_ferramentas/gerar_qr.py).
"use strict";
const $ = (s) => document.querySelector(s);
const TXT = {
  es: { titulo: "Ranking", sub: "Epidemia: Paraguay contra el cáncer", escaneie: "Escanea y juega", partidas: "partidas jugadas",
    lgpd: "Nombre, facultad y curso se muestran solo durante el congreso, hasta el 31/10/2026. El e-mail nunca aparece.",
    vazio: "Todavía no hay partidas en el ranking. ¡Sé el primero!", semUrl: "El ranking aún no está configurado.",
    erro: "Sin conexión con el ranking. Reintentando…", atual: (h) => `Actualizado a las ${h}`, encerrado: "El ranking del congreso terminó.",
    tela: "Pantalla completa", pts: "puntos" },
  pt: { titulo: "Ranking", sub: "Epidemia: Paraguai contra o câncer", escaneie: "Escaneie e jogue", partidas: "partidas jogadas",
    lgpd: "Nome, faculdade e turma aparecem só durante o congresso, até 31/10/2026. O e-mail nunca aparece.",
    vazio: "Ainda não há partidas no ranking. Seja o primeiro!", semUrl: "O ranking ainda não está configurado.",
    erro: "Sem conexão com o ranking. Tentando de novo…", atual: (h) => `Atualizado às ${h}`, encerrado: "O ranking do congresso terminou.",
    tela: "Tela cheia", pts: "pontos" },
};
let lang = "es";
try { if (localStorage.getItem("epidemia-py-lang") === '"pt"') lang = "pt"; } catch (e) { /* sem armazenamento */ }
const t = (k) => TXT[lang][k];
const cfg = () => window.EPIDEMIA_CONFIG || {};
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const fmt = (n) => new Intl.NumberFormat(lang === "pt" ? "pt-BR" : "es-PY").format(n);
let ultimo = null, vistos = new Set(), primeiraCarga = true;

function textos() {
  document.documentElement.lang = lang === "es" ? "es" : "pt-BR";
  $("#t-titulo").textContent = t("titulo"); $("#t-sub").textContent = t("sub");
  $("#t-escaneie").textContent = t("escaneie"); $("#t-partidas").textContent = t("partidas");
  $("#t-lgpd").textContent = t("lgpd");
  $("#btn-idioma").textContent = lang === "es" ? "PT" : "ES";
  $("#btn-tela").setAttribute("aria-label", t("tela"));
  const url = cfg().jogoUrl || location.href.replace(/ranking\.html.*$/, "");
  $("#url").textContent = url.replace(/^https?:\/\//, "");
}

function desenhar(d) {
  $("#partidas").textContent = fmt(d.partidas || 0);
  const destacar = !primeiraCarga;
  primeiraCarga = false;
  if (d.encerrado) { $("#lista").innerHTML = `<p class="vazio">${esc(t("encerrado"))}</p>`; return; }
  if (!d.top || !d.top.length) { $("#lista").innerHTML = `<p class="vazio">${esc(t("vazio"))}</p>`; return; }
  const linhas = d.top.slice(0, 12).map((r, i) => {
    const chave = `${r.nome}|${r.turma}|${r.pontos}|${r.hora}`;
    const nova = destacar && !vistos.has(chave);
    vistos.add(chave);
    const detalhe = [r.faculdade, r.turma].filter(Boolean).join(" · ");
    return `<div class="linha${i < 3 ? ` p${i + 1}` : ""}${nova ? " nova" : ""}"><span class="pos">${i + 1}</span>
      <span class="quem"><b>${esc(r.nome)}</b><span>${esc(detalhe)}</span></span><span class="pts">${fmt(r.pontos)}</span></div>`;
  });
  $("#lista").innerHTML = linhas.join("");
  aparar();
}

/* No tablet deitado a lista não rola: tira as linhas que não cabem inteiras */
function aparar() {
  const lista = $("#lista");
  if (getComputedStyle(lista).overflow !== "hidden") return;
  const limite = lista.clientHeight - parseFloat(getComputedStyle(lista).paddingBottom);
  [...lista.querySelectorAll(".linha")].forEach((l) => { if (l.offsetTop + l.offsetHeight > limite) l.remove(); });
}
window.addEventListener("resize", () => { if (ultimo) { primeiraCarga = true; desenhar(ultimo); } });

let emCurso = false;
async function atualizar() {
  if (emCurso || document.visibilityState === "hidden") return;   // aba escondida não consulta o ranking
  const url = cfg().rankingUrl;
  const estado = $("#estado");
  if (!url) { $("#lista").innerHTML = `<p class="vazio">${esc(t("semUrl"))}</p>`; estado.textContent = ""; return; }
  emCurso = true;
  try {
    const r = await fetch(`${url}${url.includes("?") ? "&" : "?"}t=${Date.now()}`, { cache: "no-store" });
    const d = await r.json();
    if (!d.ok) throw new Error("resposta");
    ultimo = d;
    desenhar(d);
    estado.className = "estado";
    estado.textContent = t("atual")(d.atualizado || new Date().toLocaleTimeString());
  } catch (e) {
    estado.className = "estado erro";
    estado.textContent = t("erro");
  } finally {
    emCurso = false;
  }
}

/* Tela sempre acesa no estande (quando o navegador permite) */
let trava = null;
async function manterAcesa() {
  try { if ("wakeLock" in navigator && document.visibilityState === "visible") trava = await navigator.wakeLock.request("screen"); } catch (e) { /* sem permissão */ }
}
document.addEventListener("visibilitychange", () => { manterAcesa(); atualizar(); });

$("#btn-idioma").addEventListener("click", () => {
  lang = lang === "es" ? "pt" : "es";
  try { localStorage.setItem("epidemia-py-lang", JSON.stringify(lang)); } catch (e) { /* sem armazenamento */ }
  textos();
  if (ultimo) { primeiraCarga = true; desenhar(ultimo); } else atualizar();
});
const podeTela = document.fullscreenEnabled || document.webkitFullscreenEnabled;
$("#btn-tela").hidden = !podeTela;
$("#btn-tela").addEventListener("click", () => {
  const el = document.documentElement;
  const dentro = document.fullscreenElement || document.webkitFullscreenElement;
  if (dentro) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
  else (el.requestFullscreen || el.webkitRequestFullscreen).call(el);
  manterAcesa();
});

textos();
atualizar();
manterAcesa();
// Teto de consultas: a tela do estande (ranking.html#estande) atualiza a cada 5 s; celulares, a cada 30 s
setInterval(atualizar, location.hash === "#estande" ? 5000 : 30000);
