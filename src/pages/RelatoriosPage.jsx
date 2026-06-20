import { useEffect, useState } from 'react'
import { estatisticas } from '../lib/db'
import {
  agruparPorFiscal, agruparPorMes, calcularConformidade,
  conformidadePorFiscal, tendenciaConformidade, pendenciasSemJustificativa,
  ultimaAtividadePorFiscal, agruparPorUnidade, agruparPorCriticidade,
} from '../lib/importService'
import { fmtData } from '../lib/reportData'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line, Cell,
} from 'recharts'

const CORES = ['#22c55e', '#16a34a', '#4ade80', '#86efac', '#15803d', '#166534']

export default function RelatoriosPage() {
  const [dados, setDados] = useState(null)
  const [periodo, setPeriodo] = useState('todos')

  useEffect(() => { estatisticas().then(setDados) }, [])

  if (!dados) return <Spinner />

  let checklists = dados.checklists
  if (periodo !== 'todos') {
    const limite = new Date()
    limite.setMonth(limite.getMonth() - parseInt(periodo))
    checklists = checklists.filter(c => c.data && new Date(c.data) >= limite)
  }

  const porMes           = agruparPorMes(checklists)
  const porFiscal        = agruparPorFiscal(checklists)
  const conformidade     = calcularConformidade(checklists)
  const porMunicipio     = agruparPorMunicipio(checklists)
  const porUnidade       = agruparPorUnidade(checklists)
  const porCriticidade   = agruparPorCriticidade(checklists)
  const confFiscal       = conformidadePorFiscal(checklists)
  const tendencia        = tendenciaConformidade(checklists)
  const semJustificativa = pendenciasSemJustificativa(checklists)
  const atividadeFiscal  = ultimaAtividadePorFiscal(checklists)

  const totalSim  = conformidade.reduce((s, r) => s + r.sim, 0)
  const totalResp = conformidade.reduce((s, r) => s + r.total, 0)
  const confGeral = totalResp > 0 ? Math.round((totalSim / totalResp) * 100) : 0

  const semDados = dados.total === 0

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-brand-900">Relatórios</h1>
        <select
          value={periodo}
          onChange={e => setPeriodo(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="todos">Todo o período</option>
          <option value="1">Último mês</option>
          <option value="3">Últimos 3 meses</option>
          <option value="6">Últimos 6 meses</option>
          <option value="12">Último ano</option>
        </select>
      </div>

      {semDados ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-400">Nenhum dado disponível. Importe checklists primeiro.</p>
        </div>
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <KpiCard
              label="Conformidade geral"
              valor={`${confGeral}%`}
              cor={confGeral >= 80 ? 'verde' : confGeral >= 50 ? 'laranja' : 'vermelho'}
            />
            <KpiCard label="Checklists" valor={checklists.length} cor="azul" />
            <KpiCard
              label='"Não" sem justificativa'
              valor={semJustificativa}
              cor={semJustificativa === 0 ? 'verde' : 'vermelho'}
            />
            <KpiCard label="Fiscais" valor={confFiscal.length} cor="neutro" />
          </div>

          {/* Tendência de conformidade */}
          {tendencia.length > 1 && (
            <Painel titulo="Tendência de conformidade por mês (%)">
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={tendencia} margin={{ top: 4, right: 16, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={v => `${v}%`} />
                  <Line
                    type="monotone"
                    dataKey="conformidade"
                    stroke="#16a34a"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#16a34a' }}
                    name="Conformidade %"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Painel>
          )}

          {/* Evolução temporal */}
          <Painel titulo="Evolução de checklists por mês">
            {porMes.length > 1 ? (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={porMes} margin={{ top: 4, right: 16, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="quantidade"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="Checklists"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={porMes} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="quantidade" fill="#22c55e" radius={[4, 4, 0, 0]} name="Checklists" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Painel>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Produção por fiscal */}
            <Painel titulo="Produção por fiscal">
              {porFiscal.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={porFiscal} layout="vertical" margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                    <YAxis dataKey="fiscal" type="category" width={120} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="quantidade" radius={[0, 4, 4, 0]} name="Checklists">
                      {porFiscal.map((_, i) => (
                        <Cell key={i} fill={CORES[i % CORES.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Vazio />
              )}
            </Painel>

            {/* Atividade por município */}
            <Painel titulo="Atividade por município">
              {porMunicipio.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={porMunicipio} layout="vertical" margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                    <YAxis dataKey="municipio" type="category" width={140} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="quantidade" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Checklists" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Vazio />
              )}
            </Painel>
          </div>

          {/* Conformidade por verificação de segurança */}
          <Painel titulo="Conformidade por verificação de segurança">
            {conformidade.some(c => c.total > 0) ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-gray-500">
                      <th className="pb-2 font-medium">Verificação</th>
                      <th className="pb-2 font-medium text-right">Sim</th>
                      <th className="pb-2 font-medium text-right">Não</th>
                      <th className="pb-2 font-medium text-right">Total</th>
                      <th className="pb-2 font-medium text-right w-40">Conformidade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {conformidade.map(row => (
                      <tr key={row.id}>
                        <td className="py-2 text-gray-700 text-xs">{row.pergunta}</td>
                        <td className="py-2 text-right text-green-600 font-medium">{row.sim}</td>
                        <td className="py-2 text-right text-red-500">{row.nao}</td>
                        <td className="py-2 text-right text-gray-500">{row.total}</td>
                        <td className="py-2 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-20 bg-gray-100 rounded-full h-2 overflow-hidden">
                              <div
                                className="h-2 rounded-full"
                                style={{
                                  width: `${row.conformidade}%`,
                                  background: row.conformidade >= 80 ? '#16a34a' : row.conformidade >= 50 ? '#f59e0b' : '#ef4444',
                                }}
                              />
                            </div>
                            <span className={`text-xs font-semibold w-10 text-right
                              ${row.conformidade >= 80 ? 'text-green-600' : row.conformidade >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                              {row.total > 0 ? `${row.conformidade}%` : '—'}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Vazio />
            )}
          </Painel>

          {/* Conformidade por fiscal */}
          {confFiscal.length > 0 && (
            <Painel titulo="Conformidade por fiscal">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-gray-500">
                      <th className="pb-2 font-medium">Fiscal</th>
                      <th className="pb-2 font-medium text-right">Checklists</th>
                      <th className="pb-2 font-medium text-right">Sim</th>
                      <th className="pb-2 font-medium text-right">Respondidas</th>
                      <th className="pb-2 font-medium text-right w-40">Conformidade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {confFiscal.map(row => (
                      <tr key={row.fiscal}>
                        <td className="py-2 font-medium text-gray-700">{row.fiscal}</td>
                        <td className="py-2 text-right text-gray-500">{row.qtd}</td>
                        <td className="py-2 text-right text-green-600 font-medium">{row.sim}</td>
                        <td className="py-2 text-right text-gray-500">{row.total}</td>
                        <td className="py-2 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-20 bg-gray-100 rounded-full h-2 overflow-hidden">
                              <div
                                className="h-2 rounded-full"
                                style={{
                                  width: `${row.pct}%`,
                                  background: row.pct >= 80 ? '#16a34a' : row.pct >= 50 ? '#f59e0b' : '#ef4444',
                                }}
                              />
                            </div>
                            <span className={`text-xs font-semibold w-10 text-right
                              ${row.pct >= 80 ? 'text-green-600' : row.pct >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                              {row.pct}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Painel>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Por unidade */}
            {porUnidade.length > 0 && (
              <Painel titulo="Checklists por unidade">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={porUnidade} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="unidade" tick={{ fontSize: 10 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="quantidade" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Checklists" />
                  </BarChart>
                </ResponsiveContainer>
              </Painel>
            )}

            {/* Por criticidade */}
            {porCriticidade.length > 0 && (
              <Painel titulo="Checklists por criticidade">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={porCriticidade} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="criticidade" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="quantidade" radius={[4, 4, 0, 0]} name="Checklists">
                      {porCriticidade.map((item, i) => (
                        <Cell
                          key={i}
                          fill={item.criticidade === 'Alta' ? '#ef4444' : item.criticidade === 'Média' ? '#f59e0b' : '#22c55e'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Painel>
            )}
          </div>

          {/* Última atividade por fiscal */}
          {atividadeFiscal.length > 0 && (
            <Painel titulo="Última atividade por fiscal">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-gray-500">
                      <th className="pb-2 font-medium">Fiscal</th>
                      <th className="pb-2 font-medium text-right">Checklists</th>
                      <th className="pb-2 font-medium text-right">Última submissão</th>
                      <th className="pb-2 font-medium text-right">Dias atrás</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {atividadeFiscal.map(row => {
                      const diasAtras = row.ultimaData
                        ? Math.floor((Date.now() - new Date(row.ultimaData)) / 86_400_000)
                        : null
                      return (
                        <tr key={row.fiscal}>
                          <td className="py-2 font-medium text-gray-700">{row.fiscal}</td>
                          <td className="py-2 text-right text-gray-500">{row.qtd}</td>
                          <td className="py-2 text-right text-gray-600">
                            {row.ultimaData ? fmtData(row.ultimaData) : '—'}
                          </td>
                          <td className="py-2 text-right">
                            {diasAtras !== null ? (
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full
                                ${diasAtras <= 7  ? 'bg-green-100 text-green-700'
                                  : diasAtras <= 30 ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-red-100 text-red-700'}`}>
                                {diasAtras}d
                              </span>
                            ) : '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Painel>
          )}

          {/* Ranking de fiscais */}
          <Painel titulo="Ranking de produção — fiscais">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-500">
                    <th className="pb-2 font-medium w-8">#</th>
                    <th className="pb-2 font-medium">Fiscal</th>
                    <th className="pb-2 font-medium text-right">Checklists</th>
                    <th className="pb-2 font-medium text-right">Participação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {porFiscal.map((row, i) => (
                    <tr key={row.fiscal}>
                      <td className="py-2 text-gray-400 font-medium">{i + 1}</td>
                      <td className="py-2 font-medium text-gray-700">{row.fiscal}</td>
                      <td className="py-2 text-right font-bold text-brand-600">{row.quantidade}</td>
                      <td className="py-2 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-20 bg-gray-100 rounded-full h-1.5">
                            <div
                              className="bg-brand-500 h-1.5 rounded-full"
                              style={{ width: `${Math.round((row.quantidade / checklists.length) * 100)}%` }}
                            />
                          </div>
                          <span className="text-gray-500 text-xs w-8">
                            {Math.round((row.quantidade / checklists.length) * 100)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Painel>
        </>
      )}
    </div>
  )
}

function agruparPorMunicipio(checklists) {
  const map = {}
  for (const c of checklists) {
    const m = c.municipio || 'Não informado'
    if (m && m !== 'Não informado') map[m] = (map[m] ?? 0) + 1
  }
  return Object.entries(map)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([municipio, quantidade]) => ({ municipio, quantidade }))
}

function KpiCard({ label, valor, cor }) {
  const esquemas = {
    verde:    'bg-green-50 border-green-100 text-green-700',
    laranja:  'bg-orange-50 border-orange-100 text-orange-700',
    vermelho: 'bg-red-50 border-red-100 text-red-700',
    azul:     'bg-blue-50 border-blue-100 text-blue-700',
    neutro:   'bg-gray-50 border-gray-200 text-gray-700',
  }
  return (
    <div className={`rounded-xl border p-4 ${esquemas[cor] ?? esquemas.neutro}`}>
      <p className="text-xs font-medium uppercase tracking-wide opacity-70">{label}</p>
      <p className="text-3xl font-bold mt-1">{valor}</p>
    </div>
  )
}

function Painel({ titulo, children }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <h2 className="font-semibold text-gray-700 mb-4">{titulo}</h2>
      {children}
    </div>
  )
}

function Vazio() {
  return <p className="text-gray-400 text-sm text-center py-8">Sem dados suficientes.</p>
}

function Spinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
