# Contexto da Plataforma (Zeladoria Urbana)
O sistema gerencia denúncias de infraestrutura urbana e a operação de limpeza pública.

- **Fluxo de Ocorrências**: As denúncias chegam via WhatsApp (chatbot) ou painel web(que deverá ser a página inicial uma landingpage com informações do projeto e link para criar uma denúncia), gerando ordens de serviço (OS) com geolocalização (pedir acesso a localização do dispositivo, opcional o envio da geolocalização, pode ser só o endereço mesmo) e fotos (opicional as fotos).
- **Gestão Operacional**: A plataforma controla o envio e status das equipes de limpeza.Os profissionais de limpeza são cadastrados com suas funções e equipes. O sistema deve permitir que os gestores atribuam tarefas aos profissionais e acompanhem o andamento das operações.
- **Regra de Ponto**: Não crie fluxos para check-in remoto, rastreamento móvel de indivíduos ou gestão de frotas de caminhões de lixo. 
- **Mapa e Heatmap**: O dashboard requer atualizações em tempo real do status de execução das OSs no mapa interativo e o processamento de densidade (heatmap), separando por tipo de serviço:
    - Buraco na via / rua
    - Entulho
    - Lixo acumulado
    - Iluminação pública
    - Problemas em calçadas
    - Sinalização danificada
    - Semáforo com defeito
    - Pavimentação
    - Drenagem / alagamento
    - Árvore ou vegetação interferindo na via (Poda/Manejo)
    - Outros problemas de infraestrutura