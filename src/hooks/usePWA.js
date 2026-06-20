import { useEffect, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

export function usePWA() {
  const [installPrompt, setInstallPrompt] = useState(null)
  const [isInstalled, setIsInstalled] = useState(false)

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      r && setInterval(() => r.update(), 60 * 60 * 1000)
    },
  })

  useEffect(() => {
    const handler = e => setInstallPrompt(e)
    window.addEventListener('beforeinstallprompt', handler)

    const installed = () => setIsInstalled(true)
    window.addEventListener('appinstalled', installed)

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', installed)
    }
  }, [])

  async function instalar() {
    if (!installPrompt) return false
    const { outcome } = await installPrompt.prompt()
    if (outcome === 'accepted') {
      setInstallPrompt(null)
      setIsInstalled(true)
    }
    return outcome === 'accepted'
  }

  return { installPrompt, isInstalled, instalar, needRefresh, updateServiceWorker, setNeedRefresh }
}
