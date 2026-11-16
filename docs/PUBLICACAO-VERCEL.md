# Publicação do InvestLab na Vercel

Data: 16/11/2026.

## Endereços

- Site de produção: https://investlab-sdd.vercel.app
- Projeto: `investlab-sdd`, espaço `aly-e987` (Aly).
- Painel: https://vercel.com/aly-e987/investlab-sdd
- Deploy validado: https://vercel.com/aly-e987/investlab-sdd/6NgLgBaTmoy5nzbAan4xtMqucyFZ

## Configuração

Configuração versionável em `vercel.json`: Vite, `npm ci`, `npm run build`, saída `dist`. O diretório de origem é `C:\investLab_sdd`. A pasta `.vercel/` está no `.gitignore` para futuros vínculos locais. Nenhuma variável secreta é necessária para o aplicativo.

Publicação realizada pela CLI oficial autenticada, criando um projeto novo. Nenhum site existente foi substituído. A Vercel instalou as dependências e concluiu o deploy com estado `READY`. O site de produção respondeu sem exigir login; não foram usados cookies ou credenciais nas requisições HTTP de validação.

## Atualizar o mesmo site

No PowerShell, dentro da pasta do projeto:

```powershell
cd C:\investLab_sdd
npm.cmd test
npm.cmd run build
npx.cmd --yes vercel@latest deploy --prod --yes --project investlab-sdd --scope aly-e987
```

Se a CLI estiver desconectada, execute antes `npx.cmd --yes vercel@latest login` e conclua a autorização oficial no navegador. Não coloque tokens no código ou na documentação.

O deploy por CLI não configura publicação automática por Git. Mudanças locais só aparecem no site após outro deploy. O código-fonte da entrega está em https://github.com/aly-antoayne/investLab. O envio ao GitHub não conecta automaticamente esse repositório ao projeto Vercel; a atualização por CLI continua disponível.

## Verificação realizada

- Build e 38 testes já aprovados na preparação da versão.
- Instalação e build concluídos no ambiente remoto da Vercel.
- Página principal, JavaScript e CSS responderam HTTP 200 em requisições sem autenticação.
- Aplicação aberta no Chrome pelo endereço de produção.
- Exemplo padrão: R$ 392.767,11 brutos.
- Nova simulação no endereço público com R$ 10.000 iniciais, R$ 500/mês, dez anos e 10% a.a.: R$ 125.869,35 brutos, R$ 70.000,00 investidos e R$ 55.869,35 em rendimentos. Gráfico de evolução renderizado.

## Preparar a apresentação

Abra o site de produção no navegador que será usado e salve ali as simulações do roteiro. O histórico do localhost não é transferido para a Vercel, e outro dispositivo terá histórico próprio. O site já abre publicamente; a verificação física em outro dispositivo e no projetor ainda deve ser feita.
