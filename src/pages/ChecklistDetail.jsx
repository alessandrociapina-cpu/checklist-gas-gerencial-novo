import { useEffect, useState } from 'react'
import { db } from '../lib/db'
import {
  LABELS_OBRA, LABELS_GAS, LABELS_RESPONSAVEIS, SEGURANCA_PERGUNTAS,
  fmtData, fotosDoItemSeg, fotosObs, fotosGerais,
} from '../lib/reportData'

export default function ChecklistDetail({ id, onVoltar, autoPrint = false }) {
  const [checklist, setChecklist] = useState(null)
  const [fotos, setFotos] = useState([])
  const [lightbox, setLightbox] = useState(null)

  useEffect(() => {
    db.checklists.get(id).then(setChecklist)
    db.fotos.where('checklistId').equals(id).toArray().then(setFotos)
  }, [id])

  useEffect(() => {
    if (autoPrint && checklist) {
      const t = setTimeout(() => window.print(), 500)
      return () => clearTimeout(t)
    }
  }, [autoPrint, checklist])

  if (!checklist) return <Spinner />

  const obra = checklist.obra ?? {}
  const gas  = checklist.gas ?? {}
  const seg  = Array.isArray(checklist.seguranca) ? checklist.seguranca : []
  const resp = checklist.responsaveis ?? {}
  const assin = checklist.assinaturas ?? {}
  const obs  = checklist.observacoes ?? {}

  const totalSim  = seg.filter(i => i.resposta === 'Sim').length
  const totalNao  = seg.filter(i => i.resposta === 'Não').length
  const respondidas = totalSim + totalNao
  const pctGeral  = respondidas > 0 ? Math.round((totalSim / respondidas) * 100) : 0
  const totalFotos = fotos.length

  const municipioExib = obra.municipio === 'Outros' ? (obra.municipioOutro || 'Outros') : obra.municipio

  return (
    <div style={{ fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif" }}>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="no-print fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={lightbox}
            alt="Foto ampliada"
            style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: 8, objectFit: 'contain' }}
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}

      {/* Toolbar */}
      <div className="no-print flex items-center gap-3 mb-4">
        <button onClick={onVoltar}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500" title="Voltar">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="font-semibold text-brand-900 flex-1 truncate">
          {obra.os ? `OS ${obra.os}` : 'Checklist'} — {obra.endereco || municipioExib}
        </span>
        <button onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg text-sm font-medium">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Imprimir / PDF
        </button>
      </div>

      {/* RELATÓRIO */}
      <div className="rel-page">

        {/* Cabeçalho */}
        <div className="rel-header">
          <div className="rel-header-logo">
            <img src={`${import.meta.env.BASE_URL}icons/sabesp-logo.png`} alt="Sabesp"
              style={{ height: 60, width: 'auto', objectFit: 'contain' }} />
          </div>
          <div className="rel-header-divider" />
          <div className="rel-header-info">
            <h1>Checklist de Segurança — Obras com Interferência em Rede de Gás</h1>
            <p>
              {obra.os && <><strong>OS:</strong> {obra.os}&ensp;</>}
              {municipioExib && <><strong>Município:</strong> {municipioExib}&ensp;</>}
              <strong>Data:</strong> {fmtData(checklist.criadoEm)}
              {resp.fiscal && <>&ensp;<strong>Fiscal:</strong> {resp.fiscal}</>}
            </p>
          </div>
        </div>

        {/* Cards de resumo */}
        <div className="rel-resumo">
          <Card cor={pctGeral >= 80 ? 'verde' : pctGeral >= 50 ? 'laranja' : 'vermelho'}
            valor={`${pctGeral}%`} label="Conformidade" />
          <Card cor="azul"    valor={totalSim}  label="Sim" />
          <Card cor="laranja" valor={totalNao}  label="Não" />
          <Card cor="neutro"  valor={totalFotos} label="Fotos" />
          {gas.criticidade && <Card cor={gas.criticidade === 'Alta' ? 'vermelho' : gas.criticidade === 'Média' ? 'laranja' : 'verde'} valor={gas.criticidade} label="Criticidade" />}
        </div>

        {/* Dados da Obra */}
        <Secao titulo="Dados da Obra">
          <table className="rel-tabela">
            <tbody>
              {LABELS_OBRA.map(({ key, label, transform }) => {
                const val = obra[key]
                if (!val && val !== 0) return null
                const display = transform ? transform(val, obra) : val
                if (!display) return null
                return (
                  <tr key={key}>
                    <td className="rel-td-label">{label}</td>
                    <td className="rel-td-valor">{display}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Secao>

        {/* Rede de Gás */}
        {Object.values(gas).some(Boolean) && (
          <Secao titulo="Informações da Rede de Gás">
            <table className="rel-tabela">
              <tbody>
                {LABELS_GAS.map(({ key, label }) => {
                  const val = gas[key]
                  if (!val && val !== 0) return null
                  return (
                    <tr key={key}>
                      <td className="rel-td-label">{label}</td>
                      <td className="rel-td-valor">{val}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </Secao>
        )}

        {/* Verificação de Segurança */}
        {seg.length > 0 && (
          <Secao
            titulo="Verificação de Segurança"
            badge={`${totalSim}/${respondidas || SEGURANCA_PERGUNTAS.length} — ${pctGeral}%`}
            corBadge={pctGeral >= 80 ? 'verde' : pctGeral >= 50 ? 'laranja' : 'vermelho'}
          >
            <div className="rel-barra-bg">
              <div className="rel-barra-fill"
                style={{ width: `${pctGeral}%`, background: pctGeral >= 80 ? '#15803d' : pctGeral >= 50 ? '#f58220' : '#c5221f' }} />
            </div>
            <table className="rel-tabela rel-tabela-itens">
              <thead>
                <tr>
                  <th style={{ width: 32 }}>#</th>
                  <th>Verificação</th>
                  <th style={{ width: 80, textAlign: 'center' }}>Resposta</th>
                  <th>Justificativa</th>
                </tr>
              </thead>
              <tbody>
                {SEGURANCA_PERGUNTAS.map((pergunta, i) => {
                  const item = seg[i] ?? { resposta: '', justificativa: '' }
                  const ehSim = item.resposta === 'Sim'
                  const ehNao = item.resposta === 'Não'
                  const fts   = fotosDoItemSeg(fotos, i)
                  return (
                    <>
                      <tr key={i} className={ehSim ? 'rel-ok' : ehNao ? 'rel-nok' : ''}>
                        <td style={{ textAlign: 'center', color: '#6b7280' }}>{i + 1}</td>
                        <td style={{ fontWeight: 500 }}>{pergunta}</td>
                        <td style={{ textAlign: 'center' }}>
                          {item.resposta ? (
                            <span className={ehSim ? 'rel-badge-ok' : 'rel-badge-nok'}>
                              {ehSim ? '✓ Sim' : '✗ Não'}
                            </span>
                          ) : (
                            <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>—</span>
                          )}
                        </td>
                        <td style={{ fontSize: '0.8rem' }}>
                          {ehNao && item.justificativa && (
                            <span className="rel-justificativa">⚠ {item.justificativa}</span>
                          )}
                          {ehNao && !item.justificativa && (
                            <span style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 600 }}>Sem justificativa</span>
                          )}
                          {!ehNao && '—'}
                        </td>
                      </tr>
                      {fts.length > 0 && (
                        <tr key={`${i}-fotos`} className="rel-fotos-row">
                          <td />
                          <td colSpan={3}>
                            <div className="rel-fotos-wrap">
                              {fts.map((f, fi) => (
                                <div key={fi} className="rel-foto-item">
                                  <img
                                    src={f.dataUrl}
                                    alt={`Foto ${fi + 1}`}
                                    className="rel-foto-img"
                                    onClick={() => setLightbox(f.dataUrl)}
                                    title="Clique para ampliar"
                                  />
                                  <span className="rel-foto-rotulo">Foto {fi + 1}</span>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
              </tbody>
            </table>
          </Secao>
        )}

        {/* Responsáveis */}
        {Object.values(resp).some(Boolean) && (
          <Secao titulo="Responsáveis">
            <table className="rel-tabela">
              <tbody>
                {LABELS_RESPONSAVEIS.map(({ key, label }) => {
                  const val = resp[key]
                  if (!val) return null
                  const img = assin[key]
                  return (
                    <tr key={key}>
                      <td className="rel-td-label">{label}</td>
                      <td className="rel-td-valor">
                        {val}
                        {img && (
                          <div style={{ marginTop: 6 }}>
                            <img src={img} alt={`Assinatura ${label}`}
                              style={{ maxHeight: 50, maxWidth: 150, objectFit: 'contain', border: '1px solid #d8dee6', borderRadius: 4 }}
                              onClick={() => setLightbox(img)}
                              title="Clique para ampliar assinatura"
                            />
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </Secao>
        )}

        {/* Observações */}
        {obs.texto?.trim() && (
          <Secao titulo="Observações">
            <p style={{ fontSize: '0.85rem', color: '#374151', whiteSpace: 'pre-wrap' }}>{obs.texto}</p>
            {fotosObs(fotos).length > 0 && (
              <div className="rel-fotos-wrap" style={{ marginTop: 10 }}>
                {fotosObs(fotos).map((f, i) => (
                  <div key={i} className="rel-foto-item">
                    <img src={f.dataUrl} alt={`Obs ${i + 1}`} className="rel-foto-img"
                      onClick={() => setLightbox(f.dataUrl)} title="Clique para ampliar" />
                    <span className="rel-foto-rotulo">Foto {i + 1}</span>
                  </div>
                ))}
              </div>
            )}
          </Secao>
        )}

        {/* Fotos avulsas das observações sem texto */}
        {!obs.texto?.trim() && fotosObs(fotos).length > 0 && (
          <Secao titulo="Fotos — Observações">
            <div className="rel-fotos-wrap">
              {fotosObs(fotos).map((f, i) => (
                <div key={i} className="rel-foto-item">
                  <img src={f.dataUrl} alt={`Obs ${i + 1}`} className="rel-foto-img"
                    onClick={() => setLightbox(f.dataUrl)} title="Clique para ampliar" />
                  <span className="rel-foto-rotulo">Foto {i + 1}</span>
                </div>
              ))}
            </div>
          </Secao>
        )}

        {/* Fotos gerais (sem itemKey) */}
        {fotosGerais(fotos).length > 0 && (
          <Secao titulo="Registro Fotográfico">
            <div className="rel-fotos-wrap">
              {fotosGerais(fotos).map((f, i) => (
                <div key={i} className="rel-foto-item">
                  <img src={f.dataUrl} alt={`Foto ${i + 1}`} className="rel-foto-img"
                    onClick={() => setLightbox(f.dataUrl)} title="Clique para ampliar" />
                  <span className="rel-foto-rotulo">Foto {i + 1}</span>
                </div>
              ))}
            </div>
          </Secao>
        )}

        {/* Rodapé */}
        <div className="rel-rodape">
          Sabesp · Check-list Gás Novo — Sistema Gerencial · Gerado em {new Date().toLocaleString('pt-BR')}
        </div>

      </div>
    </div>
  )
}

function Secao({ titulo, children, badge, corBadge }) {
  const corMap = { verde: '#d1fae5//#065f46', laranja: '#ffedd5//#9a3412', vermelho: '#fee2e2//#991b1b' }
  const [bg, fg] = corBadge ? corMap[corBadge]?.split('//') ?? ['#e5e7eb', '#374151'] : []
  return (
    <div className="rel-secao">
      <div className="rel-secao-titulo">
        <span>{titulo}</span>
        {badge && (
          <span className="rel-secao-badge" style={{ background: bg, color: fg }}>
            {badge}
          </span>
        )}
      </div>
      <div className="rel-secao-corpo">{children}</div>
    </div>
  )
}

function Card({ valor, label, cor }) {
  const esquemas = {
    verde:    { bg: '#d1fae5', fg: '#065f46', borda: '#6ee7b7' },
    laranja:  { bg: '#ffedd5', fg: '#9a3412', borda: '#fdba74' },
    vermelho: { bg: '#fee2e2', fg: '#991b1b', borda: '#fca5a5' },
    azul:     { bg: '#dbeafe', fg: '#1e40af', borda: '#93c5fd' },
    neutro:   { bg: '#f3f4f6', fg: '#374151', borda: '#d1d5db' },
  }
  const { bg, fg, borda } = esquemas[cor] ?? esquemas.neutro
  return (
    <div className="rel-card" style={{ background: bg, borderColor: borda }}>
      <span className="rel-card-valor" style={{ color: fg }}>{valor}</span>
      <span className="rel-card-label" style={{ color: fg }}>{label}</span>
    </div>
  )
}

function Spinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
