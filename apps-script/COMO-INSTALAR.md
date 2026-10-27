# Como ligar o ranking (planilha do Google)

Feito uma vez, no computador, com a conta Google que vai guardar os dados do ranking: a **conta pessoal do Gi**, nunca a conta da Casa Baunilha (os dados dos alunos não se misturam com os da empresa). Faça tudo numa **janela anônima** (Ctrl+Shift+N) com só essa conta: o Apps Script se confunde quando há várias contas abertas no mesmo navegador.

**Versão 2 (27/10/2026):** antes de começar, o jogo pede nome, e-mail, faculdade e turma e o aceite dos termos (ou deixa jogar sem dados) e avisa a planilha no começo e no fim de cada partida. Ela também aceita o envio da versão 1 do jogo, então pode ser instalada antes de o jogo novo entrar no ar.

1. Abra **https://sheets.new** (cria uma planilha nova).
2. Dê o nome `2026.10.27 - Ranking - Jogo Epidemia - Congresso 2026`.
3. Menu **Extensões → Apps Script**. Abre uma aba com o arquivo `Código.gs`.
4. Apague o que estiver no editor e cole todo o conteúdo de [`Codigo.gs`](Codigo.gs) (no GitHub, botão "Copy raw file").
5. Clique no disquete (**Salvar**). Se pedir um nome para o projeto: `Ranking Epidemia`.
6. Botão azul **Implantar → Nova implantação**. Na engrenagem "Selecione o tipo", escolha **App da Web**:
   - Descrição: `ranking`
   - Executar como: **Eu**
   - Quem pode acessar: **Qualquer pessoa**. Não escolha "Qualquer pessoa com Conta do Google": com ela, os alunos teriam de entrar no Google para ver o ranking e mandar a pontuação.
   - Clique em **Implantar**.
7. **Autorizar acesso** → escolha a conta. O Google avisa que "não verificou este app": é normal, o app é seu. Clique em **Avançado → Acessar Ranking Epidemia (não seguro) → Permitir**. A tela de permissão pede só duas coisas: as planilhas em que o app está instalado (só esta, pela primeira linha do código) e mostrar conteúdo em janelas e barras laterais (o menu **Ranking do jogo** e a confirmação da limpeza). Se aparecerem caixinhas, marque todas. **Se pedir Gmail, Drive ou contatos, pare** e avise o Claude.
8. Copie o **URL do app da Web** (termina em `/exec`) e coloque em `config.js`, no campo `rankingUrl`.
   - Perdeu o link? **Implantar → Gerenciar implantações** → clique na implantação → copie o URL que termina em `/exec`. Não use o de «Testar implantações» (termina em `/dev` e só abre para você).

## Trocar a versão 1 pela 2 sem mudar o link

Se a planilha já roda a versão 1:

1. Na planilha, **Extensões → Apps Script**: apague o código, cole o `Codigo.gs` novo e clique em **Salvar**.
2. **Implantar → Gerenciar implantações** → lápis (editar) → **Versão: Nova versão** → **Implantar**. O link `/exec` continua o mesmo.
3. Recarregue a planilha (F5): aparece o menu **Ranking do jogo**. Clique em **Trazer as partidas da versão 1** (copia o que já estava na aba "Ranking").

## O que fica na planilha

- Aba **Partidas**: uma linha por partida, com começo, fim, com ou sem dados, nome, e-mail, faculdade, turma, pontos, idioma, versão do jogo e versão dos termos aceitos.
- Aba **Resumo** (menu **Ranking do jogo → Atualizar resumo**): partidas iniciadas e concluídas, com e sem dados; jogadores (e-mails diferentes); e, por faculdade e por turma, jogadores, partidas, média e melhor pontuação.

## Cuidados (LGPD)

- Não compartilhe a planilha: só o app da Web é público, e ele só mostra o top 20 (nome, faculdade, turma e pontos; nunca o e-mail).
- A partir de 31/10/2026 o ranking não mostra nomes e o app não grava mais dados pessoais. As partidas continuam contadas, sem dados.
- Em **30/11/2026**, na planilha, use o menu **Ranking do jogo → Apagar nome e e-mail (LGPD, 30/11/2026)**. O nome vira "—" e cada e-mail vira um número (J1, J2…), para os totais e as médias por faculdade e turma continuarem certos.
