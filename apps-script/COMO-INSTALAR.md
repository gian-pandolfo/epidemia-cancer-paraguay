# Como ligar o ranking (planilha do Google)

Feito uma vez, no computador, com a conta Google que vai guardar os dados do ranking.

1. Abra **https://sheets.new** (cria uma planilha nova).
2. Dê o nome `2026.10.26 - Ranking - Jogo Epidemia - Congresso 2026`.
3. Menu **Extensões → Apps Script**. Abre uma aba com o arquivo `Código.gs`.
4. Apague o que estiver no editor e cole todo o conteúdo de [`Codigo.gs`](Codigo.gs) (no GitHub, botão "Copy raw file").
5. Clique no disquete (**Salvar**). Se pedir um nome para o projeto: `Ranking Epidemia`.
6. Botão azul **Implantar → Nova implantação**. Na engrenagem "Selecione o tipo", escolha **App da Web**:
   - Descrição: `ranking`
   - Executar como: **Eu**
   - Quem pode acessar: **Qualquer pessoa**
   - Clique em **Implantar**.
7. **Autorizar acesso** → escolha a conta. O Google avisa que "não verificou este app": é normal, o app é seu. Clique em **Avançado → Acessar Ranking Epidemia (não seguro) → Permitir**. O script só enxerga esta planilha.
8. Copie o **URL do app da Web** (termina em `/exec`) e coloque em `config.js`, no campo `rankingUrl`.

## Cuidados (LGPD)

- Não compartilhe a planilha: só o app da Web é público, e ele só mostra o top 20.
- Os dados pessoais (nome, faculdade, turma) valem só para o congresso. A partir de 31/10/2026 o app para de receber envios e de mostrar nomes.
- Para apagar os dados pessoais: na planilha, menu **Ranking do jogo → Apagar nome, faculdade e turma (LGPD)**. Fica só a pontuação.
