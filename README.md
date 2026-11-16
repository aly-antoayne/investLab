# InvestLab

Plataforma web educacional para simular e comparar investimentos de longo prazo. HTML5, CSS3, Tailwind CSS, JavaScript modular, Chart.js e localStorage. O Vite compila os estilos e empacota as bibliotecas: a aplicação publicada não depende de CDNs, backend ou chaves de API.

## Executar

Requisito: Node.js 22.12 ou superior, com npm.

```sh
npm ci
npm run dev
```

Abra a URL exibida pelo Vite, normalmente `http://127.0.0.1:5173`. No PowerShell com bloqueio de scripts, use `npm.cmd` no lugar de `npm`.

```sh
npm test          # Cálculos, armazenamento e integração de DOM
npm run build    # Gera dist/ para hospedagem estática
npm run preview  # Serve a versão compilada
```

Não abra `index.html` diretamente pelo protocolo `file://`: o código usa módulos e requer o servidor de desenvolvimento ou os arquivos compilados servidos por HTTP.

## Funcionalidades

- **Início:** apresentação da proposta e acesso às ferramentas.
- **Simulador:** capital, aporte mensal, período em anos ou meses, data-base, modalidade e taxas configuráveis. Exibe projeção bruta, capital investido, ganhos ou perdas, rentabilidade e evolução temporal.
- **Modalidades:** CDB prefixado ou percentual do CDI; LCI/LCA prefixada ou percentual do CDI; Tesouro prefixado ou IPCA + taxa adicional; Bitcoin e Ethereum com valorização ou desvalorização hipotética.
- **Comparador:** quatro alternativas simultâneas com capital, aporte, período e data compartilhados. Gráfico bruto e tabela com impostos, custos e estimativa após deduções quando modelada.
- **Dashboard:** indicadores da última simulação válida, evolução, composição de capital/aportes/rendimentos e cenários pessimista, moderado e otimista editáveis.
- **Histórico:** salvar com nome, recuperar após recarregamento, abrir uma cópia, excluir com confirmação e comparar de duas a seis simulações com diferenças de parâmetros explícitas. Até 100 registros locais.
- **Premissas:** fórmulas, referências oficiais, convenções de datas e limitações acessíveis dentro da aplicação.
- **Login e perfil:** conta demonstrativa local, sessão persistente, edição de nome, e-mail e biografia, avatar por iniciais e logout. As ferramentas e o histórico continuam públicos.

A aplicação inicia com uma simulação hipotética editável de R$ 5.000 + R$ 500/mês, por 20 anos, a 10% a.a. Alterações do formulário sinalizam resultados desatualizados e bloqueiam o salvamento até novo cálculo.

## Conta demonstrativa local

Clique em **Entrar** no cabeçalho. No primeiro acesso, a aplicação cria **Usuário InvestLab**, com e-mail `usuario@investlab.local` e senha `InvestLab123!`, sem iniciar sessão automaticamente. Após entrar, **Meu perfil** permite editar nome, e-mail e biografia. Ao alterar o e-mail, use o novo endereço no próximo login; as credenciais exibidas na tela de entrada acompanham essa alteração.

A conta usa `investlab.account.v1` e a sessão usa `investlab.session.v1` no localStorage. Recarregar mantém a sessão; **Sair** remove somente a sessão, preservando perfil e histórico. A criação inicial nunca restaura valores padrão sobre edições já salvas. Alterações de perfil em outra aba exigem recarregar o formulário antes de salvar.

Este acesso é demonstrativo: a senha é pública e os dados locais podem ser inspecionados ou alterados no navegador. Use dados fictícios. Não há backend, autenticação segura, cadastro de outras contas, troca de senha ou sincronização. Limpar os dados do site remove conta, sessão e histórico. Veja [especificação](specs/002-login-perfil/spec.md) e [validação](specs/002-login-perfil/validation.md).

## Cálculos e impostos

Aportes no **final de cada mês**. Taxa anual efetiva convertida para taxa mensal equivalente. O motor financeiro é compartilhado entre todos os módulos. A rentabilidade acumulada é rendimento dividido pelo total desembolsado, sem anualização.

- CDB: IR e IOF estimados por lote de aporte, conforme idade em dias corridos.
- LCI/LCA: regra de referência de isenção para pessoa física residente no Brasil; custos de distribuição assumidos zero.
- Tesouro: IR, IOF e aproximação configurável de custódia; resultado **parcial após deduções estimadas**, sem simular preço de venda antecipada ou títulos com regras especiais.
- Cripto: resultados **brutos**; tributos, corretagem e spread não modelados.

