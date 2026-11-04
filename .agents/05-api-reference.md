# Referência da API e WebSockets (GeoLimp)

Documentação de integração do frontend com o backend NestJS do GeoLimp. As chamadas assíncronas devem ser encapsuladas em custom hooks dentro de cada feature, com suporte a React Query, Axios e Socket.io-client.

---

## 1. Configurações de Ambiente

- **Base URL (Local):** `http://localhost:3000`
- **Base URL (Produção):** `https://geolimp-api.onrender.com`
- **Frontend em Produção:** `https://geolimp.vercel.app` (ou `https://geo-limp-frontend.vercel.app`)
- **Documentação Swagger:** 
  - Produção: `https://geolimp-api.onrender.com/api/docs`
  - Local: `http://localhost:3000/api/docs`
  - *Nota:* O Swagger é protegido por HTTP Basic Auth (`SWAGGER_USER` e `SWAGGER_PASSWORD`).

---

## 2. Autenticação e Cookies

O backend suporta autenticação por:
1. **Cookie HttpOnly (`token`)**: Gerado automaticamente no login e registro (`withCredentials: true` no Axios).
2. **Bearer Token (`Authorization: Bearer <token>`)**: Recomendado enviar o cabeçalho caso esteja armazenando o token no Zustand ou LocalStorage.

---

## 3. Módulos e Endpoints

### 3.1. Autenticação (`/auth`)
- `POST /auth/login`
  - **Payload:** `{ "email": "usuarioOuEmail", "password": "senha" }`
  - **Retorno:** `{ "user": { "id": "...", "name": "...", "email": "...", "role": "ROOT|GESTOR|CIDADAO" } }`
- `POST /auth/register`
  - **Payload:** `{ "name": "...", "email": "...", "password": "...", "phone": "..." }`
- `POST /auth/logout`
  - Invalida a sessão e limpa o cookie HttpOnly.

### 3.2. Painel Administrativo (`/admin`)
- `GET /admin/dashboard` `[ROOT, GESTOR]`
  - **Retorno:** KPIs com métricas de denúncias (total, resolvidas, pendentes), ordens de serviço e gráficos por categoria.
- `GET /admin/map-items` `[ROOT, GESTOR]`
  - **Retorno:** Array com todos os itens georreferenciados para renderização dos pins e marcadores operacionais no mapa.

### 3.3. Denúncias (`/complaints`)
- `POST /complaints` `[ROOT, GESTOR, CIDADAO]`
  - **Payload:**
    - `description`: **Obrigatório** (string).
    - `address`: **Obrigatório** (string).
    - `category`: **Obrigatório** (uma das categorias oficiais: *"Buraco na via / rua"*, *"Entulho"*, *"Lixo acumulado"*, *"Iluminação pública"*, *"Problemas em calçadas"*, *"Sinalização danificada"*, *"Semáforo com defeito"*, *"Pavimentação"*, *"Drenagem / alagamento"*, *"Árvore ou vegetação interferindo na via (Poda/Manejo)"* ou *"Outros problemas de infraestrutura"*).
    - `latitude`: Opcional (número).
    - `longitude`: Opcional (número).
    - `photos`: Opcional (array de URLs de imagem).
- `GET /complaints` `[ROOT, GESTOR]` — Lista todas as denúncias para a tabela de gestão.
- `GET /complaints/heatmap` `[Público]`
  - **Query Params opcionais:** `?category=...&status=...`
  - **Retorno:** Array de pontos formatados `[{ id, category, latitude, longitude, weight, status }]`.
- `GET /complaints/mine` `[Autenticado]` — Lista as denúncias criadas pelo usuário logado.
- `GET /complaints/:id` `[Autenticado]` — Detalhes completos da denúncia.
- `PATCH /complaints/:id/status` `[ROOT, GESTOR]` — Atualiza o status (`RECEBIDA`, `EM_ANALISE`, `ENCAMINHADA`, `EM_ANDAMENTO`, `RESOLVIDA`, etc.).
- `PATCH /complaints/:id` `[Autor ou ROOT/GESTOR]` — Edita os dados de uma denúncia existente.
- `DELETE /complaints/:id` `[Autor ou ROOT/GESTOR]` — Exclui a denúncia.

### 3.4. Gestão Operacional e Varrição (`/operations`)
- `POST /operations/teams` `[ROOT, GESTOR]` — Cria equipe (`{ "name": "...", "description": "..." }`).
- `GET /operations/teams` `[ROOT, GESTOR]` — Lista todas as equipes de limpeza.
- `PATCH /operations/teams/:id` `[ROOT, GESTOR]` — Atualiza dados da equipe.
- `DELETE /operations/teams/:id` `[ROOT, GESTOR]` — Exclui uma equipe.
- `POST /operations/professionals` `[ROOT, GESTOR]` — Cadastra gari (`{ "fullName": "...", "identifier": "MAT123", "teamId": "..." }`).
- `GET /operations/professionals` `[ROOT, GESTOR]` — Lista todos os profissionais de limpeza.
- `PATCH /operations/professionals/:id` `[ROOT, GESTOR]` — Atualiza dados do profissional.
- `DELETE /operations/professionals/:id` `[ROOT, GESTOR]` — Exclui um profissional.
- `GET /operations/teams/:teamId/professionals` `[ROOT, GESTOR]` — Lista garis de uma equipe.

### 3.5. Ordens de Serviço (`/service-orders`)
- `POST /service-orders` `[ROOT, GESTOR]` — Cria Ordem de Serviço (`{ "category": "...", "description": "...", "address": "...", "complaintId": "opcional" }`).
- `GET /service-orders` `[ROOT, GESTOR]` — Lista todas as OSs.
- `GET /service-orders/:id` `[ROOT, GESTOR]` — Detalhes da OS.
- `PATCH /service-orders/:id/status` `[ROOT, GESTOR]`
  - Atualiza status e vincula equipe ou evidências fotográficas de conclusão.
  - **Payload:** `{ "status": "CONCLUIDA", "teamId": "...", "completionNotes": "...", "completionPhotos": [...] }`.
- `PATCH /service-orders/:id` `[ROOT, GESTOR]` — Atualiza OS avulsa.
- `DELETE /service-orders/:id` `[ROOT, GESTOR]` — Exclui uma OS.

### 3.6. Upload de Mídia (`/media`)
- `POST /media/upload-url` `[Autenticado]`
  - Gera URL pré-assinada para upload seguro no Supabase Storage sem sobrecarregar a API.
  - **Payload:** `{ "fileName": "foto.jpg", "mimeType": "image/jpeg" }`
  - **Retorno:** `{ "uploadUrl": "...", "publicUrl": "..." }`

---

## 4. WebSockets em Tempo Real (Socket.io)

- **Endpoint / Namespace:**
  - Local: `ws://localhost:3000/dashboard`
  - Produção: `wss://geolimp-api.onrender.com/dashboard`
- **Autenticação:** O token JWT pode ser fornecido via cookie de sessão ou `auth: { token: '...' }` na inicialização do client.
- **Eventos:**
  - `ping` (Emit): Envia teste de conectividade; recebe `pong`.
  - `heatmap_update` (Listen): Notifica que as densidades do mapa de calor foram atualizadas.
  - `new_map_item` (Listen): Notifica novos pontos (denúncia ou OS) adicionados ao mapa.
  - `update_map_item` (Listen): Notifica atualizações de status ou posição de um ponto existente.
