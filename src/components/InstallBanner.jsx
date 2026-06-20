export default function InstallBanner({ onInstalar, onAtualizar, needRefresh, onDismiss }) {
  if (needRefresh) {
    return (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[min(22rem,calc(100vw-2rem))]
                      bg-brand-900 text-white rounded-xl shadow-xl px-4 py-3 flex items-center gap-3">
        <svg className="w-5 h-5 flex-shrink-0 text-brand-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <p className="flex-1 text-sm">Nova versão disponível.</p>
        <button
          onClick={onAtualizar}
          className="bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg"
        >
          Atualizar
        </button>
        <button onClick={onDismiss} className="text-brand-300 hover:text-white text-xs">✕</button>
      </div>
    )
  }

  if (onInstalar) {
    return (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[min(22rem,calc(100vw-2rem))]
                      bg-brand-900 text-white rounded-xl shadow-xl px-4 py-3 flex items-center gap-3">
        <img src={`${import.meta.env.BASE_URL}icons/icon-96.png`} alt="" className="w-10 h-10 rounded-lg flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">Instalar aplicativo</p>
          <p className="text-xs text-brand-200">Use offline, acesso rápido na área de trabalho</p>
        </div>
        <button
          onClick={onInstalar}
          className="bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg whitespace-nowrap"
        >
          Instalar
        </button>
        <button onClick={onDismiss} className="text-brand-300 hover:text-white text-xs">✕</button>
      </div>
    )
  }

  return null
}
