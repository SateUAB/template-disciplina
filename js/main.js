
// Importar exportadores (serão criados em breve)
import { generateWord } from './exporters/word.js';
import { generatePDF } from './exporters/pdf.js';

// --- Estado e Constantes ---
const STORAGE_KEY = 'uece_planning_draft_v1';
let autoSaveTimer = null;

// --- Inicialização ---
document.addEventListener('DOMContentLoaded', () => {
    loadDraft();
    setupEventListeners();
    setupScrollSpy();

    // Se não houver rascunho, iniciar com o padrão
    if (!localStorage.getItem(STORAGE_KEY)) {
        addModule();
        addModule(); // Começa com 2 módulos
        addDefaultEvaluations();
        addFreqRow();
    }
});

function setupEventListeners() {
    // Botões Principais
    document.getElementById('btn-add-module').addEventListener('click', () => addModule());
    document.getElementById('btn-add-evaluation').addEventListener('click', () => addEvaluation());
    document.getElementById('btn-add-freq').addEventListener('click', () => addFreqRow());
    document.getElementById('btn-clear-draft').addEventListener('click', clearDraft);

    // Botões de Exportação
    document.getElementById('btn-generate-word').addEventListener('click', (e) => { e.preventDefault(); handleExport('word'); });

    // Webconf Toggle
    const webconfSelect = document.getElementById('webconf_type');
    if (webconfSelect) {
        webconfSelect.addEventListener('change', (e) => {
            const container = document.getElementById('webconf_url_container');
            if (e.target.value === 'personalizado') container.classList.remove('hidden');
            else container.classList.add('hidden');
        });
    }

    // Monitoramento para Auto-Save (Input Delegation)
    document.getElementById('formPlanejamento').addEventListener('input', () => {
        const status = document.getElementById('save-status');
        status.textContent = 'Editando...';
        clearTimeout(autoSaveTimer);
        autoSaveTimer = setTimeout(saveDraft, 1000);
    });
}

// --- Lógica de Negócio (Auto-Save & Load) ---

function saveDraft() {
    const data = {
        static: getStaticData(),
        modules: getModulesData(),
        evaluations: getEvaluationsData(),
        frequency: getFrequencyData()
    };
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        const status = document.getElementById('save-status');
        status.textContent = 'Rascunho salvo ' + new Date().toLocaleTimeString();
        setTimeout(() => status.textContent = '', 3000);
    } catch (e) {
        console.error("Erro ao salvar rascunho", e);
        showToast("Erro ao salvar rascunho (Espaço cheio?)", "error");
    }
}

function loadDraft() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    try {
        const data = JSON.parse(raw);

        // 1. Static Fields
        setStaticData(data.static);

        // 2. Modules
        document.getElementById('modulesContainer').innerHTML = '';
        data.modules.forEach(mod => {
            const card = addModule(mod); // Pass data to fill
            // Resources inside module
            const resContainer = card.querySelector('.resources-container');
            mod.resources.forEach(res => addResource(resContainer, res));
        });

        // 3. Evaluations
        document.getElementById('evaluationsContainer').innerHTML = '';
        data.evaluations.forEach(ev => addEvaluation(ev));

        // 4. Frequency
        const freqBody = document.querySelector('#freqTable tbody');
        freqBody.innerHTML = '';
        data.frequency.forEach(freq => addFreqRow(freq));
        calculateTotalCH();

        showToast("Rascunho recuperado com sucesso!", "success");

    } catch (e) {
        console.error("Erro ao carregar rascunho", e);
        showToast("Erro ao carregar rascunho.", "error");
    }
}

function clearDraft() {
    if (confirm('Tem certeza? Isso apagará todo o preenchimento atual.')) {
        localStorage.removeItem(STORAGE_KEY);
        location.reload();
    }
}

// --- Helpers de Extração de Dados (Getters) ---
// Útil tanto para o Save quanto para o Export

function getStaticData() {
    const ids = ['id_turma', 'id_semestre', 'id_curso', 'id_disciplina', 'id_ch', 'id_polos', 'mat_livro', 'mat_adicional', 'webconf_type', 'mat_webconf', 'calc_npc1', 'calc_npc2', 'calc_media'];
    const data = {};
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) data[id] = el.value;
    });
    return data;
}

