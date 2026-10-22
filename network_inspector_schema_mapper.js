(function () {
    'use strict';

    // Usunięcie ewentualnych poprzednich instancji panelu
    const oldPanel = document.getElementById('custom-helper-panel');
    if (oldPanel) oldPanel.remove();
    const oldFab = document.getElementById('inspector-mobile-fab');
    if (oldFab) oldFab.remove();
    const oldModal = document.getElementById('inspector-auth-modal');
    if (oldModal) oldModal.remove();

    // Główny magazyn stanu
    window._capturedPayloads = window._capturedPayloads || [];
    window._resolvedAnswers = window._resolvedAnswers || [];

    // --- KROK 1: Ekran autoryzacji PIN (Brak wyskakujących alertów przeglądarki) ---
    const authOverlay = document.createElement('div');
    authOverlay.id = 'inspector-auth-modal';
    authOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(4, 7, 10, 0.85);
        backdrop-filter: blur(4px);
        z-index: 2147483647;
        display: flex;
        justify-content: center;
        align-items: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    authOverlay.innerHTML = `
        <div style="background: #0d1217; border: 2px solid #00e5ff; border-radius: 12px; padding: 22px; width: 320px; max-width: 90vw; color: #eceff1; box-shadow: 0 10px 35px rgba(0, 229, 255, 0.25); text-align: center; box-sizing: border-box;">
            <div style="font-size: 24px; margin-bottom: 6px;">🔬</div>
            <h3 style="margin: 0 0 6px 0; font-size: 16px; color: #00e5ff; font-weight: bold;">Inspector & Quiz Hub</h3>
            <p style="font-size: 11px; color: #90a4ae; margin-bottom: 14px; line-height: 1.4;">
                Wprowadź kod dostępu:<br>
                <b>2137</b> = Tryb Desktop (PC)<br>
                <b>2138</b> = Tryb Mobilny (Smartfon)
            </p>
            <input id="auth-pin-input" type="password" maxlength="8" placeholder="Wpisz PIN..." style="width: 100%; box-sizing: border-box; background: #07090c; border: 1px solid #1c2b36; border-radius: 6px; padding: 12px; color: #00e5ff; font-size: 16px; text-align: center; outline: none; margin-bottom: 12px; font-weight: bold; letter-spacing: 2px;" />
            <div id="auth-error-msg" style="color: #ff5252; font-size: 11px; min-height: 16px; margin-bottom: 8px;"></div>
            <button id="auth-submit-btn" style="width: 100%; background: #00e5ff; color: #07090c; border: none; padding: 12px; border-radius: 6px; font-weight: bold; font-size: 13px; cursor: pointer; transition: 0.2s;">
                Uruchom Narzędzie
            </button>
        </div>
    `;
    document.body.appendChild(authOverlay);

    const pinInput = document.getElementById('auth-pin-input');
    const authBtn = document.getElementById('auth-submit-btn');
    const errorMsg = document.getElementById('auth-error-msg');
    pinInput.focus();

    function checkPin() {
        const pin = pinInput.value.trim();
        if (pin === "2137") {
            authOverlay.remove();
            initInspector(false); // Tryb Desktop
        } else if (pin === "2138") {
            authOverlay.remove();
            initInspector(true);  // Dedykowany Tryb Mobilny
        } else {
            errorMsg.textContent = "Błędny kod! Wpisz 2137 lub 2138.";
            pinInput.value = "";
            pinInput.style.borderColor = "#ff5252";
            setTimeout(() => { pinInput.style.borderColor = "#1c2b36"; }, 1000);
        }
    }

    authBtn.onclick = checkPin;
    pinInput.onkeydown = (e) => { if (e.key === 'Enter') checkPin(); };

    // --- KROK 2: Główna Inicjalizacja Narzędzia ---
    function initInspector(isMobile) {
        console.log(`%c[Inspector] Aktywny tryb: ${isMobile ? 'MOBILNY (Smartfon)' : 'DESKTOP (PC)'}`, "color: #00e5ff; font-weight: bold;");

        // Pływający zielony przycisk (FAB) po zminimalizowaniu / ukryciu na telefonie
        const fab = document.createElement('div');
        fab.id = 'inspector-mobile-fab';
        fab.title = 'Dotknij, aby otworzyć panel';
        fab.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 54px;
            height: 54px;
            border-radius: 50%;
            background: #07090c;
            border: 2px solid #00e676;
            color: #00e676;
            box-shadow: 0 0 15px rgba(0, 230, 118, 0.6), 0 4px 15px rgba(0,0,0,0.8);
            z-index: 2147483647;
            display: none;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            cursor: pointer;
            user-select: none;
            touch-action: none;
            animation: pulse-green 2s infinite;
        `;
        fab.innerHTML = `⚡`;
        document.body.appendChild(fab);

        // Dodanie stylu pulsowania dla zielonego przycisku
        if (!document.getElementById('inspector-styles')) {
            const styleTag = document.createElement('style');
            styleTag.id = 'inspector-styles';
            styleTag.textContent = `
                @keyframes pulse-green {
                    0% { box-shadow: 0 0 0 0 rgba(0, 230, 118, 0.7); }
                    70% { box-shadow: 0 0 0 12px rgba(0, 230, 118, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(0, 230, 118, 0); }
                }
            `;
            document.head.appendChild(styleTag);
        }

        // Główny kontener GUI
        const panel = document.createElement('div');
        panel.id = 'custom-helper-panel';
        panel.style.cssText = isMobile ? `
            position: fixed;
            bottom: 12px;
            left: 50%;
            transform: translateX(-50%);
            width: 94vw;
            max-width: 440px;
            height: 65vh;
            max-height: 580px;
            background: #0d1217;
            color: #00e5ff;
            border: 2px solid #00e5ff;
            border-radius: 12px;
            padding: 12px;
            z-index: 2147483647;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            box-shadow: 0 8px 32px rgba(0,0,0,0.9);
            display: flex;
            flex-direction: column;
            user-select: none;
            overflow: hidden;
            box-sizing: border-box;
            touch-action: pan-y;
        ` : `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 390px;
            min-width: 320px;
            min-height: 250px;
            max-width: 90vw;
            max-height: 85vh;
            background: #0d1217;
            color: #00e5ff;
            border: 2px solid #00e5ff;
            border-radius: 8px;
            padding: 12px;
            z-index: 2147483647;
            font-family: 'Segoe UI', Consolas, monospace;
            box-shadow: 0 10px 30px rgba(0,0,0,0.8);
            display: flex;
            flex-direction: column;
            user-select: none;
            overflow: hidden;
            box-sizing: border-box;
        `;

        panel.innerHTML = `
            <div id="inspector-header" style="cursor: move; margin-bottom: 8px; font-size: ${isMobile ? '14px' : '13px'}; font-weight: bold; border-bottom: 1px solid #1c2b36; padding-bottom: 8px; display: flex; justify-content: space-between; align-items: center; touch-action: none;">
                <span style="display: flex; align-items: center; gap: 6px;">
                    <span>🔬 ${isMobile ? 'Mobile Inspector' : 'Inspector & Quiz Hub'}</span>
                    <span style="font-size: 9px; background: #1c2b36; color: #78909c; padding: 2px 5px; border-radius: 3px;">${isMobile ? 'TRYB TELEFON' : '[F2 = Ukryj]'}</span>
                </span>
                <div style="display: flex; gap: ${isMobile ? '14px' : '8px'}; align-items: center;">
                    <span id="inspect-toggle" title="Zminimalizuj" style="cursor: pointer; color: #ffaa00; font-weight: bold; font-size: ${isMobile ? '18px' : '14px'}; padding: 2px 6px;">[-]</span>
                    <span id="inspect-close" title="Zamknij / Schowaj do zielonego guzika" style="cursor: pointer; color: #ff4444; font-weight: bold; font-size: ${isMobile ? '18px' : '14px'}; padding: 2px 6px;">✕</span>
                </div>
            </div>

            <!-- Zakładki -->
            <div id="inspector-tabs" style="display: flex; gap: 4px; margin-bottom: 8px; border-bottom: 1px solid #1c2b36; padding-bottom: 6px;">
                <button id="tab-btn-inspect" style="flex: 1; background: #00e5ff; color: #07090c; border: none; padding: ${isMobile ? '8px 4px' : '5px'}; font-size: ${isMobile ? '12px' : '10px'}; font-weight: bold; cursor: pointer; border-radius: 4px;">Inspektor</button>
                <button id="tab-btn-games" style="flex: 1; background: #1c2b36; color: #eceff1; border: none; padding: ${isMobile ? '8px 4px' : '5px'}; font-size: ${isMobile ? '12px' : '10px'}; font-weight: bold; cursor: pointer; border-radius: 4px;">PIN Gry</button>
                <button id="tab-btn-creator" style="flex: 1; background: #1c2b36; color: #eceff1; border: none; padding: ${isMobile ? '8px 4px' : '5px'}; font-size: ${isMobile ? '12px' : '10px'}; font-weight: bold; cursor: pointer; border-radius: 4px;">Symulator</button>
            </div>

            <!-- Główna zawartość -->
            <div id="inspector-body" style="display: flex; flex-direction: column; gap: 8px; flex: 1; overflow: hidden;">
                <div id="inspector-status" style="font-size: ${isMobile ? '12px' : '11px'}; background: #0a0d11; border: 1px solid #1c2b36; border-radius: 6px; padding: 6px; color: #78909c; flex-shrink: 0;">
                    Status: Gotowy. ${isMobile ? 'Dotknij [-] aby zwinąć w zielony guzik.' : 'F2 = schowaj / pokaż.'}
                </div>

                <!-- Widok 1: Skaner -->
                <div id="view-inspect" style="display: flex; flex-direction: column; gap: 6px; flex: 1; overflow: hidden;">
                    <div id="inspector-log" style="font-size: ${isMobile ? '11px' : '11px'}; flex: 1; overflow-y: auto; background: #07090c; border: 1px solid #1c2b36; border-radius: 6px; padding: 8px; color: #eceff1; -webkit-overflow-scrolling: touch;">
                        Oczekiwanie na pakiety i dane arkuszy...
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; flex-shrink: 0;">
                        <button id="btn-deep-scan" style="background: #ffb300; color: #07090c; border: none; padding: ${isMobile ? '11px 6px' : '7px'}; font-weight: bold; cursor: pointer; border-radius: 6px; font-size: ${isMobile ? '12px' : '11px'};">
                            🔍 Skanuj Pliki & DOM
                        </button>
                        <button id="btn-resolve-fill" style="background: #00e5ff; color: #07090c; border: none; padding: ${isMobile ? '11px 6px' : '7px'}; font-weight: bold; cursor: pointer; border-radius: 6px; font-size: ${isMobile ? '12px' : '11px'};">
                            ⚡ Auto-Fill
                        </button>
                    </div>
                    <button id="btn-clear-log" style="background: #1c2b36; color: #b0bec5; border: 1px solid #37474f; padding: ${isMobile ? '8px' : '4px'}; font-weight: bold; cursor: pointer; border-radius: 6px; font-size: 11px; flex-shrink: 0;">
                        Wyczyść Historię
                    </button>
                </div>

                <!-- Widok 2: ID / PIN Gry -->
                <div id="view-games" style="display: none; flex-direction: column; gap: 6px; flex: 1; overflow-y: auto;">
                    <div style="font-size: 11px; color: #90a4ae;">
                        Wpisz PIN pokoju gry (Kahoot, Quizizz itp.):
                    </div>
                    <div style="display: flex; gap: 4px;">
                        <input id="input-game-pin" type="text" placeholder="PIN lub ID..." style="flex: 1; background: #07090c; border: 1px solid #1c2b36; color: #00e5ff; padding: ${isMobile ? '10px' : '6px'}; font-size: 12px; border-radius: 6px; outline: none;" />
                        <button id="btn-fetch-game" style="background: #00e5ff; color: #07090c; border: none; padding: ${isMobile ? '10px 14px' : '6px 12px'}; font-weight: bold; cursor: pointer; border-radius: 6px; font-size: 12px;">
                            Pobierz
                        </button>
                    </div>
                    <div id="game-results" style="background: #07090c; border: 1px solid #1c2b36; border-radius: 6px; padding: 8px; font-size: 11px; color: #eceff1; flex: 1; overflow-y: auto;">
                        Wpisz identyfikator gry lub zaloguj się do lobby, aby sniffer przechwycił arkusz.
                    </div>
                </div>

                <!-- Widok 3: Generator -->
                <div id="view-creator" style="display: none; flex-direction: column; gap: 6px; flex: 1; overflow-y: auto;">
                    <div style="font-size: 11px; color: #90a4ae;">
                        Wygeneruj test na stronie do sprawdzenia działania:
                    </div>
                    <select id="select-test-type" style="background: #07090c; border: 1px solid #1c2b36; color: #00e5ff; padding: 8px; font-size: 12px; border-radius: 6px;">
                        <option value="it">Quiz: Informatyka i Sieci (3 pytania)</option>
                        <option value="math">Quiz: Logika i Matematyka (3 pytania)</option>
                    </select>
                    <button id="btn-generate-game" style="background: #00e676; color: #07090c; border: none; padding: ${isMobile ? '11px' : '8px'}; font-weight: bold; cursor: pointer; border-radius: 6px; font-size: 12px;">
                        ⚡ Stwórz Test na Stronie
                    </button>
                    <button id="btn-remove-sim-test" style="background: #263238; color: #ff5252; border: 1px solid #37474f; padding: 6px; font-weight: bold; cursor: pointer; border-radius: 6px; font-size: 11px;">
                        Usuń Test ze Strony
                    </button>
                </div>
            </div>

            <!-- Uchwyt zmiany rozmiaru (widoczny w trybie PC) -->
            ${!isMobile ? `
                <div id="inspector-resizer" title="Zmień rozmiar" style="position: absolute; right: 2px; bottom: 2px; width: 14px; height: 14px; cursor: se-resize; display: flex; align-items: flex-end; justify-content: flex-end; color: #00e5ff; font-size: 10px; opacity: 0.7;">
                    ◢
                </div>
            ` : ''}
        `;
        document.body.appendChild(panel);

        // --- ZWIJANIE / MINIMALIZACJA I ZIELONY GUZIK (FAB) ---
        function minimizeToFab() {
            panel.style.display = 'none';
            fab.style.display = 'flex';
        }

        function restoreFromFab() {
            fab.style.display = 'none';
            panel.style.display = 'flex';
        }

        fab.onclick = restoreFromFab;
        fab.ontouchend = (e) => {
            e.preventDefault();
            restoreFromFab();
        };

        const toggleBtn = document.getElementById('inspect-toggle');
        const closeBtn = document.getElementById('inspect-close');

        toggleBtn.onclick = () => {
            if (isMobile) {
                minimizeToFab();
            } else {
                const bodyC = document.getElementById('inspector-body');
                const tabs = document.getElementById('inspector-tabs');
                const isMini = bodyC.style.display === 'none';
                bodyC.style.display = isMini ? 'flex' : 'none';
                tabs.style.display = isMini ? 'flex' : 'none';
                panel.style.height = isMini ? '380px' : 'auto';
                toggleBtn.textContent = isMini ? '[-]' : '[+]';
            }
        };

        closeBtn.onclick = () => {
            minimizeToFab();
        };

        // Klawisz F2 dla PC
        window.addEventListener('keydown', (e) => {
            if (e.key === 'F2' || e.key === 'Insert') {
                e.preventDefault();
                if (panel.style.display === 'none') {
                    restoreFromFab();
                } else {
                    minimizeToFab();
                }
            }
        });

        // Zakładki nawigacyjne
        const tabInspect = document.getElementById('tab-btn-inspect');
        const tabGames = document.getElementById('tab-btn-games');
        const tabCreator = document.getElementById('tab-btn-creator');
        const viewInspect = document.getElementById('view-inspect');
        const viewGames = document.getElementById('view-games');
        const viewCreator = document.getElementById('view-creator');

        function switchTab(btn, view) {
            [tabInspect, tabGames, tabCreator].forEach(b => {
                b.style.background = '#1c2b36';
                b.style.color = '#eceff1';
            });
            [viewInspect, viewGames, viewCreator].forEach(v => v.style.display = 'none');
            btn.style.background = '#00e5ff';
            btn.style.color = '#07090c';
            view.style.display = 'flex';
        }

        tabInspect.onclick = () => switchTab(tabInspect, viewInspect);
        tabGames.onclick = () => switchTab(tabGames, viewGames);
        tabCreator.onclick = () => switchTab(tabCreator, viewCreator);

        // --- OBSŁUGA PRZECIĄGANIA MYSZKĄ I DOTYKIEM ---
        const header = document.getElementById('inspector-header');
        let isMoving = false, startX = 0, startY = 0, initLeft = 0, initTop = 0;

        function onDragStart(clientX, clientY, target) {
            if (target.id === 'inspect-toggle' || target.id === 'inspect-close') return;
            isMoving = true;
            startX = clientX;
            startY = clientY;
            const rect = panel.getBoundingClientRect();
            initLeft = rect.left;
            initTop = rect.top;
            panel.style.bottom = 'auto';
            panel.style.right = 'auto';
            panel.style.left = `${initLeft}px`;
            panel.style.top = `${initTop}px`;
            panel.style.transform = 'none';
        }

        function onDragMove(clientX, clientY) {
            if (!isMoving) return;
            const nextL = Math.max(5, Math.min(window.innerWidth - panel.offsetWidth - 5, initLeft + (clientX - startX)));
            const nextT = Math.max(5, Math.min(window.innerHeight - panel.offsetHeight - 5, initTop + (clientY - startY)));
            panel.style.left = `${nextL}px`;
            panel.style.top = `${nextT}px`;
        }

        header.addEventListener('mousedown', (e) => onDragStart(e.clientX, e.clientY, e.target));
        window.addEventListener('mousemove', (e) => onDragMove(e.clientX, e.clientY));
        window.addEventListener('mouseup', () => { isMoving = false; });

        // Dotyk (Touch) dla telefonów
        header.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            onDragStart(touch.clientX, touch.clientY, e.target);
        }, { passive: true });

        window.addEventListener('touchmove', (e) => {
            if (!isMoving) return;
            const touch = e.touches[0];
            onDragMove(touch.clientX, touch.clientY);
        }, { passive: true });

        window.addEventListener('touchend', () => { isMoving = false; });

        // Rozciąganie za róg (PC)
        const resizer = document.getElementById('inspector-resizer');
        if (resizer) {
            let isResizing = false, rStartX = 0, rStartY = 0, initW = 0, initH = 0;
            resizer.addEventListener('mousedown', (e) => {
                isResizing = true;
                rStartX = e.clientX;
                rStartY = e.clientY;
                initW = panel.offsetWidth;
                initH = panel.offsetHeight;
                e.preventDefault();
                e.stopPropagation();
            });
            window.addEventListener('mousemove', (e) => {
                if (!isResizing) return;
                panel.style.width = `${Math.max(280, initW + (e.clientX - rStartX))}px`;
                panel.style.height = `${Math.max(200, initH + (e.clientY - rStartY))}px`;
            });
            window.addEventListener('mouseup', () => { isResizing = false; });
        }

        // --- LOGOWANIE I STATUS ---
        const logDiv = document.getElementById('inspector-log');
        const statusDiv = document.getElementById('inspector-status');

        function notifyStatus(msg, isOk = true) {
            statusDiv.innerHTML = `<span style="color: ${isOk ? '#00e676' : '#ff5252'}; font-weight: bold;">${msg}</span>`;
        }

        function logEntry(src, info, count) {
            const item = document.createElement('div');
            item.style.cssText = "margin-bottom: 5px; border-bottom: 1px solid #1c2b36; padding-bottom: 4px; word-break: break-all;";
            item.innerHTML = `
                <span style="color: #00e5ff; font-weight: bold;">[${src}]</span> 
                <span style="color: #78909c;">${info.substring(0, 32)}...</span><br>
                <span style="color: ${count > 0 ? '#00e676' : '#ff9100'}; font-weight: bold;">
                    ${count > 0 ? `✓ Wykryto odpowiedzi: ${count}` : 'ℹ Przechwycono dane'}
                </span>
            `;
            logDiv.appendChild(item);
            logDiv.scrollTop = logDiv.scrollHeight;
        }

        document.getElementById('btn-clear-log').onclick = () => {
            logDiv.innerHTML = "Wyczyszczono historię.";
            notifyStatus("Brak danych.");
            window._capturedPayloads = [];
            window._resolvedAnswers = [];
        };

        // --- SKANOWANIE STRUKTUR ---
        const BOOLEAN_KEYS = ['iscorrect', 'correct', 'is_correct', 'right', 'valid', 'isright', 'poprawna', 'prawidlowa'];
        const ID_KEYS = ['correctanswerid', 'correct_answer_id', 'correctoptionid', 'correct_id', 'right_id', 'solution_id', 'key'];

        function sanitizeText(str) {
            if (!str || typeof str !== 'string') return null;
            const cleaned = str.replace(/<[^>]*>/g, '').trim();
            if (cleaned.length < 2 || cleaned.length > 250) return null;
            return cleaned;
        }

        function deepAnalyzePayload(root, src = "PAYLOAD") {
            if (!root || typeof root !== 'object') return [];
            const results = [];
            const idMap = new Map();
            const visited = new WeakSet();

            function mapIds(node) {
                if (!node || typeof node !== 'object' || visited.has(node)) return;
                visited.add(node);
                const id = node.id || node.option_id || node.uuid || node.key;
                const txt = node.text || node.title || node.content || node.label || node.answer || node.value;
                if (id && typeof txt === 'string') {
                    const clean = sanitizeText(txt);
                    if (clean) idMap.set(String(id), clean);
                }
                for (const k of Object.keys(node)) {
                    if (typeof node[k] === 'object') mapIds(node[k]);
                }
            }
            mapIds(root);

            function scan(node, parent) {
                if (!node || typeof node !== 'object') return;
                for (const k of Object.keys(node)) {
                    const low = k.toLowerCase();
                    const val = node[k];

                    if (BOOLEAN_KEYS.includes(low) && (val === true || val === 1 || String(val) === 'true')) {
                        const txt = sanitizeText(node.text || node.content || node.title || node.label || node.answer || parent?.text);
                        if (txt) {
                            results.push({ text: txt, conf: '100%', src });
                        } else if (node.id && idMap.has(String(node.id))) {
                            results.push({ text: idMap.get(String(node.id)), conf: '100%', src });
                        }
                    }

                    if (ID_KEYS.includes(low) && val !== null && val !== undefined) {
                        const res = idMap.get(String(val));
                        if (res) results.push({ text: res, conf: '95%', src });
                    }

                    if (typeof val === 'object') scan(val, node);
                }
            }
            scan(root, null);
            return results;
        }

        function registerAnswer(ans) {
            if (!ans || !ans.text) return;
            if (!window._resolvedAnswers.some(a => a.text.toLowerCase() === ans.text.toLowerCase())) {
                window._resolvedAnswers.push(ans);
            }
        }

        // Głęboki skan plików, skryptów i DOM
        document.getElementById('btn-deep-scan').onclick = () => {
            notifyStatus("Skanowanie skryptów i pamięci strony...");
            let found = 0;

            document.querySelectorAll('script').forEach((s, idx) => {
                const c = s.textContent || s.innerText;
                if (c && c.includes('{') && (c.includes('question') || c.includes('answer') || c.includes('correct'))) {
                    try {
                        const m = c.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
                        if (m && m[0]) {
                            const res = deepAnalyzePayload(JSON.parse(m[0]), `SCRIPT_${idx}`);
                            res.forEach(a => registerAnswer(a));
                            found += res.length;
                        }
                    } catch {}
                }
            });

            [localStorage, sessionStorage].forEach((storage, sIdx) => {
                const sName = sIdx === 0 ? "LOCAL" : "SESSION";
                for (let i = 0; i < storage.length; i++) {
                    const key = storage.key(i);
                    try {
                        const res = deepAnalyzePayload(JSON.parse(storage.getItem(key)), `${sName}:${key}`);
                        res.forEach(a => registerAnswer(a));
                        found += res.length;
                    } catch {}
                }
            });

            document.querySelectorAll('[data-correct="true"], [data-is-correct="true"]').forEach(el => {
                const t = sanitizeText(el.innerText || el.getAttribute('data-answer'));
                if (t) {
                    registerAnswer({ text: t, conf: '100%', src: 'DOM_ATTR' });
                    found++;
                }
            });

            logEntry("DEEP_SCAN", "Pliki / Skrypty / DOM", found);
            notifyStatus(`Aktywnych odpowiedzi: ${window._resolvedAnswers.length}`);
        };

        // --- POBIERANIE PO PIN ---
        document.getElementById('btn-fetch-game').onclick = async () => {
            const pin = document.getElementById('input-game-pin').value.trim();
            const resBox = document.getElementById('game-results');
            if (!pin) {
                notifyStatus("Wpisz kod PIN!", false);
                return;
            }
            resBox.innerHTML = `<span style="color: #ffaa00;">Sprawdzanie bazy dla PIN ${pin}...</span>`;
            
            try {
                const endpoints = [
                    `https://play.kahoot.it/rest/kahoots/${pin}`,
                    `https://quizizz.com/api/main/game/${pin}`
                ];
                let success = false;
                for (const ep of endpoints) {
                    try {
                        const r = await fetch(ep);
                        if (r.ok) {
                            const d = await r.json();
                            const ans = deepAnalyzePayload(d, `API_${pin}`);
                            ans.forEach(a => registerAnswer(a));
                            success = true;
                        }
                    } catch {}
                }

                if (success) {
                    resBox.innerHTML = `<div style="color: #00e676;">✓ Odnaleziono arkusz dla PIN ${pin}!</div>Odpowiedzi dodane do bazy Auto-Fill.`;
                    notifyStatus(`Zaindeksowano PIN ${pin}`);
                } else {
                    resBox.innerHTML = `<div style="color: #ff9100;">Brak publicznego arkusza dla PIN: ${pin}. Wejdź do gry, a pakiety zostaną przechwycone na żywo.</div>`;
                    notifyStatus("Brak publicznego pliku", false);
                }
            } catch {
                resBox.innerHTML = `<div style="color: #ff5252;">Błąd sieci.</div>`;
            }
        };

        // --- GENERATOR TESTU ---
        document.getElementById('btn-generate-game').onclick = () => {
            const old = document.getElementById('simulated-quiz-modal');
            if (old) old.remove();

            const type = document.getElementById('select-test-type').value;
            const container = document.createElement('div');
            container.id = 'simulated-quiz-modal';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                width: 92vw;
                max-width: 480px;
                max-height: 80vh;
                background: #ffffff;
                color: #111;
                border-radius: 10px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                border: 2px solid #00e5ff;
                z-index: 2147483640;
                padding: 16px;
                font-family: -apple-system, sans-serif;
                overflow-y: auto;
            `;

            const data = type === 'math' ? [
                { q: "Ile to jest 15% z 200?", opts: ["20", "25", "30", "35"], corr: 2 },
                { q: "Rozwiąż: 2x + 6 = 18. Ile to x?", opts: ["4", "6", "8", "10"], corr: 1 },
                { q: "Pierwiastek kwadratowy ze 144 to:", opts: ["11", "12", "14", "16"], corr: 1 }
            ] : [
                { q: "Standardowy port HTTPS to:", opts: ["21", "80", "443", "8080"], corr: 2 },
                { q: "Format danych najpopularniejszy w REST API:", opts: ["XML", "JSON", "CSV", "YAML"], corr: 1 },
                { q: "Kod HTTP oznaczający sukces:", opts: ["200 OK", "404 Not Found", "500 Error", "301 Redirect"], corr: 0 }
            ];

            let html = '';
            data.forEach((item, qIdx) => {
                html += `
                    <div style="margin-bottom: 12px; background: #f5f5f5; padding: 10px; border-radius: 6px;">
                        <div style="font-weight: bold; margin-bottom: 6px;">${qIdx + 1}. ${item.q}</div>
                        ${item.opts.map((opt, oIdx) => `
                            <label style="display: block; margin-bottom: 6px; cursor: pointer; padding: 4px;" ${oIdx === item.corr ? 'data-correct="true"' : ''}>
                                <input type="radio" name="sim_q_${qIdx}" value="${opt}" style="margin-right: 8px;">
                                ${opt}
                            </label>
                        `).join('')}
                    </div>
                `;
            });

            container.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #00e5ff; padding-bottom: 8px; margin-bottom: 10px;">
                    <b style="color: #0288d1; font-size: 15px;">📝 Test Diagnostyczny</b>
                    <span id="close-sim-btn" style="cursor: pointer; color: red; font-weight: bold; font-size: 16px;">✕</span>
                </div>
                <form id="sim-form">${html}</form>
                <button id="sim-submit-btn" style="width: 100%; background: #0288d1; color: white; border: none; padding: 10px; border-radius: 6px; font-weight: bold; cursor: pointer;">
                    Sprawdź Wynik
                </button>
                <div id="sim-res-info" style="margin-top: 8px; text-align: center; font-weight: bold;"></div>
            `;
            document.body.appendChild(container);

            document.getElementById('close-sim-btn').onclick = () => container.remove();
            document.getElementById('sim-submit-btn').onclick = () => {
                let score = 0;
                data.forEach((it, qIdx) => {
                    const c = document.querySelector(`input[name="sim_q_${qIdx}"]:checked`);
                    if (c && c.value === it.opts[it.corr]) score++;
                });
                document.getElementById('sim-res-info').innerHTML = `<span style="color: #2e7d32;">Wynik: ${score} / ${data.length} punktów!</span>`;
            };
            notifyStatus("Wygenerowano test na stronie!");
        };

        document.getElementById('btn-remove-sim-test').onclick = () => {
            const el = document.getElementById('simulated-quiz-modal');
            if (el) el.remove();
        };

        // --- AUTO-FILL ZDARZENIOWY ---
        function triggerEvent(el) {
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
        }

        document.getElementById('btn-resolve-fill').onclick = () => {
            if (!window._resolvedAnswers || window._resolvedAnswers.length === 0) {
                notifyStatus("Brak danych! Uruchom Skanuj Pliki & DOM", false);
                return;
            }

            let count = 0;
            const radios = document.querySelectorAll('input[type="radio"], input[type="checkbox"]');
            const texts = document.querySelectorAll('input[type="text"], textarea');

            window._resolvedAnswers.forEach(a => {
                const target = a.text.toLowerCase().trim();
                radios.forEach(r => {
                    const lbl = r.closest('label') || r.parentElement;
                    const val = (r.value || '').toLowerCase().trim();
                    const txt = (lbl?.innerText || '').toLowerCase().trim();
                    if (txt.includes(target) || val === target) {
                        r.click();
                        r.checked = true;
                        triggerEvent(r);
                        count++;
                    }
                });
                texts.forEach(t => {
                    if (!t.value) {
                        t.value = a.text;
                        triggerEvent(t);
                        count++;
                    }
                });
            });

            notifyStatus(`Dopasowano i zaznaczono: ${count}`);
        };

        // --- SNIFFER FETCH I XHR ---
        const origFetch = window.fetch;
        window.fetch = async function (...args) {
            const res = await origFetch.apply(this, args);
            try {
                const url = typeof args[0] === 'string' ? args[0] : (args[0]?.url || 'FETCH');
                const cl = res.clone();
                cl.text().then(t => {
                    try {
                        const json = JSON.parse(t);
                        const ans = deepAnalyzePayload(json, 'FETCH');
                        ans.forEach(a => registerAnswer(a));
                        logEntry("FETCH", url, ans.length);
                        if (ans.length > 0) notifyStatus(`Wykryto ${ans.length} nowych odpowiedzi!`);
                    } catch {}
                }).catch(() => {});
            } catch {}
            return res;
        };

        const origOpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function (m, u) {
            this._reqUrl = u;
            origOpen.apply(this, arguments);
        };

        const origSend = XMLHttpRequest.prototype.send;
        XMLHttpRequest.prototype.send = function () {
            this.addEventListener('load', function () {
                try {
                    const u = this._reqUrl || 'XHR';
                    if (this.responseType === '' || this.responseType === 'text') {
                        const json = JSON.parse(this.responseText);
                        const ans = deepAnalyzePayload(json, 'XHR');
                        ans.forEach(a => registerAnswer(a));
                        logEntry("XHR", u, ans.length);
                        if (ans.length > 0) notifyStatus(`Wykryto ${ans.length} nowych odpowiedzi!`);
                    }
                } catch {}
            });
            origSend.apply(this, arguments);
        };
    }
})();