import { ACCOUNT_KEY, SESSION_KEY, DEMO_PASSWORD, currentAccount, ensureAccount, initials, login, logout, updateProfile, validateProfile } from './auth.js';

const esc = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const localNotice = '<p class="local-notice">Acesso demonstrativo, sem proteção para dados sensíveis. Use apenas dados fictícios. Conta, perfil e sessão ficam somente neste navegador, sem sincronização, e podem ser apagados ao limpar seus dados.</p>';
const field = (name, label, value, type = 'text', extra = '') => `<div class="field"><label for="${name}">${label}</label><input id="${name}" name="${name}" type="${type}" value="${esc(value)}" ${extra} aria-describedby="error-${name}" /><p class="error-text" id="error-${name}"></p></div>`;

export function createAuthUI({ main, heading, notify }) {
  const header = document.querySelector('#account-controls');
  const message = error => error.name === 'QuotaExceededError' ? 'Sem espaço no armazenamento local. A operação não foi concluída.' : error.name === 'SecurityError' ? 'O navegador bloqueou o armazenamento local. A operação não foi concluída. Você pode continuar simulando.' : error.message;
  function updateHeader() {
    let account;
    try { account = currentAccount(); } catch { /* Áreas públicas continuam disponíveis. */ }
    header.innerHTML = account ? `<a class="profile-link" href="#perfil" aria-label="Meu perfil: ${esc(account.name)}"><span class="avatar">${esc(initials(account.name))}</span><span class="account-name">${esc(account.name)}</span><span>Meu perfil</span></a><button class="button" id="logout" type="button">Sair</button>` : '<a class="button" href="#login">Entrar</a>';
    header.querySelector('#logout')?.addEventListener('click', () => {
      try { logout(); updateHeader(); location.hash = 'inicio'; notify('Você saiu da conta. Seu perfil e histórico foram preservados.'); }
      catch (error) { notify(message(error), true); }
    });
  }
  function errors(form, issues) {
    form.querySelectorAll('[aria-invalid]').forEach(el => el.removeAttribute('aria-invalid'));
    form.querySelectorAll('.error-text').forEach(el => { el.textContent = ''; });
    for (const [name, text] of Object.entries(issues)) {
      form.querySelector(`#error-${name}`).textContent = text;
      form.elements[name].setAttribute('aria-invalid', 'true');
    }
    if (Object.keys(issues).length) { form.querySelector('[aria-invalid]')?.focus(); notify('Revise os campos indicados.', true); return true; }
    return false;
  }
  function failure(error) { document.querySelector('#auth-error').textContent = message(error); }
  function renderLogin() {
    let account;
    let error;
    try { account = ensureAccount(); } catch (caught) { error = caught; }
    main.innerHTML = heading('SEU ESPAÇO LOCAL', 'Entre para cuidar do seu perfil.', 'Suas ferramentas de planejamento continuam disponíveis sem login.') + `<section class="panel auth-panel" aria-label="Login demonstrativo">${localNotice}<div class="demo-credentials"><h2 class="panel-title">Conta de demonstração</h2>${account ? `<p>E-mail: <strong>${esc(account.email)}</strong></p><p>Senha: <strong>${DEMO_PASSWORD}</strong></p>` : '<p>Não foi possível carregar a conta local.</p>'}</div><form id="login-form" novalidate>${field('email', 'E-mail', '', 'email', 'required autocomplete="username" maxlength="254"')}${field('password', 'Senha demonstrativa', '', 'password', 'required autocomplete="current-password"')}<p id="auth-error" class="error-text" role="alert"></p><button class="button primary" type="submit">Entrar</button></form></section>`;
    if (error) failure(error);
    const form = document.querySelector('#login-form');
    form.addEventListener('submit', event => {
      event.preventDefault();
      const email = form.elements.email.value;
      const password = form.elements.password.value;
      const issues = validateProfile({ name: 'Login', email, bio: '' });
      if (!password) issues.password = 'Informe a senha demonstrativa.';
      if (errors(form, issues)) return;
      try { login(email, password); updateHeader(); location.hash = 'perfil'; notify('Você entrou na conta demonstrativa.'); }
      catch (caught) { failure(caught); }
    });
  }
  function renderProfile() {
    let account;
    try { account = currentAccount(); } catch (error) { notify(message(error), true); }
    if (!account) { location.replace('#login'); renderLogin(); return; }
    main.innerHTML = heading('UM PERFIL PARA SEUS PLANOS', 'Meu perfil', 'Edite como você aparece neste navegador.') + `<section class="panel auth-panel" aria-label="Perfil local"><div class="profile-summary"><span class="avatar profile-avatar">${esc(initials(account.name))}</span><div><h2 class="panel-title">${esc(account.name)}</h2><p class="subtitle">Conta demonstrativa local</p></div></div>${localNotice}<form id="profile-form" novalidate>${field('name', 'Nome (obrigatório)', account.name, 'text', 'required autocomplete="name" minlength="2" maxlength="80"')}${field('email', 'E-mail de acesso (obrigatório)', account.email, 'email', 'required autocomplete="email" maxlength="254"')}<p class="field-hint">Ao alterar o e-mail, use o novo endereço no próximo login.</p><div class="field"><label for="bio">Biografia (opcional)</label><textarea id="bio" name="bio" rows="4" maxlength="280" aria-describedby="error-bio bio-hint">${esc(account.bio)}</textarea><p id="bio-hint" class="field-hint">Até 280 caracteres.</p><p id="error-bio" class="error-text"></p></div><p id="auth-error" class="error-text" role="alert"></p><div class="auth-actions"><button class="button primary" type="submit">Salvar perfil</button><button class="button" id="cancel-profile" type="button">Cancelar</button><button class="button" id="reload-profile" type="button" hidden>Recarregar perfil</button></div></form></section>`;
    const form = document.querySelector('#profile-form');
    form.addEventListener('submit', event => {
      event.preventDefault();
      const values = Object.fromEntries(['name', 'email', 'bio'].map(key => [key, form.elements[key].value]));
      if (errors(form, validateProfile(values))) return;
      try { account = updateProfile(values, account.revision); updateHeader(); renderProfile(); document.querySelector('#profile-form button').focus(); notify('Perfil salvo neste navegador.'); }
      catch (error) {
        failure(error);
        document.querySelector('#reload-profile').hidden = false;
        // Revalidar a sessão mesmo que o evento de outra aba ainda não tenha chegado.
        try { if (!currentAccount()) { updateHeader(); location.replace('#login'); } } catch { /* Erro já apresentado; preservar o formulário. */ }
      }
    });
    document.querySelector('#cancel-profile').addEventListener('click', renderProfile);
    document.querySelector('#reload-profile').addEventListener('click', renderProfile);
  }
  try { ensureAccount(); } catch (error) { notify(message(error), true); }
  updateHeader();
  window.addEventListener('storage', event => {
    if (event.storageArea && event.storageArea !== window.localStorage) return;
    if (event.key !== null && event.key !== ACCOUNT_KEY && event.key !== SESSION_KEY) return;
    updateHeader();
    if (location.hash === '#perfil') {
      try {
        if (!currentAccount()) { location.replace('#login'); return; }
        document.querySelector('#auth-error').textContent = 'Os dados da conta mudaram em outra aba. Recarregue o perfil antes de salvar.';
        document.querySelector('#reload-profile').hidden = false;
      } catch (error) { failure(error); }
    } else if (location.hash === '#login') renderLogin();
  });
  return { renderLogin, renderProfile, updateHeader };
}
