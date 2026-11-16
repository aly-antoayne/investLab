# Plano de implementação — InvestLab

Aplicação estática em HTML5 e JavaScript modular, com Tailwind CSS compilado por Vite, CSS próprio e Chart.js empacotado localmente. Navegação por hash permite publicar em subdiretório no GitHub Pages sem regras de redirecionamento. Nenhum serviço externo é necessário em tempo de execução.

## Decisões

- Interface clara em tons de verde e grafite, navegação lateral em desktop e adaptável em telas menores.
- Motor financeiro puro e compartilhado por todos os módulos; testes com o executor nativo do Node.
- Taxas efetivas anuais; aproximação explícita do CDI por taxa diária de 252 dias úteis; indexador mais taxa adicional por composição multiplicativa anual.
- Datas UTC com aniversários mensais limitados ao último dia do mês. Idade dos lotes em dias corridos para IR e IOF.
- Regra de referência brasileira para pessoa física registrada em docs/FINANCAS.md. CDB com IR/IOF por lote; LCI/LCA com isenção no perfil adotado. Tesouro com custódia aproximada configurável e resultado parcial identificado. Cripto com resultado bruto e tributação não modelada.
- Histórico versionado e validado na leitura; alterações de regras exigem mudança de versão. Falhas de armazenamento não interrompem cálculos.
- Comparador por padrão com quatro alternativas e mesmos parâmetros de capital, aporte, prazo e data. Histórico admite comparação com diferenças explicitadas.
- Distribuição representa composição de uma única simulação, nunca a soma de alternativas. Perdas recebem barras e explicação.
- Publicação em produção na Vercel: https://investlab-sdd.vercel.app, configurada por vercel.json. Código-fonte: https://github.com/aly-antoayne/investLab. GitHub Actions verifica testes e build; publicação na Vercel é realizada pela CLI conforme docs/PUBLICACAO-VERCEL.md.

## Verificação

Testes de fórmula versus recorrência, taxa zero e negativa, lotes, limites de IR/IOF, datas, indexadores, armazenamento e validação. Build de produção. Verificação visual e dos fluxos no navegador quando disponível. Documentar verificações realmente executadas.
