import { transformPlatform, acceptsLegacyCode } from './transform.mjs';

const $ = id => document.getElementById(id);
const form = $('transform-form');
const platform = $('platform');
const code = $('password');
const recentPlatforms = [];
let generatedPassword = '';
let generatedFor = '';
let resultVisible = false;
let toastTimer;
let copyTimer;

function message(text) {
  clearTimeout(toastTimer);
  $('toast').textContent = text;
  $('toast').classList.add('visible');
  toastTimer = setTimeout(() => $('toast').classList.remove('visible'), 2600);
}

function setError(input, errorId, text = '') {
  $(errorId).textContent = text;
  if (text) input.setAttribute('aria-invalid', 'true');
  else input.removeAttribute('aria-invalid');
}

function updateVisibility(button, visible, label) {
  button.setAttribute('aria-label', `${visible ? '隐藏' : '显示'}${label}`);
  button.setAttribute('aria-pressed', String(visible));
  button.querySelector('use').setAttribute('href', visible ? '#icon-eye-off' : '#icon-eye');
}

function renderResult() {
  $('result-value').textContent = resultVisible ? generatedPassword : '•'.repeat(generatedPassword.length);
  updateVisibility($('result-visibility'), resultVisible, '生成的密码');
}

function resetResult() {
  generatedPassword = '';
  generatedFor = '';
  resultVisible = false;
  $('result-value').textContent = '';
  $('generated-result').hidden = true;
  $('empty-result').hidden = false;
  $('result-panel').dataset.state = 'empty';
  $('result-status').innerHTML = '<span class="status-dot"></span>等待生成';
  clearTimeout(copyTimer);
  $('copy-result').querySelector('span').textContent = '复制密码';
}

function renderHistory() {
  const list = $('history-list');
  list.replaceChildren();
  if (!recentPlatforms.length) {
    const empty = document.createElement('p');
    empty.className = 'history-empty';
    empty.textContent = '还没有使用记录。生成一次后，平台名称会出现在这里。';
    list.append(empty);
  }
  for (const name of recentPlatforms) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'history-item';
    button.textContent = name;
    button.title = name;
    button.addEventListener('click', () => {
      platform.value = name;
      resetResult();
      setError(platform, 'platform-error');
      $('history-panel').hidden = true;
      $('history-toggle').setAttribute('aria-expanded', 'false');
      code.focus();
    });
    list.append(button);
  }
  $('clear-history').disabled = recentPlatforms.length === 0;
}

form.addEventListener('submit', event => {
  event.preventDefault();
  setError(platform, 'platform-error');
  setError(code, 'code-error');
  if (!platform.value.trim() || platform.value.length < 2) {
    resetResult();
    setError(platform, 'platform-error', '请输入至少 2 个字符的平台名称。');
    platform.focus();
    return;
  }
  if (!acceptsLegacyCode(code.value)) {
    resetResult();
    setError(code, 'code-error', code.value ? '口令不正确，请使用原来的转换口令。' : '请输入转换口令。');
    code.focus();
    return;
  }
  generatedFor = platform.value;
  generatedPassword = transformPlatform(generatedFor);
  resultVisible = false;
  renderResult();
  $('empty-result').hidden = true;
  $('generated-result').hidden = false;
  $('result-panel').dataset.state = 'ready';
  $('result-status').innerHTML = '<span class="status-dot"></span>已生成';
  $('result-meta').textContent = `${generatedFor} · ${generatedPassword.length} 位字符`;
  const existing = recentPlatforms.indexOf(generatedFor);
  if (existing >= 0) recentPlatforms.splice(existing, 1);
  recentPlatforms.unshift(generatedFor);
  recentPlatforms.splice(6);
  renderHistory();
  $('history-panel').hidden = true;
  $('history-toggle').setAttribute('aria-expanded', 'false');
  message('专属密码已生成，可以复制使用。');
});

platform.addEventListener('input', () => { setError(platform, 'platform-error'); resetResult(); });
code.addEventListener('input', () => { setError(code, 'code-error'); resetResult(); });
$('code-visibility').addEventListener('click', () => {
  const visible = code.type === 'password';
  code.type = visible ? 'text' : 'password';
  updateVisibility($('code-visibility'), visible, '转换口令');
});
$('result-visibility').addEventListener('click', () => { resultVisible = !resultVisible; renderResult(); });
$('history-toggle').addEventListener('click', () => {
  const open = $('history-panel').hidden;
  $('history-panel').hidden = !open;
  $('history-toggle').setAttribute('aria-expanded', String(open));
  renderHistory();
});
$('clear-history').addEventListener('click', () => { recentPlatforms.length = 0; renderHistory(); });

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    try { await navigator.clipboard.writeText(text); return true; } catch { /* Try local fallback. */ }
  }
  const previousFocus = document.activeElement;
  const field = document.createElement('textarea');
  field.value = text;
  field.setAttribute('aria-hidden', 'true');
  field.style.cssText = 'position:fixed;left:-9999px;top:0';
  document.body.append(field);
  field.select();
  let copied = false;
  try { copied = document.execCommand('copy'); } catch { /* Report failure below. */ }
  field.remove();
  previousFocus?.focus();
  return copied;
}

$('copy-result').addEventListener('click', async () => {
  if (!generatedPassword || platform.value !== generatedFor) return;
  const textToCopy = generatedPassword;
  const copied = await copyText(textToCopy);
  if (!copied) { message('浏览器未允许复制，请显示密码后手动复制。'); return; }
  if (generatedPassword !== textToCopy) return;
  clearTimeout(copyTimer);
  $('copy-result').querySelector('span').textContent = '已复制 ✓';
  message('密码已复制到剪贴板。');
  copyTimer = setTimeout(() => { $('copy-result').querySelector('span').textContent = '复制密码'; }, 2200);
});

window.addEventListener('pagehide', () => {
  resetResult();
  code.value = '';
  code.type = 'password';
  updateVisibility($('code-visibility'), false, '转换口令');
  recentPlatforms.length = 0;
  renderHistory();
});
renderHistory();
