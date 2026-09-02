# Referência da API e WebSockets (GeoLimp)

O frontend deve se conectar a uma API REST e WebSockets rodando localmente. Use chamadas assíncronas (Axios ou Fetch) preferencialmente abstraídas em custom hooks dentro da respectiva *feature*.

## Configurações Base
- **Base URL:** `http://localhost:3000`
- **Swagger (para verificar tipagens/DTOs):** `http://localhost:3000/api/docs`
- **Autenticação:** Todas as rotas protegidas exigem o cabeçalho `Authorization: Bearer <JWT_TOKEN>`.
- Salvar o token no Zustand ou LocalStorage após o login.

## Rotas Mapeadas (Mock Data)

### 1. Autenticação (`/auth`)
- `POST /auth/login`
  - **Payload:** `{ "email": "GeoLimpRoot", "password": "Root123" }` *(Aceita username no campo email)*.
  - **Retorno:** `{ "access_token": "...", "user": { ... } }`

### 2. Dashboard (`/admin`)
- `GET /admin/dashboard`
  - **Retorno Esperado:** JSON contendo KPIs: `totalComplaints`, `resolvedComplaints`, `pendingComplaints`, `totalServiceOrders`, `completedServiceOrders`, `complaintsByCategory` (objeto para gráficos).

### 3. Denúncias / Complaints (`/complaints`)
- `POST /complaints/public` (Criação pelo cidadão via formulário/landing page)
  - **REGRAS DE VALIDAÇÃO CRÍTICAS (Payload):**
    - `description`: **Obrigatório** (Texto descritivo do problema).
    - `address`: **Obrigatório** (Endereço digitado pelo usuário).
    - `category`: **Obrigatório** e deve ser estritamente uma destas opções: *"Buraco na via / rua"*, *"Entulho"*, *"Lixo acumulado"*, *"Iluminação pública"*, *"Problemas em calçadas"*, *"Sinalização danificada"*, *"Semáforo com defeito"*, *"Pavimentação"*, *"Drenagem / alagamento"*, *"Árvore ou vegetação interferindo na via (Poda/Manejo)"* ou *"Outros problemas de infraestrutura."*.
    - `latitude`, `longitude` e `photos`: **OPCIONAIS**.
- `GET /complaints` (Lista todas as denúncias para o painel do gestor)
- `GET /complaints/:id` (Detalhes da denúncia)
- `GET /complaints/heatmap`
  - **Retorno:** Array `[{ id, category, latitude, longitude, weight }]`. Denúncias sem coordenadas enviadas não aparecerão aqui.

### 4. Gestão Operacional (`/operations`)
Utilizado pelo Gestor/Root para organizar equipes de varrição e cadastrar Garis.
- `POST /operations/teams` - Criar equipe (Body: `{ "name": "Nome", "description": "Opcional" }`)
- `GET /operations/teams` - Listar todas as equipes
- `POST /operations/professionals` - Cadastrar Gari (Body: `{ "fullName": "Nome do Gari", "identifier": "Matrícula/ID digitado manualmente", "teamId": "ID da Equipe" }`)
- `GET /operations/professionals` - Listar todos os garis
- `GET /operations/teams/:teamId/professionals` - Listar garis pertencentes a uma equipe

### 5. Ordens de Serviço (`/service-orders`)
- `POST /service-orders`
  - **Payload:** `{ "complaintId": "..." }`
- `GET /service-orders`
- `PATCH /service-orders/:id/status`
  - **Utilidade:** Atualizar status e atribuir a equipe que executará/executou a limpeza.
  - **Status Aceitos:** `PENDENTE`, `EM_ANDAMENTO`, `CONCLUIDA`. (Ao enviar `CONCLUIDA`, a data de término é gerada no back-end automaticamente).
  - **Payload Opcional:** `{ "status": "CONCLUIDA", "teamId": "id-da-equipe-de-varrição" }`

### 6. Tempo Real (WebSockets)
- **Endpoint:** `ws://localhost:3000/dashboard`
- **Uso Atual:** É possível emitir o evento `ping` para teste (retorna `pong`).
- **Futuro:** A aplicação deverá escutar o evento `heatmap_update` para refletir atualizações no mapa de densidade instantaneamente (sem refresh).
