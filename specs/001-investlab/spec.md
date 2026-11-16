# Especificação funcional: InvestLab

**Identificador**: 001-investlab  
**Data**: 2026-11-16  
**Status**: Implementada localmente; inspeção visual e publicação pendentes  
**Origem**: Enunciado acadêmico fornecido pelo usuário; conteúdo duplicado consolidado em uma única especificação.

## Objetivo

Permitir que uma pessoa simule a evolução do patrimônio, compare modalidades de investimento e compreenda o efeito de aportes, prazos, rendimentos, impostos e custos. O produto deverá funcionar como uma aplicação web educacional responsiva, com cálculos reais e histórico local.

O caso central é uma pessoa de 25 anos que possui R$ 5.000,00, consegue aportar R$ 500,00 por mês e deseja avaliar cenários para os próximos 20 anos.

## Escopo e restrições

- Tecnologias obrigatórias: HTML5, CSS3, Tailwind CSS e JavaScript.
- Utilizar Chart.js para gráficos, conforme a tabela de tecnologias do enunciado.
- Persistir simulações no localStorage, sem backend, autenticação ou banco de dados nesta versão.
- Interface, valores e mensagens em português brasileiro; moeda em reais.
- Disponibilizar navegação para Início, Simulador, Comparador, Dashboard e Histórico. Esses destinos podem ser páginas ou seções, desde que sejam acessíveis e claramente identificados.
- Publicar o projeto em GitHub Pages, Vercel ou Netlify e entregar o link do repositório.
- Desenvolver individualmente ou em equipe de até três integrantes, capazes de explicar o código entregue.

## Histórias de usuário e critérios de aceite

### US1 — Simular o crescimento do patrimônio (P1)

Como pessoa que planeja investir, quero informar capital inicial, aporte mensal, período, taxa e modalidade para estimar o patrimônio futuro.

**Verificação independente**: executar uma simulação e conferir os resultados com um cálculo de referência, sem depender do comparador ou do histórico.

1. Dado um formulário válido, quando eu simular, então vejo patrimônio final bruto e líquido quando calculável, total investido, rendimentos, rentabilidade acumulada e evolução durante o período.
2. Dado um período em anos ou meses, quando eu alternar a unidade mantendo a duração equivalente, então os resultados são equivalentes.
3. Dada uma taxa anual efetiva, quando eu simular, então ela é convertida para a taxa mensal equivalente, com aportes no final de cada mês.
4. Dada uma taxa zero, então o patrimônio bruto equivale ao capital inicial mais a soma dos aportes.
5. Dados valores ausentes, inválidos ou fora dos limites aceitos, então recebo uma mensagem junto ao campo e não vejo um novo resultado como se a entrada fosse válida.
6. Dada uma alteração após calcular, então a interface indica que o resultado precisa ser atualizado ou o recalcula de forma consistente.

### US2 — Configurar modalidades e cenários (P1)

Como usuário, quero configurar hipóteses de rentabilidade para comparar produtos com premissas explícitas.

**Verificação independente**: simular cada uma das quatro famílias de investimentos com as configurações disponíveis e verificar a identificação das premissas.

1. Para CDB, posso escolher taxa prefixada ou percentual do CDI, informar prazo e consultar a estimativa de impostos aplicáveis.
2. Para LCI/LCA, posso configurar taxa e prazo, incluindo percentual do CDI quando selecionado, e consultar o resultado líquido conforme o perfil tributário adotado.
3. Para Tesouro Direto, posso selecionar uma hipótese prefixada ou indexada, configurar o indicador e eventual taxa adicional e consultar os custos e impostos considerados.
4. Para criptomoedas, posso selecionar Bitcoin ou Ethereum e configurar valorização ou desvalorização hipotética.
5. Toda taxa predefinida é identificada como hipótese. Um dado de referência real, se usado, inclui fonte e data.
6. Posso configurar e comparar cenários pessimista, moderado e otimista; os nomes não implicam taxas garantidas e as respectivas hipóteses são exibidas.

### US3 — Comparar investimentos (P1)

Como usuário, quero comparar pelo menos três investimentos simultaneamente para entender diferenças nos resultados estimados.

**Verificação independente**: montar uma comparação com CDB, LCI/LCA e Tesouro, conferindo cada resultado contra o simulador com as mesmas entradas.

