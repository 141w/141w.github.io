import { useEffect } from 'react'
import MainLayout from './layouts/MainLayout'
import { normalizeEmptyHash, useRoute } from './router/hashRoute'
import { findProject } from './data/projects'
import { scrollBehavior } from './lib/site'
import { useSpecularButtons } from './hooks/useSpecularButtons'
import HomePage from './pages/Home'
import ProjectsPage from './pages/ProjectsPage'
import ProjectDetailPage from './pages/ProjectDetail'
import AboutPage from './pages/About'
import ContactPage from './pages/Contact'
import NotFoundPage from './pages/NotFound'

const PROJECT_PREFIX = '/projects/'

export default function App() {
  const route = useRoute()
  useSpecularButtons(route.pathname)

  useEffect(() => {
    normalizeEmptyHash()
  }, [])

  // 换页回到顶部；带锚点的路径（#/about#stack）滚到该区块
  useEffect(() => {
    if (route.anchor) {
      const el = document.getElementById(route.anchor)
      if (el) {
        el.scrollIntoView({ behavior: scrollBehavior(), block: 'start' })
        return
      }
    }
    window.scrollTo(0, 0)
  }, [route.pathname, route.anchor, route.revision])

  // 每页自己的标题（index.html 里的静态标题是兜底）
  useEffect(() => {
    const suffix = 'WW · 作品集'
    if (route.pathname === '/') document.title = suffix
    else if (route.pathname === '/projects') document.title = `项目列表 · ${suffix}`
    else if (route.pathname.startsWith(PROJECT_PREFIX)) {
      const p = findProject(route.pathname.slice(PROJECT_PREFIX.length))
      document.title = p ? `${p.title} · ${suffix}` : `未找到项目 · ${suffix}`
    } else if (route.pathname === '/about') document.title = `关于 · ${suffix}`
    else if (route.pathname === '/contact') document.title = `联系 · ${suffix}`
    else document.title = `404 · ${suffix}`
  }, [route.pathname])

  const view = () => {
    const { pathname } = route
    if (pathname === '/') return <HomePage />
    if (pathname === '/projects') return <ProjectsPage />
    if (pathname.startsWith(PROJECT_PREFIX))
      return <ProjectDetailPage id={pathname.slice(PROJECT_PREFIX.length)} />
    if (pathname === '/about') return <AboutPage />
    if (pathname === '/contact') return <ContactPage />
    return <NotFoundPage path={pathname} />
  }

  return <MainLayout>{view()}</MainLayout>
}
