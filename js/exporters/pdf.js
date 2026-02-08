
export function generatePDF(data) {
    // Check if library is loaded
    if (typeof html2pdf === 'undefined') {
        alert('Biblioteca html2pdf não carregada.');
        return;
    }

    const element = document.createElement('div');
    element.style.fontFamily = "'Plus Jakarta Sans', sans-serif";
    element.style.fontSize = "12px";
    element.style.color = "#000";
    element.style.lineHeight = "1.4";
    element.style.width = "100%";
    element.style.maxWidth = "800px"; // Constrain width for PDF generation consistency
    element.style.margin = "0 auto";

    const processText = (text) => text ? text.replace(/\n/g, '<br>') : "---";
    const formatDate = (d) => d ? d.split('-').reverse().join('/') : "";

    // Webconf logic
    let webconfContent = "Ferramenta Padrão (Moodle)";
    if (data.static.webconf_type === 'personalizado') {
        webconfContent = data.static.mat_webconf || "Link Personalizado (Não informado)";
    }

    let html = `
        <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #006935; padding-bottom: 10px;">
            <h2 style="color: #006935; margin: 0;">IMPLANTAÇÃO DE DISCIPLINA - SATE/UECE</h2>
        </div>
        <div style="font-size: 10px; margin-bottom: 20px; background: #f8fafc; padding: 10px; border: 1px solid #e2e8f0;">
            <p><strong>IMPORTANTE:</strong> O arquivo deverá ser devidamente preenchido e enviado para o email atendimentosate@uece.br...</p>
            <p><strong>Prazos:</strong><br>• Implantação de Disciplinas: 14 dias úteis<br>• Implantação de Provas Online: 45 dias úteis<br>• Suporte técnico: 48h - 72h</p>
        </div>
    `;

    const tableStyle = "width: 100%; border-collapse: collapse; margin-bottom: 20px;";
    const thStyle = "background-color: #e2e8f0; padding: 8px; border: 1px solid #000; font-weight: bold; text-align: left;";
    const tdStyle = "padding: 8px; border: 1px solid #000;";

    // 1. Identificação
    html += `<h3 style="color: #006935; border-bottom: 1px solid #006935; padding-bottom: 5px;">1. Identificação</h3>`;
    html += `<table style="${tableStyle}">
        <tr>
            <td style="${thStyle}" width="15%">Turma:</td><td style="${tdStyle}">${data.static.id_turma || "---"}</td>
            <td style="${thStyle}" width="15%">Semestre:</td><td style="${tdStyle}">${data.static.id_semestre || "---"}</td>
        </tr>
        <tr><td style="${thStyle}">Curso:</td><td style="${tdStyle}" colspan="3">${data.static.id_curso || "---"}</td></tr>
        <tr>
            <td style="${thStyle}">Disciplina:</td><td style="${tdStyle}">${data.static.id_disciplina || "---"}</td>
            <td style="${thStyle}">Créditos:</td><td style="${tdStyle}">${data.static.id_ch || "---"}</td>
        </tr>
        <tr><td style="${thStyle}">Polos:</td><td style="${tdStyle}" colspan="3">${data.static.id_polos || "---"}</td></tr>
    </table>`;

    // 2. Material
    html += `<h3 style="color: #006935; border-bottom: 1px solid #006935; padding-bottom: 5px;">2. Material Didático</h3>`;
    html += `<table style="${tableStyle}">
        <tr><td style="${thStyle}" width="30%">Livro (Biblioteca):</td><td style="${tdStyle}">${data.static.mat_livro || "---"}</td></tr>
        <tr><td style="${thStyle}">Material Adicional:</td><td style="${tdStyle}">${processText(data.static.mat_adicional)}</td></tr>
        <tr><td style="${tdStyle}" colspan="2" style="font-size:10px; font-style:italic;">"Atenção aos direitos autorais..."</td></tr>
        <tr><td style="${thStyle}">Webconf:</td><td style="${tdStyle}">${webconfContent}</td></tr>
    </table>`;

    // 3. Módulos
    html += `<h3 style="color: #006935; border-bottom: 1px solid #006935; padding-bottom: 5px;">3. Módulos</h3>`;
    html += `<table style="${tableStyle}">`;

    data.modules.forEach(mod => {
        html += `<tr><td style="${thStyle}" colspan="2" style="background-color: #d1fae5;">Módulo ${mod.index}: ${mod.title || "---"}</td></tr>`;
        if (mod.intro) html += `<tr><td style="${tdStyle}" colspan="2">${processText(mod.intro)}</td></tr>`;

        if (mod.resources && mod.resources.length > 0) {
            html += `<tr><td style="${tdStyle} font-weight:bold; width:30%; background:#f1f5f9;">Recurso</td><td style="${tdStyle} font-weight:bold; background:#f1f5f9;">Detalhes</td></tr>`;
            mod.resources.forEach(res => {
                let dates = [];
                if (res.startDate) dates.push(`Início: ${formatDate(res.startDate)} ${res.startTime}`);
                if (res.endDate) dates.push(`Fim: ${formatDate(res.endDate)} ${res.endTime}`);

                let scoreText = "";
                if (res.evalMethod === 'Pontuação') scoreText = `Nota: ${res.score}`;
                else if (res.evalMethod === 'Rúbrica') scoreText = `Rúbrica: ${res.rubric}`;

                html += `<tr>
                    <td style="${tdStyle}"><strong>${res.type}</strong><br>${res.title}</td>
                    <td style="${tdStyle}">
                        ${dates.length ? 'Período: ' + dates.join(' até ') + '<br>' : ''}
                        ${scoreText ? '<b>' + scoreText + '</b><br>' : ''}
                        ${processText(res.desc)}
                    </td>
                </tr>`;
            });
        } else {
            html += `<tr><td style="${tdStyle}" colspan="2">Nenhum recurso cadastrado.</td></tr>`;
        }
    });
    html += `</table>`;

    // 4. Avaliações
    html += `<h3 style="color: #006935; border-bottom: 1px solid #006935; padding-bottom: 5px;">4. Avaliações</h3>`;
    html += `<table style="${tableStyle}"><tr><td style="${thStyle}">ID</td><td style="${thStyle}">Período</td><td style="${thStyle}">Pontuação</td><td style="${thStyle}">Detalhes</td></tr>`;

    data.evaluations.forEach(ev => {
        let period = "-";
        if (ev.startDate && ev.endDate) period = `${formatDate(ev.startDate)} ${ev.startTime}<br>a<br>${formatDate(ev.endDate)} ${ev.endTime}`;

        let score = "-";
        if (ev.evalMethod === 'Pontuação') score = ev.score;
        else if (ev.evalMethod === 'Rúbrica') score = "Rúbrica";

        let desc = processText(ev.desc);
        if (ev.id === 'Autoavaliação') desc = "Padrão Moodle";

        html += `<tr>
            <td style="${tdStyle}">${ev.id}</td>
            <td style="${tdStyle}">${period}</td>
            <td style="${tdStyle}">${score}</td>
            <td style="${tdStyle}">Tipo: ${ev.type || "-"}<br>${desc}</td>
        </tr>`;
    });
    html += `</table>`;

    // 5. Cálculo
    html += `<h3 style="color: #006935; border-bottom: 1px solid #006935; padding-bottom: 5px;">5. Cálculo de Notas</h3>`;
    html += `<table style="${tableStyle}">
        <tr>
            <td style="${thStyle}">NPC 1:</td><td style="${tdStyle}">${data.static.calc_npc1 || "-"}</td>
            <td style="${thStyle}">NPC 2:</td><td style="${tdStyle}">${data.static.calc_npc2 || "-"}</td>
        </tr>
        <tr><td style="${thStyle}">Média Final:</td><td style="${tdStyle}" colspan="3">${processText(data.static.calc_media)}</td></tr>
    </table>`;

    // 6. Frequência
    html += `<h3 style="color: #006935; border-bottom: 1px solid #006935; padding-bottom: 5px;">6. Frequência</h3>`;
    html += `<table style="${tableStyle}"><tr><td style="${thStyle}">Data</td><td style="${thStyle}">CH</td><td style="${thStyle}">Descrição</td></tr>`;
    data.frequency.forEach(freq => {
        html += `<tr><td style="${tdStyle}">${formatDate(freq.date)}</td><td style="${tdStyle}">${freq.ch}</td><td style="${tdStyle}">${freq.desc}</td></tr>`;
    });
    html += `<tr><td style="${thStyle}">Total CH:</td><td style="${tdStyle}" colspan="2"><strong>${data.totalCH}</strong></td></tr>`;
    html += `</table>`;

    element.innerHTML = html;

    html2pdf().set({
        margin: 10,
        filename: `Planejamento_${data.static.id_disciplina || 'Disciplina'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }).from(element).save();
}
