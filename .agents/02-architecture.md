# Padrão Arquitetural: Feature-Sliced Design
O projeto é organizado por domínios de negócio para evitar acoplamento.

- `src/features/`: Cada pasta é um domínio autônomo (ex: `complaints`, `heatmap`, `sweepers`). Deve conter seus próprios `components`, `hooks`, `api` e `types`.
- `src/shared/`: Exclusivo para componentes UI genéricos (botões, modais, tipografia), hooks globais (como autenticação) e funções utilitárias puras. 
- `src/pages/` (ou rotas): Arquivos enxutos de roteamento que importam e unem as features.

# Regras de Integração
- Nenhuma feature deve importar lógicas de outra feature diretamente. Se for necessário compartilhar, a lógica deve ser movida para `src/shared/`.
- Todas as requisições HTTP devem ser encapsuladas em custom hooks dentro da respectiva feature.
- Todas as requisições HTTP devem consumir a API do backend utilizando Axios e encapsuladas pelo React Query. Você deve sempre implementar e renderizar skeletons de carregamento e mensagens de erro (tratadas pelo Axios) para cada chamada de API.

# Regras de Design e UI
- **Folha de Estilo (Typography & Colors)**: O projeto segue uma folha de estilos consistente definida em `src/shared/styles/`. Você deve utilizar as variáveis de cores e tipografia (Spacings, Weights, etc.) disponíveis para garantir a harmonia visual.
- **Componentes Reutilizáveis**: Crie componentes genéricos em `src/shared/components` apenas quando necessário. Componentes específicos de uma feature devem residir dentro de sua própria pasta de feature.
- **Acessibilidade (A11y)**: Respeite as diretrizes de acessibilidade. Utilize contraste adequado, forneça textos alternativos (`alt`) para imagens e garanta a navegação por teclado.
- **Design**: Todos os componentes devem ser responsivos e funcionar perfeitamente em dispositivos móveis, tablets e desktops. Priorize layout flexível e mobile-first quando apropriado.