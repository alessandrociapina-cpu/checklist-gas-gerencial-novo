import { useState } from 'react'
import { VERSAO, CHANGELOG } from '../lib/version'

const NAV = [
  { id: 'dashboard',  label: 'Dashboard',   icon: IconDash },
  { id: 'importar',   label: 'Importar',     icon: IconImport },
  { id: 'relatorios', label: 'Relatórios',   icon: IconChart },
  { id: 'checklists', label: 'Checklists',   icon: IconList },
]

export default function Layout({ pagina, onNavegar, children, onInstalar, isInstalled }) {
  const [menuAberto, setMenuAberto] = useState(false)
  const [changelogAberto, setChangelogAberto] = useState(false)

  return (
    <div className="min-h-screen flex flex-col">
      {/* Topbar */}
      <header className="bg-brand-900 text-white flex items-center justify-between px-4 py-2 shadow-lg">
        <div className="flex items-center gap-3">
          <button
            className="lg:hidden p-1 rounded hover:bg-white/10"
            onClick={() => setMenuAberto(m => !m)}
          >
            <IconHamburger />
          </button>
          {/* Logo Sabesp */}
          <img
            src={`${import.meta.env.BASE_URL}icons/icon-96.png`}
            alt="Sabesp"
            className="h-9 w-9 rounded-lg flex-shrink-0"
          />
          <div className="leading-tight">
            <p className="font-bold text-sm tracking-tight text-white">Check-list Gás</p>
            <p className="text-xs text-brand-300 font-medium">Gerencial</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-brand-200 hidden sm:block">Checklist de Segurança · Interferência em Rede de Gás</span>
          {onInstalar && !isInstalled && (
            <button
              onClick={onInstalar}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
              title="Instalar como aplicativo"
            >
              <IconDownload className="w-4 h-4" />
              <span className="hidden sm:inline">Instalar app</span>
            </button>
          )}
          <button
            onClick={() => setChangelogAberto(true)}
            className="flex items-center gap-1 bg-white/10 hover:bg-white/20 text-brand-200 hover:text-white text-xs font-mono px-2.5 py-1 rounded-lg transition-colors"
            title="Ver histórico de versões"
          >
            v{VERSAO}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <nav
          className={`
            fixed inset-y-0 left-0 z-40 w-56 bg-brand-900 text-white pt-16 pb-4 flex flex-col gap-1
            transform transition-transform duration-200
            ${menuAberto ? 'translate-x-0' : '-translate-x-full'}
            lg:relative lg:translate-x-0 lg:pt-0
          `}
        >
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => { onNavegar(id); setMenuAberto(false) }}
              className={`
                flex items-center gap-3 px-4 py-3 text-sm font-medium text-left transition-colors
                ${pagina === id
                  ? 'bg-brand-700 text-white'
                  : 'text-brand-200 hover:bg-white/10'}
              `}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {label}
            </button>
          ))}

          <div className="mt-auto px-4 pt-4 border-t border-white/10">
            <button
              onClick={() => setChangelogAberto(true)}
              className="text-xs text-brand-300 hover:text-white transition-colors"
            >
              Versão {VERSAO}
            </button>
          </div>
        </nav>

        {/* Overlay mobile */}
        {menuAberto && (
          <div
            className="fixed inset-0 z-30 bg-black/40 lg:hidden"
            onClick={() => setMenuAberto(false)}
          />
        )}

        {/* Conteúdo */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>

      {/* Modal de changelog */}
      {changelogAberto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          onClick={() => setChangelogAberto(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-brand-900 text-white px-5 py-4 flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className="font-bold text-base">Histórico de Versões</h2>
                <p className="text-xs text-brand-200 mt-0.5">Gás Novo — Gerencial</p>
              </div>
              <button
                onClick={() => setChangelogAberto(false)}
                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto flex-1 divide-y divide-gray-100">
              {CHANGELOG.map((entry, i) => (
                <div key={entry.versao} className="px-5 py-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`font-bold text-sm px-2 py-0.5 rounded-full
                      ${i === 0 ? 'bg-brand-900 text-white' : 'bg-gray-100 text-gray-600'}`}>
                      v{entry.versao}
                    </span>
                    <span className="text-xs text-gray-400">{fmtData(entry.data)}</span>
                    {i === 0 && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                        atual
                      </span>
                    )}
                  </div>
                  <ul className="space-y-1">
                    {entry.mudancas.map((m, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="text-brand-500 mt-0.5 flex-shrink-0">•</span>
                        {m}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex-shrink-0">
              <p className="text-xs text-gray-400 text-center">
                Versão atual: <strong className="text-gray-600">v{VERSAO}</strong>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function fmtData(d) {
  if (!d) return ''
  try { const [a, m, dd] = d.split('-'); return `${dd}/${m}/${a}` } catch { return d }
}

function IconHamburger({ className = 'w-6 h-6' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )
}

function IconDash({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  )
}

function IconImport({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  )
}

function IconChart({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  )
}

function IconList({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  )
}

function IconDownload({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  )
}
