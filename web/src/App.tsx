import { lazy, Suspense, type ReactNode } from 'react'
import { motion, MotionConfig } from 'framer-motion'
import Resume from './ui/Resume'
import Works from './ui/Works'
import { useStore } from './store'
import { useMotionPreference } from './hooks/useMotionPreference'

const Stage = lazy(() => import('./scene/Stage'))
const DESTINATION = 'https://ai.alexdbg.com/'
const ASSETS = import.meta.env.BASE_URL

function CtaLink({ className = 'primary-cta', children }: { className?: string; children: ReactNode }) {
  return <a className={className} href={DESTINATION} target="_blank" rel="noopener noreferrer">{children}<span aria-hidden="true">↗</span></a>
}

function Hero() {
  const reduce = useMotionPreference()
  return <section className="hero" id="top" aria-labelledby="hero-title">
    <div className="hero-copy">
      <motion.p className="eyebrow" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><span className="live-dot" />好奇心，是最好的开始</motion.p>
      <motion.h1 id="hero-title" initial={{ opacity: 0, y: reduce ? 0 : 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .8, ease: [.22, 1, .36, 1] }}>
        让 AI，<br />开始替你<br /><span className="title-accent">工作。</span><span className="title-spark" aria-hidden="true">✳</span>
      </motion.h1>
      <motion.div initial={{ opacity: 0, y: reduce ? 0 : 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7, delay: .15 }}>
        <p className="hero-description">不用追赶每一个新工具。<br />跟着 Alex 和仓鼠向导，把想法变成作品，<br className="desktop-break" />把重复的工作交给 AI。</p>
        <div className="hero-actions"><CtaLink>立即进入 AI 仓鼠洞</CtaLink><a className="text-link" href="#learning-map">找到我的路线 <span aria-hidden="true">↓</span></a></div>
        <div className="hero-proof" aria-label="Alex 的教学成果">
          <div><strong>30<span>万</span></strong><span>AI 同路人</span></div>
          <div><strong>2<span>万+</span></strong><span>培训学员</span></div>
          <div><strong>30<span>场+</span></strong><span>全国巡回</span></div>
        </div>
      </motion.div>
    </div>
    <div className="hero-bottom"><a href="#alex-story"><span className="scroll-icon" aria-hidden="true">↓</span>向下探索，认识你的向导</a><span>LESS BUSY. MORE POSSIBLE.</span></div>
  </section>
}

export default function App() {
  const night = useStore((s) => s.night)
  const reduce = useMotionPreference()
  return <MotionConfig reducedMotion={reduce ? 'always' : 'never'}><div className="site" data-night={night}>
    <a className="skip-link" href="#learning-map">跳到学习路线</a>
    <header className="site-header">
      <a className="brand" href="#top" aria-label="AI 仓鼠洞首页"><img src={`${ASSETS}brand/ai-hamster-hole-logo.png`} alt="AI 仓鼠洞" /><span className="brand-byline">by Alex 大表哥</span></a>
      <nav aria-label="主要导航"><a href="#alex-story">关于 Alex</a><a href="#learning-map">学习路线</a><CtaLink className="nav-cta">进入学习站</CtaLink></nav>
    </header>
    <main>
      <div className="exploration">
        <div className="stage-shell"><div className="stage-sticky"><Suspense fallback={<div className="stage-initial">仓鼠向导正在准备中…</div>}><Stage /></Suspense></div></div>
        <Hero />
        <Resume lang="zh" />
      </div>
      <Works lang="zh" />
    </main>
    <footer className="site-footer"><a href="#top"><img src={`${ASSETS}brand/ai-hamster-hole-logo.png`} alt="AI 仓鼠洞" /></a><span>保持好奇，让想法发生。</span><span>Alex 大表哥 © 2026</span><a href="#top">回到顶部 ↑</a></footer>
  </div></MotionConfig>
}