function setStaticData(data) {
    if (!data) return;
    Object.keys(data).forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.value = data[id];
            if (id === 'webconf_type') el.dispatchEvent(new Event('change')); // Trigger toggle logic
        }
    });
}

function getModulesData() {
    const modules = [];
    document.querySelectorAll('#modulesContainer .item-card').forEach((card, index) => {
        const resources = [];
        card.querySelectorAll('.resource-item').forEach(res => {
            resources.push({
                type: res.querySelector('.res-type').value,
                title: res.querySelector('.res-title').value,
                startDate: res.querySelector('.res-start-date').value,
                startTime: res.querySelector('.res-start-time').value,
                startToggle: res.querySelector('.start-toggle').value,
                endDate: res.querySelector('.res-end-date').value,
                endTime: res.querySelector('.res-end-time').value,
                endToggle: res.querySelector('.end-toggle').value,
                evalMethod: res.querySelector('.eval-method').value,
                score: res.querySelector('.val-score').value,
                rubric: res.querySelector('.val-rubric').value,
                desc: res.querySelector('.res-desc').value
            });
        });

        modules.push({
            index: index + 1, // UI Index
            title: card.querySelector('.mod-tema').value,
            intro: card.querySelector('.mod-intro').value,
            resources: resources
        });
    });
    return modules;
}

function getEvaluationsData() {
    const evals = [];
    document.querySelectorAll('#evaluationsContainer .evaluation-item').forEach(card => {
        evals.push({
            id: card.querySelector('.eval-id').value,
            type: card.querySelector('.eval-type').value,
            startDate: card.querySelector('.eval-start-date').value,
            startTime: card.querySelector('.eval-start-time').value,
            startToggle: card.querySelector('.start-toggle').value,
            endDate: card.querySelector('.eval-end-date').value,
            endTime: card.querySelector('.eval-end-time').value,
            endToggle: card.querySelector('.end-toggle').value,
            evalMethod: card.querySelector('.eval-method').value,
            score: card.querySelector('.val-score').value,
            rubric: card.querySelector('.val-rubric').value,
            desc: card.querySelector('.eval-desc').value
        });
    });
    return evals;
}

function getFrequencyData() {
    const freq = [];
    document.querySelectorAll('#freqTable tbody tr').forEach(tr => {
        const dateRaw = tr.querySelector('.freq-data').value;
        const ch = tr.querySelector('.freq-ch').value;
        const desc = tr.querySelector('.freq-desc').value;
        if (dateRaw || ch || desc) { // Only save if not empty
            freq.push({ date: dateRaw, ch, desc });
        }
    });
    return freq;
}

// --- DOM Manipulation (UI) ---

let moduleCounter = 0; // Para IDs únicos se necessário, mas DOM order é suficiente

