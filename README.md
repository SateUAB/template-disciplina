# Planejamento de Disciplina - UECE

Sistema moderno para planejamento e organização de disciplinas acadêmicas, desenvolvido com design **Liquid Glass** e paleta institucional UECE.

## 🎨 Características

- **Interface Moderna**: Design Liquid Glass com efeitos de glassmorfismo e animações suaves
- **Paleta UECE**: Cores institucionais em tons de azul
- **Exportação Word**: Gere documentos `.docx` formatados diretamente do navegador
- **Validação Inteligente**: Sistema de validação em tempo real
- **Responsivo**: Funciona perfeitamente em desktop, tablet e mobile
- **Zero Dependências de Backend**: Aplicação 100% client-side

## 🚀 Como Usar

1. Acesse a aplicação online ou abra `index.html` localmente
2. Preencha as informações da disciplina nos formulários
3. Adicione módulos, recursos e avaliações conforme necessário
4. Clique em "Gerar Arquivo Word (.docx)" para exportar

## 📦 Estrutura do Projeto

```
TempMoodle/
├── index.html          # Página principal
├── css/
│   └── style.css       # Estilos (Liquid Glass UECE)
├── js/
│   ├── main.js         # Lógica principal
│   └── exporters/
│       └── word.js     # Exportador DOCX
└── libs/
    └── docx.min.js     # Biblioteca para geração de Word
```

## 🌐 Deploy

Este projeto pode ser hospedado gratuitamente no **GitHub Pages**:

1. Faça push do código para um repositório GitHub
2. Vá em Settings → Pages
3. Selecione a branch `main` e pasta `/ (root)`
4. Salve e aguarde alguns minutos

Sua aplicação estará disponível em: `https://seu-usuario.github.io/nome-do-repo`

## 🛠️ Tecnologias

- HTML5
- CSS3 (Glassmorphism, Animations)
- JavaScript (ES6+)
- [docx.js](https://docx.js.org/) - Geração de documentos Word

## 📄 Licença

Este projeto é de uso acadêmico para a UECE.

---

Desenvolvido com 💙 para a Universidade Estadual do Ceará
