"use strict";
/* Ícones de traço do jogo (arte "luz contra a névoa", beta6): 24 x 24, traço na cor do texto (currentColor).
   Os mesmos desenhos da prancha de arte conceitual. ico("vacuna") devolve o <svg> pronto. */
const ICONES = {
  // ações
  vacuna: "M14.5 5.5l4 4-9 9-4-4zM7.5 16.5L3 21M16.5 7.5l3-3M18 3l3 3M12.6 9.9l1.4 1.4M10.8 11.7l1.4 1.4",
  tabaco: "M3 14h12v3H3zM15 14h3v3h-3M20.5 14v3M18 11c0-1.2.8-1.6.8-2.8S18 6.6 18 5.5M4 4l16 16",
  habitos: "M12 7.5c-1.6-1.4-4.4-1.6-5.8.2-1.9 2.4-1 6.9 1.2 9.6 1.1 1.4 2.3 1.6 3.4 1.1.4-.2.8-.3 1.2-.3s.8.1 1.2.3c1.1.5 2.3.3 3.4-1.1 2.2-2.7 3.1-7.2 1.2-9.6-1.4-1.8-4.2-1.6-5.8-.2zM12 7.5c0-1.8.6-3.2 2-4.5",
  vph: "M9 3h6M10 3v13.5a2 2 0 0 0 4 0V3M10 11h4",
  mamo: "M9 21l5.6-11.6c.9-1.9.3-4.2-1.4-5.1a2.6 2.6 0 0 0-2.4 0c-1.7.9-2.3 3.2-1.4 5.1L15 21",
  registro: "M9 3.5h6v3H9zM8 5H6.5A1.5 1.5 0 0 0 5 6.5v13A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5v-13A1.5 1.5 0 0 0 17.5 5H16M8.5 11h7M8.5 14.5h7M8.5 18h4",
  quimio: "M8 3h8v8.5a4 4 0 0 1-8 0zM8 7h8M12 15.5V17M10.5 17h3v2.5h-3zM12 19.5V22",
  radio: "M13.6 9.23L16.5 4.21A9 9 0 0 0 7.5 4.21L10.4 9.23A3.2 3.2 0 0 1 13.6 9.23ZM8.8 12L3 12A9 9 0 0 0 7.5 19.79L10.4 14.77A3.2 3.2 0 0 1 8.8 12ZM13.6 14.77L16.5 19.79A9 9 0 0 0 21 12L15.2 12A3.2 3.2 0 0 1 13.6 14.77Z",
  paliativos: "M4 12.5c0 4 3.6 7.5 8 7.5s8-3.5 8-7.5M12 13.5s-4-2.4-4-5a2 2 0 0 1 4-.9 2 2 0 0 1 4 .9c0 2.6-4 5-4 5z",
  pesquisa: "M2.5 9L12 4.5 21.5 9 12 13.5zM6.5 11v4.5c3 2.4 8 2.4 11 0V11M21.5 9v5",
  // placar, mapa e avisos
  ano: "M4 5.5h16V20H4zM4 10h16M8.5 3v4M15.5 3v4",
  moeda: "M5 7c0-1.4 3.1-2.5 7-2.5s7 1.1 7 2.5-3.1 2.5-7 2.5S5 8.4 5 7zM5 7v5c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V7M5 12v5c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-5",
  medalha: "M8 3l3 5M16 3l-3 5M12 21a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11zM12 13l1 1.9 2.1.3-1.5 1.5.4 2.1-2-1-2 1 .4-2.1-1.5-1.5 2.1-.3z",
  estrela: "M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.9z",
  coracao: "M12 20s-7-4.4-7-9.5A4 4 0 0 1 12 8a4 4 0 0 1 7 2.5C19 15.6 12 20 12 20z",
  oculto: "M3 3l18 18M10.6 6.2A9.7 9.7 0 0 1 12 6c5 0 8.5 4.5 9 6-.3.8-1.1 2.1-2.4 3.4M6.6 6.6C4.4 8 3.2 10.2 3 12c.5 1.5 4 6 9 6 1.6 0 3-.5 4.3-1.2M9.9 9.9a3 3 0 0 0 4.2 4.2",
  alvo: "M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17zM12 7.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9zM12 11.2a.8.8 0 1 0 0 1.6.8.8 0 0 0 0-1.6z",
  convenio: "M10 14l4-4M8.5 11.5l-2 2a3 3 0 0 0 4.2 4.2l2-2M15.5 12.5l2-2a3 3 0 0 0-4.2-4.2l-2 2",
  pessoas: "M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M16 5.5a3 3 0 0 1 0 5.6M21 20c0-2.6-1.6-4.9-4-5.7",
  luz: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1",
  nevoa: "M3 8h11M7 12h14M3 16h12M9 20h10",
  jornal: "M4 5h13v14H6a2 2 0 0 1-2-2zM17 9h3v8a2 2 0 0 1-2 2M7 8.5h7M7 12h7M7 15.5h4",
  bloqueado: "M7 11V8a5 5 0 0 1 10 0v3M5.5 11h13v9.5h-13z",
  demanda: "M3 10v4h3l7 4V6L6 10zM16.5 9a4 4 0 0 1 0 6M19 6.5a7.5 7.5 0 0 1 0 11",
  raio: "M13 2L4.5 13.5h6.5L10 22l8.5-11.5H12z",
  repete: "M4 11a8 8 0 0 1 13.7-5.3L20 8M20 3.5V8h-4.5M20 13a8 8 0 0 1-13.7 5.3L4 16M4 20.5V16h4.5",
  // habilidades
  celular: "M8 3h8v18H8zM11 18h2",
  diploma: "M6 4h12v16H6zM9 8h6M9 11h6M9 14h4",
  chip: "M7 7h10v10H7zM10 10h4v4h-4zM9 3v4M15 3v4M9 17v4M15 17v4M3 9h4M3 15h4M17 9h4M17 15h4",
  universidade: "M3 9l9-5 9 5zM5 9v9M9 9v9M15 9v9M19 9v9M3 20h18",
  antena: "M12 13v8M8.5 9.5a5 5 0 0 1 7 0M5.5 6.5a9 9 0 0 1 13 0M12 13a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z",
  grafico: "M4 20V4M4 20h16M7 15l4-4 3 3 5-6",
  frasco: "M9 3h6M10 3v6L4.5 19A1.5 1.5 0 0 0 5.8 21h12.4a1.5 1.5 0 0 0 1.3-2L14 9V3M7 15h10",
  van: "M3 7h11v9H3zM14 10h4l3 3v3h-7zM7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  bola: "M12 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM8 20h8M10 8a3 3 0 0 0-2 2",
  globo: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9M12 3C9.5 5.6 8.2 8.6 8.2 12s1.3 6.4 3.8 9",
  brilho: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z",
  chave: "M8 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM11.5 10.5L21 10.5M17 10.5v3M20 10.5v2.5",
  barraca: "M3 20L12 4l9 16zM12 4v16M8.5 20l3.5-6 3.5 6",
  predio: "M5 21V5h9v16M14 9h5v12M8 8h3M8 11h3M8 14h3M3 21h18",
  hospital: "M4 21V8h16v13M9 21v-5h6v5M12 10v4M10 12h4M3 21h18M8 8V4h8v4",
  louro: "M12 21c-4-2-6-6-6-11M12 21c4-2 6-6 6-11M6 10c2 0 3 1 3 3M6 14c1.8 0 3 .8 3.5 2.5M18 10c-2 0-3 1-3 3M18 14c-1.8 0-3 .8-3.5 2.5M6 6c1.5 0 2.5 1 2.5 2.5M18 6c-1.5 0-2.5 1-2.5 2.5",
  guindaste: "M4 21h8M8 21V5M8 5h12M8 5l4 4M18 5v5M17 10h2v3h-2zM5 5l3-2 3 2",
  diamante: "M6 3h12l3 6-9 12L3 9zM3 9h18M9 3l3 6 3-6",
  cidade: "M3 21V11h5v10M8 21V5h7v16M15 21V9h6v12M3 21h18M10.5 8h2M10.5 11h2M10.5 14h2",
  barras: "M4 20h16M7 20v-6M12 20V8M17 20v-10",
  protocolo: "M9 3.5h6v3H9zM8 5H6.5A1.5 1.5 0 0 0 5 6.5v13A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5v-13A1.5 1.5 0 0 0 17.5 5H16M8.5 13l2 2 4-4.5",
  rede: "M10 5a2 2 0 1 0 4 0 2 2 0 1 0-4 0M3 19a2 2 0 1 0 4 0 2 2 0 1 0-4 0M17 19a2 2 0 1 0 4 0 2 2 0 1 0-4 0M12 7v4M12 11l-6 6M12 11l6 6",
  medico: "M12 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM5 21c0-3.9 3.1-7 7-7s7 3.1 7 7M9 14.5v2.5a3 3 0 0 0 6 0",
  livro: "M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h11M9 8h6",
  microscopio: "M9 3h4l-1 9h-2zM11 12v2M6 21h12M8 18h8M15 9a5 5 0 0 1 0 9",
  dna: "M7 3c0 5 10 5 10 9s-10 4-10 9M17 3c0 5-10 5-10 9s10 4 10 9M8.5 6h7M8.5 18h7M10 12h4",
  trofeu: "M8 3h8v6a4 4 0 0 1-8 0zM8 5H4.5a3 3 0 0 0 3.5 4M16 5h3.5a3 3 0 0 1-3.5 4M12 13v4M8 21h8M9 17h6",
};

