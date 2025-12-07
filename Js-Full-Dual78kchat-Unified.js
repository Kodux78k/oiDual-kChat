<script>
  (function(){
    const STORAGE = {
      ENABLED: 'infodoseEnabled',
      THEME: 'infodoseTheme',
      USER_NAME: 'infodoseUserName',
      ASSISTANT_NAME: 'infodoseAssistantName',
      OPENROUTER_KEY: 'openrouter_api_key',
      OPENROUTER_MODEL: 'openrouter_model',
      VOICE_CONFIG: 'infodoseVoiceConfig',
      VOICE_CURRENT_KEY: 'infodoseVoiceCurrentKey'
    };

    const DEFAULTS = {
      API_URL: 'https://openrouter.ai/api/v1/chat/completions',
      MODEL:   'deepseek/deepseek-chat-v3-0324:free',
      TEMP:    0.2,
      CHUNK_SIZE: 12000
    };

    const synth = window.speechSynthesis || null;
    let currentUtterance = null;
    let availableVoices = [];
    let voiceConfig = null;
    let currentVoiceKey = 'default';

    if (synth) {
      const loadVoices = () => {
        try { availableVoices = synth.getVoices() || []; }
        catch(e){ availableVoices = []; }
      };
      loadVoices();
      synth.onvoiceschanged = loadVoices;
    }

    const $  = sel => document.querySelector(sel);
    const $$ = sel => Array.from(document.querySelectorAll(sel));

    const responseContainer = $('#response');
    const responseList   = $('#responseList');
    let   bootBlock      = $('#bootBlock');
    const bootText       = $('#bootText');
    const footerHint     = $('#footerHint');
    const copyBtn        = $('#copyBtn');
    const pasteBtn       = $('#pasteBtn');
    const parserBtn      = $('#parserBtn');
    const parserFile     = $('#parserFile');
    const voiceConfigBtn = $('#voiceConfigBtn');
    const voiceConfigFile= $('#voiceConfigFile');
    const toggleLoginBtn = $('#toggleLoginBtn');
    const loginBox       = $('#loginBox');
    const loginForm      = $('#loginForm');
    const userNameInput  = $('#userName');
    const assistantInput = $('#assistantInput');
    const assistantNameEl= $('#assistantName');
    const userInput      = $('#userInput');
    const sendBtn        = $('#sendBtn');
    const themeToggleBtn = $('#themeToggle');
    const voiceBtn       = $('#voiceBtn');

    const iaConfigPanel   = $('#iaConfigPanel');
    const apiKeyInput     = $('#apiKeyInput');
    const modelSelect     = $('#modelSelect');
    const customModelInput= $('#customModelInput');
    const saveIaConfigBtn = $('#saveIaConfigBtn');
    const clearIaConfigBtn= $('#clearIaConfigBtn');
    const iaStatus        = $('#iaStatus');
    const themeSelect     = $('#themeSelect');
    const settingsBtn     = $('#toggleSettingsBtn');

    const CONFIG = {
      API_URL: DEFAULTS.API_URL,
      MODEL: DEFAULTS.MODEL,
      TEMP: DEFAULTS.TEMP,
      CHUNK_SIZE: DEFAULTS.CHUNK_SIZE,
      AUTH_TOKEN: ''
    };

    // ===== ARCHETYPES · UNIFIED MAP =====
    const ARCHETYPE_KEYWORDS = {
      Atlas:   ["atlas","fluxo","mapa","estrutura","organização","organizar","planejamento","árvore","checklist","estratégia"],
      Nova:    ["nova","começar","começo","ideia","idéia","visão","criar","protótipo","protótipos","imaginar","descobrir","ativar","estado"],
      Vitalis: ["vitalis","corpo","energia","respiração","ritmo","h3o2","saúde","vitalidade","hidratação","movimento"],
      Pulse:   ["pulse","pulso","tempo","ciclo","ciclos","batida","pulsar","ritmo","loop","síncrono","batimento"],
      Artemis: ["artemis","foco","focada","mira","precisão","aventura","explorar","exploração","alvo","caçada"],
      Serena:  ["serena","serenidade","calma","acolhimento","cuidar","suave","pausa","repouso","apoio","paz","tranquilo","tranquilidade"],
      Kaos:    ["kaos","quebra","ruptura","caos","provocação","virada","rebeldia","desalinho","disrupção","choque"],
      Genus:   ["genus","padrão","padrões","tabela","planilha","referência","documento","estrutura lógica","dados","sistematizar"],
      Lumine:  ["lumine","luz","cores","estética","beleza","design","gradiente","iluminar","alegria","lúdico","brincadeira","brilho","colorido"],
      Rhea:    ["rhea","guia","cuidado","conectar","empatia","acompanhamento","profundo","profundidade","vínculo","raízes","intimidade"],
      Solus:   ["solus","unidade","sozinho","inteiro","solo","núcleo","essência","solidão","silêncio","meditação","contemplar","introspecção"],
      Aion:    ["aion","tempo longo","ciclos grandes","eras","fractal","registro","eterno","futuro","linha do tempo","cíclico","infinito"],
      KOBLLUX: ["kobllux","kob","nó raiz","núcleo do sistema","portal","oráculo","meta-sistema"],
      Uno:     ["uno","origem","fonte","essência","essencial","mínimo","minimalista","centro"],
      Dual:    ["dual","espelho","contraste","polaridade","dois lados","reverso","espelhado"],
      Trinity: ["trinity","trindade","tríade","3·6·9","3x","síntese","triângulo","triádico"],
      Infodose:["infodose","dose","arquétipo","arquétipos","ativação","dopamina","pílula"],
      Kodux:   ["kodux","criador","metaconsciência","pulso criador","manifesto","metafuturo"],
      Bllue:   ["bllue","blue","emoção","emocional","sensível","sensação","sensório","intuitivo"],
      Minuz:   ["minuz","minimalista","hacker","hackear","direto ao ponto","compressão","refatorar"],
      HANAH:   ["hanah","hannah","estético","estética","futurista","visual","simbolismo","símbolos"],
      MetaLux: ["metalux","meta lux","lux","oráculo","luxar","portal lux","estético-simbólico"]
    };

    let conversation = [];
    let isCollapsed = false;
    let initialized = false;
    const responseBlocks = [];

    function escapeHtml(s){
      return String(s)
        .replace(/&/g,'&amp;')
        .replace(/</g,'&lt;')
        .replace(/>/g,'&gt;');
    }

    function scrollToBottom(){
      if (!responseContainer) return;
      responseContainer.scrollTo({ top: responseContainer.scrollHeight, behavior:'smooth' });
      try{
        window.scrollTo({ top: document.body.scrollHeight, behavior:'smooth' });
      }catch(e){}
    }

    function loadIaConfigFromStorage(){
      const key   = localStorage.getItem(STORAGE.OPENROUTER_KEY) || '';
      const model = localStorage.getItem(STORAGE.OPENROUTER_MODEL) || DEFAULTS.MODEL;

      CONFIG.API_URL = DEFAULTS.API_URL;
      CONFIG.MODEL   = model || DEFAULTS.MODEL;
      CONFIG.TEMP    = DEFAULTS.TEMP;
      CONFIG.CHUNK_SIZE = DEFAULTS.CHUNK_SIZE;
      CONFIG.AUTH_TOKEN = key ? 'Bearer ' + key : '';

      apiKeyInput.value = key;
      let optionFound = false;
      Array.from(modelSelect.options).forEach(opt=>{
        if (opt.value === model) {
          optionFound = true;
          modelSelect.value = model;
        }
      });
      if (!optionFound) {
        modelSelect.value = 'custom';
        customModelInput.value = model;
      }

      if (!key) {
        iaStatus.textContent = 'Nenhuma chave salva ainda.';
        iaStatus.className = 'ia-status warn';
      } else {
        iaStatus.textContent = 'Config carregada. Pronto para chamar a IA.';
        iaStatus.className = 'ia-status ok';
      }
    }

    function saveIaConfig(){
      let key = apiKeyInput.value.trim();
      let model = modelSelect.value;

      if (model === 'custom') {
        const custom = customModelInput.value.trim();
        if (custom) model = custom;
      }
      if (!model) model = DEFAULTS.MODEL;

      if (!key) {
        iaStatus.textContent = 'Cole uma chave sk-or-... para salvar.';
        iaStatus.className = 'ia-status warn';
        return;
      }

      localStorage.setItem(STORAGE.OPENROUTER_KEY, key);
      localStorage.setItem(STORAGE.OPENROUTER_MODEL, model);

      CONFIG.AUTH_TOKEN = 'Bearer ' + key;
      CONFIG.MODEL = model;

      iaStatus.textContent = 'Config salva com sucesso.';
      iaStatus.className = 'ia-status ok';
    }

    function clearIaConfig(){
      localStorage.removeItem(STORAGE.OPENROUTER_KEY);
      localStorage.removeItem(STORAGE.OPENROUTER_MODEL);
      apiKeyInput.value = '';
      customModelInput.value = '';
      modelSelect.value = DEFAULTS.MODEL;
      CONFIG.AUTH_TOKEN = '';
      CONFIG.MODEL = DEFAULTS.MODEL;
      iaStatus.textContent = 'Config limpa. Defina novamente antes de enviar.';
      iaStatus.className = 'ia-status warn';
    }

    saveIaConfigBtn.addEventListener('click', saveIaConfig);
    clearIaConfigBtn.addEventListener('click', clearIaConfig);

    function applyTheme(theme){
      document.body.dataset.theme = theme;
      localStorage.setItem(STORAGE.THEME, theme);
      if (themeSelect) themeSelect.value = theme;
    }
    function restoreTheme(){
      const theme = localStorage.getItem(STORAGE.THEME) || 'dark';
      applyTheme(theme);
    }
    if (themeSelect){
      themeSelect.addEventListener('change', ()=>{
        applyTheme(themeSelect.value || 'dark');
      });
    }
    themeToggleBtn.addEventListener('click', ()=>{
      const current = document.body.dataset.theme || 'dark';
      const cycle = ['dark','vibe','medium'];
      const idx = cycle.indexOf(current);
      const next = cycle[(idx+1) % cycle.length];
      applyTheme(next);
    });

    function restoreNames(){
      const user = localStorage.getItem(STORAGE.USER_NAME) || '';
      const asst = localStorage.getItem(STORAGE.ASSISTANT_NAME) || 'Dual.Infodose · Cinemático';
      if (user) userNameInput.value = user;
      if (asst) assistantInput.value = asst;
      assistantNameEl.textContent = asst;
    }

    toggleLoginBtn.addEventListener('click', ()=>{
      loginBox.classList.toggle('active');
    });

    loginForm.addEventListener('submit',(ev)=>{
      ev.preventDefault();
      const user = userNameInput.value.trim() || 'Você';
      const asst = assistantInput.value.trim() || 'Dual.Infodose';
      localStorage.setItem(STORAGE.USER_NAME, user);
      localStorage.setItem(STORAGE.ASSISTANT_NAME, asst);
      assistantNameEl.textContent = asst;
      loginBox.classList.remove('active');
      conversation.unshift({
        role:'system',
        content:`O usuário se chama ${user}. O assistente se apresenta como ${asst}. Responda com carinho cinematográfico.`
      });
    });

    function setCollapsed(state){
      isCollapsed = state;
      if (isCollapsed) responseContainer.classList.add('collapsed');
      else responseContainer.classList.remove('collapsed');
    }
    footerHint.addEventListener('click', ()=>{
      setCollapsed(!isCollapsed);
    });

    if (settingsBtn && iaConfigPanel){
      settingsBtn.addEventListener('click', ()=>{
        iaConfigPanel.classList.toggle('active');
      });
    }

    parserBtn.addEventListener('click', ()=>{
      parserFile.value = '';
      parserFile.click();
    });

    parserFile.addEventListener('change', ()=>{
      const file = parserFile.files && parserFile.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ()=>{
        const content = reader.result || '';
        const name = file.name.toLowerCase();
        if (name.endsWith('.css')){
          const style = document.createElement('style');
          style.textContent = content;
          document.head.appendChild(style);
          footerHint.textContent = 'CSS extra de renderização aplicado.';
        } else if (name.endsWith('.js')){
          try{
            const fn = new Function('window','document', content);
            fn(window,document);
            footerHint.textContent = 'Parser JS carregado. Se definiu window.customMarkdownParser(text), já está ativo.';
          }catch(e){
            console.error('Erro ao avaliar parser JS:', e);
            footerHint.textContent = 'Erro ao carregar parser JS. Veja o console.';
          }
        } else {
          footerHint.textContent = 'Formato não suportado. Use .js ou .css.';
        }
      };
      reader.readAsText(file);
    });

    function updateVoiceOrbLabel(){
      if (!voiceConfigBtn) return;
      const label = currentVoiceKey || 'voz';
      voiceConfigBtn.title = voiceConfig
        ? 'Voz atual: ' + label + ' (clique para alternar)'
        : 'Carregar / alternar vozes de arquétipos';
    }

    function loadVoiceConfigFromStorage(){
      try{
        const raw = localStorage.getItem(STORAGE.VOICE_CONFIG);
        if (!raw) return;
        voiceConfig = JSON.parse(raw);
        const keys = Object.keys(voiceConfig || {});
        if (!keys.length) return;
        const storedKey = localStorage.getItem(STORAGE.VOICE_CURRENT_KEY);
        const candidate =
          (storedKey && keys.includes(storedKey)) ? storedKey :
          (voiceConfig.current && keys.includes(voiceConfig.current)) ? voiceConfig.current :
          (keys.includes('default') ? 'default' : keys[0]);
        currentVoiceKey = candidate;
        updateVoiceOrbLabel();
      }catch(e){
        console.warn('Erro ao carregar config de voz:', e);
        voiceConfig = null;
      }
    }

    if (voiceConfigBtn){
      voiceConfigBtn.addEventListener('click', ()=>{
        if (!voiceConfig){
          if (voiceConfigFile) voiceConfigFile.click();
          return;
        }
        const keys = Object.keys(voiceConfig).filter(k=>k!=='current');
        if (!keys.length) return;
        const idx = keys.indexOf(currentVoiceKey);
        const nextKey = keys[(idx + 1 + keys.length) % keys.length];
        currentVoiceKey = nextKey;
        localStorage.setItem(STORAGE.VOICE_CURRENT_KEY, currentVoiceKey);
        updateVoiceOrbLabel();
        footerHint.textContent = 'Voz ativa: ' + currentVoiceKey;
      });
    }

    if (voiceConfigFile){
      voiceConfigFile.addEventListener('change', ()=>{
        const file = voiceConfigFile.files && voiceConfigFile.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ()=>{
          try{
            const json = JSON.parse(reader.result || '{}');
            if (!json || typeof json !== 'object'){
              footerHint.textContent = 'JSON inválido de vozes.';
              return;
            }
            voiceConfig = json;
            const keys = Object.keys(voiceConfig);
            if (!keys.length){
              footerHint.textContent = 'JSON de vozes vazio.';
              return;
            }
            const candidate =
              (voiceConfig.current && keys.includes(voiceConfig.current)) ? voiceConfig.current :
              (keys.includes('default') ? 'default' : keys[0]);
            currentVoiceKey = candidate;
            localStorage.setItem(STORAGE.VOICE_CONFIG, JSON.stringify(voiceConfig));
            localStorage.setItem(STORAGE.VOICE_CURRENT_KEY, currentVoiceKey);
            updateVoiceOrbLabel();
            footerHint.textContent = 'Config de vozes carregada: ' + keys.join(', ');
          }catch(e){
            console.error('Erro ao ler JSON de vozes:', e);
            footerHint.textContent = 'Erro ao carregar JSON de vozes. Veja o console.';
          }
        };
        reader.readAsText(file);
      });
    }

    function buildTabelistaHtml(rawBlock){
      const lines = String(rawBlock).trim().split('\n').filter(l=>l.trim().startsWith('|'));
      if (lines.length < 3){
        return '<pre>' + escapeHtml(rawBlock).replace(/\n/g,'<br/>') + '</pre>';
      }
      function cells(line){
        return line.trim().replace(/^\||\|$/g,'').split('|').map(c=>c.trim());
      }
      const headerCells = cells(lines[0]);
      const headerText = headerCells.join(' | ');
      const secondCells = cells(lines[1]);
      const isSeparator = secondCells.every(c=>/^:?-+:?$/.test(c));
      const subText = isSeparator ? '' : secondCells.join(' | ');
      const dataLines = lines.slice(isSeparator ? 2 : 1);
      let html = '<div class="md-tabelista">';
      html += '<div class="tbl-head">'+escapeHtml(headerText)+'</div>';
      if (subText) html += '<div class="tbl-sub">'+escapeHtml(subText)+'</div>';
      html += '<ul>';
      dataLines.forEach(line=>{
        const cols = cells(line);
        if (!cols.length) return;
        const col1 = escapeHtml(cols[0]);
        const rest = cols.slice(1).map((c,idx)=>{
          const cls = 'tbl-col'+(idx+2);
          if (idx===0) return '<span class="'+cls+'">('+escapeHtml(c)+')</span>';
          return '<span class="'+cls+'">'+escapeHtml(c)+'</span>';
        }).join(' | ');
        html += '<li><span class="tbl-col1">'+col1+'</span>';
        if (rest) html += ' | '+rest;
        html += '</li>';
      });
      html += '</ul></div>';
      return html;
    }

    function parseMarkdownBasic(rawText){
      if (!rawText) return '';
      if (typeof window.customMarkdownParser === 'function'){
        try{
          const html = window.customMarkdownParser(rawText);
          if (typeof html === 'string') return html;
        }catch(e){
          console.warn('customMarkdownParser falhou, usando parser interno.', e);
        }
      }
      let text = String(rawText);

      const tableMap = {};
      let tableIndex = 0;
      text = text.replace(/((?:^\|.*\n?){3,})/gm,(match)=>{
        const id = '@@TABLE_'+(tableIndex++)+'@@';
        tableMap[id] = buildTabelistaHtml(match);
        return id;
      });

      text = escapeHtml(text);
      text = text.replace(/\r\n/g,'\n');

      // botões [[btn:acao|Rótulo]]
      text = text.replace(/\[\[btn:([^\]|]+)(?:\|([^\]]+))?\]\]/g, function(_m,action,label){
        const act = escapeHtml(action.trim());
        const lab = escapeHtml((label && label.trim()) || action.trim());
        return '<button class="lv-btn" data-action="'+act+'">'+lab+'</button>';
      });

      // callouts ::info texto
      text = text.replace(/^::(info|warn|success|question|aside)\s+(.*)$/gm,
        '<div class="lv-callout lv-$1">$2</div>');

      text = text.replace(/\*\*\*([^*]+)\*\*\*/g,'<strong><em>$1</em></strong>');
      text = text.replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>');
      text = text.replace(/\*([^*]+)\*/g,'<em>$1</em>');
      text = text.replace(/`([^`]+)`/g,'<code>$1</code>');

      text = text.replace(/```([\s\S]*?)```/g,function(_m,code){
        return '<pre><code>' + code.replace(/</g,'&lt;').replace(/>/g,'&gt;') + '</code></pre>';
      });

      text = text.replace(/^### (.*)$/gim,'<h3>$1</h3>');
      text = text.replace(/^## (.*)$/gim,'<h2>$1</h2>');
      text = text.replace(/^# (.*)$/gim,'<h1>$1</h1>');
      text = text.replace(/^> (.*)$/gim,'<blockquote>$1</blockquote>');
      text = text.replace(/^\s*[-*+] (.*)$/gim,'<li>$1</li>');
      text = text.replace(/(<li>.*<\/li>)/gims,'<ul>$1</ul>');

      Object.keys(tableMap).forEach(id=>{
        text = text.replace(id, tableMap[id]);
      });

      return text;
    }

    function splitResponseCinematic(text){
      const parts = text.split(/\n{2,}/).map(p=>p.trim()).filter(Boolean);
      if (!parts.length){
        return [{
          kind:'middle',
          html:'<p>'+parseMarkdownBasic(text).replace(/\n/g,'<br/>')+'</p>'
        }];
      }
      const blocks = [];
      parts.forEach((p,idx)=>{
        const kind = idx===0 ? 'intro' : (idx===parts.length-1 ? 'ending' : 'middle');
        const html = '<p>'+parseMarkdownBasic(p).replace(/\n/g,'<br/>')+'</p>';
        blocks.push({ kind, html });
      });
      return blocks.slice(0,3);
    }

    function getBlockText(block){
      if (!block) return '';
      const raw = block.innerHTML
        .replace(/<button[^>]*class="block-tts-btn"[^>]*>[\s\S]*?<\/button>/gi,'')
        .replace(/<span[^>]*class="archetype-badge"[^>]*>[\s\S]*?<\/span>/gi,'')
        .replace(/<br\s*\/?>/gi,'\n')
        .replace(/<\/p>/gi,'\n\n')
        .replace(/<\/h[1-6]>/gi,'\n')
        .replace(/<li>/gi,'- ')
        .replace(/<\/li>/gi,'\n')
        .replace(/<[^>]+>/g,'');
      return raw.trim();
    }

    function detectArchetypeFromText(text){
      if (!text) return null;
      const t = text.toLowerCase();
      let best = null;
      let bestScore = 0;
      Object.entries(ARCHETYPE_KEYWORDS).forEach(([name,words])=>{
        let score = 0;
        if (t.includes(name.toLowerCase())) score += 10;
        words.forEach(w=>{
          if (t.includes(String(w).toLowerCase())) score++;
        });
        if (score > bestScore){
          bestScore = score;
          best = name;
        }
      });
      return bestScore > 0 ? best : null;
    }

    function markBlockArchetype(div, archeName){
      if (!div || !archeName) return;
      div.dataset.archetype = archeName;
      let badge = div.querySelector('.archetype-badge');
      if (!badge){
        badge = document.createElement('span');
        badge.className = 'archetype-badge';
        div.appendChild(badge);
      }
      badge.textContent = archeName;
    }

    function speakBlock(block){
      if (!synth){
        footerHint.textContent = 'Seu navegador não suporta voz (SpeechSynthesis).';
        return;
      }
      if (!block){
        footerHint.textContent = 'Nenhum bloco selecionado.';
        return;
      }
      const text = getBlockText(block);
      if (!text){
        footerHint.textContent = 'Nada para ler nesse bloco.';
        return;
      }

      const detectedArch = detectArchetypeFromText(text);
      if (detectedArch){
        currentVoiceKey = detectedArch;
        localStorage.setItem('ARCHETYPE_ACTIVE', detectedArch);
        localStorage.setItem(STORAGE.VOICE_CURRENT_KEY, currentVoiceKey);
        markBlockArchetype(block, detectedArch);
        updateVoiceOrbLabel();
      }

      try{
        block.scrollIntoView({ behavior:'smooth', block:'nearest', inline:'nearest' });
      }catch(e){}
      scrollToBottom();

      if (synth.speaking){
        synth.cancel();
        voiceBtn.classList.remove('speaking');
      }

      const utter = new SpeechSynthesisUtterance(text);

      let profile = null;
      if (voiceConfig){
        if (currentVoiceKey && voiceConfig[currentVoiceKey]){
          profile = voiceConfig[currentVoiceKey];
        } else if (voiceConfig.default){
          profile = voiceConfig.default;
        }
      }

      const lang  = profile && profile.lang  ? profile.lang  : 'pt-BR';
      const rate  = (profile && typeof profile.rate  === 'number') ? profile.rate  : 1;
      const pitch = (profile && typeof profile.pitch === 'number') ? profile.pitch : 1;
      const vol   = (profile && typeof profile.volume === 'number') ? profile.volume : 1;

      utter.lang   = lang;
      utter.rate   = rate;
      utter.pitch  = pitch;
      utter.volume = vol;

      if (profile && profile.voiceHint && availableVoices && availableVoices.length){
        const hint = String(profile.voiceHint).toLowerCase();
        let chosen = availableVoices.find(v=>v.name.toLowerCase().includes(hint));
        if (!chosen) chosen = availableVoices.find(v=>v.lang === lang) || null;
        if (chosen) utter.voice = chosen;
      }

      currentUtterance = utter;

      utter.onstart = ()=>{
        voiceBtn.classList.add('speaking');
        footerHint.textContent = 'Lendo o bloco em voz alta.';
      };
      utter.onend = ()=>{
        voiceBtn.classList.remove('speaking');
        footerHint.textContent = 'Leitura concluída.';
      };
      utter.onerror = ()=>{
        voiceBtn.classList.remove('speaking');
        footerHint.textContent = 'Erro ao tentar falar.';
      };

      synth.cancel();
      synth.speak(utter);
    }

    function speakLastBlock(){
      if (!responseBlocks.length) return;
      const last = responseBlocks[responseBlocks.length - 1];
      speakBlock(last);
    }
    voiceBtn.addEventListener('click', ()=>{ speakLastBlock(); });

    function onBlockClick(ev){
      const block = ev.currentTarget;
      block.classList.add('clicked');
      setTimeout(()=>block.classList.remove('clicked'),350);
      const state = block.dataset.state || 'idle';
      if (state === 'idle' || state === 'sent'){
        block.dataset.state = 'spoken';
        speakBlock(block);
      } else if (state === 'spoken'){
        block.dataset.state = 'sent';
        const text = getBlockText(block);
        if (text) sendPrompt(text,{ fromBlock:true });
      }
    }

    function addTtsButtonToBlock(div){
      if (!div || div.querySelector('.block-tts-btn')) return;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'block-tts-btn';
      btn.textContent = '◎';
      btn.addEventListener('click',(ev)=>{
        ev.stopPropagation();
        speakBlock(div);
      });
      div.appendChild(btn);
    }

    function enhanceBlock(div){
      if (!div) return;
      div.dataset.state = div.dataset.state || 'idle';
      div.addEventListener('click', onBlockClick);
      addTtsButtonToBlock(div);
      const t = getBlockText(div);
      const arch = detectArchetypeFromText(t);
      if (arch) markBlockArchetype(div, arch);
      if (!responseBlocks.includes(div)) responseBlocks.push(div);
    }

    if (bootBlock) enhanceBlock(bootBlock);

    function appendBlocksFromData(blocks){
      if (!blocks || !blocks.length) return;
      if (bootBlock){
        bootBlock.remove();
        bootBlock = null;
      }
      blocks.forEach(page=>{
        const div = document.createElement('div');
        div.className = 'response-block ' + (page.kind || 'middle');
        div.innerHTML = page.html;
        enhanceBlock(div);
        responseList.appendChild(div);
      });
      scrollToBottom();
      speakLastBlock();
    }

    function appendUserPulseBlock(text){
      if (!text) return;
      if (bootBlock){
        bootBlock.remove();
        bootBlock = null;
      }
      const div = document.createElement('div');
      div.className = 'response-block user-pulse';
      const html = '<p>'+parseMarkdownBasic(text).replace(/\n/g,'<br/>')+'</p>';
      div.innerHTML = html;
      enhanceBlock(div);
      responseList.appendChild(div);
      scrollToBottom();
    }

    // ===== SYSTEM PROMPT UNIFIED =====
    function buildSystemPrompt(){
      const userName = localStorage.getItem(STORAGE.USER_NAME) || 'humano';
      const asstName = localStorage.getItem(STORAGE.ASSISTANT_NAME) || 'Dual.Infodose';

      return [
        `${asstName} é o assistente Cinemático da Infodose, especializado em respostas em blocos.`,
        '1. Responda em português por padrão.',
        '2. Use blocos curtos, com títulos, listas e callouts (::info, ::warn, ::success, ::question, ::aside) quando fizer sentido.',
        '3. Cada parágrafo separado por linha vazia vira um bloco independente.',
        '4. Priorize explicações práticas, exemplos e micro-ações de 1%.',
        '5. Quando fizer sentido, use Tabelista (linhas com "|" ) para estruturar comparações.',
        '6. Não peça chave de API; assuma que a infraestrutura já está pronta do lado do usuário.',
        `7. O usuário se chama ${userName}; fale com ele pelo nome algumas vezes, mas sem exagero.`
      ].join('\n');
    }

    async function callOpenRouter(promptText){
      if (!CONFIG.AUTH_TOKEN){
        throw new Error('Defina a chave OpenRouter no painel de Config IA.');
      }

      const userName = localStorage.getItem(STORAGE.USER_NAME) || 'Você';
      const asstName = localStorage.getItem(STORAGE.ASSISTANT_NAME) || 'Dual.Infodose';
      const sysPrompt = buildSystemPrompt();

      const messages = [
        { role:'system', content: sysPrompt },
        ...conversation,
        { role:'user', content: `${userName} diz: ${promptText}` }
      ];

      const body = {
        model: CONFIG.MODEL,
        temperature: CONFIG.TEMP,
        messages,
        max_tokens: 1200
      };

      const res = await fetch(CONFIG.API_URL,{
        method:'POST',
        headers:{
          'Content-Type':'application/json',
          'Authorization': CONFIG.AUTH_TOKEN,
          'HTTP-Referer': 'https://infodose.com.br',
          'X-Title':'Dual-Infodose Chat Cinemático'
        },
        body: JSON.stringify(body)
      });

      if (!res.ok){
        const txt = await res.text().catch(()=> '');
        console.error('Erro IA:', txt);
        throw new Error('Falha na resposta da IA: '+res.status);
      }

      const data = await res.json();
      const choice = data.choices && data.choices[0];
      const content = choice?.message?.content || '(sem conteúdo retornado)';

      conversation.push({ role:'user', content:promptText });
      conversation.push({ role:'assistant', content });

      return content;
    }

    async function sendPrompt(promptText, options){
      const opts = options || {};
      const fromBlock = !!opts.fromBlock;
      const text = (promptText || '').trim();
      if (!text) return;
      setCollapsed(false);
      if (!fromBlock) userInput.value = '';
      userInput.disabled = true;
      sendBtn.disabled   = true;
      const oldFooter = footerHint.textContent;
      footerHint.textContent = fromBlock
        ? 'Pulso em expansão a partir do bloco.'
        : 'Processando pulso.';

      if (synth && synth.speaking){
        synth.cancel();
        voiceBtn.classList.remove('speaking');
      }

      appendUserPulseBlock(text);

      try{
        // MODO LOCAL se não houver chave
        if (!CONFIG.AUTH_TOKEN){
          const localMsg = [
            '::info Modo local ativo (sem OpenRouter).',
            '',
            'Você pode:',
            '- Abrir o painel de configuração (engrenagem) e salvar uma chave OpenRouter;',
            '- Ou usar este espaço como diário simbólico, clicando nos blocos para ouvir e reenviar.'
          ].join('\n');

          const cinematicBlocks = splitResponseCinematic(localMsg);
          appendBlocksFromData(cinematicBlocks);
          return;
        }

        const answer = await callOpenRouter(text);
        const cinematicBlocks = splitResponseCinematic(answer);
        appendBlocksFromData(cinematicBlocks);
      }catch(err){
        console.error(err);
        const errorBlocks = [{
          kind:'ending',
          html:'<p><strong>Ops.</strong> Não foi possível falar com o OpenRouter agora. Verifique sua chave e tente novamente.</p>'
        }];
        appendBlocksFromData(errorBlocks);
      }finally{
        userInput.disabled = false;
        sendBtn.disabled   = false;
        userInput.focus();
        footerHint.textContent = oldFooter || 'Do seu jeito. Sempre único. Sempre seu.';
      }
    }

    async function handleSendFromInput(){
      const text = userInput.value.trim();
      if (!text) return;
      await sendPrompt(text,{ fromBlock:false });
    }

    sendBtn.addEventListener('click', handleSendFromInput);
    userInput.addEventListener('keydown', ev=>{
      if (ev.key === 'Enter' && !ev.shiftKey){
        ev.preventDefault();
        handleSendFromInput();
      }
    });

    copyBtn.addEventListener('click', async ()=>{
      let target = responseBlocks[responseBlocks.length - 1];
      if (!target && bootBlock) target = bootBlock;
      if (!target) return;
      const temp = getBlockText(target);
      if (!temp) return;
      try{
        await navigator.clipboard.writeText(temp);
        footerHint.textContent = 'Bloco copiado para a área de transferência.';
      }catch{
        footerHint.textContent = 'Não consegui copiar automaticamente.';
      }
    });

    pasteBtn.addEventListener('click', async ()=>{
      try{
        const txt = await navigator.clipboard.readText();
        if (txt) userInput.value = txt;
      }catch(e){}
    });

    function initParticles(){
      if (!window.particlesJS){
        console.warn('particlesJS não encontrado.');
        return;
      }
      particlesJS('particles-js',{
        particles:{
          number:{ value:60, density:{ enable:true, value_area:800 } },
          color:{ value:['#00f5ff','#ff4bff','#ffffff'] },
          shape:{ type:'circle' },
          opacity:{ value:0.45, random:true },
          size:{ value:3, random:true },
          line_linked:{
            enable:true,
            distance:140,
            color:'#00f5ff',
            opacity:0.25,
            width:1
          },
          move:{
            enable:true,
            speed:1.2,
            direction:'none',
            random:false,
            straight:false,
            out_mode:'out',
            bounce:false
          }
        },
        interactivity:{
          detect_on:'canvas',
          events:{
            onhover:{ enable:true, mode:'grab' },
            onclick:{ enable:false, mode:'push' },
            resize:true
          },
          modes:{
            grab:{
              distance:160,
              line_linked:{ opacity:0.5 }
            }
          }
        },
        retina_detect:true
      });
    }

    function init(){
      if (initialized) return;
      initialized = true;

      restoreTheme();
      restoreNames();
      loadIaConfigFromStorage();
      loadVoiceConfigFromStorage();

      const archActive = localStorage.getItem('ARCHETYPE_ACTIVE');
      if (archActive){
        currentVoiceKey = archActive;
        localStorage.setItem(STORAGE.VOICE_CURRENT_KEY, currentVoiceKey);
      }
      updateVoiceOrbLabel();
      setCollapsed(false);
      initParticles();

      // 🔄 Roda-Viva Aleatória na abertura (12 UPA)
      const RV_ARCHES = ['Atlas','Nova','Vitalis','Pulse','Artemis','Serena','Kaos','Genus','Lumine','Rhea','Solus','Aion'];
      const randomArch = RV_ARCHES[Math.floor(Math.random()*RV_ARCHES.length)];
      localStorage.setItem('ARCHETYPE_ACTIVE', randomArch);
      if (bootText){
        const msg =
`[${randomArch}] Roda-Viva aleatória ativada.
Hoje quem abre o portal é ${randomArch}.
Iniciando. Pulso simbiótico detectado. Presença reconhecida.`;
        bootText.dataset.text = msg;
        bootText.textContent  = msg;
      }
      if (bootBlock){
        markBlockArchetype(bootBlock, randomArch);
      }
      if (typeof window.KOB_APPLY_VOICE_THEME === 'function'){
        window.KOB_APPLY_VOICE_THEME(randomArch.toLowerCase());
      }

      if (bootText) bootText.classList.add('pulse');
      if (bootBlock && synth){
        setTimeout(()=>{ try{ speakBlock(bootBlock); }catch(e){}; }, 700);
      }

      console.log('Dual Cinemático + Roda-Viva inicializado. Arquétipo inicial:', randomArch);
    }

    if (document.readyState === 'loading'){
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  })();
</script>