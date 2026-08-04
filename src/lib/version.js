export const VERSAO = '1.3.0'

export const CHANGELOG = [
  {
    versao: '1.3.0',
    data: '2026-08-04',
    mudancas: [
      'Compactação das fotos na exportação, com opções de qualidade',
      'Arquivos acima de 20 MB são divididos automaticamente em partes que cabem em e-mail',
      'Barra de progresso e resumo da economia obtida ao exportar',
      'Fotos originais nunca são substituídas por cópias compactadas ao importar',
    ],
  },
  {
    versao: '1.2.0',
    data: '2026-08-04',
    mudancas: [
      'Unificação de bancos: exporte o banco consolidado e importe o de outro computador',
      'Importação aceita tanto o backup do fiscal quanto o consolidado de outro gerencial',
      'Botão para excluir checklists, com confirmação e remoção das fotos',
      'Relatório com linguagem autoexplicativa (aprovadas / não conformidades)',
      'Correção: observações do fiscal eram descartadas na importação',
    ],
  },
  {
    versao: '1.1.0',
    data: '2026-06-20',
    mudancas: [
      'Identidade visual atualizada com logo e cores da Sabesp (azul #003B5C / #00AEEF)',
      'Ícones do app atualizados com logo Sabesp + "Check-list Gás Gerencial"',
      'Relatório PDF com logo Sabesp no cabeçalho',
      'Melhorias de segurança: CSP, validação de arquivos importados, sanitização de dados',
    ],
  },
  {
    versao: '1.0.1',
    data: '2026-06-20',
    mudancas: [
      'Correção de deploy para GitHub Pages',
      'Lançamento inicial do sistema gerencial para Checklist Gás Novo',
      'Importação de checklists JSON exportados pelo app Checklist Gás Novo',
      'Dashboard com cards de resumo e gráficos de atividade',
      'Relatórios: conformidade por verificação, por fiscal, tendência mensal',
      'Relatório individual com todas as seções: obra, gás, segurança, responsáveis e fotos',
      'Instalável como PWA (funciona offline)',
    ],
  },
]