1. A comparação utiliza o mesmo valor inicial, aporte mensal e período em todas as alternativas por padrão.
2. Cada alternativa apresenta modalidade, hipótese de taxa, patrimônio final bruto e líquido quando calculável, total investido, rendimentos, rentabilidade acumulada, impostos e taxas.
3. Vejo uma comparação visual legível e os valores correspondentes em formato textual ou tabular.
4. Se a interface permitir parâmetros diferentes por alternativa, ela identifica explicitamente essas diferenças antes da interpretação dos resultados.
5. A comparação indica se os valores são brutos ou líquidos; um tratamento tributário não implementado não aparece como imposto zero nem como resultado líquido completo.
6. Uma alternativa de criptomoeda pode apresentar perda, sem tratamento visual ou matemático que transforme a perda em ganho.

### US4 — Interpretar o dashboard (P2)

Como usuário, quero um painel que explique os resultados selecionados por meio de indicadores e gráficos.

**Verificação independente**: carregar uma simulação ou comparação e verificar a correspondência entre gráficos, indicadores e dados de origem.

1. O painel mostra patrimônio projetado, total investido, aportes mensais acumulados, rendimentos e evolução do patrimônio.
2. Um gráfico de linha apresenta a evolução; um gráfico de barras compara modalidades; um gráfico de rosca ou pizza apresenta a distribuição com sua base identificada.
3. Em uma simulação individual, a distribuição pode representar capital inicial, aportes e rendimentos positivos, com título que descreva essa composição.
4. Se houver perdas, a distribuição não usa fatias negativas: apresenta valores e perdas em representação apropriada e mantém a explicação textual.
5. Alternativas de uma comparação são cenários mutuamente exclusivos: seus patrimônios não são somados como se compusessem uma carteira real.
6. Sem dados selecionados, o painel explica como iniciar uma simulação.

### US5 — Salvar e recuperar simulações (P2)

Como usuário, quero salvar, consultar, excluir e comparar simulações anteriores para revisar minhas hipóteses.

**Verificação independente**: salvar uma simulação, recarregar a página, abri-la, compará-la com outras salvas e excluí-la.

1. Salvar registra identificação, nome, data, parâmetros e premissas necessárias para interpretar e reproduzir o cálculo.
2. Após recarregar a aplicação no mesmo navegador e origem, as simulações continuam disponíveis.
3. Consultar uma simulação mostra seus parâmetros e resultados; reutilizá-la permite editar uma nova simulação sem sobrescrever silenciosamente a original.
4. Excluir remove apenas a simulação escolhida, com confirmação ou possibilidade de desfazer.
5. Posso selecionar pelo menos três simulações salvas para comparação; diferenças de capital, aporte e prazo ficam evidentes.
6. Se o armazenamento estiver indisponível, cheio ou contiver dados inválidos, a aplicação explica o problema e mantém o simulador utilizável.
7. O histórico vazio apresenta uma orientação para criar a primeira simulação. A interface informa que os dados são locais ao navegador e podem ser apagados ao limpar seus dados.

## Requisitos funcionais

- **RF-001**: Receber capital inicial e aporte mensal não negativos, com pelo menos um deles maior que zero.
- **RF-002**: Receber duração positiva equivalente a uma quantidade inteira de meses; rejeitar durações que exijam meses fracionários sem regra definida.
- **RF-003**: Identificar a periodicidade da taxa informada; aceitar taxa anual efetiva e, se oferecer taxa mensal, exibir a equivalência utilizada.
- **RF-004**: Aceitar taxas hipotéticas negativas para criptomoedas acima de -100% por período; rejeitar valores que inviabilizem a conversão ou produzam resultados não finitos.
- **RF-005**: Validar números finitos, entradas monetárias e limites operacionais apresentados ao usuário; não truncar ou ajustar entradas silenciosamente.
- **RF-006**: Usar as mesmas premissas e mecanismo de cálculo no simulador, comparador, dashboard e recuperação do histórico.
- **RF-007**: Separar valores brutos, deduções e valores líquidos; identificar custos incluídos, não aplicáveis e não modelados.
- **RF-008**: Exibir impostos e custos estimados segundo um perfil tributário documentado, com fonte oficial e data de verificação antes da implementação das regras.
- **RF-009**: Considerar a idade de cada aporte quando a tributação depender do tempo de aplicação; não aplicar automaticamente a idade do capital inicial a todos os aportes.
- **RF-010**: Exibir como indicadores e percentuais são definidos e qual a base utilizada na rentabilidade acumulada.
- **RF-011**: Gerar evolução mensal e apresentação legível para períodos longos, preservando o valor final e a correspondência com os indicadores.
- **RF-012**: Formatar moeda e percentuais no padrão brasileiro e distinguir ganhos de perdas por texto ou símbolo, além de cor.
- **RF-013**: Permitir comparação simultânea de no mínimo três alternativas e comparação de simulações salvas.
- **RF-014**: Oferecer mensagens claras de sucesso, erro e estados vazios.
- **RF-015**: Exibir o aviso educacional junto às projeções e na documentação: resultados são estimativas, não garantias, ofertas ou recomendações de investimento.
- **RF-016**: Não depender de APIs externas ou chaves privadas para as funcionalidades obrigatórias.
- **RF-017**: Manter formulários, navegação e resultados utilizáveis por teclado, com rótulos, foco visível e alternativas textuais aos gráficos.

