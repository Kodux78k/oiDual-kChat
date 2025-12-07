  <script>
  (function(){
    // ==========================
    // CONSTANTES & ESTADO BASE
    // ==========================
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
      TEMP:    0.35,
      CHUNK_SIZE: 12000
    };

    const CONFIG = {
      API_URL: DEFAULTS.API_URL,
      MODEL: DEFAULTS.MODEL,
      TEMP: DEFAULTS.TEMP,
      CHUNK_SIZE: DEFAULTS.CHUNK_SIZE,
      AUTH_TOKEN: ''
    };

    const synth = window.speechSynthesis || null;
    let availableVoices = [];
    let currentUtterance = null;

    if (synth) {
      const loadVoices = () => {
        try { availableVoices = synth.getVoices() || []; }
        catch(e){ availableVoices = []; }
      };
      loadVoices();
      synth.onvoiceschanged = loadVoices;
    }

    // Conversa em memória
    const conversation = [];

    // ==========================
    // HELPERS DOM
    // ==========================
    const $  = s => document.querySelector(s);
    const $$ = s => Array.from(document.querySelectorAll(s));

    const responseContainer = $('#response');
    const responseList      = $('#responseList');
    const bootBlock         = $('#bootBlock');
    const bootText          = $('#bootText');
    const footerHint        = $('#footerHint');
    const copyBtn           = $('#copyBtn');
    const pasteBtn          = $('#pasteBtn');
    const parserBtn         = $('#parserBtn');
    const parserFile        = $('#parserFile');
    const voiceConfigBtn    = $('#voiceConfigBtn');
    const voiceConfigFile   = $('#voiceConfigFile');
    const toggleLoginBtn    = $('#toggleLoginBtn');
    const loginBox          = $('#loginBox');
    const loginForm         = $('#loginForm');
    const userNameInput     = $('#userName');
    const assistantInput    = $('#assistantInput');
    const assistantNameEl   = $('#assistantName');
    const userInput         = $('#userInput');
    const sendBtn           = $('#sendBtn');
    const voiceBtn          = $('#voiceBtn');
    const themeToggleBtn    = $('#themeToggle');

    const iaConfigPanel     = $('#iaConfigPanel');
    const apiKeyInput       = $('#apiKeyInput');
    const modelSelect       = $('#modelSelect');
    const customModelInput  = $('#customModelInput');
    const themeSelect       = $('#themeSelect');
    const saveIaConfigBtn   = $('#saveIaConfigBtn');
    const clearIaConfigBtn  = $('#clearIaConfigBtn');
    const iaStatus          = $('#iaStatus');
    const settingsBtn       = $('#toggleSettingsBtn');

    // Config de voz extra (arquivo JSON opcional)
    let voiceConfig = null;
    let currentVoiceKey = 'default';

    // ==========================
    // MAPA DE ARQUÉTIPOS (detecção simples)
    // ==========================
    const ARCHETYPE_KEYWORDS = {
      Atlas:   ["atlas","mapa","estrutura","organização","organizar","planejamento","estratégia","checklist"],
      Nova:    ["nova","começar","começo","ideia","idéia","visão","criar","protótipo","protótipos","imaginar"],
      Vitalis: ["vitalis","corpo","energia","ritmo","saúde","vitalidade","hidratação","movimento","respiração"],
      Pulse:   ["pulse","pulso","batida","loop","ciclo","ciclos","tempo","ritmo","síncrono","batimento"],
      Artemis: ["artemis","foco","mira","precisão","caçada","explorar","exploração","aventura","alvo"],
      Serena:  ["serena","serenidade","calma","calmo","acolher","acolhimento","paz","tranquilo","tranquilidade"],
      Kaos:    ["kaos","caos","quebrar","desafiar","disrupção","rebelde","subversivo","choque","explosão"],
      Genus:   ["genus","sistema","sistematizar","planilha","tabela","dados","detalhe","detalhado","prático"],
      Lumine:  ["lumine","luz","alegria","brincar","lúdico","brincadeira","brilho","colorido"],
      Rhea:    ["rhea","profundo","profundidade","conexão","conectivo","raízes","intimidade","vínculo"],
      Solus:   ["solus","solidão","silêncio","meditação","contemplar","sabedoria","contemplativo","introspecção"],
      Aion:    ["aion","tempo","futuro","linha do tempo","timeline","cíclico","eterno","infinito"],
      KOBLLUX: ["kobllux","kobllux.","kob","nó raiz","núcleo do sistema","portal","oráculo","meta-sistema"],
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

    function detectArchetypeFromText(text) {
      const low = (text || '').toLowerCase();
      for (const [arch, keys] of Object.entries(ARCHETYPE_KEYWORDS)) {
        if (keys.some(k => low.includes(k))) return arch;
      }
      return null;
    }

    // ==========================
    // THEME HELPER
    // ==========================
    function applyUiTheme(theme) {
      const root = document.documentElement;
      const body = document.body;
      const t = theme || 'dark';

      localStorage.setItem(STORAGE.THEME, t);
      body.setAttribute('data-theme', t);

      if (t === 'dark') {
        root.style.setProperty('--bg', '#050811');
      } else if (t === 'vibe') {
        root.style.setProperty('--bg', '#09051a');
      } else if (t === 'medium') {
        root.style.setProperty('--bg', '#080a12');
      }
    }

    function cycleTheme() {
      const current = localStorage.getItem(STORAGE.THEME) || 'dark';
      const order = ['dark','vibe','medium'];
      const idx = order.indexOf(current);
      const next = order[(idx + 1) % order.length];
      themeSelect.value = next;
      applyUiTheme(next);
    }

    // ==========================
    // TTS · FALA
    // ==========================
    function stopSpeaking() {
      if (!synth) return;
      try {
        synth.cancel();
      } catch(e){}
      currentUtterance = null;
      voiceBtn.classList.remove('speaking');
    }

    function speak(text, archHint) {
      if (!synth || !text) return;
      stopSpeaking();

      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'pt-BR';

      // Se tiver config de voz por arquétipo (arquivo JSON), tenta aplicar
      if (voiceConfig && archHint && voiceConfig[archHint]) {
        const cfg = voiceConfig[archHint];
        const vMatch = (availableVoices || []).find(v => v.name && v.name.includes(cfg.voice || ''));
        if (vMatch) u.voice = vMatch;
        if (cfg.rate)  u.rate  = cfg.rate;
        if (cfg.pitch) u.pitch = cfg.pitch;
      }

      // Hooks KOBLLUX já vão ajustar voz/tema via patches que você colou acima
      u.onstart = () => {
        voiceBtn.classList.add('speaking');
      };
      u.onend = u.onerror = () => {
        voiceBtn.classList.remove('speaking');
        currentUtterance = null;
      };

      currentUtterance = u;
      synth.speak(u);
    }

    // ==========================
    // RENDER · BLOCO
    // ==========================
    function mdToHtml(chunk) {
      if (!chunk) return '';

      // Escapa básico
      let text = chunk.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

      const lines = text.split('\n');
      const out = [];
      let inTabelista = false;
      let tblRows = [];

      const flushTabelista = () => {
        if (!inTabelista || !tblRows.length) return;
        const head = tblRows[0] || '';
        const sub  = tblRows[1] || '';
        const bodyRows = tblRows.slice(2);

        out.push('<div class="md-tabelista">');
        if (head) out.push('<div class="tbl-head">'+head+'</div>');
        if (sub)  out.push('<div class="tbl-sub">'+sub+'</div>');
        if (bodyRows.length){
          out.push('<ul>');
          bodyRows.forEach(row=>{
            const cols = row.split('|').map(c=>c.trim());
            if (!cols[0]) return;
            out.push(
              '<li>' +
                '<span class="tbl-col1">'+cols[0]+'</span>' +
                (cols[1] ? ' | <span class="tbl-col2">'+cols[1]+'</span>' : '') +
                (cols[2] ? ' | <span class="tbl-col3">'+cols[2]+'</span>' : '') +
              '</li>'
            );
          });
          out.push('</ul>');
        }
        out.push('</div>');
        inTabelista = false;
        tblRows = [];
      };

      for (let raw of lines) {
        const line = raw.trim();

        // Tabelista: se linha tiver 2+ " | "
        if (/\|/.test(line)) {
          inTabelista = true;
          tblRows.push(line);
          continue;
        } else {
          flushTabelista();
        }

        if (!line) {
          out.push('<p></p>');
          continue;
        }

        if (line.startsWith('### ')) {
          out.push('<h3>'+line.slice(4)+'</h3>');
          continue;
        }
        if (line.startsWith('## ')) {
          out.push('<h2>'+line.slice(3)+'</h2>');
          continue;
        }
        if (line.startsWith('# ')) {
          out.push('<h1>'+line.slice(2)+'</h1>');
          continue;
        }

        const calloutMatch = line.match(/^::(info|warn|success|question|aside)\s+(.*)$/i);
        if (calloutMatch) {
          const type = calloutMatch[1].toLowerCase();
          const content = calloutMatch[2];
          out.push('<div class="lv-callout lv-'+type+'">'+content+'</div>');
          continue;
        }

        const btnMatch = line.match(/^\[\[btn:(.+?)\|(.+?)\]\]$/);
        if (btnMatch) {
          const action = btnMatch[1].trim();
          const label  = btnMatch[2].trim();
          out.push('<button class="lv-btn" data-btn-action="'+action+'">'+label+'</button>');
          continue;
        }

        out.push('<p>'+line.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')+'</p>');
      }

      flushTabelista();
      return out.join('\n');
    }

    function createResponseBlock(text, opts={}) {
      const role = opts.role || 'assistant';
      const position = opts.position || 'middle';

      const block = document.createElement('div');
      block.classList.add('response-block');
      block.dataset.role = role;

      if (role === 'user') {
        block.classList.add('user-pulse');
      } else {
        if (position === 'intro') block.classList.add('intro');
        else if (position === 'ending') block.classList.add('ending');
        else block.classList.add('middle');
      }

      block.dataset.raw = text;

      const arch = detectArchetypeFromText(text);
      if (arch) {
        const badge = document.createElement('span');
        badge.className = 'archetype-badge';
        badge.textContent = arch;
        block.appendChild(badge);
      }

      const inner = document.createElement('div');
      inner.innerHTML = mdToHtml(text);
      block.appendChild(inner);

      const ttsBtn = document.createElement('button');
      ttsBtn.className = 'block-tts-btn';
      ttsBtn.type = 'button';
      ttsBtn.textContent = '◎';
      ttsBtn.addEventListener('click', (ev)=>{
        ev.stopPropagation();
        speak(block.dataset.raw || block.innerText || '', arch);
      });
      block.appendChild(ttsBtn);

      block.addEventListener('click', ()=>{
        block.classList.add('clicked');
        setTimeout(()=> block.classList.remove('clicked'), 350);
        // Single click → falar
        speak(block.dataset.raw || block.innerText || '', arch);
      });

      block.addEventListener('dblclick', (ev)=>{
        ev.preventDefault();
        ev.stopPropagation();
        // Double click → reenviar como pergunta
        const textToSend = (block.dataset.raw || '').trim();
        if (textToSend) {
          userInput.value = textToSend;
          handleSend();
        }
      });

      responseList.appendChild(block);
      responseContainer.scrollTop = responseContainer.scrollHeight;
      return block;
    }

    function splitAndRenderAssistant(text) {
      if (!text) return;
      const parts = text.split(/\n{2,}/).map(p=>p.trim()).filter(Boolean);
      if (!parts.length) {
        createResponseBlock(text, { role:'assistant', position:'middle' });
        return;
      }
      parts.forEach((chunk, idx)=>{
        let pos = 'middle';
        if (idx === 0) pos = 'intro';
        if (idx === parts.length - 1) pos = 'ending';
        createResponseBlock(chunk, { role:'assistant', position:pos });
      });
    }

    function getLastBlock() {
      const blocks = $$('.response-block');
      return blocks.length ? blocks[blocks.length-1] : null;
    }

    // ==========================
    // STORAGE & LOGIN
    // ==========================
    function loadConfigFromStorage() {
      const key   = localStorage.getItem(STORAGE.OPENROUTER_KEY) || '';
      const model = localStorage.getItem(STORAGE.OPENROUTER_MODEL) || DEFAULTS.MODEL;
      const theme = localStorage.getItem(STORAGE.THEME) || 'dark';

      CONFIG.AUTH_TOKEN = key;
      CONFIG.MODEL = model;

      apiKeyInput.value = key ? '••••••••••••••••' : '';
      themeSelect.value = theme;
      applyUiTheme(theme);

      if (modelSelect.querySelector(`option[value="${model}"]`)) {
        modelSelect.value = model;
        customModelInput.value = '';
      } else {
        modelSelect.value = 'custom';
        customModelInput.value = model;
      }

      if (key) {
        iaStatus.textContent = 'Chave carregada do armazenamento local.';
        iaStatus.className = 'ia-status ok';
      } else {
        iaStatus.textContent = 'Nenhuma chave salva ainda.';
        iaStatus.className = 'ia-status warn';
      }

      try {
        const vcRaw = localStorage.getItem(STORAGE.VOICE_CONFIG);
        if (vcRaw) {
          voiceConfig = JSON.parse(vcRaw);
        }
      } catch(e){ voiceConfig = null; }

      currentVoiceKey = localStorage.getItem(STORAGE.VOICE_CURRENT_KEY) || 'default';

      const enabled = localStorage.getItem(STORAGE.ENABLED) === '1';
      const userName = localStorage.getItem(STORAGE.USER_NAME) || '';
      const assistantName = localStorage.getItem(STORAGE.ASSISTANT_NAME) || 'Dual.Infodose';

      if (enabled && userName && assistantName) {
        assistantNameEl.textContent = `${assistantName} · Cinemático`;
        userInput.placeholder = `Diga algo para ${assistantName}.`;
        userNameInput.value = userName;
        assistantInput.value = assistantName;
      } else {
        setTimeout(()=> loginBox.classList.add('active'), 600);
      }
    }

    function saveIaConfig() {
      let key = apiKeyInput.value.trim();
      if (key === '••••••••••••••••') {
        key = localStorage.getItem(STORAGE.OPENROUTER_KEY) || '';
      }
      const selModel = modelSelect.value;
      let model = selModel === 'custom'
        ? (customModelInput.value.trim() || DEFAULTS.MODEL)
        : selModel;

      CONFIG.AUTH_TOKEN = key;
      CONFIG.MODEL = model;

      if (key) localStorage.setItem(STORAGE.OPENROUTER_KEY, key);
      else localStorage.removeItem(STORAGE.OPENROUTER_KEY);

      localStorage.setItem(STORAGE.OPENROUTER_MODEL, model);

      const theme = themeSelect.value || 'dark';
      applyUiTheme(theme);

      iaStatus.textContent = key
        ? `Config salva. Modelo: ${model}.`
        : 'Modelo salvo, mas ainda falta a chave.';
      iaStatus.className = key ? 'ia-status ok' : 'ia-status warn';
    }

    function clearIaConfig() {
      CONFIG.AUTH_TOKEN = '';
      CONFIG.MODEL = DEFAULTS.MODEL;

      apiKeyInput.value = '';
      customModelInput.value = '';
      modelSelect.value = DEFAULTS.MODEL;

      localStorage.removeItem(STORAGE.OPENROUTER_KEY);
      localStorage.removeItem(STORAGE.OPENROUTER_MODEL);

      iaStatus.textContent = 'Configuração limpa. Use o painel para salvar novamente.';
      iaStatus.className = 'ia-status warn';
    }

    function handleLoginSubmit(ev) {
      ev.preventDefault();
      const name = userNameInput.value.trim();
      const asst = assistantInput.value.trim() || 'Dual.Infodose';

      if (!name) return;

      localStorage.setItem(STORAGE.ENABLED, '1');
      localStorage.setItem(STORAGE.USER_NAME, name);
      localStorage.setItem(STORAGE.ASSISTANT_NAME, asst);

      assistantNameEl.textContent = `${asst} · Cinemático`;
      userInput.placeholder = `Diga algo para ${asst}.`;

      loginBox.classList.remove('active');

      const hi = `Ativação concluída.\n\nNome detectado: **${name}**.\nAssistente base: **${asst}**.\n\n::info Comece com uma pergunta simples sobre o seu dia ou peça uma leitura simbólica 3·6·9.`;
      splitAndRenderAssistant(hi);
      speak(`Bem-vindo, ${name}. ${asst} foi ativado para caminhar com você.`, 'Infodose');
    }

    // ==========================
    // OPENROUTER
    // ==========================
    function buildSystemPrompt() {
      const userName = localStorage.getItem(STORAGE.USER_NAME) || 'humano';
      const asstName = localStorage.getItem(STORAGE.ASSISTANT_NAME) || 'Dual.Infodose';

      return [
        `${asstName} é o assistente Cinemático da Infodose, especializado em respostas em blocos.`,
        `1. Responda em português por padrão.`,
        `2. Use blocos curtos, com títulos, listas e callouts (::info, ::warn, ::success, ::question, ::aside) quando fizer sentido.`,
        `3. Tudo que você responder será renderizado como blocos clicáveis. Cada parágrafo separado por linha vazia vira um bloco.`,
        `4. Priorize explicações práticas, exemplos e micro-ações de 1%.`,
        `5. Quando fizer sentido, use Tabelista (linhas com "|") para estruturar comparações.`,
        `6. Não peça chave de API; assuma que a infraestrutura já está pronta do lado do usuário.`,
        `7. O usuário se chama ${userName}; fale com ele pelo nome algumas vezes, mas sem exagero.`
      ].join('\n');
    }

    async function callOpenRouter(userContent) {
      const apiKey = CONFIG.AUTH_TOKEN;
      if (!apiKey) {
        const msg = 'Para falar com a IA externa, você precisa salvar uma chave OpenRouter no painel de configuração.';
        splitAndRenderAssistant(`::warn Chave OpenRouter não encontrada.\n\n${msg}`);
        return;
      }

      const sys = buildSystemPrompt();

      const payload = {
        model: CONFIG.MODEL || DEFAULTS.MODEL,
        temperature: CONFIG.TEMP,
        messages: [
          { role:'system', content: sys },
          ...conversation,
          { role:'user', content: userContent }
        ],
        max_tokens: 1200
      };

      try {
        const res = await fetch(CONFIG.API_URL, {
          method:'POST',
          headers:{
            'Content-Type':'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': 'https://infodose.com.br',
            'X-Title':'Dual-Infodose Chat Cinemático'
          },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const txt = await res.text().catch(()=> '');
          throw new Error(`HTTP ${res.status} – ${txt.slice(0,200)}`);
        }

        const data = await res.json();
        const choice = data?.choices?.[0];
        const content = choice?.message?.content || '';

        if (!content) {
          splitAndRenderAssistant('::warn A IA respondeu vazio. Tente reformular a pergunta ou verificar a configuração.');
          return;
        }

        conversation.push({ role:'assistant', content });
        splitAndRenderAssistant(content);
        speak(content, null);

      } catch (err) {
        console.error('Erro OpenRouter:', err);
        splitAndRenderAssistant(
          '::warn Erro ao falar com a IA externa.\n\n' +
          'Tente novamente em alguns segundos ou revise a chave/modelo no painel.'
        );
      }
    }

    // ==========================
    // ENVIO DE MENSAGEM
    // ==========================
    function handleSend() {
      const text = userInput.value.trim();
      if (!text) return;

      if (bootBlock) {
        bootBlock.remove();
      }

      userInput.value = '';

      createResponseBlock(text, { role:'user', position:'middle' });

      conversation.push({ role:'user', content:text });

      // Se não tiver chave, já dá resposta local
      if (!CONFIG.AUTH_TOKEN) {
        const local = [
          '::info Modo local ativo (sem OpenRouter).',
          '',
          'Você pode:',
          '- Abrir o painel de configuração (ícone de engrenagem) e salvar uma chave OpenRouter;',
          '- Ou simplesmente usar esse chat como um diário simbólico, clicando nos blocos para ouvir e reenviar.'
        ].join('\n');
        splitAndRenderAssistant(local);
        return;
      }

      callOpenRouter(text);
    }

    // ==========================
    // BOTÕES & EVENTOS
    // ==========================
    function initEvents() {
      sendBtn.addEventListener('click', handleSend);
      userInput.addEventListener('keydown', ev=>{
        if (ev.key === 'Enter' && !ev.shiftKey) {
          ev.preventDefault();
          handleSend();
        }
      });

      footerHint.addEventListener('click', ()=>{
        responseContainer.classList.toggle('collapsed');
      });

      copyBtn.addEventListener('click', async ()=>{
        const last = getLastBlock();
        if (!last) return;
        const text = last.dataset.raw || last.innerText || '';
        try {
          await navigator.clipboard.writeText(text);
          footerHint.innerHTML = '<span class="footer-dot"></span>Texto copiado. Toque de novo para recolher/expandir.';
          setTimeout(()=>{
            footerHint.innerHTML = '<span class="footer-dot"></span>Do seu jeito. Sempre único. Sempre seu.';
          }, 1800);
        } catch(e) {
          console.warn('Clipboard fail', e);
        }
      });

      pasteBtn.addEventListener('click', async ()=>{
        try {
          const text = await navigator.clipboard.readText();
          if (text) userInput.value = text;
        } catch(e) {
          console.warn('Clipboard read fail', e);
        }
      });

      parserBtn.addEventListener('click', ()=>{
        parserFile.click();
      });

      parserFile.addEventListener('change', ()=>{
        const file = parserFile.files?.[0];
        if (!file) return;
        const ext = (file.name.split('.').pop() || '').toLowerCase();
        const reader = new FileReader();
        reader.onload = e=>{
          const content = String(e.target.result || '');
          if (ext === 'js') {
            try {
              (0,eval)(content);
              splitAndRenderAssistant('::success Parser JS carregado. O próximo texto pode usar esse novo renderizador.');
            } catch(err) {
              console.error(err);
              splitAndRenderAssistant('::warn Falha ao carregar parser JS. Veja o console do navegador.');
            }
          } else if (ext === 'css') {
            const style = document.createElement('style');
            style.textContent = content;
            document.head.appendChild(style);
            splitAndRenderAssistant('::success CSS extra aplicado para os blocos do Livro Vivo.');
          }
        };
        reader.readAsText(file);
        parserFile.value = '';
      });

      voiceConfigBtn.addEventListener('click', ()=>{
        voiceConfigFile.click();
      });

      voiceConfigFile.addEventListener('change', ()=>{
        const file = voiceConfigFile.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = e=>{
          try {
            voiceConfig = JSON.parse(String(e.target.result || '{}'));
            localStorage.setItem(STORAGE.VOICE_CONFIG, JSON.stringify(voiceConfig));
            splitAndRenderAssistant('::success Configuração de vozes por arquétipo carregada.');
          } catch(err) {
            console.error(err);
            splitAndRenderAssistant('::warn JSON inválido na configuração de vozes.');
          }
        };
        reader.readAsText(file);
        voiceConfigFile.value = '';
      });

      voiceBtn.addEventListener('click', ()=>{
        if (voiceBtn.classList.contains('speaking')) {
          stopSpeaking();
          return;
        }
        const last = getLastBlock();
        if (!last) return;
        const arch = detectArchetypeFromText(last.dataset.raw || last.innerText || '');
        speak(last.dataset.raw || last.innerText || '', arch);
      });

      settingsBtn.addEventListener('click', ()=>{
        iaConfigPanel.classList.toggle('active');
      });

      saveIaConfigBtn.addEventListener('click', saveIaConfig);
      clearIaConfigBtn.addEventListener('click', clearIaConfig);

      themeSelect.addEventListener('change', ()=>{
        applyUiTheme(themeSelect.value);
      });

      themeToggleBtn.addEventListener('click', cycleTheme);

      toggleLoginBtn.addEventListener('click', ()=>{
        loginBox.classList.toggle('active');
      });

      loginForm.addEventListener('submit', handleLoginSubmit);
    }

    // ==========================
    // PARTICLES.JS
    // ==========================
    function initParticles() {
      if (typeof particlesJS === 'undefined') return;
      particlesJS('particles-js',{
        particles:{
          number:{ value:60, density:{ enable:true, value_area:800 } },
          color:{ value:'#00f5ff' },
          shape:{ type:'circle' },
          opacity:{ value:0.35, random:true },
          size:{ value:3, random:true },
          line_linked:{
            enable:true,
            distance:150,
            color:'#00f5ff',
            opacity:0.2,
            width:1
          },
          move:{
            enable:true,
            speed:1.2,
            direction:'none',
            random:true,
            straight:false,
            out_mode:'out',
            bounce:false
          }
        },
        interactivity:{
          detect_on:'canvas',
          events:{
            onhover:{ enable:true, mode:'repulse' },
            onclick:{ enable:false, mode:'push' },
            resize:true
          },
          modes:{
            repulse:{ distance:120, duration:0.4 }
          }
        },
        retina_detect:true
      });
    }

    // ==========================
    // BOOT
    // ==========================
    function boot() {
      initParticles();
      initEvents();
      loadConfigFromStorage();

      if (bootText) {
        bootText.classList.add('pulse');
        setTimeout(()=> bootText.classList.remove('pulse'), 4200);
      }
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', boot);
    } else {
      boot();
    }

  })();
  </script>