/* Ícone de cada habilidade da árvore */
const HAB_ICO = {
  b_reg: "celular", b_beca: "diploma", b_agentes: "pessoas", b_ia: "chip", b_uni: "universidade", b_tele: "antena",
  b_vig: "grafico", b_ensaios: "frasco", b_movel: "van", b_pred: "bola", b_paper: "globo", b_aps40: "brilho",
  p_chave: "chave", p_kermes: "barraca", p_camara: "predio", p_concessao: "hospital", p_caridade: "paliativos", p_royalties: "raio",
  p_acelconc: "radio", p_fundacao: "louro", p_zona: "guindaste", p_grande: "convenio", p_mecenas: "diamante", p_polo: "cidade",
  d_gestao: "barras", d_colegas: "pessoas", d_protocolos: "protocolo", d_rede: "rede", d_residentes: "medico", d_mbe: "livro",
  d_acel: "radio", d_tamizaje: "microscopio", d_rcbp: "dna", d_centro: "hospital", d_lider: "medalha", d_excel: "trofeu",
};

const ico = (nome, cls = "") => (ICONES[nome]
  ? `<svg class="i${cls ? ` ${cls}` : ""}" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${ICONES[nome]}"/></svg>`
  : "");

/* Tira o emoji do começo de um rótulo ("🤖 Tecnología e IA" → "Tecnología e IA"): na interface, o ícone de traço substitui o emoji */
const semEmoji = (s) => String(s).replace(/^[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}️‍]+\s*/u, "");