function addModule(data = null) {
    moduleCounter++;
    const container = document.getElementById('modulesContainer');
    const index = container.children.length + 1;

    // Elementos
    const div = document.createElement('div');
    div.className = 'item-card';
    div.innerHTML = `
        <div class="item-header">
            <span class="item-title">Módulo ${index}</span>
            <div style="display:flex; gap:10px;">
                <!-- Future: Move Up/Down buttons -->
                <button type="button" class="btn btn-remove remove-module-btn">Remover</button>
            </div>
        </div>
        <div class="item-body">
            <div class="grid">
                <div class="col-12"><label>Título do Módulo</label><input type="text" class="mod-tema" placeholder="COLOCAR O TEMA DO MÓDULO"></div>
                <div class="col-12"><label>Conteúdo Introdutório</label><textarea class="mod-intro" style="min-height:60px;" placeholder="Neste espaço colocar algum vídeo, imagem ou objetivos relacionados ao tema..."></textarea></div>
            </div>
            <div style="margin-top:25px; padding-top:20px; border-top:1px dashed var(--border);">
                <label style="color:var(--text-muted); font-size:0.85rem; margin-bottom:15px; display:block;">Recursos deste módulo:</label>
                <div class="resources-container"></div>
                <button type="button" class="btn btn-solid-blue add-resource-btn" style="font-size:0.9rem; padding:10px; width: auto;">+ Adicionar Recurso</button>
            </div>
        </div>`;

    // Add Events
    div.querySelector('.remove-module-btn').addEventListener('click', () => {
        if (confirm('Remover este módulo e todos os seus recursos?')) {
            div.remove();
            renumberModules();
            saveDraft();
        }
    });

    const titleInput = div.querySelector('.mod-tema');
    const titleSpan = div.querySelector('.item-title');

    titleInput.addEventListener('input', (e) => {
        const val = e.target.value;
        // Get current index from the span text or recalculate? 
        // Safer to just use the index stored or calculate. 
        // Actually, renumberModules handles index. But for immediate feedback:
        // extracting index from current text "Módulo X..." is risky if format changes.
        // But simply: prompt says "Módulo ${index}". 
        // Let's rely on renumber to be safe? No, 'input' needs instant feedback.
        // We can just keep the "Módulo X" part if we don't change index.
        const currentText = titleSpan.textContent;
        const prefix = currentText.split(' – ')[0]; // "Módulo 1"
        // Wait, if user backspaces empty, we need to know the index.
        // Let's assume titleSpan startswith "Módulo <N>".
        // Regex: /^Módulo \d+/
        const match = currentText.match(/^Módulo \d+/);
        if (match) {
            titleSpan.textContent = val ? `${match[0]} – ${val}` : match[0];
        }
    });

    div.querySelector('.add-resource-btn').addEventListener('click', (e) => {
        addResource(e.target.previousElementSibling);
    });

    // Fill Data if provided
    if (data) {
        div.querySelector('.mod-tema').value = data.title || '';
        div.querySelector('.mod-intro').value = data.intro || '';
        if (data.title) {
            titleSpan.textContent = `Módulo ${index} – ${data.title}`;
        }
    }

    container.appendChild(div);
    // renumberModules will overwrite this anyway? 
    // Yes, renumberModules is called at the end.
    // So renumberModules logic MUST be updated.
    renumberModules();
    return div;
}

function renumberModules() {
    document.querySelectorAll('#modulesContainer .item-card').forEach((card, idx) => {
        const val = card.querySelector('.mod-tema').value;
        const prefix = `Módulo ${idx + 1}`;
        card.querySelector('.item-title').textContent = val ? `${prefix} – ${val}` : prefix;
    });
}

