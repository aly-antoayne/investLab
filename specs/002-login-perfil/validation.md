# Validação — Login e perfil local

**Data**: 2026-11-16

## Verificações automatizadas

- `npm.cmd test`: 52 testes aprovados; 14 novos testes cobrem conta, sessão, perfil e integração das telas. Os 38 testes anteriores continuam aprovados.
- `npm.cmd run build`: build de produção concluído com Vite, sem novas dependências.
- `git diff --check`: sem erros de espaçamento nas alterações rastreadas.

Os testes do módulo de conta verificam criação única, normalização de e-mail, senha exata, edição e preservação dos dados, limites dos campos e iniciais, registros corrompidos, sessões inválidas, conflitos entre abas e falhas no armazenamento.

Os testes DOM verificam login inválido e válido, acesso direto ao perfil, edição e cancelamento, nome e avatar no cabeçalho, persistência após recriar a aplicação, retorno com e-mail alterado, logout preservando histórico, conteúdo HTML inerte, quota e armazenamento bloqueado, formulários desatualizados e logout externo. A camada de gráficos usa o mesmo substituto dos testes anteriores; esses testes não inspecionam pixels nem executam Chart.js.

## Limites e pendências

A inspeção visual não foi concluída. O inventário do controle do computador informou que o host de acesso ao navegador estava indisponível. A alternativa pela janela nativa do Chrome detectou entrada simultânea do usuário, e a tentativa foi interrompida para evitar conflito com sua navegação.

Permanecem pendentes a inspeção visual das duas telas nas larguras de 360, 768 e 1280 pixels e a execução integral por teclado em navegador real. O código inclui estilos adaptáveis, rótulos, foco e mensagens, mas os testes DOM não comprovam o layout renderizado nem a experiência com leitor de tela.

Não houve publicação. A conta é demonstrativa, com credencial pública armazenada localmente. Não há garantia de autenticação segura nem isolamento dos dados contra quem acessa o navegador. A verificação de revisão evita sobrescrever alterações já persistidas por outra aba, sem garantir atomicidade para gravações simultâneas no localStorage.

## Roteiro manual para revisão

1. Executar `npm.cmd run dev` e abrir `#login`. Conferir o aviso e as credenciais padrão.
2. Testar campos vazios e senha incorreta. Entrar com a conta demonstrativa.
3. Editar nome, e-mail e biografia. Cancelar, editar novamente e salvar. Conferir nome e iniciais no cabeçalho.
4. Recarregar, sair, entrar com o e-mail atualizado e conferir o perfil persistido.
5. Abrir duas abas no perfil, salvar em uma e tentar salvar o formulário antigo na outra; conferir a mensagem e a opção de recarregar. Sair em uma aba e conferir o redirecionamento da outra.
6. Conferir as duas telas nas três larguras e usar Tab, Shift+Tab e Enter para concluir login, edição, cancelamento e logout.
7. Salvar uma simulação, sair e conferir que histórico, simulador, comparador e dashboard continuam disponíveis.
