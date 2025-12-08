<script>
// =============================================================
// KDX.DevPanel v4.1 · Dashboard + Dev integrado no Dual78kChat
// - Indicador móvel das tabs
// - Botões de export com classes .kdxExportBtn (save/json/zip) + ícones
// - Ajustes mínimos de comportamento (resize/scroll)
// =============================================================
(function(){

  // -------------------------------------------------
  // 0) Botão de toggle (usa #icon-code se existir)
  // -------------------------------------------------
  const codeBtn = document.getElementById('icon-code');
  const hasCodeBtn = !!codeBtn;

  // Fallback: mini quadradinho no canto (pode remover se não quiser)
  let fallbackBtn = null;
  if (!hasCodeBtn) {
    fallbackBtn = document.createElement('button');
    fallbackBtn.type = 'button';
    fallbackBtn.id = 'kdxDevToggleFallback';
    fallbackBtn.textContent = '</>';
    document.body.appendChild(fallbackBtn);
  }

  // -------------------------------------------------
  // 1) CSS do painel (integra com tokens existentes)
  // -------------------------------------------------
  const style = document.createElement('style');
  style.id = 'kdxDevPanelStyles';
  style.textContent = `
    /* KDX DevPanel v4.1 – integrado (styles já fornecidos) */

   /* === KDX DEV PANEL — Atualizado: centralizado, alto, abas pills, export buttons styled === */

/* -- wrapper toggle (mantido, só polish) -- */
#kdxDevToggleFallback{
  position:fixed;
  bottom:12px;
  right:12px;
  padding:6px 10px;
  font-size:12px;
  border-radius:10px;
  border:1px solid rgba(255,255,255,.14);
  background:linear-gradient(180deg, rgba(0,0,0,.78), rgba(6,10,22,.9));
  color:#fff;
  z-index:100000;
  cursor:pointer;
  backdrop-filter: blur(6px);
  box-shadow:0 8px 20px rgba(0,0,0,.5);
}

/* -- painel centralizado (horizontal center, flutua acima do centro vertical) -- */
#kdxDevPanel{
  position:fixed;
  left:50%;
  transform:translateX(-50%) translateY(8px) scale(.995);
  bottom:auto;
  top:8vh;
  width:min(760px, 95vw);
  max-width:95vw;
  height:80vh;
  max-height:92vh;
  border-radius:16px;
  background:var(--bg-panel, rgba(6,10,22,.96));
  backdrop-filter:blur(14px) saturate(1.05);
  box-shadow:0 28px 60px rgba(0,0,0,.6);
  border:1px solid rgba(0,245,255,.18);
  color:var(--text, #e6f3ff);
  font-family:inherit;
  font-size:13px;
  display:flex;
  flex-direction:column;
  opacity:0;
  pointer-events:none;
  transition:opacity .22s cubic-bezier(.2,.9,.2,1), transform .22s ease;
  z-index:99998;
  padding:8px;
}

#kdxDevPanel.open{
  opacity:1;
  pointer-events:auto;
  transform:translateX(-50%) translateY(0) scale(1);
}

#kdxDevHeader{
  padding:8px 10px 6px;
  display:flex;
  align-items:center;
  justify-content:space-between;
  border-bottom:1px solid rgba(255,255,255,.04);
  font-size:11px;
  text-transform:uppercase;
  letter-spacing:.09em;
  gap:10px;
}
#kdxDevHeader .left{
  display:flex;
  align-items:center;
  gap:10px;
}
#kdxDevHeader span{ opacity:.85; cursor:pointer; font-weight:600; font-size:12px; }

/* TABS: pills com indicador e rolagem quando necessário */
#kdxDevTabs{
  display:flex;
  gap:8px;
  padding:10px;
  align-items:center;
  overflow:auto;
  -webkit-overflow-scrolling:touch;
  border-bottom:1px solid rgba(255,255,255,.03);
  scrollbar-width:thin;
  position:relative;
}
.kdxDevTab{
  flex:0 0 auto;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  gap:8px;
  padding:8px 12px;
  font-size:12px;
  text-transform:uppercase;
  letter-spacing:.06em;
  cursor:pointer;
  opacity:.75;
  border-radius:999px;
  background:linear-gradient(180deg, rgba(255,255,255,.02), rgba(0,0,0,.02));
  border:1px solid transparent;
  transition:all .18s ease;
  color:var(--text, #e6f3ff);
}
.kdxDevTab:hover{ transform:translateY(-2px); opacity:1; box-shadow:0 6px 18px rgba(0,0,0,.45); }
.kdxDevTab.active{
  background:linear-gradient(90deg, rgba(0,245,255,.12), rgba(255,75,255,.10));
  color: #001217;
  font-weight:700;
  border:1px solid rgba(255,255,255,.08);
  box-shadow:0 8px 26px rgba(0,245,255,.06), inset 0 -6px 18px rgba(0,0,0,.18);
}

/* indicador visual (linha fina) */
.kdxDevTabsIndicator{
  position:absolute;
  bottom:4px;
  height:4px;
  width:40px;
  background:linear-gradient(90deg,#00f5ff,#ff4bff);
  border-radius:999px;
  transition:transform .22s cubic-bezier(.2,.9,.2,1), width .22s ease;
  pointer-events:none;
  box-shadow:0 6px 18px rgba(0,245,255,.06);
}

/* sections & layout */
.kdxDevBody{ display:flex; flex:1; gap:10px; padding:12px; align-items:flex-start; overflow:hidden; }
.kdxDevMain{ flex:1 1 62%; min-width:240px; display:flex; flex-direction:column; gap:8px; height:calc(80vh - 140px); overflow:auto; padding-right:6px; }
.kdxDevSide{ flex:0 0 34%; min-width:200px; max-width:320px; display:flex; flex-direction:column; gap:8px; height:calc(80vh - 140px); overflow:auto; }

.kdxDevSection{ display:none; }
.kdxDevSection.active{ display:block; }

/* DASHBOARD grid */
#kdxDashIntro{ font-size:13px; opacity:.86; margin-bottom:8px; }
#kdxDashGrid{ display:grid; grid-template-columns:1fr; gap:8px; margin-bottom:8px; }
@media(min-width:820px){ #kdxDashGrid{ grid-template-columns:1fr 1fr; } }
.kdxDashCard{ border-radius:12px; padding:10px; background:
    radial-gradient(circle at 0 0, rgba(0,245,255,.10), transparent 55%),
    radial-gradient(circle at 100% 100%, rgba(255,75,255,.06), transparent 55%),
    linear-gradient(180deg, rgba(2,6,18,.98), rgba(4,8,28,.96));
  border:1px solid rgba(255,255,255,.04);
  box-shadow:0 12px 34px rgba(0,0,0,.6);
}
.kdxDashLabel{ font-size:11px; text-transform:uppercase; letter-spacing:.06em; opacity:.75; margin-bottom:6px; }
.kdxDashValue{ font-size:16px; font-weight:700; margin-bottom:4px; color:var(--text); }
.kdxDashSub{ font-size:12px; opacity:.8; }

/* actions */
#kdxDashActions{ display:flex; gap:8px; margin-top:6px; }
#kdxDashActions button{ flex:1; padding:9px 12px; border-radius:999px; border:1px solid rgba(255,255,255,.06); background:linear-gradient(180deg, rgba(0,0,0,.6), rgba(3,6,12,.9)); color:var(--text,#e6f3ff); font-size:13px; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; gap:8px; transition:transform .15s ease, box-shadow .15s ease; }
#kdxDashActions button:hover{ transform:translateY(-3px); box-shadow:0 10px 30px rgba(0,0,0,.5); }

/* log, upload, editor, term, presets, apps, perf kept as before (omitted to save space) */
/* ... the rest of the same CSS you already had ... */

/* === EXPORT BUTTONS — estilos aprimorados === */
.kdxExportBtn {
  display:inline-flex;
  align-items:center;
  justify-content:center;
  gap:8px;
  padding:10px 12px;
  border-radius:12px;
  border:1px solid rgba(255,255,255,.06);
  background:linear-gradient(180deg, rgba(10,12,20,.95), rgba(3,6,14,.98));
  color:var(--text,#e6f3ff);
  font-weight:700;
  font-size:13px;
  cursor:pointer;
  transition:transform .12s ease, box-shadow .12s ease, background .12s ease;
  box-shadow:0 8px 22px rgba(0,0,0,.5), inset 0 -6px 20px rgba(255,255,255,.02);
  width:100%;
}
.kdxExportBtn:hover{ transform:translateY(-4px); box-shadow:0 16px 40px rgba(0,0,0,.6), 0 6px 20px rgba(0,245,255,.06); }
.kdxExportBtn .icon{ width:18px;height:18px;display:inline-flex;align-items:center;justify-content:center; opacity:.95; }

/* variants */
.kdxExportBtn.save { background:linear-gradient(90deg,#ffe37a,#ffd36b); color:#071016; border:1px solid rgba(0,0,0,.12); }
.kdxExportBtn.json { background:linear-gradient(90deg, rgba(0,245,255,.12), rgba(0,200,255,.06)); color:#001217; border:1px solid rgba(0,245,255,.14); }
.kdxExportBtn.zip  { background:linear-gradient(90deg, rgba(255,75,255,.12), rgba(200,80,255,.04)); color:#071016; border:1px solid rgba(255,75,255,.12); }

@media(max-width:760px){
  #kdxDevPanel{ left:50%; width:calc(100vw - 24px); height:86vh; top:6vh; padding:10px; }
  .kdxDevBody{ flex-direction:column; }
  .kdxDevSide{ order:2; width:100%; max-width:100%; }
  .kdxDevMain{ order:1; width:100%; }
  #kdxDashGrid{ grid-template-columns:1fr; }
  #kdxDevHeader{ gap:6px; padding:8px 6px; font-size:12px; }
  .kdxDevTab{ padding:8px 10px; font-size:12px; }
}
  `;
  document.head.appendChild(style);

  // -------------------------------------------------
  // 2) Markup do painel (Dash + Dev tabs)
  // -------------------------------------------------
  const panel = document.createElement('aside');
  panel.id = 'kdxDevPanel';
  panel.innerHTML = `
    <div id="kdxDevHeader">
      <div>KDX Panel · v4.1</div>
      <span id="kdxDevClose">fechar</span>
    </div>

    <div id="kdxDevTabs">
      <button class="kdxDevTab active" data-tab="dash">dash</button>
      <button class="kdxDevTab" data-tab="log">log</button>
      <button class="kdxDevTab" data-tab="upload">up</button>
      <button class="kdxDevTab" data-tab="editor">edit</button>
      <button class="kdxDevTab" data-tab="term">term</button>
      <button class="kdxDevTab" data-tab="presets">preset</button>
      <button class="kdxDevTab" data-tab="apps">apps</button>
      <button class="kdxDevTab" data-tab="perf">perf</button>

      <!-- indicador móvel -->
      <div class="kdxDevTabsIndicator" id="kdxDevTabsIndicator"></div>
    </div>

    <!-- DASHBOARD -->
    <div id="kdxDevSection-dash" class="kdxDevSection active">
      <div id="kdxDashIntro">Painel do portal · visão rápida da sessão, arquétipo, tema e IA.</div>
      <div id="kdxDashGrid">
        <div class="kdxDashCard">
          <div class="kdxDashLabel">assistente</div>
          <div class="kdxDashValue" id="kdxDashAssistant">—</div>
          <div class="kdxDashSub" id="kdxDashUser">Você: —</div>
        </div>
        <div class="kdxDashCard">
          <div class="kdxDashLabel">tema & arquétipo</div>
          <div class="kdxDashValue" id="kdxDashTheme">—</div>
          <div class="kdxDashSub" id="kdxDashArch">Arquétipo: —</div>
        </div>
        <div class="kdxDashCard">
          <div class="kdxDashLabel">mensagens</div>
          <div class="kdxDashValue" id="kdxDashMsgs">0</div>
          <div class="kdxDashSub" id="kdxDashUserMsgs">Você: 0</div>
        </div>
        <div class="kdxDashCard">
          <div class="kdxDashLabel">voz & IA</div>
          <div class="kdxDashValue" id="kdxDashVoice">default</div>
          <div class="kdxDashSub" id="kdxDashIa">IA: —</div>
        </div>
      </div>
      <div id="kdxDashActions">
        <button id="kdxDashThemeBtn">alternar tema</button>
        <button id="kdxDashCollapseBtn">mostrar/ocultar chat</button>
      </div>
    </div>

    <!-- LOG -->
    <div id="kdxDevSection-log" class="kdxDevSection">
      <select id="kdxLogFilter">
        <option value="all">Todos</option>
        <option value="info">Info</option>
        <option value="warn">Warn</option>
        <option value="error">Erro</option>
        <option value="system">Sistema</option>
      </select>
      <div id="kdxDevLog"></div>
    </div>

    <!-- UPLOAD -->
    <div id="kdxDevSection-upload" class="kdxDevSection">
      <div class="kdxUploadBox">
        <strong>JSON</strong>
        <input type="file" id="kdxJsonInput">
      </div>
      <div class="kdxUploadBox">
        <strong>CSS</strong>
        <input type="file" id="kdxCssInput">
      </div>
      <div class="kdxUploadBox">
        <strong>JS patch</strong>
        <input type="file" id="kdxJsInput">
      </div>
      <small>JSON recente fica em <code>window.KDX_JSON_LAST</code>.</small>
    </div>

    <!-- EDITOR -->
    <div id="kdxDevSection-editor" class="kdxDevSection">
      <div id="kdxDevEditorWrap">
        <textarea id="kdxDevEditorText">// KDX Dev v4.1 – escreva JS aqui e clique em Executar.</textarea>
        <div id="kdxDevEditorMonaco"></div>
      </div>
      <button id="kdxDevRunBtn">Executar no contexto da página</button>
    </div>

    <!-- TERMINAL -->
    <div id="kdxDevSection-term" class="kdxDevSection">
      <div id="kdxDevTermOut"></div>
      <input id="kdxDevTermIn" placeholder='help, clear, fps, blocks, eval 1+1...' />
    </div>

    <!-- PRESETS -->
    <div id="kdxDevSection-presets" class="kdxDevSection">
      <ul id="kdxDevPresetList"></ul>
      <button id="kdxDevPresetSave" class="kdxExportBtn save"><span class="icon">💾</span>Salvar código atual</button>
      <button id="kdxDevExportJson" class="kdxExportBtn json"><span class="icon">📄</span>Exportar JSON (logs+presets)</button>
      <button id="kdxDevExportZip" class="kdxExportBtn zip"><span class="icon">📦</span>Exportar ZIP</button>
    </div>

    <!-- APPS -->
    <div id="kdxDevSection-apps" class="kdxDevSection">
      <div id="kdxDevApps"></div>
    </div>

    <!-- PERF -->
    <div id="kdxDevSection-perf" class="kdxDevSection">
      <div id="kdxDevPerfInfo">
        <span id="kdxPerfFps">FPS: --</span>
        <span id="kdxPerfMem">Memória: --</span>
        <span id="kdxPerfTicks">Ticks: --</span>
      </div>
    </div>
  `;
  document.body.appendChild(panel);

  // -------------------------------------------------
  // 3) Toggle / Tabs + indicador móvel
  // -------------------------------------------------
  const closeBtn = document.getElementById('kdxDevClose');
  function togglePanel(){ panel.classList.toggle('open'); repositionIndicatorToActive(); }
  if (codeBtn) codeBtn.addEventListener('click', togglePanel);
  if (fallbackBtn) fallbackBtn.addEventListener('click', togglePanel);
  closeBtn.addEventListener('click', ()=> panel.classList.remove('open'));

  const tabsContainer = document.getElementById('kdxDevTabs');
  const tabs = Array.from(document.querySelectorAll('.kdxDevTab'));
  const indicator = document.getElementById('kdxDevTabsIndicator');

  function positionIndicator(el){
    if (!el || !indicator || !tabsContainer) return;
    // compute left relative to tabsContainer's left (consider scroll)
    const rectTabs = tabsContainer.getBoundingClientRect();
    const rectEl = el.getBoundingClientRect();
    const left = rectEl.left - rectTabs.left + tabsContainer.scrollLeft;
    indicator.style.width = rectEl.width + 'px';
    indicator.style.transform = 'translateX(' + left + 'px)';
    // ensure active tab is visible
    const elLeft = el.offsetLeft, elRight = elLeft + el.offsetWidth;
    const visibleLeft = tabsContainer.scrollLeft;
    const visibleRight = visibleLeft + tabsContainer.clientWidth;
    if (elLeft < visibleLeft) tabsContainer.scrollTo({left: elLeft - 12, behavior:'smooth'});
    if (elRight > visibleRight) tabsContainer.scrollTo({left: elRight - tabsContainer.clientWidth + 12, behavior:'smooth'});
  }

  function repositionIndicatorToActive(){
    const active = document.querySelector('.kdxDevTab.active');
    if (!active) return;
    // small timeout to allow layout to settle (useful after open or resize)
    requestAnimationFrame(()=> positionIndicator(active));
  }

  tabs.forEach(tab=>{
    tab.addEventListener('click', ()=>{
      document.querySelectorAll('.kdxDevTab').forEach(t=>t.classList.remove('active'));
      document.querySelectorAll('.kdxDevSection').forEach(s=>s.classList.remove('active'));
      tab.classList.add('active');
      const id = tab.dataset.tab;
      const sec = document.getElementById('kdxDevSection-'+id);
      if (sec) sec.classList.add('active');
      repositionIndicatorToActive();
    });
  });

  // handle resize & tabs scroll
  window.addEventListener('resize', ()=> repositionIndicatorToActive());
  tabsContainer.addEventListener('scroll', ()=> repositionIndicatorToActive());

  // init indicator after mount
  setTimeout(()=> repositionIndicatorToActive(), 160);

  // -------------------------------------------------
  // 4) DASHBOARD – leitura de estado do Dual78kChat
  // -------------------------------------------------
  const dashAssistant  = document.getElementById('kdxDashAssistant');
  const dashUser       = document.getElementById('kdxDashUser');
  const dashTheme      = document.getElementById('kdxDashTheme');
  const dashArch       = document.getElementById('kdxDashArch');
  const dashMsgs       = document.getElementById('kdxDashMsgs');
  const dashUserMsgs   = document.getElementById('kdxDashUserMsgs');
  const dashVoice      = document.getElementById('kdxDashVoice');
  const dashIa         = document.getElementById('kdxDashIa');
  const dashThemeBtn   = document.getElementById('kdxDashThemeBtn');
  const dashCollapseBtn= document.getElementById('kdxDashCollapseBtn');

  function updateDash(){
    if (!dashAssistant) return;
    const asstEl = document.getElementById('assistantName');
    dashAssistant.textContent = asstEl && asstEl.textContent.trim() ? asstEl.textContent.trim() : 'Dual.Infodose';
    let userName = 'Você';
    try{ userName = localStorage.getItem('infodoseUserName') || 'Você'; }catch(e){}
    dashUser.textContent = 'Você: ' + userName;
    const theme = document.body.dataset.theme || 'dark';
    dashTheme.textContent = theme;
    let arch = '—';
    try{ arch = localStorage.getItem('ARCHETYPE_ACTIVE') || '—'; }catch(e){}
    dashArch.textContent = 'Arquétipo: ' + arch;
    const blocks = document.querySelectorAll('.response-block');
    const userBlocks = document.querySelectorAll('.response-block.user-pulse');
    dashMsgs.textContent = String(blocks.length);
    dashUserMsgs.textContent = 'Você: ' + String(userBlocks.length);
    let vKey = 'default';
    try{ vKey = localStorage.getItem('infodoseVoiceCurrentKey') || 'default'; }catch(e){}
    dashVoice.textContent = vKey;
    const iaLabel = document.getElementById('iaStatus');
    dashIa.textContent = iaLabel && iaLabel.textContent.trim() ? iaLabel.textContent.trim() : 'sem chave ou modelo definido';
  }

  if (dashThemeBtn){
    dashThemeBtn.addEventListener('click', ()=>{
      const cycle = ['dark','vibe','medium'];
      const current = document.body.dataset.theme || 'dark';
      const idx = cycle.indexOf(current);
      const next = cycle[(idx+1+cycle.length)%cycle.length];
      document.body.dataset.theme = next;
      try{ localStorage.setItem('infodoseTheme', next); }catch(e){}
      updateDash();
    });
  }

  if (dashCollapseBtn){
    dashCollapseBtn.addEventListener('click', ()=>{
      const resp = document.getElementById('response');
      if (!resp) return;
      resp.classList.toggle('collapsed');
    });
  }

  // -------------------------------------------------
  // 5) LOG + Hook de console
  // -------------------------------------------------
  const logBox    = document.getElementById('kdxDevLog');
  const logFilter = document.getElementById('kdxLogFilter');
  const logs      = [];

  function appendLog(type, ...msg){
    logs.push({ type, msg, ts: Date.now() });
    renderLogs();
  }
  function renderLogs(){
    if (!logBox) return;
    const f = logFilter.value;
    logBox.innerHTML = '';
    logs.forEach(l=>{
      if (f !== 'all' && f !== l.type) return;
      const div = document.createElement('div');
      div.className = 'kdxLog-'+l.type;
      try { div.textContent = '['+l.type.toUpperCase()+'] '+ l.msg.map(x=> (typeof x === 'object') ? JSON.stringify(x) : String(x)).join(' '); }
      catch(e){ div.textContent = '['+l.type.toUpperCase()+'] '+ String(l.msg); }
      logBox.appendChild(div);
    });
    logBox.scrollTop = logBox.scrollHeight;
  }
  if (logFilter) logFilter.addEventListener('change', renderLogs);

  ['log','info','warn','error'].forEach(type=>{
    const orig = console[type];
    console[type] = function(...args){
      try{ orig && orig.apply(console, args); }catch(e){}
      appendLog(type, ...args);
    };
  });
  appendLog('system','KDX DevPanel v4.1 iniciado.');

  // -------------------------------------------------
  // 6) Upload JSON / CSS / JS
  // -------------------------------------------------
  const jsonInput = document.getElementById('kdxJsonInput');
  const cssInput  = document.getElementById('kdxCssInput');
  const jsInput   = document.getElementById('kdxJsInput');

  if (jsonInput){
    jsonInput.addEventListener('change', async e=>{
      const file = e.target.files[0];
      if (!file) return;
      try{
        const txt = await file.text();
        const json = JSON.parse(txt);
        window.KDX_JSON_LAST = json;
        appendLog('system','JSON carregado em window.KDX_JSON_LAST');
      }catch(err){
        appendLog('error','JSON inválido:', err);
      }
    });
  }

  if (cssInput){
    cssInput.addEventListener('change', async e=>{
      const file = e.target.files[0];
      if (!file) return;
      const css = await file.text();
      const style = document.createElement('style');
      style.textContent = css;
      document.head.appendChild(style);
      appendLog('system','CSS extra injetado.');
    });
  }

  if (jsInput){
    jsInput.addEventListener('change', async e=>{
      const file = e.target.files[0];
      if (!file) return;
      const js = await file.text();
      const s = document.createElement('script');
      s.textContent = js;
      document.head.appendChild(s);
      appendLog('system','JS patch injetado.');
    });
  }

  // -------------------------------------------------
  // 7) Editor + Monaco opcional
  // -------------------------------------------------
  const editorText   = document.getElementById('kdxDevEditorText');
  const monacoSlot   = document.getElementById('kdxDevEditorMonaco');
  const runBtn       = document.getElementById('kdxDevRunBtn');
  let monacoEditor   = null;
  let monacoLoaded   = false;

  function getEditorCode(){ if (monacoEditor) return monacoEditor.getValue(); return editorText.value; }

  function ensureMonaco(cb){
    if (monacoLoaded && window.monaco && monacoEditor) return cb && cb();
    if (window.monaco && window.require){ monacoLoaded = true; return createMonaco(cb); }
    const exist = document.querySelector('script[data-kdx-monaco-loader]');
    if (exist){ exist.addEventListener('load', ()=> bootMonaco(cb)); return; }
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.52.0/min/vs/loader.min.js';
    s.dataset.kdxMonacoLoader = '1';
    s.onload = ()=> bootMonaco(cb);
    document.head.appendChild(s);
  }

  function bootMonaco(cb){
    if (!window.require) return;
    window.require.config({ paths:{ 'vs':'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.52.0/min/vs' }});
    window.require(['vs/editor/editor.main'], function(){ monacoLoaded = true; createMonaco(cb); });
  }

  function createMonaco(cb){
    if (!window.monaco || monacoEditor) return cb && cb();
    monacoSlot.style.display = 'block';
    editorText.style.display = 'none';
    monacoEditor = window.monaco.editor.create(monacoSlot,{
      value: editorText.value || '// DevPanel Monaco conectado.',
      language:'javascript',
      theme:'vs-dark',
      automaticLayout:true,
      minimap:{enabled:false},
      fontSize:12
    });
    appendLog('system','Monaco carregado.');
    if (cb) cb();
  }

  runBtn.addEventListener('click', ()=>{
    const code = getEditorCode();
    try{
      const result = eval(code);
      appendLog('info','Resultado:', result);
    }catch(err){
      appendLog('error','Erro ao executar código:', err);
    }
  });

  // Opcional: carrega Monaco depois de alguns segundos
  setTimeout(()=>{ ensureMonaco(); }, 1500);

  // -------------------------------------------------
  // 8) Terminal
  // -------------------------------------------------
  const termOut = document.getElementById('kdxDevTermOut');
  const termIn  = document.getElementById('kdxDevTermIn');
  const termHistory = [];
  let termIndex     = -1;

  function termPrint(prefix, text){
    const line = document.createElement('div');
    line.textContent = prefix + ' ' + text;
    termOut.appendChild(line);
    termOut.scrollTop = termOut.scrollHeight;
  }

  termPrint('>','Terminal KDX v4.1. Comandos: help');

  function handleCommand(cmd){
    if (cmd === 'help'){ termPrint('>','help, clear, fps, blocks, eval <js>'); return; }
    if (cmd === 'clear'){ termOut.innerHTML = ''; return; }
    if (cmd === 'fps'){ termPrint('>','FPS: '+lastFps); return; }
    if (cmd === 'blocks'){
      const blocks = document.querySelectorAll('.response-block');
      termPrint('>','response-blocks: '+blocks.length);
      blocks.forEach((b,i)=> termPrint('>','#'+i+' '+(b.dataset.archetype||'sem archetype')));
      return;
    }
    if (cmd.startsWith('eval ')){
      const js = cmd.slice(5);
      try{ const res = eval(js); termPrint('>','=> '+String(res)); }catch(err){ termPrint('>','Erro: '+err); }
      return;
    }
    try{ const res = eval(cmd); termPrint('>','=> '+String(res)); }catch(err){ termPrint('>','(erro: '+err+')'); }
  }

  termIn.addEventListener('keydown', e=>{
    if (e.key === 'Enter'){
      e.preventDefault();
      const cmd = termIn.value.trim();
      if (!cmd) return;
      termHistory.push(cmd);
      termIndex = termHistory.length;
      termPrint('$', cmd);
      termIn.value = '';
      handleCommand(cmd);
    } else if (e.key === 'ArrowUp'){
      if (!termHistory.length) return;
      termIndex = Math.max(0, termIndex-1);
      termIn.value = termHistory[termIndex] || '';
    } else if (e.key === 'ArrowDown'){
      if (!termHistory.length) return;
      termIndex = Math.min(termHistory.length, termIndex+1);
      termIn.value = termHistory[termIndex] || '';
    }
  });

  // -------------------------------------------------
  // 9) Presets + Export JSON/ZIP (botões já com classes visuais)
  // -------------------------------------------------
  const presetList   = document.getElementById('kdxDevPresetList');
  const presetSave   = document.getElementById('kdxDevPresetSave');
  const exportJson   = document.getElementById('kdxDevExportJson');
  const exportZip    = document.getElementById('kdxDevExportZip');

  function loadPresets(){
    const store = JSON.parse(localStorage.getItem('KDX_PRESETS') || '{}');
    presetList.innerHTML = '';
    Object.entries(store).forEach(([name, code])=>{
      const li = document.createElement('li');
      const title = document.createElement('div');
      title.style.flex = '1';
      title.textContent = name;
      const btns = document.createElement('div');
      btns.style.display = 'flex';
      btns.style.gap = '6px';
      const loadBtn = document.createElement('button');
      loadBtn.textContent = 'load';
      loadBtn.style.fontSize='11px';
      loadBtn.style.padding='6px 8px';
      loadBtn.style.borderRadius='6px';
      loadBtn.addEventListener('click', ()=>{
        if (monacoEditor) monacoEditor.setValue(code);
        else editorText.value = code;
        appendLog('system','Preset carregado: '+name);
      });
      const delBtn = document.createElement('button');
      delBtn.textContent = 'x';
      delBtn.style.fontSize='11px';
      delBtn.style.padding='6px 8px';
      delBtn.style.borderRadius='6px';
      delBtn.addEventListener('click', ()=>{
        const s = JSON.parse(localStorage.getItem('KDX_PRESETS') || '{}');
        delete s[name];
        localStorage.setItem('KDX_PRESETS', JSON.stringify(s));
        loadPresets();
        appendLog('system','Preset removido: '+name);
      });
      btns.appendChild(loadBtn);
      btns.appendChild(delBtn);
      li.appendChild(title);
      li.appendChild(btns);
      li.style.display = 'flex';
      li.style.justifyContent = 'space-between';
      li.style.alignItems = 'center';
      li.addEventListener('click', (e)=>{ if (e.target === li) { /* noop */ } });
      presetList.appendChild(li);
    });
  }
  loadPresets();

  presetSave.addEventListener('click', ()=>{
    const name = 'Preset-'+new Date().toISOString();
    const code = getEditorCode();
    const store = JSON.parse(localStorage.getItem('KDX_PRESETS') || '{}');
    store[name] = code;
    localStorage.setItem('KDX_PRESETS', JSON.stringify(store));
    loadPresets();
    appendLog('system','Preset salvo: '+name);
  });

  function downloadBlob(name, blob){
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(()=> URL.revokeObjectURL(url), 3000);
  }

  exportJson.addEventListener('click', ()=>{
    const data = { logs, presets: JSON.parse(localStorage.getItem('KDX_PRESETS') || '{}'), jsonLast: window.KDX_JSON_LAST || null };
    const blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'});
    downloadBlob('kdx-devpanel-export.json', blob);
    appendLog('system','Export JSON gerado.');
  });

  function ensureJSZip(cb){
    if (window.JSZip) return cb && cb();
    const exist = document.querySelector('script[data-kdx-jszip]');
    if (exist){ exist.addEventListener('load', ()=> cb && cb()); return; }
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
    s.dataset.kdxJsZip = '1';
    s.onload = ()=> cb && cb();
    document.head.appendChild(s);
  }

  exportZip.addEventListener('click', ()=>{
    ensureJSZip(()=>{
      if (!window.JSZip){
        appendLog('error','JSZip não carregou, usando JSON mesmo.');
        exportJson.click();
        return;
      }
      const zip = new window.JSZip();
      zip.file('logs.json', JSON.stringify(logs,null,2));
      zip.file('presets.json', localStorage.getItem('KDX_PRESETS') || '{}');
      if (window.KDX_JSON_LAST) zip.file('json_last.json', JSON.stringify(window.KDX_JSON_LAST,null,2));
      zip.generateAsync({type:'blob'}).then(blob=>{
        downloadBlob('kdx-devpanel-bundle.zip', blob);
        appendLog('system','ZIP exportado.');
      }).catch(err=>{
        appendLog('error','Erro ao gerar ZIP:', err);
      });
    });
  });

  // -------------------------------------------------
  // 10) API de mini-apps + Inspector DualChat
  // -------------------------------------------------
  const appsBox = document.getElementById('kdxDevApps');
  window.KDX = window.KDX || {};
  window.KDX.registerPanel = function(name, html, fn){
    const box = document.createElement('div');
    box.style.marginBottom = '8px';
    box.innerHTML = '<strong>'+name+'</strong><div style="margin-top:6px;">'+html+'</div>';
    appsBox.appendChild(box);
    if (typeof fn === 'function') fn(box);
    appendLog('system','Mini-app registrado: '+name);
  };

  window.KDX.registerPanel(
    'Inspector DualChat',
    '<button data-kdx="scan" style="font-size:10px;padding:6px 8px;border-radius:6px;border:1px solid rgba(0,245,255,.4);background:transparent;color:inherit;width:100%;margin-top:3px;">Scan blocks</button><div data-kdx="list" style="margin-top:6px;max-height:150px;overflow:auto;"></div>',
    box=>{
      const btn  = box.querySelector('[data-kdx="scan"]');
      const list = box.querySelector('[data-kdx="list"]');
      btn.addEventListener('click', ()=>{
        const blocks = Array.from(document.querySelectorAll('.response-block'));
        list.innerHTML = '';
        if (!blocks.length){ list.textContent = 'Nenhum .response-block encontrado.'; return; }
        blocks.forEach((b,i)=>{
          const bt = document.createElement('button');
          bt.textContent = '#'+i+' · '+(b.dataset.archetype || 'sem arquétipo');
          bt.style.display = 'block';
          bt.style.width = '100%';
          bt.style.fontSize = '11px';
          bt.style.marginBottom = '6px';
          bt.style.borderRadius = '6px';
          bt.style.border = '1px solid rgba(0,245,255,.3)';
          bt.style.background = 'rgba(0,245,255,.06)';
          bt.addEventListener('click', ()=>{
            b.scrollIntoView({behavior:'smooth', block:'center'});
            b.style.outline = '2px solid var(--accent,#00f5ff)';
            setTimeout(()=> b.style.outline = '', 1400);
            appendLog('info','Inspect bloco #'+i, (b.innerText||'').slice(0,120));
          });
          list.appendChild(bt);
        });
      });
    }
  );

  // -------------------------------------------------
  // 11) Perf HUD + loop que também atualiza o Dash
  // -------------------------------------------------
  const perfFps   = document.getElementById('kdxPerfFps');
  const perfMem   = document.getElementById('kdxPerfMem');
  const perfTicks = document.getElementById('kdxPerfTicks');

  let lastFps = 0;
  let frames  = 0;
  let lastT   = performance.now();
  let ticks   = 0;

  function loop(ts){
    frames++;
    ticks++;
    const dt = ts - lastT;
    if (dt >= 1000){
      lastFps = Math.round(frames * 1000 / dt);
      frames  = 0;
      lastT   = ts;
      if (perfFps)   perfFps.textContent   = 'FPS: '+lastFps;
      if (perfTicks) perfTicks.textContent = 'Ticks: '+ticks;
      if (perfMem){
        if (performance && performance.memory){
          const m = performance.memory;
          const used = (m.usedJSHeapSize / 1048576).toFixed(1);
          const total = (m.totalJSHeapSize / 1048576).toFixed(1);
          perfMem.textContent = 'Memória: '+used+' / '+total+' MB';
        } else {
          perfMem.textContent = 'Memória: API não disponível';
        }
      }
      // Atualiza o Dashboard 1x por segundo
      updateDash();
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

})();
</script>