## Premissas financeiras adotadas

### Juros e aportes

Os aportes ocorrem no **final de cada mês**, após a rentabilidade do saldo anterior. As taxas permanecem constantes em cada cenário, salvo futura funcionalidade explicitamente documentada.

Para capital inicial `P`, aporte mensal `A`, taxa anual efetiva decimal `i` e duração inteira em meses `n`:

```text
r = (1 + i)^(1/12) - 1
VF_inicial = P × (1 + r)^n
VF_aportes = A × ((1 + r)^n - 1) / r, se r ≠ 0
VF_aportes = A × n, se r = 0
VF_bruto = VF_inicial + VF_aportes
Total_investido = P + A × n
Rendimento_bruto = VF_bruto - Total_investido
VF_líquido = VF_bruto - Impostos - Taxas
Rendimento_líquido = VF_líquido - Total_investido
Rentabilidade_acumulada_bruta = 100 × Rendimento_bruto / Total_investido
Rentabilidade_acumulada_líquida = 100 × Rendimento_líquido / Total_investido
```

A rentabilidade acumulada representa a relação entre rendimento e capital desembolsado, sem ponderação temporal; não deve ser rotulada como taxa anualizada. Se uma dedução já estiver incorporada ao saldo, ela não pode ser subtraída novamente.

O cálculo mensal equivalente para conferir a evolução é `saldo_mês = saldo_anterior × (1 + r) + A`, iniciando em `P`. O mês zero mostra apenas o capital inicial. Valores monetários são arredondados para apresentação; o arredondamento interno e eventuais regras tributárias específicas deverão ser documentados e validados.

### Indexadores, impostos e custos

- CDI e demais indicadores serão hipóteses configuráveis por padrão. A especificação não fixa taxas de mercado.
- A regra de conversão de percentual do CDI e a composição de indexador com taxa adicional deverão ser documentadas e exibidas de forma compreensível antes do uso; aproximações educacionais deverão ser identificadas como tais.
- O perfil inicial assumido é pessoa física residente no Brasil. Outros perfis ficam fora do escopo inicial.
- Antes de implementar regras tributárias, verificar fontes oficiais aplicáveis ao produto, investidor e data de referência. Registrar alíquotas, faixas, isenções, limites e custos modelados na documentação.
- Deduções dependentes do prazo deverão ser calculadas por lote, incluindo o capital inicial e cada aporte, com convenção de datas ou dias explicitada. Se necessário, solicitar uma data-base para a simulação.
- Prazos sujeitos a IOF, custos de custódia, condições de isenção e tributação de criptomoedas exigem tratamento explícito: implementar a regra aplicável ou sinalizar a limitação, sem anunciar resultado líquido completo.
- Não presumir que uma regra tributária atual permanecerá inalterada durante toda a projeção; identificar a manutenção dessa regra como hipótese.
- A projeção de Tesouro não representa previsão de preço de venda antecipada. Oscilações de mercado, liquidez, inadimplência e mudanças futuras de taxas não são modeladas no cálculo constante.

## Casos de borda e falhas

- Taxa zero, taxa negativa admissível, apenas capital inicial e apenas aportes mensais.
- Prazo mínimo de um mês; último aporte sem rentabilidade anterior ao resgate.
- Caracteres inválidos, campos vazios, separadores brasileiros e conversão de porcentagem para decimal.
- Taxa de -100% ou menor, infinito, valores não numéricos e combinação que cause estouro numérico.
- Diferenças entre prazo total e idade de cada aporte para impostos.
- Perdas sem imposto indevidamente calculado sobre ganho inexistente, respeitadas as regras do cenário adotado.
- Gráficos com séries longas, valores nulos e perdas; atualização sem duplicar gráficos.
- Histórico vazio, registro corrompido ou incompatível e falha ao gravar ou excluir.
- Comparação de simulações com premissas diferentes sem mascarar essas diferenças.

## Entidades conceituais