As regras e suas fontes estão em [docs/FINANCAS.md](docs/FINANCAS.md). As taxas sugeridas são hipóteses, sem cotação de mercado. Regras tributárias de referência são mantidas constantes ao longo da projeção.

## Organização

```text
index.html                 Estrutura, navegação e diálogo de salvamento
css/styles.css             Tailwind, identidade visual e responsividade
js/app.js                  Telas, formulários, validação e interações
js/finance.js              Motor puro, modalidades, taxas e lotes tributários
js/charts.js               Gráficos Chart.js e destruição de instâncias
js/storage.js              Persistência, validação e versionamento do histórico
js/auth.js                 Conta demonstrativa, sessão e validação do perfil local
js/auth-ui.js              Login, perfil, cabeçalho e eventos entre abas
public/favicon.svg         Identidade da aplicação
tests/                     Testes financeiros, persistência e integração de DOM
docs/                      Premissas, demonstração e validação
specs/001-investlab/        Especificação, plano e tarefas
specs/002-login-perfil/     Especificação, plano, tarefas e validação do acesso local
.github/workflows/ci.yml   Testes e build pelo GitHub Actions
```

O histórico usa a chave `investlab.simulations.v1`, com versão do formato e das regras financeiras, separada da conta demonstrativa e da sessão. Dados inválidos ou incompatíveis não são sobrescritos silenciosamente. Limpar o armazenamento do site remove as simulações; não há sincronização.

## Publicação

**Site publicado:** [https://investlab-sdd.vercel.app](https://investlab-sdd.vercel.app). Publicação em produção na Vercel concluída em 16/11/2026; acesso sem login e carregamento dos arquivos conferidos. **Código-fonte:** [https://github.com/aly-antoayne/investLab](https://github.com/aly-antoayne/investLab). Veja [registro e atualização do deploy](docs/PUBLICACAO-VERCEL.md).

### Vercel

A Vercel usa `vercel.json`: framework Vite, instalação `npm ci`, build `npm run build` e saída `dist`. Para atualizar o site, veja `docs/PUBLICACAO-VERCEL.md`. Não são necessárias variáveis secretas ou regras de reescrita de rotas.

### Arquivos versionados

O repositório contém o código da aplicação, recursos públicos, arquivos de dependências, configuração Vite/Vercel, testes, documentação e artefatos SDD. O workflow de CI verifica os testes e o build na branch `main` e em pull requests.

`node_modules/`, `dist/`, arquivos `.env`, dados locais da Vercel e logs não são versionados. As dependências e a versão compilada são reproduzidas com `npm ci` e `npm run build`. Configurações locais alternativas de Netlify/GitHub Pages não fazem parte desta entrega, hospedada na Vercel.

## Demonstração e verificação

- [Roteiro com três simulações e explicação do código](docs/APRESENTACAO.md).
- [Verificações executadas e pendências](docs/VALIDACAO.md).
- 52 testes automatizados aprovados, incluindo cálculos, histórico, login, perfil, sessão, falhas de armazenamento e alterações entre abas.
- `npm run build` aprovado; versão compilada carregada no Chrome por HTTP local.
- Telas representativas inspecionadas em 360, 768 e 1280 pixels na revisão inicial, com nova verificação dos problemas corrigidos em janela de aproximadamente 960 pixels. A matriz completa de telas/resoluções e a revisão integral por teclado continuam pendentes; veja `docs/VALIDACAO.md`.
- [Ajustes e comportamento após a revisão](docs/AJUSTES-2026-11-16.md): estado do comparador, acessibilidade, legenda do gráfico de perda e layout intermediário.

O comparador mantém a última base calculada enquanto você navega entre telas na mesma sessão. Calcular ou abrir outra simulação importa sua base na próxima visita ao comparador. O dashboard continua mostrando a última simulação válida do simulador. Parâmetros do comparador não são persistidos após recarregar a aplicação.

## Participação de IA

O desenvolvimento desta versão recebeu auxílio de IA na especificação, código, testes e documentação.

## Aviso educacional

O InvestLab é um projeto acadêmico de simulação. Os resultados são estimativas baseadas nas premissas informadas pelo usuário e não representam garantia de rentabilidade, oferta de produtos financeiros ou recomendação de investimento. Rentabilidade passada ou hipotética não garante resultados futuros.
