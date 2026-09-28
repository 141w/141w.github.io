import { useEffect, useState } from 'react'

/**
 * 零依赖 hash 路由。
 * 选 hash 而不是真路径：站点是双腿部署，GitHub Pages 那条深链会 404，
 * 只有自建服务器的 nginx 配了 try_files 兜底。
 */
export interface RouteState {
  pathname: string
  /** 路径内的锚点，例如 #/about#stack -> 'stack' */
  anchor: string | null
  /** 重复导航到同一 hash 时递增，供页面重跑滚动等行为 */
  revision: number
}

const REFRESH_EVENT = 'ww:route-refresh'

let revision = 0

export function parseHash(raw: string = window.location.hash): RouteState {
  let path = raw.replace(/^#/, '') || '/'
  if (!path.startsWith('/')) path = '/' + path
  path = path.replace(/\/+$/, '') || '/'

  const at = path.indexOf('#')
  if (at === -1) return { pathname: path, anchor: null, revision }
  return {
    pathname: path.slice(0, at) || '/',
    anchor: path.slice(at + 1) || null,
    revision,
  }
}

function toHash(to: string): string {
  const path = to.startsWith('/') ? to : '/' + to
  return '#' + path
}

export function normalizeEmptyHash(): void {
  if (!window.location.hash) window.history.replaceState(null, '', '#/')
}

export function navigate(to: string): void {
  const next = toHash(to)
  if (window.location.hash === next) {
    // 同 hash 不会再触发 hashchange，手动广播一次
    revision += 1
    window.dispatchEvent(new Event(REFRESH_EVENT))
    return
  }
  window.location.hash = next
}

export function useRoute(): RouteState {
  const [route, setRoute] = useState<RouteState>(() => parseHash())

  useEffect(() => {
    const sync = () => setRoute(parseHash())
    window.addEventListener('hashchange', sync)
    window.addEventListener(REFRESH_EVENT, sync)
    return () => {
      window.removeEventListener('hashchange', sync)
      window.removeEventListener(REFRESH_EVENT, sync)
    }
  }, [])

  return route
}

/** 导航高亮用：/projects/:id 归到 /projects */
export function navKeyOf(pathname: string): string {
  return pathname.startsWith('/projects/') ? '/projects' : pathname
}
