import { useEffect, useRef, useState } from 'react'
import { processarArquivos } from '../lib/importService'
import { TAMANHO_MAX_ARQUIVO, exportarBanco, dividirEmPartes, contarRegistros } from '../lib/db'
import { PRESETS_QUALIDADE } from '../lib/imagem'

// Limite por arquivo gerado. 20 MB passa com folga nos anexos de e-mail
// corporativo (normalmente 25 MB) e no WhatsApp Web.
const LIMITE_PARTE = 20 * 1024 * 1024

export default function ImportPage({ onImportado }) {
  const [arrastando, setArrastando] = useState(false)
  const [processando, setProcessando] = useState(false)
  const [resultados, setResultados] = useState(null)
  const inputRef = useRef()

  // Exportação do banco consolidado (unificação entre encarregados)
  const [contagem, setContagem] = useState(null)
  const [qualidade, setQualidade] = useState('media')
  const [identificacao, setIdentificacao] = useState('')
  const [exportando, setExportando] = useState(false)
  const [progresso, setProgresso] = useState(null)
  const [ultimoExport, setUltimoExport] = useState(null)

  useEffect(() => { atualizarContagem() }, [])

  function atualizarContagem() {
    contarRegistros().then(setContagem)
  }

  async function processar(arquivos) {
    if (!arquivos.length) return
    // Rejeita arquivos maiores que o limite antes de ler o conteúdo
    const listaFiltrada = [...arquivos].filter(f => {
      if (f.size > TAMANHO_MAX_ARQUIVO) {
        setResultados([{ arquivo: f.name, erro: `Arquivo muito grande (máx. 100 MB).` }])
        return false
      }
      return true
    })
    if (!listaFiltrada.length) return
    setProcessando(true)
    setResultados(null)
    try {
      const res = await processarArquivos(listaFiltrada)
      setResultados(res)
      atualizarContagem()
    } finally {
      setProcessando(false)
    }
  }

  function baixar(blob, nome) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = nome
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  async function exportar() {
    setExportando(true)
    setUltimoExport(null)
    setProgresso(null)
    try {
      const { dados, meta, economia } = await exportarBanco({
        qualidade,
        identificacao,
        onProgresso: setProgresso,
      })
      setProgresso(null)

      const partes = dividirEmPartes(dados, meta, LIMITE_PARTE)

      const hoje = new Date().toISOString().substring(0, 10)
      const tag = identificacao.trim()
        ? `-${identificacao.trim().toLowerCase().replace(/[^a-z0-9]+/gi, '-')}`
        : ''

      const arquivos = []
      for (const parte of partes) {
        const sufixo = partes.length > 1 ? `-parte${parte.parte}de${parte.totalPartes}` : ''
        const nome = `gas-gerencial-consolidado${tag}-${hoje}${sufixo}.json`
        const blob = new Blob([JSON.stringify(parte)], { type: 'application/json' })
        arquivos.push({ nome, tamanho: blob.size })
        baixar(blob, nome)
        // Espaça os downloads: navegadores bloqueiam vários disparos simultâneos
        if (partes.length > 1) await new Promise(r => setTimeout(r, 400))
      }

      setUltimoExport({ arquivos, qtd: dados.length, economia })
    } finally {
      setExportando(false)
      setProgresso(null)
    }
  }

  function onDrop(e) {
    e.preventDefault()
    setArrastando(false)
    processar(e.dataTransfer.files)
  }

  function onDragOver(e) { e.preventDefault(); setArrastando(true) }
  function onDragLeave()  { setArrastando(false) }
  function onInputChange(e) { processar(e.target.files) }

  const temSucesso = resultados?.some(r => r.ok)

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-brand-900">Importar e Unificar Dados</h1>

      <p className="text-gray-600 text-sm">
        Carregue os arquivos <strong>.json</strong> enviados pelos fiscais pelo app{' '}
        <strong>Checklist Gás Novo</strong>, ou o <strong>banco consolidado</strong> exportado
        por outro computador gerencial. Checklists já existentes são atualizados apenas se a
        versão importada for mais recente, então importar o mesmo arquivo duas vezes não duplica nada.
      </p>

      {/* Zona de drop */}
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => !processando && inputRef.current.click()}
        className={`
          cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition-colors
          ${arrastando ? 'border-brand-500 bg-brand-50' : 'border-gray-300 bg-white hover:border-brand-400 hover:bg-gray-50'}
          ${processando ? 'pointer-events-none opacity-60' : ''}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".json"
          className="hidden"
          onChange={onInputChange}
        />

        {processando ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500">Processando arquivos…</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 text-gray-500">
            <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <p className="text-base font-medium">Arraste arquivos JSON aqui</p>
            <p className="text-sm">ou clique para selecionar</p>
          </div>
        )}
      </div>

      {/* Resultados */}
      {resultados && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h2 className="font-semibold text-gray-700">Resultado da importação</h2>
          </div>
          <ul className="divide-y divide-gray-100">
            {resultados.map((r, i) => (
              <li key={i} className="flex items-start gap-3 px-4 py-3">
                {r.ok ? (
                  <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold">✓</span>
                ) : (
                  <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold">✗</span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm text-gray-800 truncate">{r.arquivo}</p>
                  {r.ok ? (
                    <>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {r.novos} novo{r.novos !== 1 ? 's' : ''} · {r.atualizados} atualizado{r.atualizados !== 1 ? 's' : ''} · {r.total} total
                        {r.fotos > 0 && ` · ${r.fotos} foto${r.fotos !== 1 ? 's' : ''}`}
                      </p>
                      {r.consolidado && (
                        <p className="text-xs text-brand-600 mt-1 font-medium">
                          Banco consolidado de outro computador
                          {r.origem && ` — ${r.origem}`}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-red-500 mt-0.5">{r.erro}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {temSucesso && (
        <button
          onClick={onImportado}
          className="bg-brand-600 text-white px-6 py-2.5 rounded-lg hover:bg-brand-700 font-medium"
        >
          Ver Dashboard
        </button>
      )}

      {/* ── Unificação de bancos entre encarregados ─────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 bg-brand-900 text-white">
          <h2 className="font-bold text-base">Unificar bancos de dados</h2>
          <p className="text-xs text-brand-200 mt-0.5">
            Para juntar os checklists de dois computadores
          </p>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div className="bg-brand-50 border border-brand-100 rounded-lg px-4 py-3">
            <p className="text-sm text-gray-700 font-medium mb-2">Como fazer:</p>
            <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
              <li>Cada encarregado clica em <strong>Exportar banco consolidado</strong>.</li>
              <li>Trocam os arquivos entre si (e-mail, WhatsApp ou pen drive).</li>
              <li>Cada um importa o arquivo do outro na área acima.</li>
            </ol>
            <p className="text-xs text-gray-500 mt-2">
              Ao final os dois computadores ficam com exatamente os mesmos checklists.
              Pode repetir quantas vezes quiser — nada é duplicado.
            </p>
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1.5 mt-2">
              <strong>Atenção:</strong> exclusões não são transmitidas. Se você excluir um
              checklist e depois importar o banco do outro encarregado, ele volta. Combinem
              antes quem exclui o quê, ou excluam nos dois computadores.
            </p>
          </div>

          {/* Situação atual */}
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-500">Seu banco atual:</span>
            {contagem ? (
              <span className="font-semibold text-gray-800">
                {contagem.checklists} checklist{contagem.checklists !== 1 ? 's' : ''}
                {' · '}{contagem.fotos} foto{contagem.fotos !== 1 ? 's' : ''}
              </span>
            ) : (
              <span className="text-gray-400">carregando…</span>
            )}
          </div>

          {/* Opções */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Identificação <span className="text-gray-400">(opcional)</span>
              </label>
              <input
                type="text"
                value={identificacao}
                onChange={e => setIdentificacao(e.target.value)}
                maxLength={60}
                placeholder="Ex.: João — Unidade Sul"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <p className="text-xs text-gray-400 mt-1">
                Aparece no nome do arquivo e para quem importar, ajudando a saber de qual computador veio.
              </p>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Qualidade das fotos</label>
              <select
                value={qualidade}
                onChange={e => setQualidade(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {Object.entries(PRESETS_QUALIDADE).map(([id, p]) => (
                  <option key={id} value={id}>{p.label}</option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">
                {PRESETS_QUALIDADE[qualidade]?.descricao}
              </p>
            </div>

            <p className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded px-2 py-1.5">
              As fotos são compactadas <strong>apenas no arquivo enviado</strong> — as originais
              continuam intactas neste computador. Se o arquivo passar de 20 MB, ele é dividido
              automaticamente em partes que cabem em um e-mail.
            </p>
          </div>

          <button
            onClick={exportar}
            disabled={exportando || !contagem?.checklists}
            className="flex items-center gap-2 bg-brand-600 text-white px-5 py-2.5 rounded-lg hover:bg-brand-700 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exportando ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            )}
            {exportando ? 'Gerando arquivo…' : 'Exportar banco consolidado'}
          </button>

          {/* Progresso da compactação */}
          {progresso && (
            <div className="space-y-1">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-500 transition-all duration-150"
                  style={{ width: `${Math.round((progresso.atual / progresso.total) * 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500">
                Compactando fotos… {progresso.atual} de {progresso.total}
              </p>
            </div>
          )}

          {!contagem?.checklists && contagem && (
            <p className="text-xs text-gray-400">
              Nenhum checklist importado ainda — não há o que exportar.
            </p>
          )}

          {ultimoExport && (
            <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 space-y-2">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold">✓</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800">
                    {ultimoExport.qtd} checklist{ultimoExport.qtd !== 1 ? 's' : ''} exportado{ultimoExport.qtd !== 1 ? 's' : ''}
                    {ultimoExport.arquivos.length > 1 && ` em ${ultimoExport.arquivos.length} arquivos`}
                  </p>
                  {ultimoExport.economia.bytesOriginais > 0 && (
                    <p className="text-xs text-gray-600 mt-0.5">
                      Fotos reduzidas de {fmtTamanho(ultimoExport.economia.bytesOriginais)} para{' '}
                      {fmtTamanho(ultimoExport.economia.bytesFinais)}
                      {ultimoExport.economia.bytesFinais < ultimoExport.economia.bytesOriginais && (
                        <strong>
                          {' '}({Math.round(100 - (ultimoExport.economia.bytesFinais / ultimoExport.economia.bytesOriginais) * 100)}% menor)
                        </strong>
                      )}
                    </p>
                  )}
                </div>
              </div>

              <ul className="space-y-1 pl-8">
                {ultimoExport.arquivos.map(a => (
                  <li key={a.nome} className="text-xs text-gray-600 break-all">
                    {a.nome} — <span className={a.tamanho > TAMANHO_MAX_ARQUIVO ? 'text-red-600 font-semibold' : ''}>{fmtTamanho(a.tamanho)}</span>
                  </li>
                ))}
              </ul>

              {ultimoExport.arquivos.length > 1 && (
                <p className="text-xs text-gray-600 pl-8">
                  Envie <strong>todos os arquivos</strong> ao outro encarregado. Ele pode
                  importar os {ultimoExport.arquivos.length} de uma vez, arrastando juntos.
                </p>
              )}

              {ultimoExport.arquivos.some(a => a.tamanho > TAMANHO_MAX_ARQUIVO) && (
                <p className="text-xs text-red-600 pl-8">
                  Um dos arquivos passou de 100 MB e não poderá ser importado. Escolha uma
                  compactação maior e exporte novamente.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function fmtTamanho(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
