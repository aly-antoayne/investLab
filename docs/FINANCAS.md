# Fórmulas e premissas financeiras

Referência do modelo: `br-pf-2026-11-v1`. Fontes consultadas em 16/11/2026. Perfil: pessoa física residente no Brasil. Trata-se de aproximação educacional, sem avaliação fiscal individual ou promessa de manutenção das regras durante o horizonte simulado.

## Juros compostos

Para `P` de capital inicial, `A` de aporte mensal, `i` de taxa anual efetiva em decimal e `n` de meses inteiros:

```text
r = expm1(log1p(i) / 12)
VF = P × (1 + r)^n + A × ((1 + r)^n − 1) / r
Se r = 0: VF = P + A × n
```

O motor aplica a recorrência equivalente `saldo = saldo × (1 + r) + A` em cada mês. O aporte acontece no final do mês, inclusive no último mês; esse último aporte não rende antes do resgate. O mês zero contém somente `P`.

```text
investido = P + A × n
ganho_bruto = VF − investido
rentabilidade_acumulada_bruta = ganho_bruto / investido × 100
estimativa_após_deduções = VF − IR − IOF − custódia
ganho_após_deduções = estimativa_após_deduções − investido
```

Essa rentabilidade é uma relação entre rendimento e desembolso total. Não é TIR, taxa anualizada ou retorno ponderado no tempo. Os cálculos mantêm precisão de ponto flutuante; valores são arredondados para centavos apenas na apresentação. Tolerância dos testes: até R$ 0,01 nos exemplos usuais, com verificações mais estritas quando apropriado.

## Taxas e indexadores

Taxas da interface são percentuais; o motor as converte para decimal. Todos os valores iniciais são hipóteses editáveis.

- **Prefixada/cripto:** a taxa informada é anual efetiva.
- **Percentual do CDI:** `d = (1 + CDI_anual)^(1/252) − 1`; `i = (1 + d × percentual_CDI/100)^252 − 1`. CDI constante, 252 dias úteis, sem calendário de feriados. É uma aproximação educacional da aplicação de um percentual diário, e não a multiplicação simples da taxa anual.
- **Tesouro indexado:** `(1 + IPCA_anual) × (1 + adicional_anual) − 1`. IPCA e adicional constantes; não modela defasagem do índice ou preço de negociação.
- A evolução mensal é obtida da taxa anual equivalente em todos os casos. Não há dados de mercado ou integração externa.

## Datas e lotes

Cada capital aplicado constitui um lote: o capital inicial na data-base e cada aporte em seu aniversário mensal. O dia é limitado ao último dia do mês de destino, sempre calculado a partir da data original: 31/01 → 28/02 → 31/03 em ano não bissexto.

Datas são tratadas à meia-noite UTC. A idade tributária é a diferença em dias corridos entre a aplicação do lote e o fim da simulação, sem dias de liquidação D+1, fins de semana ou feriados bancários.

Para cada lote `L`, com `k` meses restantes:

```text
valor_lote = principal_lote × (1 + r)^k
ganho_tributável = max(0, valor_lote − principal_lote)
IOF_lote = ganho_tributável × percentual_IOF(dias)
IR_lote = (ganho_tributável − IOF_lote) × alíquota_IR(dias)
```

A idade do capital inicial não é reutilizada nos aportes mais recentes. O último aporte tem idade zero e ganho zero. Os tributos dos lotes são somados somente no resgate final. Rendimentos não sofrem resgates ou tributação intermediária.

## Regras de referência

### CDB e Tesouro — IR e IOF

Sobre rendimentos positivos: IR de 22,5% até 180 dias; 20% de 181 a 360; 17,5% de 361 a 720; 15% após 720 dias. IOF segundo o anexo regressivo para dias 1 a 29, zero a partir de 30. Referência: [Tesouro Direto — regras e regulamento](https://www.tesourodireto.com.br/sobre-o-tesouro/regras-e-regulamento) e [Decreto 6.306/2007, art. 32 e anexo, Câmara dos Deputados](https://www2.camara.leg.br/legin/fed/decret/2007/decreto-6306-14-dezembro-2007-566561-normaatualizada-pe.html).

A tabela de percentuais do rendimento retidos como IOF nos dias 1 a 29 é: 96, 93, 90, 86, 83, 80, 76, 73, 70, 66, 63, 60, 56, 53, 50, 46, 43, 40, 36, 33, 30, 26, 23, 20, 16, 13, 10, 6 e 3. No dia zero não existe ganho no modelo; o resultado tributável é zero.

### LCI/LCA

No perfil de referência, rendimentos isentos de IR, conforme [Receita Federal — rendimentos do capital](https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/preenchimento/manual-mir/rendimentos/rendimentos-do-capital), seção de LCA/LCI. A projeção não implementa carência ou negociação de títulos: presume manutenção matemática dos lotes, sem afirmar que um resgate conjunto de todos eles seria contratualmente possível. Custos de distribuição assumidos zero.

### Custódia no Tesouro

O valor inicial sugerido de 0,2% a.a. usa como referência a [página de regras do Tesouro](https://www.tesourodireto.com.br/sobre-o-tesouro/regras-e-regulamento). O usuário pode alterar essa hipótese.

Nosso modelo provisiona mensalmente `saldo após rendimento, antes do aporte × taxa anual × dias do mês / 365`, acumulando o custo para dedução final. Não reproduz o provisionamento diário oficial. Assume ausência de taxa da instituição. Não contempla Selic, Renda+, Educa+, isenções específicas, cupons, marcação a mercado, preços ou negociação antecipada. Por isso o resultado aparece como **parcial após deduções estimadas**, sem afirmar líquido completo.

### Criptomoedas

Bitcoin e Ethereum admitem taxas negativas superiores a −100%. Não há modelagem de tributos, spread, taxas ou custódia. O motor retorna `null` para essas deduções e para o valor líquido; a interface mostra “não modelados”, nunca uma falsa isenção. Mostra somente o resultado bruto.

## Limites operacionais

- Capital inicial: de zero a R$ 1 bilhão; aporte: de zero a R$ 10 milhões. Pelo menos um deve ser positivo.
- Prazo: de 1 a 600 meses inteiros. A troca de unidade mantém a duração; anos que correspondam a meses fracionários são recusados.
- Taxa anual prefixada: 0% a 100%; para cripto: −99,99% a 100%.
- Percentual do CDI: 0% a 300%; indicador anual: 0% a 50%.
- Adicional anual indexado: 0% a 100%; custódia anual: 0% a 5%.
- Projeções acima de R$ 1 quintilhão são recusadas, com mensagem.
- Datas-base: anos de 2000 a 2100. O fim da projeção pode superar 2100, dentro dos 600 meses.

Esses limites mantêm o projeto utilizável e não representam limites reais dos produtos. As sugestões dos cenários do dashboard são limitadas à faixa de taxas prefixadas e podem ser ajustadas pelo usuário.

## Interpretação

O comparador usa capital, aportes, prazo e data iguais por padrão. O histórico também permite comparar entradas diferentes, identificando-as. Gráficos de comparação mostram a mesma base bruta; a tabela detalha deduções e limitações.

A distribuição do dashboard representa capital inicial, aportes e ganho bruto de uma única simulação. Para perdas, usa barras com total investido, patrimônio bruto e perda em módulo. As alternativas nunca são somadas como se fossem uma carteira real.

O modelo não prevê inflação em poder de compra, oscilações, inadimplência, disponibilidade dos produtos, carências, vencimentos intermediários ou condições futuras de reinvestimento. Não é uma recomendação de investimento.
