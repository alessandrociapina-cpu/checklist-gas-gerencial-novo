import { useEffect, useState } from 'react'
import { db } from '../lib/db'
import { calcConformidadeChecklist } from '../lib/importService'

export default function ChecklistsPage({ onDetalhe, onImprimir }) {
  const [checklists, setChecklists] = useState(null)
  const [busca, setBusca] = useState('')
  const [fiscal, setFiscal] = useState('')
  const [fiscais, setFiscais] = useState([])
  const [ordenar, setOrdenar] = useState('data_desc')

  useEffect(() => {
    db.checklists.toArray().then(todos => {
      setChecklists(todos)
      const fs = [...new Set(todos.map(c => c.fiscal).filter(Boolean))].sort()
      setFiscais(fs)
    })
  }, [])

  if (!checklists) return <Spinner />

  let filtrados = checklists
  if (busca) {
    const q = busca.toLowerCase()
    filtrados = filtrados.filter(c =>
      c.obra?.os?.toLowerCase().includes(q) ||
      c.obra?.endereco?.toLowerCase().includes(q) ||
      c.fiscal?.toLowerCase().includes(q) ||
      c.municipio?.toLowerCase().includes(q) ||
      c.gas?.criticidade?.toLowerCase().includes(q)
    )
  }
  if (fiscal) filtrados = filtrados.filter(c => c.fiscal === fiscal)

  filtrados = [...filtrados].sort((a, b) => {
    if (ordenar === 'data_desc') return (b.data || '').localeCompare(a.data || '')
    if (ordenar === 'data_asc')  return (a.data || '').localeCompare(b.data || '')
    if (ordenar === 'fiscal')    return (a.fiscal || '').localeCompare(b.fiscal || '')
    return 0
  })

  return (
    <div className="max-w-5xl space-y-5">
      <h1 className="text-2xl font-bold text-brand-900">Checklists</h1>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="Buscar por OS, endereço, fiscal…"
          value={busca}
          onChange={e => setBusca(e.target.value)}
          className="flex-1 min-w-48 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <select
          value={fiscal}
          onChange={e => setFiscal(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">Todos os fiscais</option>
          {fiscais.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
        <select
          value={ordenar}
          onChange={e => setOrdenar(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="data_desc">Mais recentes</option>
          <option value="data_asc">Mais antigos</option>
          <option value="fiscal">Por fiscal</option>
        </select>
      </div>

      {filtrados.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-400">
            {checklists.length === 0
              ? 'Nenhum checklist importado ainda.'
              : 'Nenhum checklist corresponde aos filtros.'}
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500">{filtrados.length} checklist{filtrados.length !== 1 ? 's' : ''}</p>

          {/* ── Cards (mobile) ──────────────────────────────── */}
          <div className="sm:hidden bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden divide-y divide-gray-100">
            {filtrados.map(c => {
              const conformidade = calcConformidadeChecklist(c)
              return (
                <div key={c.id} className="px-4 py-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 truncate">
                        {c.obra?.os ? `OS ${c.obra.os}` : '—'}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{c.obra?.endereco || '—'}</p>
                      <div className="flex flex-wrap items-center gap-x-2 mt-1 text-xs text-gray-500">
                        {c.data && <span>{formatarData(c.data)}</span>}
                        {c.fiscal && <span>· {c.fiscal}</span>}
                        {c.municipio && <span>· {c.municipio}</span>}
                        {c.gas?.criticidade && (
                          <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${criticidadeCor(c.gas.criticidade)}`}>
                            {c.gas.criticidade}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold
                        ${conformidade >= 80 ? 'bg-green-100 text-green-700'
                          : conformidade >= 50 ? 'bg-yellow-100 text-yellow-700'
                          : conformidade > 0  ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-500'}`}>
                        {conformidade > 0 ? `${conformidade}%` : '—'}
                      </span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => onDetalhe(c.id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-brand-50 text-brand-600 text-xs font-medium"
                          title="Ver relatório"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Ver
                        </button>
                        <button
                          onClick={() => onImprimir(c.id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs font-medium"
                          title="Imprimir / PDF"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                          </svg>
                          PDF
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── Tabela (sm+) ────────────────────────────────── */}
          <div className="hidden sm:block bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-left text-gray-500">
                  <th className="px-4 py-3 font-medium">Data</th>
                  <th className="px-4 py-3 font-medium">OS / Endereço</th>
                  <th className="px-4 py-3 font-medium">Fiscal</th>
                  <th className="px-4 py-3 font-medium hidden md:table-cell">Município</th>
                  <th className="px-4 py-3 font-medium hidden lg:table-cell">Criticidade</th>
                  <th className="px-4 py-3 font-medium text-center">Conformidade</th>
                  <th className="px-4 py-3 font-medium text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtrados.map(c => {
                  const conformidade = calcConformidadeChecklist(c)
                  return (
                    <tr key={c.id} className="hover:bg-green-50 transition-colors">
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {c.data ? formatarData(c.data) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800 truncate max-w-xs">
                          {c.obra?.os ? `OS ${c.obra.os}` : '—'}
                        </p>
                        <p className="text-xs text-gray-400 truncate max-w-xs">{c.obra?.endereco}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{c.fiscal || '—'}</td>
                      <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{c.municipio || '—'}</td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {c.gas?.criticidade ? (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${criticidadeCor(c.gas.criticidade)}`}>
                            {c.gas.criticidade}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold
                          ${conformidade >= 80 ? 'bg-green-100 text-green-700'
                            : conformidade >= 50 ? 'bg-yellow-100 text-yellow-700'
                            : conformidade > 0  ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-500'}`}>
                          {conformidade > 0 ? `${conformidade}%` : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onDetalhe(c.id)}
                            className="p-1.5 rounded-lg text-brand-600 hover:bg-brand-50"
                            title="Ver relatório completo"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => onImprimir(c.id)}
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
                            title="Imprimir / Salvar PDF"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

function criticidadeCor(c) {
  if (c === 'Alta')  return 'bg-red-100 text-red-700'
  if (c === 'Média') return 'bg-yellow-100 text-yellow-700'
  if (c === 'Baixa') return 'bg-green-100 text-green-700'
  return 'bg-gray-100 text-gray-600'
}

function formatarData(data) {
  try {
    const [a, m, d] = data.split('-')
    return `${d}/${m}/${a}`
  } catch { return data }
}

function Spinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
