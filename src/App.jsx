import { useState } from 'react'
import Layout from './components/Layout'
import InstallBanner from './components/InstallBanner'
import { usePWA } from './hooks/usePWA'
import Dashboard from './pages/Dashboard'
import ImportPage from './pages/ImportPage'
import RelatoriosPage from './pages/RelatoriosPage'
import ChecklistsPage from './pages/ChecklistsPage'
import ChecklistDetail from './pages/ChecklistDetail'

export default function App() {
  const [pagina, setPagina] = useState('dashboard')
  const [checklistId, setChecklistId] = useState(null)
  const [autoPrint, setAutoPrint] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [bannerDismissed, setBannerDismissed] = useState(false)

  const { installPrompt, isInstalled, instalar, needRefresh, updateServiceWorker, setNeedRefresh } = usePWA()

  function navegar(p, id = null, opts = {}) {
    setPagina(p)
    setChecklistId(id)
    setAutoPrint(opts.autoPrint ?? false)
  }

  function onImportado() {
    setRefreshKey(k => k + 1)
    setPagina('dashboard')
  }

  const mostrarBanner = !bannerDismissed && (needRefresh || (installPrompt && !isInstalled))

  return (
    <>
      <Layout
        pagina={pagina}
        onNavegar={navegar}
        onInstalar={installPrompt && !isInstalled ? instalar : null}
        isInstalled={isInstalled}
      >
        {pagina === 'dashboard'  && (
          <Dashboard
            key={refreshKey}
            onNavegar={navegar}
            onInstalar={installPrompt && !isInstalled ? instalar : null}
            isInstalled={isInstalled}
          />
        )}
        {pagina === 'importar'   && <ImportPage onImportado={onImportado} />}
        {pagina === 'relatorios' && <RelatoriosPage key={refreshKey} />}
        {pagina === 'checklists' && (
          <ChecklistsPage
            key={refreshKey}
            onDetalhe={id => navegar('detalhe', id)}
            onImprimir={id => navegar('detalhe', id, { autoPrint: true })}
          />
        )}
        {pagina === 'detalhe' && (
          <ChecklistDetail
            id={checklistId}
            autoPrint={autoPrint}
            onVoltar={() => navegar('checklists')}
          />
        )}
      </Layout>

      {mostrarBanner && (
        <InstallBanner
          onInstalar={installPrompt && !isInstalled ? instalar : null}
          needRefresh={needRefresh}
          onAtualizar={() => updateServiceWorker(true)}
          onDismiss={() => setBannerDismissed(true)}
        />
      )}
    </>
  )
}
