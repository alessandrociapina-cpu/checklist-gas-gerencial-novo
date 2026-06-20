// Labels dos campos da aba Obra
export const LABELS_OBRA = [
  { key: 'unidade',    label: 'Unidade Responsável',
    transform: (v, o) => v === 'Outros' ? (o.unidadeOutro || 'Outros') : v },
  { key: 'os',         label: 'Número da OS' },
  { key: 'endereco',   label: 'Endereço' },
  { key: 'municipio',  label: 'Município',
    transform: (v, o) => v === 'Outros' ? (o.municipioOutro || 'Outros') : v },
  { key: 'localizacao', label: 'Localização (GPS)' },
  { key: 'tipoServico', label: 'Tipo de Serviço',
    transform: (v, o) => v === 'Outros' ? (o.tipoServicoOutro || 'Outros') : v },
]

// Labels dos campos da aba Rede de Gás
export const LABELS_GAS = [
  { key: 'protocoloComgas',          label: 'Protocolo de Atendimento Comgás' },
  { key: 'protocoloAcompanhamento',  label: 'Protocolo de Acompanhamento' },
  { key: 'qtdInterferencias',        label: 'Quantidade de Interferências' },
  { key: 'material',                 label: 'Material' },
  { key: 'profundidade',             label: 'Profundidade (m)' },
  { key: 'diametro',                 label: 'Diâmetro Rede/Ramal de Gás' },
  { key: 'pressao',                  label: 'Pressão' },
  { key: 'distanciaVala',            label: 'Distância entre vala e interferência mais próxima (m)' },
  { key: 'criticidade',              label: 'Criticidade' },
  { key: 'responsavelDemarcacao',    label: 'Responsável pela demarcação em campo' },
]

// Labels dos campos da aba Responsáveis
export const LABELS_RESPONSAVEIS = [
  { key: 'fiscal',                label: 'Fiscal Sabesp' },
  { key: 'empresaExecutora',      label: 'Empresa Executora' },
  { key: 'responsavelExecutora',  label: 'Responsável Executora' },
  { key: 'encarregado',           label: 'Encarregado Sabesp' },
  { key: 'coordenador',           label: 'Coordenador Sabesp' },
  { key: 'plantonista',           label: 'Plantonista' },
]

// Perguntas de segurança (espelha data.js do app de campo)
export const SEGURANCA_PERGUNTAS = [
  'Interferências localizadas e demarcadas?',
  'Foram disponibilizados os cadastros de gás para a equipe de campo?',
  'Foram disponibilizados os cadastros de água e esgoto para a equipe de campo?',
  'A equipe de campo está treinada para leitura correta dos cadastros e execução segura da atividade?',
]

export function fmtData(d) {
  if (!d) return '—'
  try {
    const s = d.substring(0, 10)
    const [a, m, dd] = s.split('-')
    return `${dd}/${m}/${a}`
  } catch { return d }
}

// itemKey das fotos de segurança: "seg:<id>"
export const SEGURANCA_IDS = ['interferencias', 'cadastroGas', 'cadastroAguaEsgoto', 'equipeTreinada']

export function fotosDoItemSeg(fotos, idx) {
  const id = SEGURANCA_IDS[idx]
  return fotos.filter(f => f.itemKey === `seg:${id}`)
}

export function fotosObs(fotos) {
  return fotos.filter(f => f.itemKey === 'obs')
}

export function fotosGerais(fotos) {
  return fotos.filter(f => !f.itemKey || f.itemKey === '')
}
