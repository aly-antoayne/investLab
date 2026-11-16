# Roteiro de apresentação — InvestLab

Tempo sugerido: 8 a 12 minutos. Site para demonstrar: [https://investlab-sdd.vercel.app](https://investlab-sdd.vercel.app). O acesso público foi validado em 16/11/2026. Código-fonte: [https://github.com/aly-antoayne/investLab](https://github.com/aly-antoayne/investLab).

## 1. Proposta e tecnologias

Apresente o problema de planejar investimentos de longo prazo e a pergunta: como prazo, aporte e taxa afetam o patrimônio? Mostre a navegação e explique HTML5, CSS3, Tailwind, JavaScript, Chart.js e localStorage. Não há conta, servidor financeiro ou dinheiro real.

## 2. Demonstração A — exemplo do enunciado

No Simulador, configure:

| Campo | Valor |
|---|---|
| Modalidade | CDB |
| Modelo | Prefixada |
| Capital | R$ 10.000,00 |
| Aporte | R$ 500,00 |
| Prazo | 10 anos |
| Taxa | 10% a.a. hipotéticos |
| Data inicial | 16/11/2026 |

Resultado bruto de referência: **R$ 125.869,35**, total investido de R$ 70.000,00 e rendimento bruto de R$ 55.869,35. Abra a seção de impostos para explicar o resultado após deduções e o cálculo por lote. Salve como “Exemplo do enunciado”.

Explique a fórmula: a taxa mensal equivalente é `(1 + i)^(1/12) − 1`. Primeiro rende o saldo anterior; só então entra o aporte. O aporte final não rende naquele mês. Taxa anual dividida por 12 não produz a mesma equivalência efetiva.

## 3. Demonstração B — independência aos 45 anos

Use R$ 5.000,00 iniciais, R$ 500,00 mensais e 20 anos. Na hipótese de 10% anuais, o bruto é **R$ 392.767,11** para R$ 125.000,00 investidos. Salve como “Independência aos 45”.

Abra o Comparador. Confirme o capital, aporte, data e período compartilhados. Compare CDB, LCI/LCA e Tesouro com taxas hipotéticas visíveis; a quarta alternativa pode ser Bitcoin. Mostre as diferenças entre bruto, isenção de referência, impostos e custódia parcial. Não apresente a maior projeção como uma recomendação ou garantia.

No Dashboard, mostre evolução, composição individual e cenários. Altere as taxas pessimista/moderada/otimista e recalcule. Volte ao simulador e mude o aporte de R$ 500 para R$ 600: explique o aviso de resultado desatualizado antes de recalcular.

## 4. Demonstração C — perda em criptomoeda

Configure Bitcoin, R$ 5.000 iniciais, R$ 500 mensais, 20 anos e taxa hipotética de **−10% a.a.** Resultado bruto: **R$ 50.851,67**, perda de **R$ 74.148,33** em relação aos R$ 125.000 investidos. Salve como “Cripto em cenário negativo”.

Mostre que a perda não é transformada em ganho e que tributos não modelados não aparecem como zero. No dashboard, a distribuição com perda usa barras. Compare taxas negativas e positivas para deixar explícita a sensibilidade da projeção.

## 5. Histórico e robustez

Abra o Histórico, selecione as três simulações e compare. Explique por que diferentes valores iniciais e prazos precisam ficar visíveis. Recarregue a página para demonstrar persistência. Abra uma simulação como cópia. Exclua um registro de demonstração com confirmação, mostrando que os demais permanecem.

Faça também um cálculo com taxa zero e uma tentativa com aporte negativo. Demonstre o resultado simples e a validação por campo, respectivamente.

## 6. Código e autoria

- `finance.js`: conversão de taxas, recorrência mensal, idade dos lotes, deduções e validação.
- `storage.js`: salvar/ler/excluir, chave local, versões e tratamento de dados inválidos.
- `app.js`: eventos dos formulários e montagem das telas.
- `charts.js`: apresentação dos dados calculados, sem um segundo cálculo financeiro.
- `tests/`: referência independente da fórmula, casos-limite, persistência e integração de DOM.

Declare o auxílio de IA na criação e revisão desta versão. Não há IA tomando decisões financeiras nem API de assistente. Cada integrante deve explicar a parte do código que apresentar.

## Perguntas para ensaio

1. Por que a taxa mensal não é simplesmente a taxa anual dividida por 12?
2. Qual linha da recorrência determina o instante do aporte?
3. Como o IR de um aporte recente difere do capital inicial?
4. Por que cripto tem `null` em vez de zero nos impostos não modelados?
5. O que se perde ao limpar o localStorage?
6. Por que o gráfico de composição não soma as quatro alternativas?
7. Qual a diferença entre teste de DOM e teste visual real no navegador?
8. Como o cálculo com taxa zero valida a lógica de aportes?

## Respostas para o ensaio

### 1. Por que a taxa mensal não é simplesmente a taxa anual dividida por 12?

Porque a taxa anual é efetiva e os rendimentos se acumulam a cada mês. Para preservar a equivalência dos juros compostos, usamos:

```text
taxa mensal = (1 + taxa anual)^(1/12) − 1
```

Na fórmula, a taxa anual deve estar em forma decimal: 10% é `0,10`. Assim, 10% ao ano equivalem a aproximadamente **0,7974% ao mês**. Dividir por 12 produziria uma taxa que, composta por doze meses, não reproduziria os mesmos 10% anuais.

### 2. Qual linha da recorrência determina o instante do aporte?

No arquivo `js/finance.js`, o rendimento é calculado antes de adicionar o aporte:

```javascript
const beforeContribution = balance * (1 + monthlyRate);
balance = beforeContribution + input.monthly;
```

Isso representa um aporte **no final do mês**. Primeiro rende o saldo anterior; depois entra o aporte, que começa a render no período seguinte. O último aporte da projeção não rende naquele mês.

### 3. Como o IR de um aporte recente difere do capital inicial?

Cada aporte é tratado como um lote com sua própria data de aplicação. Na tabela de referência implementada pelo projeto, um aporte recente pode ter uma alíquota maior que a do capital inicial aplicado há mais tempo.

O imposto incide sobre o **rendimento positivo de cada lote**, após o IOF considerado pelo modelo, e não sobre todo o dinheiro investido. Por isso, o sistema não aplica automaticamente a idade do capital inicial a todos os aportes. As regras e limitações adotadas estão em `FINANCAS.md`.

### 4. Por que cripto tem `null` em vez de zero nos impostos não modelados?

Porque **zero indicaria um cálculo que concluiu que não há imposto**, enquanto `null` indica que esse cálculo não foi implementado.

O aplicativo apresenta o resultado de criptomoedas como bruto e informa que tributos, corretagem e spread não foram modelados. Isso evita apresentar uma ausência de cálculo como se fosse isenção ou resultado líquido completo.

### 5. O que se perde ao limpar o localStorage?

As simulações salvas no histórico daquele navegador e endereço. O aplicativo continua funcionando, mas os registros não são recuperados por uma conta ou servidor, pois esta versão não possui sincronização.

O histórico do localhost é separado do histórico do site publicado. Para apresentar na Vercel, prepare os registros no endereço publicado e no navegador que será utilizado.

### 6. Por que o gráfico de composição não soma as quatro alternativas?

Cada alternativa responde a uma pergunta separada: “O que aconteceria se o mesmo dinheiro fosse aplicado nesta modalidade?”. Somar os resultados contaria o mesmo capital várias vezes.

O gráfico de composição do dashboard mostra **capital inicial, aportes e rendimentos de uma única simulação**. Quando há perda, usa barras para comparar total investido, patrimônio bruto e perda, sem criar fatias negativas em um gráfico de rosca.

### 7. Qual a diferença entre teste de DOM e teste visual real no navegador?

O teste de DOM verifica a estrutura e os comportamentos da interface: mensagens de validação, botões, campos e atualização dos resultados. Neste projeto, esses testes usam jsdom e substituem o módulo de gráficos.

A inspeção no navegador verifica a renderização real dos gráficos e a legibilidade de textos, campos e valores nas larguras observadas. **Os dois tipos de verificação se complementam**: passar nos testes de DOM não garante que um gráfico esteja desenhado corretamente ou que o layout seja legível.

### 8. Como o cálculo com taxa zero valida a lógica de aportes?

Sem rendimento, o resultado deve ser exatamente:

```text
patrimônio = capital inicial + aporte mensal × quantidade de meses
```

Por exemplo, vinte anos correspondem a 240 meses:

```text
R$ 5.000 + R$ 500 × 240 = R$ 125.000
```

O rendimento bruto deve ser zero. Esse caso ajuda a detectar erros como adicionar um aporte a mais, esquecer algum mês ou aplicar rendimento quando a taxa é zero.

Use estas respostas como apoio para o ensaio e explique cada ideia com suas palavras.

## Encerramento e entrega

Mostre README, fontes financeiras, testes e limites da projeção. Use o endereço publicado [https://investlab-sdd.vercel.app](https://investlab-sdd.vercel.app) no material de apresentação. Confira também o acesso em outro dispositivo e apresente o repositório [https://github.com/aly-antoayne/investLab](https://github.com/aly-antoayne/investLab).


## Ensaio após as correções da revisão

- Execute uma comparação, vá ao dashboard e retorne: a última base calculada permanece na mesma sessão.
- Para apresentar outra base, calcule no simulador ou abra uma simulação salva; depois entre no comparador. A nova base será importada.
- O dashboard descreve a última simulação válida do simulador; não representa a soma ou a seleção do comparador.
- Em janelas de até 1100 px, o formulário fica acima dos resultados. Role a página para mostrar os cards e os gráficos.
- “Independência aos 45” é um cenário de vinte anos, não uma conclusão sobre renda suficiente para aposentadoria.
- Prepare o histórico no endereço publicado e no navegador que será usado na apresentação.

Consulte `AJUSTES-2026-11-16.md` e `VALIDACAO.md` para os ajustes e o alcance das verificações.
