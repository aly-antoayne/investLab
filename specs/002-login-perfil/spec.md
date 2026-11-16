# Especificação funcional: Login e perfil local

**Identificador**: 002-login-perfil  
**Data**: 2026-11-16  
**Status**: Implementada localmente; testes e build aprovados; inspeção visual pendente  
**Origem**: “Gostaria de implementar o sistema de login e perfil do usuário, salvos apenas no localstorage, crie um usuário padrão com informações padrões”.

## Objetivo

Permitir entrar no InvestLab com uma conta demonstrativa predefinida, consultar e editar seu perfil e sair da sessão. Conta, perfil e sessão devem persistir exclusivamente no localStorage do navegador, sem servidor ou sincronização.

## Escopo e premissas

- Esta evolução acrescenta acesso local demonstrativo à versão 001-investlab, que originalmente excluía autenticação. As restrições anteriores referentes à ausência de autenticação são substituídas apenas para este escopo.
- Uma única conta local, criada automaticamente no primeiro acesso. Cadastro, múltiplas contas, recuperação de senha, alteração de senha e autenticação externa ficam fora do escopo.
- Simulador, comparador, dashboard, histórico, início e premissas continuam disponíveis sem login. Apenas o perfil exige sessão; acessar seu endereço diretamente deve levar à tela de login e retornar ao perfil após entrar.
- O histórico existente permanece disponível no mesmo navegador, inclusive após entrar ou sair. Não haverá migração, exclusão ou associação das simulações a contas nesta entrega.
- Interface e mensagens em português brasileiro, seguindo o visual existente.
- A tela de login explica que o acesso é demonstrativo, mostra as credenciais padrão e informa que os dados são locais e podem desaparecer ao limpar o navegador.
- O login local não constitui autenticação segura nem controle de acesso a dados sensíveis. Não solicitar dados bancários, documentos ou senhas reais.

## Usuário padrão

| Informação | Valor inicial |
|---|---|
| Nome | Usuário InvestLab |
| E-mail de acesso e contato | usuario@investlab.local |
| Senha demonstrativa | InvestLab123! |
| Biografia | Estou começando a planejar meu futuro financeiro com o InvestLab. |
| Avatar | Iniciais do nome, inicialmente UI |
| Identificação | Identificador estável para a conta local |
| Criação e atualização | Data e hora efetivas de criação; atualização acompanha cada edição salva |

Criar a conta somente quando ainda não existir um registro. Recarregar, abrir novamente ou sair nunca deve restaurar os valores padrão sobre um perfil editado. Se todos os dados locais da funcionalidade forem removidos, o próximo acesso recria a conta padrão sem iniciar sessão automaticamente.

## Histórias de usuário e critérios de aceite

### US1 — Entrar com a conta padrão (P1)

Como visitante, quero usar credenciais de demonstração para acessar meu perfil sem criar uma conta.

**Verificação independente**: iniciar em um navegador sem dados da funcionalidade, conferir as credenciais apresentadas e realizar um login.

1. Dado o primeiro acesso, quando a funcionalidade é iniciada, então a conta padrão é criada uma única vez e o visitante continua desconectado.
2. Dado um visitante, quando seleciona “Entrar” no cabeçalho, então vê campos identificados de e-mail e senha, credenciais de demonstração e a indicação de armazenamento local.
3. Dadas credenciais válidas, quando confirma o login, então entra no perfil e o cabeçalho apresenta seu nome ou iniciais e acesso a “Meu perfil” e “Sair”.
4. Dados e-mail ou senha incorretos, quando confirma, então vê “E-mail ou senha inválidos.” e nenhuma sessão é criada.
5. Dados campos vazios ou e-mail malformado, então a interface indica os campos a corrigir e mantém o formulário utilizável.
6. Dada uma sessão válida, quando recarrega ou reabre a aplicação no mesmo navegador e origem, então continua conectado.

### US2 — Consultar e editar o perfil (P1)

Como usuário conectado, quero atualizar meus dados de apresentação e mantê-los ao voltar à aplicação.

**Verificação independente**: entrar, editar o perfil, salvar e recarregar para conferir a persistência.

