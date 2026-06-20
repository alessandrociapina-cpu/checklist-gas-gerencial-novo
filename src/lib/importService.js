import { importarBackup, db } from './db'

export async function processarArquivos(arquivos) {
  const resultados = []

  for (const arquivo of arquivos) {
    if (!arquivo.name.endsWith('.json')) {
      resultados.push({ arquivo: arquivo.name, erro: 'Não é um arquivo JSON.' })
      continue
    }

    try {
      const texto = await arquivo.text()
      const json = JSON.parse(texto)

      // Nota: esta verificação identifica o formato do arquivo, não é um controle de segurança.
      // Todo o conteúdo importado é tratado como dado não confiável nas funções de db.js.
      if (json.app !== 'checklist-gas-novo') {
        resultados.push({ arquivo: arquivo.name, erro: 'Formato não reconhecido (app inválido). Esperado: checklist-gas-novo.' })
        continue
      }

      const { novos, atualizados, total, fotos: qtdFotos } = await importarBackup(json)

      await db.importacoes.add({
        arquivo: arquivo.name,
        importadoEm: new Date().toISOString(),
        qtd: novos + atualizados,
      })

      resultados.push({ arquivo: arquivo.name, novos, atualizados, total, fotos: qtdFotos, ok: true })
    } catch (e) {
      resultados.push({ arquivo: arquivo.name, erro: e.message })
    }
  }

  return resultados
}

// Perguntas de segurança — espelha o data.js do app de campo
export const SEGURANCA_DEF = [
  { id: 'interferencias',     pergunta: 'Interferências localizadas e demarcadas?' },
  { id: 'cadastroGas',        pergunta: 'Foram disponibilizados os cadastros de gás para a equipe de campo?' },
  { id: 'cadastroAguaEsgoto', pergunta: 'Foram disponibilizados os cadastros de água e esgoto para a equipe de campo?' },
  { id: 'equipeTreinada',     pergunta: 'A equipe de campo está treinada para leitura correta dos cadastros e execução segura da atividade?' },
]

// ─── Conformidade ──────────────────────────────────────────────────────────

export function calcularConformidade(checklists) {
  return SEGURANCA_DEF.map(({ id, pergunta }) => {
    let sim = 0, nao = 0, total = 0
    for (const c of checklists) {
      const seg = Array.isArray(c.seguranca) ? c.seguranca : []
      const idx = SEGURANCA_DEF.findIndex(q => q.id === id)
      const item = seg[idx]
      if (!item || !item.resposta) continue
      total++
      if (item.resposta === 'Sim') sim++
      else if (item.resposta === 'Não') nao++
    }
    const pct = total > 0 ? Math.round((sim / total) * 100) : 0
    return { id, pergunta, conformidade: pct, sim, nao, total }
  })
}

export function calcConformidadeChecklist(c) {
  const seg = Array.isArray(c.seguranca) ? c.seguranca : []
  let sim = 0, respondidas = 0
  for (const item of seg) {
    if (item.resposta === 'Sim' || item.resposta === 'Não') {
      respondidas++
      if (item.resposta === 'Sim') sim++
    }
  }
  return respondidas > 0 ? Math.round((sim / respondidas) * 100) : 0
}

export function conformidadePorFiscal(checklists) {
  const map = {}
  for (const c of checklists) {
    const f = c.fiscal || 'Não informado'
    if (!map[f]) map[f] = { sim: 0, respondidas: 0, qtd: 0 }
    map[f].qtd++
    const seg = Array.isArray(c.seguranca) ? c.seguranca : []
    for (const item of seg) {
      if (item.resposta === 'Sim' || item.resposta === 'Não') {
        map[f].respondidas++
        if (item.resposta === 'Sim') map[f].sim++
      }
    }
  }
  return Object.entries(map)
    .map(([fiscal, d]) => ({
      fiscal,
      qtd: d.qtd,
      sim: d.sim,
      total: d.respondidas,
      pct: d.respondidas > 0 ? Math.round((d.sim / d.respondidas) * 100) : 0,
    }))
    .sort((a, b) => b.pct - a.pct)
}

export function tendenciaConformidade(checklists) {
  const map = {}
  for (const c of checklists) {
    const mes = c.data?.substring(0, 7)
    if (!mes) continue
    if (!map[mes]) map[mes] = { sim: 0, respondidas: 0 }
    const seg = Array.isArray(c.seguranca) ? c.seguranca : []
    for (const item of seg) {
      if (item.resposta === 'Sim' || item.resposta === 'Não') {
        map[mes].respondidas++
        if (item.resposta === 'Sim') map[mes].sim++
      }
    }
  }
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mes, d]) => ({
      mes,
      conformidade: d.respondidas > 0 ? Math.round((d.sim / d.respondidas) * 100) : 0,
    }))
}

export function pendenciasSemJustificativa(checklists) {
  let count = 0
  for (const c of checklists) {
    const seg = Array.isArray(c.seguranca) ? c.seguranca : []
    for (const item of seg) {
      if (item.resposta === 'Não' && !item.justificativa?.trim()) count++
    }
  }
  return count
}

// ─── Atividade ────────────────────────────────────────────────────────────

export function ultimaAtividadePorFiscal(checklists) {
  const map = {}
  for (const c of checklists) {
    const f = c.fiscal || 'Não informado'
    if (!map[f]) map[f] = { fiscal: f, ultimaData: '', qtd: 0 }
    map[f].qtd++
    if (c.data && c.data > map[f].ultimaData) map[f].ultimaData = c.data
  }
  return Object.values(map).sort((a, b) =>
    (b.ultimaData || '').localeCompare(a.ultimaData || '')
  )
}

export function agruparPorMes(checklists) {
  const map = {}
  for (const c of checklists) {
    const d = c.data ? c.data.substring(0, 7) : 'sem data'
    map[d] = (map[d] ?? 0) + 1
  }
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mes, quantidade]) => ({ mes, quantidade }))
}

export function agruparPorFiscal(checklists) {
  const map = {}
  for (const c of checklists) {
    const f = c.fiscal || 'Não informado'
    map[f] = (map[f] ?? 0) + 1
  }
  return Object.entries(map)
    .sort(([, a], [, b]) => b - a)
    .map(([fiscal, quantidade]) => ({ fiscal, quantidade }))
}

export function agruparPorUnidade(checklists) {
  const map = {}
  for (const c of checklists) {
    const u = c.obra?.unidade === 'Outros' ? (c.obra.unidadeOutro || 'Outros') : (c.obra?.unidade || 'Não informado')
    map[u] = (map[u] ?? 0) + 1
  }
  return Object.entries(map).sort(([, a], [, b]) => b - a).map(([unidade, quantidade]) => ({ unidade, quantidade }))
}

export function agruparPorCriticidade(checklists) {
  const map = {}
  for (const c of checklists) {
    const cr = c.gas?.criticidade || 'Não informado'
    map[cr] = (map[cr] ?? 0) + 1
  }
  return Object.entries(map).sort(([, a], [, b]) => b - a).map(([criticidade, quantidade]) => ({ criticidade, quantidade }))
}
