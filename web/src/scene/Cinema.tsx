import { Component, Suspense, useEffect, useRef, useState, type ReactNode } from 'react'
import { Canvas } from '@react-three/fiber'
import { useProgress } from '@react-three/drei'
import { motion, useMotionValueEvent, useScroll, useSpring, useTransform, type MotionValue } from 'framer-motion'
import * as THREE from 'three'
import { useMotionPreference } from '../hooks/useMotionPreference'
import CinematicWorld from './CinematicWorld'
import { CHAPTERS } from './cinematicTimeline'

const DESTINATION = 'https://ai.alexdbg.com/'
const POSTER = `${import.meta.env.BASE_URL}brand/hamster-v3-poster.png`

class CinemaBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? <div className="cinema-fallback"><img src={POSTER} alt="高精度仓鼠向导" /><p>静态展示模式 · 学习内容照常开放</p></div> : this.props.children }
}

function ModelLoading() {
  const { active, progress } = useProgress()
  if (!active && progress >= 100) return null
  return <><div className="cinema-loading-poster" aria-hidden="true"><img src={POSTER} alt="" /></div><div className="cinema-loading" role="status"><span>正在为你打开新世界</span><span>{Math.round(progress)}%</span><i style={{ transform: `scaleX(${progress / 100})` }} /></div></>
}

function Copy({ progress, index, children, className = '' }: { progress: MotionValue<number>; index: number; children: ReactNode; className?: string }) {
  const ranges = [[0, .12, .21, .22], [.19, .25, .40, .47], [.45, .52, .66, .74], [.72, .79, .98, 1]][index]
  const opacity = useTransform(progress, ranges, index === 0 ? [1, 1, 0, 0] : index === 3 ? [0, 1, 1, 1] : [0, 1, 1, 0])
  const y = useTransform(progress, ranges, index === 0 ? [0, 0, -50, -50] : [40, 0, 0, -40])
  const [interactive, setInteractive] = useState(index === 0)
  useMotionValueEvent(opacity, 'change', v => setInteractive(v > .55))
  return <motion.div className={`cinema-copy copy-${index} ${className}`} style={{ opacity, y }} {...(!interactive ? { inert: '' } : {})} aria-hidden={!interactive}>{children}</motion.div>
}

