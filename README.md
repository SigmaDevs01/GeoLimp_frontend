# GeoLimp - Frontend Web

Interface Web e Dashboard Interativo para o ecossistema **GeoLimp** — Plataforma Integrada de Gestão de Limpeza Urbana, Zeladoria Municipal e Atendimento ao Cidadão.

Desenvolvido com **React 19**, **TypeScript**, **Vite**, **Tailwind CSS**, mapas interativos com mapa de calor e sincronização em tempo real via **Socket.io**.

---

## 🚀 Tecnologias Utilizadas

- **Core:** [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/)
- **Estilização:** [Tailwind CSS](https://tailwindcss.com/) com design system personalizado e Lucide Icons
- **Gerenciamento de Estado & Requisições:** [TanStack React Query](https://tanstack.com/query/latest) e [Zustand](https://github.com/pmndrs/zustand)
- **Mapas e Georreferenciamento:** [Leaflet](https://leafletjs.com/) e Leaflet.heat / MapLibre para renderização de Mapa de Calor e marcadores operacionais
- **Tempo Real:** [Socket.io-client](https://socket.io/docs/v4/client-api/)
- **Formulários & Validação:** [Zod](https://zod.dev/) e [React Hook Form](https://react-hook-form.com/)
- **Cliente HTTP:** [Axios](https://axios-http.com/) com suporte a envio de credenciais (cookies)
- **Hospedagem:** [Vercel](https://vercel.com/)

---

## 🏛️ Arquitetura e Estrutura de Pastas

O projeto adota os princípios de **Feature-Sliced Design**, garantindo baixo acoplamento e alta coesão:

```text
src/
├── features/                # Domínios de negócio autônomos
│   ├── admin/               # Gestão de usuários, estatísticas e configurações
│   ├── auth/                # Login, cadastro, sessão e autenticação
│   ├── complaints/          # Criação, listagem e edição de denúncias
│   ├── map/                 # Visualização de mapa, pins operacionais e heatmap
│   ├── service-orders/      # Ordens de serviço e acompanhamento de equipes
│   └── sweeping/            # Gestão de equipes e garis de varrição
├── shared/                  # Componentes e utilitários compartilhados
│   ├── api/                 # Configuração do Axios e instâncias base
│   ├── components/          # Botões, modais, loaders, inputs reutilizáveis
│   ├── hooks/               # Hooks globais (ex: uso de auth, debouncing)
│   ├── styles/              # Variáveis e configurações de cores/tema
│   └── types/               # Tipagens TypeScript compartilhadas
└── pages/                   # Rotas da aplicação (Landing Page, Dashboard, etc.)
```

---

## 📋 Funcionalidades Principais

1. **Portal do Cidadão (Landing Page):**
   - Criação rápida de denúncias com categoria, endereço, descrição, geolocalização e envio de fotos.
   - Acompanhamento do status das próprias solicitações.
2. **Painel do Gestor (Dashboard):**
   - KPIs em tempo real (taxa de resolução, tempo médio de atendimento, denúncias por categoria).
   - Mapa Interativo com alternância entre **Mapa de Calor (Heatmap)** de incidência e **Marcadores/Pins operacionais**.
   - Gerenciamento de Ordens de Serviço (OS): atribuição a equipes, fotos de conclusão e finalização.
   - Gerenciamento de Equipes de Varrição e Garis.
   - Gestão de Acessos: cadastro, edição e exclusão de gestores e operadores com modais customizados de confirmação.

---

## 🛠️ Configuração e Execução Local

### Pré-requisitos
- **Node.js** (versão 20 ou superior)
- **npm** (ou yarn / pnpm)
- Backend da API em execução (ou apontando para o Render)

### 1. Clonar o repositório
```bash
git clone https://github.com/SigmaDevs01/GeoLimp_frontend.git
cd GeoLimp_frontend
```

### 2. Instalar dependências
```bash
npm install
```

### 3. Configurar variáveis de ambiente
Crie um arquivo `.env` na raiz do projeto:

```env
# URL da API Backend (Local ou Produção)
VITE_API_URL=http://localhost:3000

# URL do WebSocket Gateway
VITE_WS_URL=http://localhost:3000
```

> **Para apontar para a API em Produção (Render):**
> ```env
> VITE_API_URL=https://geolimp-api.onrender.com
> VITE_WS_URL=https://geolimp-api.onrender.com
> ```

### 4. Executar em modo de desenvolvimento
```bash
npm run dev
```

Abra no navegador em: `http://localhost:5173`

---

## 🚢 Deploy em Produção (Vercel)

O frontend está configurado para deploy contínuo na Vercel:

- **Domínio de Produção:** `https://geolimp.vercel.app`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **SPA Routing:** Configurado via `vercel.json` com reescrita para `index.html`.
- **Environment Variables na Vercel:**
  - `VITE_API_URL`: `https://geolimp-api.onrender.com`
  - `VITE_WS_URL`: `https://geolimp-api.onrender.com`

---

## 📄 Licença

Desenvolvido pelo time GeoLimp para modernização da zeladoria urbana municipal.
