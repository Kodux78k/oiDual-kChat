<script>
// KDX.DevPanel · Botão DEV de segurança
(function(){
  function attachDevToggle(){
    const panel = document.getElementById('kdxDevPanel');
    if (!panel) {
      console.warn('[KDX] DevPanel ainda não existe, não criei o botão DEV.');
      return;
    }

    // evita criar duas vezes
    if (document.getElementById('kdxDevMiniToggle')) return;

    // tenta grudar perto do nome do assistente
    const anchor =
      document.getElementById('assistantName') ||
      document.getElementById('logoContainer') ||
      document.body;

    const btn = document.createElement('button');
    btn.id = 'kdxDevMiniToggle';
    btn.type = 'button';
    btn.textContent = '‎ࢴ';

    Object.assign(btn.style, {
      fontSize: '10px',
      padding: '3px 7px',
      borderRadius: '999px',
      border: '1px solid rgba(0,245,255,.6)',
      background: 'rgba(2,5,14,.92)',
      color: '#00f5ff',
      marginLeft: '6px',
      cursor: 'pointer',
      opacity: '0.85'
    });

    btn.addEventListener('mouseenter', ()=> btn.style.opacity = '1');
    btn.addEventListener('mouseleave', ()=> btn.style.opacity = '0.85');

    btn.addEventListener('click', ()=>{
      panel.classList.toggle('open');
    });

    // se tiver anchor, tenta colocar logo depois
    if (anchor !== document.body && anchor.parentNode) {
      anchor.parentNode.insertBefore(btn, anchor.nextSibling);
    } else {
      // fallback: topo direito da tela
      btn.style.position = 'fixed';
      btn.style.top = '10px';
      btn.style.right = '10px';
      btn.style.zIndex = '1';
      document.body.appendChild(btn);
    }

    console.log('[KDX] Botão DEV anexado.');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attachDevToggle);
  } else {
    attachDevToggle();
  }
})();
</script>