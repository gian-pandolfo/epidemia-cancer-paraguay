/* Música de fundo (pedido do Gi, 27/10/2026): composição original, tocada pelo próprio celular (Web Audio).
   Violão de cordas duplas, como o ronroco andino, dedilhado devagar em ré menor, com muito espaço e eco: o clima da
   trilha de "The Last of Us", sem copiar melodia nenhuma. Não há arquivo de áudio nem música de terceiros, então não
   há direitos autorais de ninguém. O botão 🔊/🔇 liga e desliga e a escolha fica guardada no celular.
   Começa só depois do primeiro toque na tela (regra dos navegadores) e para quando o jogo sai da tela. */
(() => {
  const CHAVE = "epidemia-py-som";
  const BPM = 62, OITAVO = 60 / BPM / 2, VOLUME = 2.8;   // calibrado na prévia: média perto de −26 dB, picos abaixo de −6 dB
  // 8 compassos em ré menor: Dm, B♭, F, C, Dm, Gm, B♭, A (notas MIDI, do baixo para o agudo)
  const ACORDES = [[38, 50, 57, 62, 65], [46, 53, 58, 62, 65], [41, 48, 53, 57, 60], [48, 55, 60, 64, 67],
    [38, 50, 57, 62, 65], [43, 50, 55, 58, 62], [46, 53, 58, 62, 65], [45, 52, 57, 61, 64]];
  const DEDILHADO = [0, 2, 3, 4, 1, 3, 2, 4];   // qual nota do acorde em cada oitavo do compasso
  // Melodia: [compasso, oitavo, nota MIDI]; termina na sensível (dó♯) que volta para o ré
  const MELODIA = [[0, 0, 69], [0, 5, 65], [0, 7, 64], [1, 0, 62],
    [4, 0, 72], [4, 3, 69], [4, 4, 67], [4, 6, 65], [5, 0, 64], [5, 3, 65], [5, 4, 62],
    [7, 2, 61], [7, 4, 64]];

  let ctx = null, entrada = null, mestre = null, relogio = null, ligado = false, passo = 0, proximo = 0;
  const buffers = {};
  const lerPref = () => { try { return localStorage.getItem(CHAVE); } catch (e) { return null; } };
  const gravarPref = (v) => { try { localStorage.setItem(CHAVE, v); } catch (e) { /* sem armazenamento */ } };
  const botao = () => document.getElementById("btn-som");

  /* Corda dedilhada (Karplus-Strong): um ruído curto que se repete e se apaga como uma corda; duas cordas quase iguais
     soam juntas, como os pares do ronroco. Gerada abaixo da nota e afinada depois pela velocidade de leitura. */
  function corda(midi) {
    if (buffers[midi]) return buffers[midi];
    const sr = ctx.sampleRate, f = 440 * 2 ** ((midi - 69) / 12), seg = midi < 50 ? 5 : midi < 62 ? 4 : 3;
    const n = Math.floor(sr * seg), b = ctx.createBuffer(1, n, sr), d = b.getChannelData(0);
    const p = Math.max(2, Math.floor(sr / f - 0.5)), perda = Math.pow(0.001, 1 / (f * seg * 0.9));
    for (const desafina of [1, 1.0025]) {
      const q = Math.max(2, Math.round(p / desafina)), linha = new Float32Array(q);
      for (let i = 0; i < q; i++) linha[i] = Math.random() * 2 - 1;
      for (let i = 1; i < q; i++) linha[i] = 0.5 * (linha[i] + linha[i - 1]);   // ataque menos áspero, de unha macia
      for (let i = 0, k = 0; i < n; i++) {
        const a = linha[k], prox = linha[(k + 1) % q];
        d[i] += a * 0.5;
        linha[k] = perda * 0.5 * (a + prox);
        k = (k + 1) % q;
      }
    }
    const fim = Math.floor(sr * 0.25);
    for (let i = 0; i < fim; i++) d[n - 1 - i] *= i / fim;
    buffers[midi] = { b, taxa: f * (p + 0.5) / sr };
    return buffers[midi];
  }

  /* Eco de sala grande: ruído que se apaga devagar, mais escuro no fim */
  function eco(seg) {
    const sr = ctx.sampleRate, n = Math.floor(sr * seg), b = ctx.createBuffer(2, n, sr);
    for (let c = 0; c < 2; c++) {
      const d = b.getChannelData(c);
      let lp = 0;
      for (let i = 0; i < n; i++) { lp += 0.3 * ((Math.random() * 2 - 1) * Math.pow(1 - i / n, 3) - lp); d[i] = lp; }
    }
    return b;
  }

  function montar() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    entrada = ctx.createGain();
    mestre = ctx.createGain(); mestre.gain.value = 0;
    const seco = ctx.createGain(); seco.gain.value = 0.6;
    const sala = ctx.createConvolver(); sala.buffer = eco(3.4);
    const molhado = ctx.createGain(); molhado.gain.value = 0.5;
    const quente = ctx.createBiquadFilter(); quente.type = "lowpass"; quente.frequency.value = 4200;
    entrada.connect(seco); seco.connect(quente);
    entrada.connect(sala); sala.connect(molhado); molhado.connect(quente);
    quente.connect(mestre); mestre.connect(ctx.destination);
  }

  function nota(midi, t, vol, pan) {
    const c = corda(midi), fonte = ctx.createBufferSource(), g = ctx.createGain();
    fonte.buffer = c.b; fonte.playbackRate.value = c.taxa; g.gain.value = vol;
    fonte.connect(g);
    if (ctx.createStereoPanner) { const pn = ctx.createStereoPanner(); pn.pan.value = pan; g.connect(pn); pn.connect(entrada); }
    else g.connect(entrada);
    fonte.start(Math.max(ctx.currentTime, t));   // o atraso humano nunca pode cair antes de agora
  }

  /* Um oitavo de compasso: dedilhado esparso (sorteado a cada volta) + melodia que aparece e some */
  function tocarPasso(p, t) {
    const ciclo = Math.floor(p / 64), compasso = Math.floor(p / 8) % 8, pos = p % 8, h = () => (Math.random() - 0.5) * 0.024;
    const acorde = ACORDES[compasso];
    if (pos === 0) nota(acorde[0], t + h(), 0.42, -0.15);
    else if (Math.random() < 0.55) nota(acorde[DEDILHADO[pos]], t + h(), 0.2 + Math.random() * 0.1, (Math.random() - 0.5) * 0.6);
    if (ciclo % 3 !== 0) {   // um ciclo só de violão, dois com melodia
      const oitava = ciclo >= 4 && Math.random() < 0.25 ? 12 : 0;
      for (const [c, o, m] of MELODIA) if (c === compasso && o === pos && Math.random() < 0.85) nota(m + oitava, t + h(), 0.5, 0.2);
    }
    if (compasso === 3 && pos === 6 && ciclo % 2 === 1) nota(86, t, 0.12, 0.4);   // um harmônico no alto, de vez em quando
  }

  function agendar() {
    if (!ctx) return;
    if (proximo < ctx.currentTime + 0.05) proximo = ctx.currentTime + 0.1;
    while (proximo < ctx.currentTime + 1.2) { tocarPasso(passo, proximo); passo++; proximo += OITAVO; }
  }

  function ligar() {
    try {
      if (!ctx) montar();
      ctx.resume();
      ligado = true;
      mestre.gain.cancelScheduledValues(ctx.currentTime);
      mestre.gain.setTargetAtTime(VOLUME, ctx.currentTime, 0.8);
      clearInterval(relogio); relogio = setInterval(agendar, 200); agendar();
    } catch (e) { ligado = false; }   // navegador sem Web Audio: o jogo segue sem som
    mostrar();
  }

  function desligar() {
    ligado = false;
    if (ctx) {
      mestre.gain.cancelScheduledValues(ctx.currentTime);
      mestre.gain.setTargetAtTime(0, ctx.currentTime, 0.15);
      setTimeout(() => { if (!ligado) { clearInterval(relogio); ctx.suspend(); } }, 700);
    }
    mostrar();
  }

  function mostrar() {   // o ícone mostra o que está tocando de verdade
    const b = botao();
    if (!b) return;
    b.textContent = ligado ? "🔊" : "🔇";
    b.setAttribute("aria-pressed", String(ligado));
  }

  document.addEventListener("click", (e) => {
    if (!e.target.closest || !e.target.closest("#btn-som")) return;
    if (ligado) { gravarPref("off"); desligar(); } else { gravarPref("on"); ligar(); }
  }, true);
  // primeiro toque em qualquer lugar (menos no próprio botão): começa a música, se ela não foi desligada.
  // "click" porque é o toque que o navegador do celular aceita para liberar o som
  const primeiro = (e) => {
    if (e.target.closest && e.target.closest("#btn-som")) return;
    document.removeEventListener("click", primeiro, true);
    if (lerPref() !== "off" && !ligado) ligar();
  };
  document.addEventListener("click", primeiro, true);
  document.addEventListener("visibilitychange", () => {
    if (!ctx || !ligado) return;
    if (document.hidden) { clearInterval(relogio); ctx.suspend(); }
    else { ctx.resume(); proximo = 0; clearInterval(relogio); relogio = setInterval(agendar, 200); }
  });
  mostrar();
})();
