import Dexie from 'dexie'

export const db = new Dexie('gas-gerencial-novo')

db.version(1).stores({
  checklists: 'id, atualizadoEm, *fiscal, *municipio, data',
  fotos: 'id, checklistId, itemKey',
  importacoes: '++id, arquivo, importadoEm, qtd',
})

// Prefixos de dataUrl aceitos para fotos e assinaturas (allowlist restritiva)
const DATA_URL_PERMITIDO = ['data:image/jpeg;', 'data:image/png;', 'data:image/gif;', 'data:image/webp;']
const TAMANHO_MAX_DATAURL = 5 * 1024 * 1024  // 5 MB por imagem
const TAMANHO_MAX_ARQUIVO = 100 * 1024 * 1024 // 100 MB por arquivo de backup

function dataUrlValida(v) {
  if (typeof v !== 'string') return false
  if (v.length > TAMANHO_MAX_DATAURL) return false
  return DATA_URL_PERMITIDO.some(p => v.startsWith(p))
}

function municipioResolvido(obra = {}) {
  if (!obra.municipio) return ''
  return obra.municipio === 'Outros' ? (obra.municipioOutro || 'Outros') : obra.municipio
}

// Normaliza observações: o app de campo grava um objeto { texto }, mas versões
// antigas podiam gravar uma string simples. Sempre devolve objeto para o relatório.
function sanitizarObservacoes(o) {
  if (typeof o === 'string') return { texto: o }
  if (o && typeof o === 'object') return o
  return {}
}

// Garante que apenas campos conhecidos e seguros do checklist sejam persistidos
function sanitizarChecklist(c) {
  return {
    id:            typeof c.id === 'string'            ? c.id            : '',
    criadoEm:      typeof c.criadoEm === 'string'      ? c.criadoEm      : '',
    atualizadoEm:  typeof c.atualizadoEm === 'string'  ? c.atualizadoEm  : '',
    obra:          c.obra          && typeof c.obra === 'object'          ? c.obra          : {},
    gas:           c.gas           && typeof c.gas === 'object'           ? c.gas           : {},
    seguranca:     Array.isArray(c.seguranca)                             ? c.seguranca     : [],
    responsaveis:  c.responsaveis  && typeof c.responsaveis === 'object'  ? c.responsaveis  : {},
    observacoes:   sanitizarObservacoes(c.observacoes),
    // assinaturas são dataUrls — validadas individualmente abaixo
    assinaturas:   c.assinaturas   && typeof c.assinaturas === 'object'   ? c.assinaturas   : {},
  }
}

// Valida assinaturas embutidas no checklist (são dataUrls de imagem)
function sanitizarAssinaturas(assinaturas) {
  const seguras = {}
  for (const [k, v] of Object.entries(assinaturas)) {
    if (dataUrlValida(v)) seguras[k] = v
  }
  return seguras
}