| Entidade | Informações necessárias |
|---|---|
| Simulação | Identificação, nome, criação, versão das premissas, capital, aporte, período, modalidade e configuração de taxa |
| Modalidade | Família, ativo ou produto, regime de rentabilidade, indicador e custos/tributos aplicáveis |
| Cenário | Nome, hipóteses configuradas e referência da simulação base |
| Resultado | Valores investidos, bruto e líquido, rendimentos, deduções, rentabilidade e evolução temporal |
| Comparação | Alternativas selecionadas, parâmetros compartilhados e diferenças explicitadas |
| Premissa financeira | Regra adotada, limites, fonte quando aplicável e data de referência |

## Requisitos de qualidade e verificação

- A aplicação deve funcionar em celular, tablet e desktop. Verificar pelo menos larguras de 360, 768 e 1280 pixels, sem rolagem horizontal da página; tabelas podem ter rolagem própria identificada.
- Os resultados textuais devem continuar acessíveis se um gráfico falhar.
- Verificar o cálculo por fórmula e por evolução mensal independente, com diferença máxima de R$ 0,01 na apresentação de casos de referência sem tributos.
- Validar taxas zero e negativas, conversão anual/mensal, aportes no fim do mês, consistência entre módulos e regras tributárias implementadas.
- Verificar persistência após recarregamento e recuperação de falhas do armazenamento.
- O código deverá separar responsabilidades de cálculo, regras de modalidades, gráficos, armazenamento e interação, sem exigir a estrutura de diretórios sugerida no enunciado.

## Critérios mensuráveis de sucesso

- **CS-001**: Uma pessoa consegue concluir uma simulação válida e identificar patrimônio, total investido e rendimentos sem consultar o código.
- **CS-002**: As quatro famílias de investimentos estão disponíveis; Bitcoin e Ethereum admitem taxas positivas e negativas.
- **CS-003**: Pelo menos três alternativas são comparadas simultaneamente com parâmetros compartilhados e resultados coerentes com o simulador.
- **CS-004**: Os casos de referência sem tributos conferem com a fórmula e a evolução mensal dentro de R$ 0,01; deduções implementadas possuem casos de verificação próprios.
- **CS-005**: Salvar, recarregar, consultar, comparar e excluir simulações funciona no navegador utilizado para a demonstração.
- **CS-006**: Os fluxos principais funcionam nas três larguras de tela definidas e são utilizáveis por teclado.
- **CS-007**: Toda projeção identifica hipóteses e aviso educacional; qualquer resultado líquido informa as deduções consideradas e limitações.
- **CS-008**: O site publicado e o repositório estão acessíveis pelos links entregues; o README permite executar o projeto e entender as fórmulas.

## Demonstração e entregáveis

Entregar código organizado, README de execução, descrição das funcionalidades, fórmulas, premissas, fontes das regras financeiras, link do repositório e link do site publicado. Preparar apresentação que demonstre simulador, comparação, gráficos e histórico, com explicação do cálculo e da participação de IA, se utilizada.

A demonstração deverá conter pelo menos:

1. R$ 10.000,00 iniciais, R$ 500,00 mensais, 10 anos e 10% anuais hipotéticos, com conferência do cálculo bruto.
2. R$ 5.000,00 iniciais, R$ 500,00 mensais e 20 anos, comparando ao menos três modalidades com taxas e custos explícitos.
3. Um cenário de criptomoeda com taxa negativa configurável, demonstrando perda e comparação com uma hipótese positiva.

Incluir verificações adicionais de taxa zero e de histórico na apresentação ou no material de validação.

## Funcionalidades opcionais e fora do escopo inicial

São opcionais: assistente com API de IA, meta financeira com cálculo do aporte necessário, inflação e poder de compra, carteira com alocação real por ativo e indicadores obtidos por APIs. Os três cenários de rentabilidade permanecem no escopo por fazerem parte da situação-problema.

Uma futura IA poderá explicar resultados, mas deverá utilizar valores calculados e validados pelo JavaScript. Não poderá inventar resultados nem substituir o motor financeiro. Integrações não podem expor segredos no código público.

Não fazem parte da primeira versão: operações financeiras reais, compra ou venda de ativos, integração bancária, aconselhamento personalizado, sincronização entre dispositivos e autenticação.

## Decisões para o planejamento

Os detalhes de distribuição de páginas, identidade visual, limites numéricos operacionais, publicação, método de composição de indexadores e convenção tributária deverão ser definidos no planejamento. Nenhum deles impede a aprovação do escopo; as regras financeiras precisam estar documentadas e verificadas antes da implementação dos respectivos cálculos.
