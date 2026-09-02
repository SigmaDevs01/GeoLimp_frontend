# Estratégia de Testes

- **Playwright (E2E)**: Escreva testes E2E focados nos fluxos de usuário completos.
  - Utilize as APIs do Playwright para injetar coordenadas de geolocalização falsas ao testar o mapa e o envio de denúncias.
  - Simule o armazenamento local ou cookies para manter estados de autenticação entre testes que exigem níveis de acesso diferentes (Gestor vs. Cidadão).
  - Teste cenários de erro interceptando a rede (ex: `page.route()`) para simular falhas no upload de fotos para o Supabase ou lentidão na rede.
- **Testes Unitários**: Utilize Vitest + React Testing Library apenas para regras de validação isoladas (ex: schemas do Zod) e utilitários globais.
