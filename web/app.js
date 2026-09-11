const codeElement = document.getElementById('code');
let code = '';

async function generateCode() {
  codeElement.textContent = 'Loading code...';
  const response = await fetch('/api/pair-code', { method: 'POST' });
  if (!response.ok) throw new Error('Could not generate pairing code');
  const data = await response.json();
  code = data.code;
  codeElement.textContent = code;
}

async function copyCode() {
  if (!code) return;
  try {
    await navigator.clipboard.writeText(code);
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = code;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
  }
}

codeElement.addEventListener('click', copyCode);
codeElement.addEventListener('keydown', event => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    copyCode();
  }
});

generateCode().catch(() => {
  codeElement.textContent = 'Pairing code unavailable';
});
