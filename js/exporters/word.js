
export function generateWord(data) {
    const { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType, TextRun, BorderStyle, ShadingType, AlignmentType, VerticalAlign, HeightRule } = docx;

    // Estilos Visuais
    const borderStyle = { style: BorderStyle.SINGLE, size: 4, color: "444444" }; // Bordas um pouco mais grossas e cinzas
    const headerShading = { fill: "E0E0E0", type: ShadingType.CLEAR, color: "auto" };
    const subHeaderShading = { fill: "F5F5F5", type: ShadingType.CLEAR, color: "auto" };

    // Helper para criar células com mais controle de layout
    const createCell = (content, widthPct = null, bold = false, shading = null, colSpan = 1, rowSpan = 1, align = AlignmentType.LEFT) => {
        const paragraphs = [];

        if (typeof content === 'string') {
            const lines = content.split('\n');
            lines.forEach(line => {
                if (line.trim() !== "") {
                    paragraphs.push(new Paragraph({
                        children: [new TextRun({
                            text: line,
                            bold: bold,
                            font: "Calibri",
                            size: 22 // 11pt 
                        })],
                        spacing: { after: 120, line: 276 }, // Espaçamento entre parágrafos (1.15 line height)
                        alignment: align
                    }));
                }
            });
        }

        return new TableCell({
            children: paragraphs,
            width: widthPct ? { size: widthPct, type: WidthType.PERCENTAGE } : undefined,
            shading: shading ? shading : undefined,
            columnSpan: colSpan,
            rowSpan: rowSpan,
            verticalAlign: VerticalAlign.CENTER, // Centralizar verticalmente para estética
            margins: {
                top: 100, bottom: 100, left: 100, right: 100 // Margem interna (padding)
            },
            borders: { top: borderStyle, bottom: borderStyle, left: borderStyle, right: borderStyle }
        });
    };

    // Helper text processor with null/undefined safeguard
    const safeText = (text) => (text === null || text === undefined) ? "-" : text;
    const processText = (text) => {
        if (text === null || text === undefined || text === "") return "-";
        return text;
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "";
        const [y, m, d] = dateStr.split('-');
        return `${d}/${m}/${y}`;
    };

    // Webconf logic
    let webconfContent = "Ferramenta Padrão (Moodle)";
    if (data.static && data.static.webconf_type === 'personalizado') {
        webconfContent = processText(data.static.mat_webconf) || "Link Personalizado (Não informado)";
    }

    // --- Content Construction ---

    const introParagraphs = [
        new Paragraph({
            children: [new TextRun({ text: "IMPORTANTE: ", bold: true, color: "CC0000" }), new TextRun("O arquivo deverá ser devidamente preenchido e enviado para o email atendimentosate@uece.br.")],
            spacing: { after: 200 }
        }),
        new Paragraph({
            children: [new TextRun({ text: "Prazos:", bold: true })], spacing: { after: 100 }
        }),
        new Paragraph({ children: [new TextRun("• Implantação de Disciplinas: 14 dias úteis")] }),
        new Paragraph({ children: [new TextRun("• Implantação de Provas Online: 45 dias úteis")] }),
        new Paragraph({ children: [new TextRun("• Atendimento suporte: 48h - 72h")], spacing: { after: 400 } }),
    ];

    // --- Tabela 1: Identificação ---
    const tableIdent = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
            new TableRow({ children: [createCell("IDENTIFICAÇÃO DA DISCIPLINA", 100, true, headerShading, 4, 1, AlignmentType.CENTER)], cantSplit: true }),
            new TableRow({
                children: [
                    createCell("Turma:\n" + processText(data.static.id_turma), 25, false, subHeaderShading),
                    createCell("Semestre:\n" + processText(data.static.id_semestre), 25, false, subHeaderShading),
                    createCell("Curso:\n" + processText(data.static.id_curso), 50, false, null, 2)
                ],
                cantSplit: true
            }),
            new TableRow({
                children: [
                    createCell("Disciplina:\n" + processText(data.static.id_disciplina), 60, false, null, 2),
                    createCell("Créditos/CH:\n" + processText(data.static.id_ch), 40, false, null, 2)
                ],
                cantSplit: true
            }),
            new TableRow({ children: [createCell("Polos:\n" + processText(data.static.id_polos), 100, false, null, 4)], cantSplit: true })
        ]
    });

    // --- Tabela 2: Material ---
    const tableMat = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
            new TableRow({ children: [createCell("MATERIAL DIDÁTICO E REFERÊNCIAS", 100, true, headerShading, 2, 1, AlignmentType.CENTER)], cantSplit: true }),
            new TableRow({ children: [createCell("Livro (Biblioteca):", 30, true, subHeaderShading), createCell(processText(data.static.mat_livro), 70)], cantSplit: true }),
            new TableRow({ children: [createCell("Material Adicional:", 30, true, subHeaderShading), createCell(processText(data.static.mat_adicional), 70)], cantSplit: true }),
            new TableRow({ children: [createCell("Webconf (Sala):", 30, true, subHeaderShading), createCell(webconfContent, 70)], cantSplit: true }),
            new TableRow({ children: [createCell("Atenção: A reprodução não autorizada de materiais é passível de punição legal.", 100, false, { fill: "FFF0F0", color: "auto" }, 2, 1, AlignmentType.CENTER)], cantSplit: true })
        ]
    });

    // --- Tabela 3: Módulos ---
    const modRows = [new TableRow({ children: [createCell("CONTEÚDO PROGRAMÁTICO (MÓDULOS)", 100, true, headerShading, 2, 1, AlignmentType.CENTER)], cantSplit: true })];

    data.modules.forEach(mod => {
        // Cabeçalho do Módulo
        modRows.push(new TableRow({
            children: [createCell(`Módulo ${mod.index}: ${mod.title}`, 100, true, subHeaderShading, 2)],
            cantSplit: true
        }));

        // Intro do Módulo
        if (mod.intro) {
            modRows.push(new TableRow({
                children: [createCell(processText(mod.intro), 100, false, null, 2)],
                cantSplit: true
            }));
        }

        // Recursos do Módulo
        if (mod.resources && mod.resources.length > 0) {
            modRows.push(new TableRow({
                children: [createCell("Recurso", 30, true, { fill: "EEEEEE" }, 1, 1, AlignmentType.CENTER), createCell("Detalhamento", 70, true, { fill: "EEEEEE" }, 1, 1, AlignmentType.CENTER)],
                cantSplit: true
            }));

            mod.resources.forEach(res => {
                const dates = [];
                if (res.startDate) dates.push(`Início: ${formatDate(res.startDate)} ${res.startTime}`);
                if (res.endDate) dates.push(`Fim: ${formatDate(res.endDate)} ${res.endTime}`);

                let details = "";
                if (dates.length) details += `${dates.join(' | ')}\n`;
                if (res.score) details += `Nota: ${res.score}\n`;
                if (res.rubric) details += `Rúbrica: ${res.rubric}\n`;
                details += `\n${res.desc}`;

                modRows.push(new TableRow({
                    children: [
                        createCell(`${safeText(res.type)}:\n${safeText(res.title)}`, 30, true),
                        createCell(details, 70, false)
                    ],
                    cantSplit: false // Permitir quebra se o detalhamento for muito longo
                }));
            });
        } else {
            modRows.push(new TableRow({ children: [createCell("Nenhum recurso cadastrado para este módulo.", 100, false, null, 2)], cantSplit: true }));
        }
    });
    const tableMods = new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: modRows });

    // --- Tabela 4: Avaliações ---
    const avalRows = [new TableRow({ children: [createCell("SISTEMA DE AVALIAÇÃO", 100, true, headerShading, 4, 1, AlignmentType.CENTER)], cantSplit: true })];
    avalRows.push(new TableRow({
        children: [
            createCell("Identificação", 20, true, subHeaderShading),
            createCell("Período", 25, true, subHeaderShading),
            createCell("Pontuação", 15, true, subHeaderShading),
            createCell("Detalhes", 40, true, subHeaderShading)
        ], cantSplit: true
    }));

    data.evaluations.forEach(ev => {
        let period = "-";
        if (ev.startDate && ev.endDate) {
            period = `${formatDate(ev.startDate)} ${ev.startTime}\na\n${formatDate(ev.endDate)} ${ev.endTime}`;
        }

        let score = "-";
        if (ev.evalMethod === 'Pontuação') score = safeText(ev.score);
        else if (ev.evalMethod === 'Rúbrica') score = "Rúbrica";

        let desc = ev.desc;
        if (ev.id === 'Autoavaliação') desc = "Autoavaliação padrão (Moodle)";
        else desc = `Tipo: ${safeText(ev.type)}\n${safeText(desc)}`;

        avalRows.push(new TableRow({
            children: [
                createCell(safeText(ev.id), 20, true),
                createCell(period, 25, false, null, 1, 1, AlignmentType.CENTER),
                createCell(score, 15, false, null, 1, 1, AlignmentType.CENTER),
                createCell(desc, 40)
            ],
            cantSplit: false
        }));
    });
    const tableAval = new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: avalRows });

    // --- Tabela 5: Cálculo ---
    const tableCalc = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
            new TableRow({ children: [createCell("CÁLCULO DE NOTAS", 100, true, headerShading, 2, 1, AlignmentType.CENTER)], cantSplit: true }),
            new TableRow({
                children: [
                    createCell(`NPC 1: ${processText(data.static.calc_npc1)}\nNPC 2: ${processText(data.static.calc_npc2)}`, 40, false),
                    createCell(`Média Final:\n${processText(data.static.calc_media)}`, 60, false, subHeaderShading)
                ],
                cantSplit: true
            })
        ]
    });

    // --- Tabela 6: Frequência ---
    const freqRows = [new TableRow({ children: [createCell("DISTRIBUIÇÃO DE FREQUÊNCIA", 100, true, headerShading, 3, 1, AlignmentType.CENTER)], cantSplit: true })];
    freqRows.push(new TableRow({ children: [createCell("Data", 25, true, subHeaderShading), createCell("CH", 15, true, subHeaderShading, 1, 1, AlignmentType.CENTER), createCell("Descrição da Atividade", 60, true, subHeaderShading)], cantSplit: true }));

    data.frequency.forEach(freq => {
        freqRows.push(new TableRow({
            children: [
                createCell(formatDate(freq.date), 25, false, null, 1, 1, AlignmentType.CENTER),
                createCell(freq.ch, 15, false, null, 1, 1, AlignmentType.CENTER),
                createCell(freq.desc, 60)
            ],
            cantSplit: true
        }));
    });

    freqRows.push(new TableRow({ children: [createCell("Total Carga Horária:", 40, true, subHeaderShading, 2, 1, AlignmentType.RIGHT), createCell(data.totalCH, 60, true, null)], cantSplit: true }));
    const tableFreq = new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: freqRows });

    // Build Doc
    const doc = new Document({
        sections: [{
            children: [
                ...introParagraphs,
                tableIdent, new Paragraph({ text: "" }),
                tableMat, new Paragraph({ text: "" }),
                tableMods, new Paragraph({ text: "" }),
                tableAval, new Paragraph({ text: "" }),
                tableCalc, new Paragraph({ text: "" }),
                tableFreq
            ]
        }]
    });

    Packer.toBlob(doc).then(blob => {
        saveAs(blob, `Planejamento_${data.static.id_disciplina || 'Disciplina'}.docx`);
    });
}
