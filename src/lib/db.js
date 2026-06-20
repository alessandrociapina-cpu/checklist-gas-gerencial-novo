import Dexie from 'dexie'

export const db = new Dexie('gas-gerencial-novo')

db.version(1).stores({
  checklists: 'id, atualizadoEm, *fiscal, *municipio, data',
  fotos: 'id, checklistId, itemKey',
  importacoes: '++id, arquivo, importadoEm, qtd',
})

function municipioResolvido(obra = {}) {
  if (!obra.municipio) return ''
  return obra.municipio === 'Outros' ? (obra.municipioOutro || 'Outros') : obra.municipio
}

export async function importarBackup(jsonData) {
  if (!jsonData?.dados?.length) throw new Error('Arquivo sem dados de checklists.')

  let novos = 0
  let atualizados = 0
  let totalFotos = 0

  for (const entrada of jsonData.dados) {
    const { checklist, fotos: fotosEntrada = [] } = entrada
    if (!checklist?.id) continue

    const existing = await db.checklists.get(checklist.id)
    const maisRecente =
      !existing ||
      new Date(checklist.atualizadoEm) > new Date(existing.atualizadoEm)

    if (maisRecente) {
      const { fotos: _fotosEmbutidas, ...checklistSemFotos } = checklist
      const flat = {
        ...checklistSemFotos,
        fiscal: checklist.responsaveis?.fiscal ?? '',
        municipio: municipioResolvido(checklist.obra),
        data: checklist.criadoEm?.substring(0, 10) ?? '',
      }
      await db.checklists.put(flat)
      existing ? atualizados++ : novos++
    }

    const todasFotos = []

    for (let fi = 0; fi < fotosEntrada.length; fi++) {
      const f = fotosEntrada[fi]
      todasFotos.push({
        ...f,
        id: f.id || `${checklist.id}_foto_${fi}`,
        checklistId: f.checklistId || checklist.id,
      })
    }

    if (todasFotos.length) {
      await db.fotos.bulkPut(todasFotos)
      totalFotos += todasFotos.length
    }
  }

  return { novos, atualizados, total: jsonData.dados.length, fotos: totalFotos }
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