function addResource(container, data = null) {
    const div = document.createElement('div');
    div.className = 'resource-item';
    div.innerHTML = `
        <div class="resource-header"><span class="resource-label">Novo Recurso</span><button type="button" class="btn btn-remove remove-res-btn">Remover</button></div>
        <div class="grid">
            <div class="col-4"><label>Tipo</label><select class="res-type"><option value="" disabled selected>Selecione...</option><option>Fórum</option><option>Tarefa</option><option>Questionário</option><option>Wiki</option></select></div>
            <div class="col-8"><label>Título</label><input type="text" class="res-title"></div>
            <div class="col-12"><div class="grid" style="gap:16px;">
                <div class="col-6"><div class="datetime-group"><div class="datetime-header"><label style="margin:0;">Data de Abertura</label><select class="toggle-select start-toggle"><option value="" disabled selected>Selecione...</option><option value="Não">Não</option><option value="Sim">Sim</option></select></div><div class="date-inputs-container"><div><span class="sub-label">Dia</span><input type="date" class="res-start-date"></div><div><span class="sub-label">Hora</span><input type="time" class="res-start-time"></div></div></div></div>
                <div class="col-6"><div class="datetime-group"><div class="datetime-header"><label style="margin:0;">Data de Encerramento</label><select class="toggle-select end-toggle"><option value="" disabled selected>Selecione...</option><option value="Não">Não</option><option value="Sim">Sim</option></select></div><div class="date-inputs-container"><div><span class="sub-label">Dia</span><input type="date" class="res-end-date"></div><div><span class="sub-label">Hora</span><input type="time" class="res-end-time"></div></div></div></div>
            </div></div>
            <div class="col-12"><div class="grid" style="gap:10px; align-items:end;">
                <div class="col-6"><label>Método Avaliativo</label><select class="eval-method"><option value="" disabled selected>Selecione...</option><option value="Nenhum">Nenhum</option><option value="Pontuação">Pontuação</option><option value="Rúbrica">Rúbrica</option></select></div>
                <div class="col-6"><input type="number" class="val-score hidden" placeholder="Nota"><input type="text" class="val-rubric hidden" placeholder="Rúbrica"></div>
            </div></div>
            <div class="col-12"><label>Descrição / Link</label><textarea class="res-desc" rows="2" placeholder="Colocar o questionamento para interação ou realização da atividade."></textarea></div>
        </div>`;

    // Events
    div.querySelector('.remove-res-btn').addEventListener('click', () => div.remove());

    const resLabel = div.querySelector('.resource-label');
    const resType = div.querySelector('.res-type');

    resType.addEventListener('change', (e) => {
        resLabel.textContent = `Recurso – ${e.target.value}`;
        // Optional: Change header color based on type? 
        // For now, just title update as requested.
    });

    setupToggleLogic(div);
    setupEvalMethodLogic(div);

    // Fill Data
    if (data) {
        div.querySelector('.res-type').value = data.type || '';
        if (data.type) {
            resLabel.textContent = `Recurso – ${data.type}`;
        }
        div.querySelector('.res-title').value = data.title || '';
        div.querySelector('.res-start-date').value = data.startDate || '';
        div.querySelector('.res-start-time').value = data.startTime || '';
        div.querySelector('.start-toggle').value = data.startToggle || '';
        div.querySelector('.res-end-date').value = data.endDate || '';
        div.querySelector('.res-end-time').value = data.endTime || '';
        div.querySelector('.end-toggle').value = data.endToggle || '';
        div.querySelector('.eval-method').value = data.evalMethod || '';
        div.querySelector('.val-score').value = data.score || '';
        div.querySelector('.val-rubric').value = data.rubric || '';
        div.querySelector('.res-desc').value = data.desc || '';

        // Trigger UI updates based on data
        div.querySelectorAll('.toggle-select').forEach(el => el.dispatchEvent(new Event('change')));
        div.querySelector('.eval-method').dispatchEvent(new Event('change'));
    }

    container.appendChild(div);
}