1. Dada uma sessão válida, quando abre “Meu perfil”, então vê nome, e-mail e biografia atuais, sem exibição da senha.
2. Dados nome, e-mail e biografia válidos, quando salva, então recebe confirmação e os dados persistem; cabeçalho e iniciais refletem o nome atualizado.
3. Dada uma mudança de e-mail salva, quando sai e entra novamente, então o novo e-mail permite o login com a senha demonstrativa original; o e-mail anterior deixa de permitir o acesso. A tela de login apresenta o e-mail local atual para a demonstração.
4. Dados campos inválidos, então vê mensagens junto aos campos e nenhum dado persistido é substituído.
5. Dadas alterações não salvas, quando cancela, então o formulário volta aos últimos valores salvos. Sair da página também descarta alterações não salvas.
6. Dado conteúdo com marcação ou scripts nos campos, então ele é exibido como texto, sem executar código ou alterar a página.

### US3 — Encerrar a sessão (P1)

Como usuário conectado, quero sair da conta sem perder meu perfil ou minhas simulações.

**Verificação independente**: editar e salvar o perfil, sair, recarregar e entrar novamente.

1. Dada uma sessão válida, quando seleciona “Sair”, então a sessão é removida, retorna ao início e o cabeçalho oferece “Entrar”.
2. Dado um logout concluído, quando recarrega ou tenta abrir o perfil diretamente, então permanece desconectado e precisa entrar novamente.
3. Dado um logout concluído, então conta, perfil e histórico permanecem armazenados e podem ser recuperados no próximo acesso.

### US4 — Compreender falhas no armazenamento (P2)

Como usuário, quero receber uma mensagem clara quando meus dados não puderem ser recuperados ou salvos.

**Verificação independente**: bloquear o armazenamento, simular falta de espaço e fornecer registros inválidos.

1. Dado localStorage bloqueado ou sem espaço, quando tenta criar a conta, entrar ou salvar, então recebe explicação de que a operação não foi concluída, sem confirmação falsa de persistência.
2. Dado um perfil corrompido ou incompatível, quando a aplicação abre, então informa o problema e preserva o registro original; não substitui silenciosamente os dados pela conta padrão.
3. Dada uma sessão sem conta correspondente ou inválida, então o perfil não é exibido e a aplicação solicita novo login, sem sobrescrever o perfil existente.
4. Dada uma falha da funcionalidade, então simulador, comparador e demais áreas públicas continuam utilizáveis.

## Requisitos funcionais

- **RF-001**: Persistir conta, perfil e sessão exclusivamente no localStorage, sem cookies, sessionStorage, backend, banco remoto ou chamadas de rede para essas operações.
- **RF-002**: Manter registros identificáveis e versionados, separados do histórico existente, preservando chaves e dados de outras funcionalidades.
- **RF-003**: Criar exatamente uma conta padrão quando ausente; não iniciar sessão automaticamente.
- **RF-004**: Validar o e-mail ignorando diferenças entre maiúsculas e minúsculas e espaços externos. A senha é sensível a maiúsculas e minúsculas e deve ser comparada exatamente como informada.
- **RF-005**: Exigir nome com 2 a 80 caracteres após remover espaços externos; aceitar nomes acentuados. Exigir e-mail em formato válido, com até 254 caracteres. Biografia é opcional, com até 280 caracteres. Rejeitar excesso de tamanho sem truncar silenciosamente.
- **RF-006**: Permitir editar nome, e-mail e biografia. Avatar é derivado das primeiras letras do primeiro e último nomes; um nome único usa sua primeira letra. Upload de imagem fica fora do escopo.
- **RF-007**: Persistir a sessão somente após validar as credenciais e confirmar a gravação. Sessão permanece até logout, remoção ou invalidação dos dados locais; não há expiração automática nesta versão.
- **RF-008**: Exigir sessão válida para visualizar e editar o perfil, inclusive por endereço direto, e reconhecer logout ou mudança de perfil em outra aba antes de permitir nova edição. Uma aba com formulário desatualizado deve solicitar recarregamento antes de salvar sobre uma alteração externa.
- **RF-009**: Confirmar a edição somente após gravar com sucesso; preservar os valores anteriores e manter as alterações no formulário para nova tentativa em caso de falha.
- **RF-010**: Remover apenas a sessão no logout. Se sua remoção falhar, informar a falha e não confirmar a saída persistente.
- **RF-011**: Não duplicar a senha na sessão, expô-la no perfil ou registrá-la em mensagens de erro. A credencial é pública e exclusivamente demonstrativa; sua apresentação na tela de login é intencional.
- **RF-012**: Não registrar, transmitir ou sincronizar dados do login e perfil com serviços externos.
- **RF-013**: Apresentar erros, confirmações, campos obrigatórios, estado conectado e aviso de armazenamento local de forma compreensível e acessível.
- **RF-014**: Preservar cálculos, gráficos, comparação e consulta, gravação e exclusão do histórico existente.

