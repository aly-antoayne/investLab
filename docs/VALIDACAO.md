# Registro de validação — 16/11/2026

## Estado atual

38 testes aprovados e compilação de produção aprovada após as correções da revisão funcional. Os quatro problemas identificados foram corrigidos. A publicação em produção na Vercel foi concluída: https://investlab-sdd.vercel.app. O endereço abriu sem login, e HTML/JavaScript/CSS responderam HTTP 200.

## Verificações automatizadas

- `npm.cmd test`: 38 testes, zero falhas.
- `npm.cmd run build`: Vite, Tailwind e Chart.js compilados em `dist/`.
- `npm.cmd ls --depth=0`: dependências diretas instaladas sem erro informado pelo comando.
- Node.js usado: v22.14.0.

### Cálculos

Fórmula fechada versus recorrência mensal; exemplos do roteiro; taxa zero e negativa; aportes no final do mês; conversão anual/mensal; IR e IOF por idade de cada lote; base de IR após IOF; isenção e custódia conforme o modelo implementado; CDI e indexador composto; datas de fim de mês; entradas inválidas e proteção contra valores excessivos.

### Armazenamento e interface

Salvar, recuperar, comparar três registros, abrir cópia e excluir seletivamente; nomes tratados como texto; histórico incompatível ou corrompido preservado; limite e falha de quota; campos inválidos; resultado desatualizado; troca de unidade; quatro alternativas; cenários ordenados e limites de taxas.

Três regressões adicionadas:

1. Manter capital, aporte, prazo, data, taxa e resultados do comparador ao ir ao dashboard e retornar.
2. Importar a nova base após executar outra simulação válida.
3. “Pular para o conteúdo” preservar rota e conteúdo, focando `main`, em comparador, dashboard, histórico e premissas.

Os testes de interface usam jsdom com o módulo de gráficos substituído; não validam renderização de canvas.

## Verificações no Chrome

A revisão inicial abriu a compilação por um servidor HTTP somente local. HTML, JavaScript, CSS e favicon responderam com sucesso. Foram percorridos Início, Simulador, Comparador, Dashboard, Histórico e Premissas.

- Exemplo de dez anos: R$ 125.869,35 brutos, R$ 70.000,00 investidos.
- Exemplo de vinte anos: R$ 392.767,11 brutos, R$ 125.000,00 investidos.
- Bitcoin a −10% anuais por vinte anos: R$ 50.851,67 brutos e perda de R$ 74.148,33.
- Taxa zero: R$ 125.000,00, sem rendimento.
- Aporte negativo rejeitado; salvamento de resultado desatualizado bloqueado.
- Um registro salvo, recuperado após recarregamento e reaberto.
- Gráficos de linha, comparação, rosca positiva e barras de perda renderizados.
- Cenário pessimista alterado de 7% para 8%, com recálculo da tabela.
- Telas representativas inspecionadas na emulação de 360, 768 e 1280 pixels.

Após as correções, a pasta `dist/` foi servida localmente e os fluxos afetados foram novamente conferidos:

- Comparação com aporte de R$ 750: manteve o campo e os R$ 185.000,00 investidos após ir ao dashboard e voltar.
- Cenário negativo preservou os valores de referência; gráfico de perda passou a exibir somente as categorias do eixo, sem a legenda “undefined”.
- Layout intermediário passou a colocar o formulário acima dos resultados; campos compartilhados do comparador passaram a duas colunas até 1100 px. No build final, o prazo de 20 anos ficou legível e os cards de R$ 125.000,00 e R$ 267.767,11 apareceram sem quebra na janela de aproximadamente 960 px.
- Salto por teclado conferido no Chrome: o link recebeu foco, foi acionado com Enter e focou o conteúdo mantendo `#comparador`. Isso é uma verificação focal, não uma certificação da navegação integral por teclado.

## Pendências e alcance

- A inspeção em 360/768/1280 foi de telas representativas, não de todos os fluxos em todas as larguras. A revisão atual focalizou os quatro defeitos reportados.
- Navegação integral por teclado, leitor de tela, contraste medido e aparelhos físicos ainda não foram certificados. O salto para o conteúdo tem regressão automatizada.
- Comparação de três registros e exclusão estão cobertas pelos testes; não foram repetidas manualmente na revisão atual.
- Não houve reinstalação limpa de dependências nem revisão em Safari/Firefox.
- O modelo tributário não foi atualizado por esta correção; permanecem as premissas e limitações de `FINANCAS.md`.
- O registro anterior de bloqueio da automação de navegador é histórico: nesta revisão o Chrome foi acessado e houve inspeção real.
- Site público validado: https://investlab-sdd.vercel.app. No Chrome, o exemplo de dez anos retornou R$ 125.869,35 e o gráfico renderizou. Código-fonte da entrega: https://github.com/aly-antoayne/investLab. A verificação em outro dispositivo permanece pendente.

## Antes da apresentação

- [x] Publicar e conferir o endereço público sem autenticação.
- [ ] Abrir o endereço final em outro dispositivo.
- [ ] Conferir resolução do projetor, gráficos e tabelas no navegador da apresentação.
- [ ] Preparar simulações salvas no endereço final; localhost e Vercel possuem históricos separados.
- [ ] Ensaiar o roteiro e explicar bruto, deduções estimadas, taxas hipotéticas e limitações.

As mudanças e a regra de preservação do comparador estão em `AJUSTES-2026-11-16.md`.