function addEvaluation(data = null) {
    const container = document.getElementById('evaluationsContainer');
    const div = document.createElement('div');
    div.className = 'item-card evaluation evaluation-item';

    div.innerHTML = `
        <div class="item-header"><span class="item-title">Avaliação</span><button type="button" class="btn btn-remove remove-eval-btn">Remover</button></div>
        <div class="item-body">
            <div class="grid">
                <div class="col-3"><label>Identificação</label><select class="eval-id"><option value="Autoavaliação">Autoavaliação</option><option value="NPC">NPC</option><option value="2ª Chamada NPC">2ª Chamada NPC</option><option value="NEF">NEF</option><option value="2ª Chamada NEF">2ª Chamada NEF</option></select></div>
                <div class="col-9 common-eval-fields"><label>Tipo de Recurso</label><input type="text" class="eval-type" placeholder="Ex: seminário, questionário..."></div>
                <div class="col-12"><div class="grid" style="gap:16px;">
                    <div class="col-6"><div class="datetime-group"><div class="datetime-header"><label style="margin:0;">Data de Abertura</label><select class="toggle-select start-toggle"><option value="" disabled selected>Selecione...</option><option value="Não">Não</option><option value="Sim">Sim</option></select></div><div class="date-inputs-container"><div><span class="sub-label">Dia</span><input type="date" class="eval-start-date"></div><div><span class="sub-label">Hora</span><input type="time" class="eval-start-time"></div></div></div></div>
                    <div class="col-6"><div class="datetime-group"><div class="datetime-header"><label style="margin:0;">Data de Encerramento</label><select class="toggle-select end-toggle"><option value="" disabled selected>Selecione...</option><option value="Não">Não</option><option value="Sim">Sim</option></select></div><div class="date-inputs-container"><div><span class="sub-label">Dia</span><input type="date" class="eval-end-date"></div><div><span class="sub-label">Hora</span><input type="time" class="eval-end-time"></div></div></div></div>
                </div></div>
                <div class="col-12 common-eval-fields"><div class="grid" style="align-items:end;"><div class="col-6"><label>Método Avaliativo</label><select class="eval-method"><option value="" disabled selected>Selecione...</option><option value="Nenhum">Nenhum</option><option value="Pontuação">Pontuação</option><option value="Rúbrica">Rúbrica</option></select></div><div class="col-6"><input type="number" class="val-score hidden" placeholder="Nota"><input type="text" class="val-rubric hidden" placeholder="Rúbrica"></div></div></div>
                <div class="col-12 common-eval-fields"><label>Descrição / Enunciado / Link</label><textarea class="eval-desc" rows="3" placeholder="Colocar o texto da avaliação."></textarea><div class="ps-note"><strong>P.S:</strong> Se for Questionário, informar configurações e senha.</div></div>
                <div class="col-12 auto-eval-msg" style="display:none;">A configuração padrão será aplicada. Caso a sua seja diferente, favor informar os detalhes no corpo do chamado.</div>
            </div>
        </div>`;

    div.querySelector('.remove-eval-btn').addEventListener('click', () => {
        if (confirm('Remover esta avaliação?')) div.remove();
    });

    const idSelect = div.querySelector('.eval-id');
    const autoMsg = div.querySelector('.auto-eval-msg');
    const commons = div.querySelectorAll('.common-eval-fields');
    const titleSpan = div.querySelector('.item-title');

    idSelect.addEventListener('change', (e) => {
        // Update Title dynamically
        titleSpan.textContent = `Avaliação – ${e.target.value}`;

        if (e.target.value === 'Autoavaliação') {
            commons.forEach(el => el.classList.add('hidden'));
            autoMsg.style.display = 'block';
        } else {
            commons.forEach(el => el.classList.remove('hidden'));
            autoMsg.style.display = 'none';
        }
    });

    setupToggleLogic(div);
    setupEvalMethodLogic(div);

    if (data) {
        idSelect.value = data.id || 'NPC';
        div.querySelector('.eval-type').value = data.type || '';
        div.querySelector('.eval-start-date').value = data.startDate || '';
        div.querySelector('.eval-start-time').value = data.startTime || '';
        div.querySelector('.start-toggle').value = data.startToggle || '';
        div.querySelector('.eval-end-date').value = data.endDate || '';
        div.querySelector('.eval-end-time').value = data.endTime || '';
        div.querySelector('.end-toggle').value = data.endToggle || '';
        div.querySelector('.eval-method').value = data.evalMethod || '';
        div.querySelector('.val-score').value = data.score || '';
        div.querySelector('.val-rubric').value = data.rubric || '';
        div.querySelector('.eval-desc').value = data.desc || '';

        idSelect.dispatchEvent(new Event('change'));
        div.querySelectorAll('.toggle-select').forEach(el => el.dispatchEvent(new Event('change')));
        div.querySelector('.eval-method').dispatchEvent(new Event('change'));
    }

    container.appendChild(div);
}

function addDefaultEvaluations() {
    addEvaluation({ id: 'Autoavaliação' });
    addEvaluation({ id: 'NPC' });
    addEvaluation({ id: '2ª Chamada NPC' });
    addEvaluation({ id: 'NEF' });
}

