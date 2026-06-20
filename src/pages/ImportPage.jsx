import { useRef, useState } from 'react'
import { processarArquivos } from '../lib/importService'
import { TAMANHO_MAX_ARQUIVO } from '../lib/db'

export default function ImportPage({ onImportado }) {
  const [arrastando, setArrastando] = useState(false)
  const [processando, setProcessando] = useState(false)
  const [resultados, setResultados] = useState(null)
  const inputRef = useRef()

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
    } finally {
      setProcessando(false)
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
      <h1 className="text-2xl font-bold text-brand-900">Importar Checklists</h1>

      <p className="text-gray-600 text-sm">
        Carregue os arquivos <strong>.json</strong> de backup exportados pelo app{' '}
        <strong>Checklist Gás Novo</strong> (Checklist de Segurança · Interferência em Rede de Gás).
        Checklists já existentes serão atualizados apenas se a versão importada for mais recente.
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
                    <p className="text-xs text-gray-500 mt-0.5">
                      {r.novos} novo{r.novos !== 1 ? 's' : ''} · {r.atualizados} atualizado{r.atualizados !== 1 ? 's' : ''} · {r.total} total
                      {r.fotos > 0 && ` · ${r.fotos} foto${r.fotos !== 1 ? 's' : ''}`}
                    </p>
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
    </div>
  )
}
