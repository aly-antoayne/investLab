# Plano de implementação — Login e perfil local

**Data**: 2026-11-16

Aplicação existente em JavaScript modular com Vite, sem novas dependências. A implementação segue [spec.md](spec.md).

- `js/auth.js`: conta e perfil em um registro versionado, separado da sessão e do histórico. Criação única, validação na leitura, credencial pública demonstrativa, sessão persistente e edição com revisão única para detectar formulários desatualizados.
- `js/auth-ui.js`: formulários, mensagens acessíveis, escape de dados locais, cabeçalho e sincronização da interface por eventos de armazenamento. Falhas não interrompem áreas públicas.
- `js/app.js` e `index.html`: integração das rotas `#login` e `#perfil` e controles de conta no cabeçalho. Acesso direto ao perfil sem sessão redireciona ao login.
- `css/styles.css`: componentes no padrão visual existente, campos e ações adaptáveis a telas menores.
- Testes unitários do armazenamento e integração DOM, incluindo falhas de leitura/gravação, recarga, cancelamento, edição concorrente, logout e regressões financeiras. Build de produção e inspeção visual quando o navegador estiver disponível sem conflito de uso.

O localStorage não oferece transações entre abas. A revisão é conferida imediatamente antes da gravação e impede salvar um formulário cuja base já mudou. Uma corrida entre leituras e gravações simultâneas continua sujeita ao comportamento do navegador; não há garantia de transação distribuída.

O comando/skill `speckit-implement` não está instalado neste ambiente. A implementação foi realizada diretamente, sem scripts do Spec Kit, branch nova, commit, push ou publicação.