function addFreqRow(data = null) {
    const tbody = document.querySelector('#freqTable tbody');
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td><input type="date" class="freq-data"></td>
        <td><input type="number" class="freq-ch" min="0" max="23"></td>
        <td><input type="text" class="freq-desc"></td>
        <td><button type="button" class="btn btn-remove remove-freq" style="margin:0;">X</button></td>
    `;

    tr.querySelector('.remove-freq').addEventListener('click', () => {
        tr.remove();
        calculateTotalCH();
    });

    tr.querySelector('.freq-ch').addEventListener('input', calculateTotalCH);

    if (data) {
        tr.querySelector('.freq-data').value = data.date;
        tr.querySelector('.freq-ch').value = data.ch;
        tr.querySelector('.freq-desc').value = data.desc;
    }

    tbody.appendChild(tr);
}

window.calculateTotalCH = function () {
    let total = 0;
    document.querySelectorAll('.freq-ch').forEach(input => {
        const val = parseInt(input.value);
        if (!isNaN(val)) total += val;
    });
    document.getElementById('total_ch').value = total;
}

// --- Logic Helpers ---

function setupToggleLogic(parent) {
    parent.querySelectorAll('.toggle-select').forEach(sel => {
        sel.addEventListener('change', (e) => {
            const container = e.target.closest('.datetime-group').querySelector('.date-inputs-container');
            if (e.target.value === 'Sim') {
                container.style.display = 'flex';
                // Focus first input
                setTimeout(() => container.querySelector('input').focus(), 100);
            } else container.style.display = 'none';
        });
    });
}

// --- Scroll Spy & Navigation ---
function setupScrollSpy() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.section-card');

    const observerOptions = {
        root: null,
        rootMargin: '-50% 0px -50% 0px', // Activate when section is in middle of viewport
        threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Remove active class from all
                navLinks.forEach(link => link.classList.remove('active'));

                // Add to current
                const id = entry.target.id;
                const activeLink = document.querySelector(`.nav-link[href="#${id}"]`);
                if (activeLink) activeLink.classList.add('active');
            }
        });
    }, observerOptions);

    sections.forEach(section => observer.observe(section));
}

function setupEvalMethodLogic(parent) {
    const methodSel = parent.querySelector('.eval-method');
    methodSel.addEventListener('change', (e) => {
        const container = e.target.closest('.grid'); // This might trigger on the subgrid
        // Find inputs relatively
        const scoreInput = methodSel.parentElement.nextElementSibling.querySelector('.val-score');
        const rubricInput = methodSel.parentElement.nextElementSibling.querySelector('.val-rubric');

        scoreInput.classList.add('hidden');
        rubricInput.classList.add('hidden');

        if (e.target.value === 'Pontuação') {
            scoreInput.classList.remove('hidden');
        } else if (e.target.value === 'Rúbrica') {
            rubricInput.classList.remove('hidden');
        }
    });
}

function handleExport(type) {
    if (!validateForm()) {
        showToast("Por favor, preencha os campos obrigatórios (Turma, Curso, Disciplina)", "error");
        return;
    }

    const payload = {
        static: getStaticData(),
        modules: getModulesData(),
        evaluations: getEvaluationsData(),
        frequency: getFrequencyData(),
        totalCH: document.getElementById('total_ch').value
    };

    if (type === 'word') generateWord(payload);
    else generatePDF(payload);
}

function validateForm() {
    let isValid = true;
    let firstError = null;

    const setError = (el) => {
        el.style.border = '1px solid red';
        el.addEventListener('input', () => el.style.border = '', { once: true });
        isValid = false;
        if (!firstError) firstError = el;
    };

    // 1. Static Fields
    const staticIds = ['id_turma', 'id_semestre', 'id_curso', 'id_disciplina', 'id_ch', 'id_polos',
        'mat_livro', 'mat_adicional', 'calc_npc1', 'calc_npc2', 'calc_media'];

    staticIds.forEach(id => {
        const el = document.getElementById(id);
        if (el && !el.value.trim()) setError(el);
    });

    // Webconf logic
    const webconfType = document.getElementById('webconf_type');
    if (webconfType && webconfType.value === 'personalizado') {
        const webconfUrl = document.getElementById('mat_webconf');
        if (!webconfUrl.value.trim()) setError(webconfUrl);
    }

    // 2. Modules & Resources
    document.querySelectorAll('#modulesContainer .item-card').forEach(mod => {
        const title = mod.querySelector('.mod-tema');
        const intro = mod.querySelector('.mod-intro');
        if (!title.value.trim()) setError(title);
        if (!intro.value.trim()) setError(intro);

        mod.querySelectorAll('.resource-item').forEach(res => {
            const rTitle = res.querySelector('.res-title');
            const rDesc = res.querySelector('.res-desc');
            const rType = res.querySelector('.res-type');
            if (!rTitle.value.trim()) setError(rTitle);
            if (!rDesc.value.trim()) setError(rDesc);
            if (!rType.value) setError(rType); // Check for empty Select

            // Conditional Dates
            const startToggle = res.querySelector('.start-toggle');
            if (!startToggle.value) setError(startToggle); // Check toggle selection
            else if (startToggle.value === 'Sim') {
                const d = res.querySelector('.res-start-date');
                const t = res.querySelector('.res-start-time');
                if (!d.value) setError(d);
                if (!t.value) setError(t);
            }

            const endToggle = res.querySelector('.end-toggle');
            if (!endToggle.value) setError(endToggle); // Check toggle selection
            else if (endToggle.value === 'Sim') {
                const d = res.querySelector('.res-end-date');
                const t = res.querySelector('.res-end-time');
                if (!d.value) setError(d);
                if (!t.value) setError(t);
            }

            // Conditional Scoring
            const evalMethod = res.querySelector('.eval-method');
            if (!evalMethod.value) setError(evalMethod); // Check method selection
            else if (evalMethod.value === 'Pontuação') {
                const s = res.querySelector('.val-score');
                if (!s.value.trim()) setError(s);
            } else if (evalMethod.value === 'Rúbrica') {
                const r = res.querySelector('.val-rubric');
                if (!r.value.trim()) setError(r);
            }
        });
    });

    // 3. Evaluations
    document.querySelectorAll('#evaluationsContainer .evaluation-item').forEach(evalCard => {
        const id = evalCard.querySelector('.eval-id').value;
        if (id !== 'Autoavaliação') {
            const type = evalCard.querySelector('.eval-type');
            const desc = evalCard.querySelector('.eval-desc');
            if (!type.value.trim()) setError(type);
            if (!desc.value.trim()) setError(desc);

            // Dates
            const startToggle = evalCard.querySelector('.start-toggle');
            if (!startToggle.value) setError(startToggle);
            else if (startToggle.value === 'Sim') {
                const d = evalCard.querySelector('.eval-start-date');
                const t = evalCard.querySelector('.eval-start-time');
                if (!d.value) setError(d);
                if (!t.value) setError(t);
            }

            const endToggle = evalCard.querySelector('.end-toggle');
            if (!endToggle.value) setError(endToggle);
            else if (endToggle.value === 'Sim') {
                const d = evalCard.querySelector('.eval-end-date');
                const t = evalCard.querySelector('.eval-end-time');
                if (!d.value) setError(d);
                if (!t.value) setError(t);
            }

            // Scoring
            const evalMethod = evalCard.querySelector('.eval-method');
            if (!evalMethod.value) setError(evalMethod);
            else if (evalMethod.value === 'Pontuação') {
                const s = evalCard.querySelector('.val-score');
                if (!s.value.trim()) setError(s);
            } else if (evalMethod.value === 'Rúbrica') {
                const r = evalCard.querySelector('.val-rubric');
                if (!r.value.trim()) setError(r);
            }
        }
    });

    // 4. Frequency
    document.querySelectorAll('#freqTable tbody tr').forEach(tr => {
        const date = tr.querySelector('.freq-data');
        const ch = tr.querySelector('.freq-ch');
        const desc = tr.querySelector('.freq-desc');

        // If row exists, it must be filled (unless empty row logic is preferred, but user said ALL fields)
        // Check if any field has value, if so, all must have value. 
        // Or if user wants STRICT, then every existing row must be valid.
        // Let's assume strict: if row is there, fill it.
        if (!date.value) setError(date);
        if (!ch.value) setError(ch);
        if (!desc.value.trim()) setError(desc);
    });

    if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        showToast("Existem campos obrigatórios não preenchidos!", "error");
    }

    return isValid;
}

function showToast(msg, type = 'info') {
    const container = document.getElementById('toast-container');
    const div = document.createElement('div');
    div.className = `toast toast-${type}`;

    // Icons Removed as per user request
    div.innerHTML = `<span>${msg}</span>`;

    container.appendChild(div);

    setTimeout(() => {
        div.classList.add('hiding');
        setTimeout(() => div.remove(), 300); // Wait for transition
    }, 4000);
}