## Entidades conceituais

| Entidade | Informações necessárias |
|---|---|
| Conta local | Identificação estável, credencial demonstrativa e versão do formato |
| Perfil | Identificação da conta, nome, e-mail de acesso e contato, biografia, criação e última atualização |
| Sessão local | Referência à conta e data do login; sem cópia da senha |

Conta e perfil podem compartilhar um registro, desde que uma edição não altere a identificação nem a senha e que a atualização seja consistente.

## Casos de borda e falhas

- Primeiro acesso, recarga repetida e abertura em múltiplas abas sem duplicar a conta.
- Credenciais vazias, senha incorreta, e-mail com maiúsculas ou espaços externos e senha com espaços adicionais.
- Nome apenas com espaços, nome único, caracteres acentuados, biografia vazia e limites de tamanho.
- Cancelamento de edição, falha de gravação e atualização do e-mail usado para entrar.
- Sessão inválida, referência a conta ausente, registro parcial, JSON inválido e versão incompatível.
- Falta de espaço ou bloqueio do armazenamento durante criação, login, edição e logout.
- Logout ou edição em outra aba; prevenir gravação silenciosa sobre uma edição mais recente.
- Limpeza completa dos dados, remoção apenas da sessão e preservação do histórico anterior.
- Textos com caracteres especiais e marcação exibidos de forma inerte.

## Requisitos de qualidade e verificação

- Login e perfil devem funcionar em larguras de 360, 768 e 1280 pixels sem rolagem horizontal da página.
- Todos os controles devem funcionar por teclado, com rótulos, foco visível, senha mascarada e mensagens de erro associadas aos campos; confirmações devem ser anunciadas por tecnologias assistivas.
- Validar criação única, login válido e inválido, edição, cancelamento, persistência, logout, falhas de armazenamento e preservação do histórico com verificações reproduzíveis.
- Verificar que nenhuma operação desta funcionalidade depende de requisições de rede.
- O aviso sobre armazenamento e acesso demonstrativo deve estar visível no login e no perfil.

## Critérios mensuráveis de sucesso

- **CS-001**: Em um navegador sem dados, é possível entrar usando as credenciais exibidas e consultar o perfil sem cadastro ou configuração.
- **CS-002**: Nome, e-mail e biografia alterados permanecem idênticos após recarregar, sair e entrar novamente, sem recriação do perfil padrão.
- **CS-003**: Credenciais inválidas nunca criam sessão; acesso direto ao perfil sem sessão sempre conduz ao login.
- **CS-004**: Após logout e recarga, o usuário continua desconectado, com perfil e histórico preservados.
- **CS-005**: Os fluxos de criação, login, edição e logout não apresentam sucesso em nenhuma das falhas de armazenamento previstas.
- **CS-006**: Login, edição, cancelamento e logout são concluídos por teclado nas três larguras definidas.
- **CS-007**: Simular, comparar, salvar e recuperar uma simulação continua funcionando com e sem sessão, incluindo dados salvos antes desta evolução.

## Limites da entrega

Esta entrega implementa o comportamento local descrito. Não inclui publicação, backend, proteção real contra acesso aos dados do navegador, cadastro de outras contas, exclusão de conta, redefinição de senha, upload de avatar ou personalização das hipóteses financeiras a partir do perfil. As verificações executadas e os limites de validação estão em [validation.md](validation.md).
