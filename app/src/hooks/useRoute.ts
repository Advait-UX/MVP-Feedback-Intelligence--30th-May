import { useState, useEffect, useCallback } from 'react'
import type { Route } from '../types'

function useRoute(initial: Route) {
  const [route, setRoute] = useState<Route>(initial)

  const navigate = useCallback((section: string) => {
    setRoute((prev) => ({ ...prev, section, view: 'list' }))
  }, [])

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (
        event.data &&
        typeof event.data === 'object' &&
        event.data.type === 'fi-navigate' &&
        typeof event.data.section === 'string'
      ) {
        navigate(event.data.section)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [navigate])

  return { route, setRoute, navigate }
}

export default useRoute