export async function importarBackup(jsonData) {
  // Validação estrutural básica antes de processar qualquer dado
  if (!Array.isArray(jsonData?.dados) || jsonData.dados.length === 0)
    throw new Error('Arquivo sem dados de checklists.')

  // Limite de tamanho total (verificação aproximada via contagem de entradas)
  if (jsonData.dados.length > 5000)
    throw new Error('Arquivo contém mais entradas do que o limite permitido (5000).')

  let novos = 0
  let atualizados = 0
  let totalFotos = 0

  for (const entrada of jsonData.dados) {
    const { checklist: checklistBruto, fotos: fotosEntrada = [] } = entrada
    if (!checklistBruto?.id || typeof checklistBruto.id !== 'string') continue

    const existing = await db.checklists.get(checklistBruto.id)
    const maisRecente =
      !existing ||
      new Date(checklistBruto.atualizadoEm) > new Date(existing.atualizadoEm)

    if (maisRecente) {
      // Usa apenas campos conhecidos (allowlist) em vez de spread irrestrito
      const c = sanitizarChecklist(checklistBruto)
      c.assinaturas = sanitizarAssinaturas(c.assinaturas)

      const flat = {
        ...c,
        fiscal:    c.responsaveis?.fiscal ?? '',
        municipio: municipioResolvido(c.obra),
        data:      c.criadoEm?.substring(0, 10) ?? '',
      }
      await db.checklists.put(flat)
      existing ? atualizados++ : novos++
    }

    const todasFotos = []
    for (let fi = 0; fi < fotosEntrada.length; fi++) {
      const f = fotosEntrada[fi]
      // Valida que o dataUrl é uma imagem segura antes de armazenar
      if (!dataUrlValida(f.dataUrl)) continue
      todasFotos.push({
        id:          f.id || `${checklistBruto.id}_foto_${fi}`,
        checklistId: f.checklistId || checklistBruto.id,
        itemKey:     typeof f.itemKey === 'string' ? f.itemKey : '',
        dataUrl:     f.dataUrl,
      })
    }

    if (todasFotos.length) {
      await db.fotos.bulkPut(todasFotos)
      totalFotos += todasFotos.length
    }
  }

  return { novos, atualizados, total: jsonData.dados.length, fotos: totalFotos }
}

export { TAMANHO_MAX_ARQUIVO }

// Identificadores de origem aceitos na importação:
// - checklist-gas-novo           → backup enviado pelo fiscal (app de campo)
// - checklist-gas-gerencial-novo → backup consolidado de outro computador gerencial
export const APP_CAMPO     = 'checklist-gas-novo'
export const APP_GERENCIAL = 'checklist-gas-gerencial-novo'
export const APPS_ACEITOS  = [APP_CAMPO, APP_GERENCIAL]

// Contagem rápida para exibir na tela antes de exportar
export async function contarRegistros() {
  const [checklists, fotos] = await Promise.all([
    db.checklists.count(),
    db.fotos.count(),
  ])
  return { checklists, fotos }
}

/**
 * Gera um backup consolidado de TODO o banco local, no mesmo formato que a
 * importação já entende. Permite unificar os bancos de dois encarregados:
 * cada um exporta, troca o arquivo e importa o do outro.
 *
 * Os campos planos (fiscal/municipio/data) são derivados na importação, então
 * não precisam ser exportados — o round-trip export→import é seguro.
 */
export async function exportarBanco({ incluirFotos = true, identificacao = '' } = {}) {
  const checklists = await db.checklists.toArray()

  // Agrupa fotos por checklist em uma única passagem
  const fotosPorChecklist = new Map()
  if (incluirFotos) {
    for (const f of await db.fotos.toArray()) {
      if (!fotosPorChecklist.has(f.checklistId)) fotosPorChecklist.set(f.checklistId, [])
      fotosPorChecklist.get(f.checklistId).push({
        id:          f.id,
        checklistId: f.checklistId,
        itemKey:     f.itemKey ?? '',
        dataUrl:     f.dataUrl,
      })
    }
  }

  const dados = checklists.map(c => ({
    checklist: {
      id:           c.id,
      criadoEm:     c.criadoEm,
      atualizadoEm: c.atualizadoEm,
      obra:         c.obra,
      gas:          c.gas,
      seguranca:    c.seguranca,
      responsaveis: c.responsaveis,
      observacoes:  c.observacoes,
      assinaturas:  c.assinaturas,
    },
    fotos: fotosPorChecklist.get(c.id) ?? [],
  }))

  return {
    app: APP_GERENCIAL,
    exportadoEm: new Date().toISOString(),
    identificacao: typeof identificacao === 'string' ? identificacao.slice(0, 60) : '',
    incluiFotos: incluirFotos,
    dados,
  }
}

export async function estatisticas() {
  const todos = await db.checklists.toArray()
  return {
    total: todos.length,
    fiscais: [...new Set(todos.map(c => c.fiscal).filter(Boolean))],
    municipios: [...new Set(todos.map(c => c.municipio).filter(Boolean))],
    checklists: todos,
  }
}
