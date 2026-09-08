import { lazy, Suspense, useEffect, useState } from 'react'
import { MotionConfig } from 'framer-motion'
import { useMotionPreference } from './hooks/useMotionPreference'
import FlagshipRoutes from './ui/FlagshipRoutes'
import FlagshipAbout from './ui/FlagshipAbout'

const Cinema = lazy(() => import('./scene/Cinema'))
const DESTINATION = 'https://ai.alexdbg.com/'

export default function App() {
  const reduced = useMotionPreference()
  const [dark, setDark] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return <MotionConfig reducedMotion={reduced ? 'always' : 'never'}>
    <div className="flagship-site">
      <a href="#learning-map" className="skip-link">跳到学习路线</a>
      <header className={`flagship-header${dark ? ' is-dark' : ''}${scrolled ? ' is-scrolled' : ''}`}>
        <a className="flagship-brand" href="#top" aria-label="AI 仓鼠洞首页"><img src={`${import.meta.env.BASE_URL}brand/ai-hamster-hole-logo.png`} alt="AI 仓鼠洞" /></a>
        <nav aria-label="主要导航"><a href="#top">探索</a><a href="#learning-map">学习路线</a><a href="#alex-story">关于 Alex</a></nav>
        <a className="header-cta" href={DESTINATION} target="_blank" rel="noopener noreferrer">进入学习站 <span aria-hidden="true">↗</span></a>
      </header>
      <main>
        <Suspense fallback={<section className="cinema-initial" id="top"><p>AI HAMSTER HOLE</p><h1>让 AI，<br />为你所用。</h1><a href={DESTINATION} target="_blank" rel="noopener noreferrer">进入 AI 仓鼠洞 ↗</a></section>}><Cinema onDarkChange={setDark} /></Suspense>
        <FlagshipRoutes />
        <FlagshipAbout />
      </main>
      <footer className="flagship-footer"><img src={`${import.meta.env.BASE_URL}brand/ai-hamster-hole-logo.png`} alt="AI 仓鼠洞" /><span>Alex 大表哥 © 2026</span><span>STAY CURIOUS. MAKE IT REAL.</span><a href="#top">回到顶部 ↑</a></footer>
    </div>
  </MotionConfig>
}