export default function Cinema({ onDarkChange }: { onDarkChange: (dark: boolean) => void }) {
  const section = useRef<HTMLElement>(null)
  const viewport = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: section, offset: ['start start', 'end end'] })
  const progress = useSpring(scrollYProgress, { stiffness: 90, damping: 28, mass: .5, restDelta: .00005 })
  const reduced = useMotionPreference()
  const [compact, setCompact] = useState(window.innerWidth < 760)
  const [active, setActive] = useState(0)
  const [visible, setVisible] = useState(true)
  const [turn, setTurn] = useState(0)
  const [canvasReady, setCanvasReady] = useState(false)
  const [dragged, setDragged] = useState(false)
  const dark = !reduced && (active === 1 || active === 2)
  const background = useTransform(progress, [0,.17,.27,.69,.79,1], ['#f3f3f0','#f3f3f0','#0b0d10','#0b0d10','#eae9e5','#eae9e5'])
  const line = useTransform(progress, p => `${Math.round(p * 100)}%`)
  useMotionValueEvent(progress, 'change', p => setActive(p < .215 ? 0 : p < .465 ? 1 : p < .745 ? 2 : 3))
  useEffect(() => { onDarkChange(dark && visible); return () => onDarkChange(false) }, [dark, visible, onDarkChange])
  useEffect(() => {
    const query = window.matchMedia('(max-width: 759px)')
    const change = () => setCompact(query.matches)
    query.addEventListener('change', change)
    let intersects = true
    const observer = new IntersectionObserver(([entry]) => { intersects = entry.isIntersecting; setVisible(intersects && !document.hidden) }, { threshold: .01 })
    if (viewport.current) observer.observe(viewport.current)
    const visibility = () => setVisible(intersects && !document.hidden)
    document.addEventListener('visibilitychange', visibility)
    return () => { query.removeEventListener('change', change); observer.disconnect(); document.removeEventListener('visibilitychange', visibility) }
  }, [])
  function jump(index: number) {
    if (!section.current) return
    const top = section.current.getBoundingClientRect().top + window.scrollY
    const distance = section.current.offsetHeight - window.innerHeight
    window.scrollTo({ top: top + CHAPTERS[index].at * distance, behavior: reduced ? 'instant' : 'smooth' })
  }
  return <section ref={section} id="top" className={`cinema${reduced ? ' is-reduced' : ''}`} aria-label="仓鼠向导的四幕探索之旅">
    <motion.div ref={viewport} className={`cinema-viewport${dark ? ' is-dark' : ''}`} style={{ background: reduced ? '#f3f3f0' : background }}>
      <div className="cinema-backdrop-word" aria-hidden="true">{active < 2 ? 'POSSIBLE.' : 'BE CURIOUS.'}</div>
      <div className="cinema-canvas" role="img" aria-label="百万面三维仓鼠，滚动可从完整角色进入面部近景并环绕查看背包。可拖动角色观察角度。">
        <CinemaBoundary><Canvas onCreated={() => setCanvasReady(true)} camera={{ position: [2.3, 2.65, 7.6], fov: 30, near: .05, far: 70 }} dpr={compact ? 1 : [1, 1.5]} frameloop={visible ? (reduced ? 'demand' : 'always') : 'never'} gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping }} fallback={<div className="cinema-fallback"><img src={POSTER} alt="仓鼠向导静态展示" /></div>}><Suspense fallback={null}><CinematicWorld progress={progress} reduced={reduced} compact={compact} turn={turn} onDrag={() => setDragged(true)} /></Suspense></Canvas>{canvasReady && <ModelLoading />}</CinemaBoundary>
      </div>
      {reduced ? <div className="cinema-copy copy-0"><p className="cinema-eyebrow">AI HAMSTER HOLE</p><h1>让 AI，<br />为你所用。</h1><p className="cinema-description">从第一个问题，到第一个作品。<br />让好奇心，成为你的新能力。</p><a className="cinema-cta" href={DESTINATION} target="_blank" rel="noopener noreferrer">开启你的 AI 旅程 <span aria-hidden="true">↗</span></a></div> : <>
        <Copy progress={progress} index={0}><p className="cinema-eyebrow">AI HAMSTER HOLE</p><h1>让 AI，<br />为你所用。</h1><p className="cinema-description">从第一个问题，到第一个作品。<br />让好奇心，成为你的新能力。</p><a className="cinema-cta" href={DESTINATION} target="_blank" rel="noopener noreferrer">开启你的 AI 旅程 <span aria-hidden="true">↗</span></a><span className="cinema-byline">ALEX 大表哥的 AI 新手学习入口</span></Copy>
        <Copy progress={progress} index={1}><p className="cinema-eyebrow">LOOK A LITTLE CLOSER</p><h2>看见工具。<br />更看见<span>可能。</span></h2><p className="cinema-description">不被复杂的概念劝退。<br />从一个好问题开始，看懂 AI 能为你做什么。</p><div className="cinema-detail-line"><span /><small>从好奇，到理解。</small></div></Copy>
        <Copy progress={progress} index={2}><p className="cinema-eyebrow">MADE FOR THE CURIOUS</p><h2>把想象，<br />带进<span>现实。</span></h2><p className="cinema-description">一张图、一个网站、一套工作流。<br />让想法走出收藏夹，成为你的第一个作品。</p><a className="cinema-text-link" href="#learning-map">发现你的学习路线 <span aria-hidden="true">↗</span></a></Copy>
        <Copy progress={progress} index={3}><p className="cinema-eyebrow">YOUR NEXT CHAPTER</p><h2>能力的边界，<br /><span>由你打开。</span></h2><p className="cinema-description">不用一次学会所有 AI。<br />先做成一件事，再走向下一种可能。</p><a className="cinema-cta" href="#learning-map">找到你的第一步 <span aria-hidden="true">↓</span></a></Copy>
      </>}
      {!reduced && <nav className="cinema-chapters" aria-label="切换展示章节">{CHAPTERS.map((chapter, i) => <button key={chapter.label} aria-current={active === i ? 'step' : undefined} aria-label={`第${i + 1}幕：${chapter.label}`} onClick={() => jump(i)}><span className="chapter-label">{chapter.label}</span><i /></button>)}</nav>}
      <div className="cinema-bottom"><a href="#learning-map" className="cinema-skip">{reduced ? '探索学习路线' : '跳过展示'} <span aria-hidden="true">↓</span></a><div className="cinema-explore-hint"><span className="scroll-stroke" aria-hidden="true" />{reduced ? '已按系统偏好减少动态效果' : '向下滚动，打开新的视角'}</div><button className="cinema-view-control" onClick={() => { setTurn(t => t + 1); setDragged(true) }} aria-label="旋转角色视角">{dragged ? '继续旋转视角' : compact ? '轻触，旋转视角' : '拖动角色，探索细节'} <span aria-hidden="true">⟳</span></button></div>
      {!reduced && <div className="cinema-progress" aria-hidden="true"><motion.i style={{ width: line }} /></div>}
    </motion.div>
  </section>
}
