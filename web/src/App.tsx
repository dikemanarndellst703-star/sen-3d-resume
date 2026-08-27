import { Suspense, useRef, type ReactNode } from 'react'
import { Canvas } from '@react-three/fiber'
import { motion, useScroll, useTransform, type MotionValue } from 'framer-motion'
import * as THREE from 'three'
import Scene from './scene/Scene'
import NoiseOverlay from './ui/NoiseOverlay'
import Resume from './ui/Resume'
import Works from './ui/Works'
import LoadingScreen from './ui/LoadingScreen'

const DESTINATION = 'https://ai.alexdbg.com/'
type Lang = 'zh'

function CtaLink({ className, children }: { className: string; children: ReactNode }) {
  return (
    <a className={className} href={DESTINATION} target="_blank" rel="noopener noreferrer">
      {children}<span aria-hidden="true">↗</span>
    </a>
  )
}

function Hero({ cueOpacity }: { cueOpacity: MotionValue<number> }) {
  const { scrollY } = useScroll()
  const blur = useTransform(scrollY, [0, 420], ['blur(0px)', 'blur(14px)'])
  const opacity = useTransform(scrollY, [0, 360], [1, 0])
  const titleY = useTransform(scrollY, [0, 540], [0, -90])
  const bodyY = useTransform(scrollY, [0, 540], [0, -42])

  return (
    <section className="hero">
      <motion.div className="about" lang="zh" style={{ filter: blur, opacity }}>
        <div className="about-intro">
          <div className="hero-brand-lockup">
            <img src={`${import.meta.env.BASE_URL}brand/ai-hamster-hole-logo.png`} alt="AI 仓鼠洞" />
          </div>
          <motion.p className="about-kicker" style={{ y: bodyY }}>Alex 大表哥的 AI 新手入口</motion.p>
          <motion.h1 className="about-title" style={{ y: titleY }}>
            <span>让 AI</span><strong>开始替你工作</strong>
          </motion.h1>
          <motion.p className="about-body" style={{ y: bodyY }}>
            不再追逐每一个新工具。跟着仓鼠向导，从 ChatGPT、AI 绘画到 AI 编程，
            找到真正适合你的学习路径。
          </motion.p>
          <motion.div className="hero-actions" style={{ y: bodyY }}>
            <CtaLink className="primary-cta">立即进入 AI 仓鼠洞</CtaLink>
            <a className="text-cta" href="#alex-story">先认识 Alex <span aria-hidden="true">↓</span></a>
          </motion.div>
          <motion.ul className="hero-proof" style={{ y: bodyY }} aria-label="Alex 的教学成果">
            <li><strong>30 万</strong><span>AI 粉丝</span></li>
            <li><strong>2 万+</strong><span>培训学员</span></li>
            <li><strong>30 场+</strong><span>全国巡回</span></li>
          </motion.ul>
        </div>
      </motion.div>
      <motion.div className="scroll-cue" style={{ opacity: cueOpacity }} aria-hidden="true">
        <span className="scroll-cue-label">跟着仓鼠向下探索</span>
        <span className="scroll-cue-track"><span className="scroll-cue-dot" /></span>
      </motion.div>
    </section>
  )
}

export default function App() {
  const lang: Lang = 'zh'
  const { scrollY } = useScroll()
  const worksRef = useRef<HTMLElement>(null)
  const { scrollYProgress: worksProgress } = useScroll({ target: worksRef, offset: ['start end', 'start center'] })
  const fogBg = useTransform(worksProgress, [0, 1], ['rgba(48, 38, 29, 0)', 'rgba(48, 38, 29, 0.54)'])
  const scrimOpacity = useTransform(scrollY, [0, 520], [0.08, 0.58])
  const cueOpacity = useTransform(scrollY, [0, 160], [1, 0])
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800
  const railOpacity = useTransform(scrollY, [vh * 0.45, vh], [0, 1])
  const heroChromeOpacity = useTransform(scrollY, [0, 280], [1, 0])

  return (
    <>
      <LoadingScreen />
      <div className="scene-bg">
        <Canvas
          shadows={{ type: THREE.PCFSoftShadowMap }} dpr={[1, 1.5]}
          camera={{ position: [0, 2.2, 9.5], fov: 36, near: 0.1, far: 100 }}
          gl={{ antialias: true, stencil: false, depth: true, toneMapping: THREE.ACESFilmicToneMapping }}
        >
          <Suspense fallback={null}><Scene /></Suspense>
        </Canvas>
      </div>

      <motion.div className="scrim" style={{ opacity: scrimOpacity }} aria-hidden="true" />
      <motion.div className="stage-fog" style={{ background: fogBg }} aria-hidden="true" />
      <motion.div className="glass-rail" style={{ opacity: railOpacity }} aria-hidden="true" />

      <a className="floating-cta" href={DESTINATION} target="_blank" rel="noopener noreferrer">
        <span>进入学习站</span><b aria-hidden="true">↗</b>
      </a>

      <motion.div className="hero-chrome" style={{ opacity: heroChromeOpacity }} aria-hidden="true">
        <div className="hero-frame" />
        <span className="hero-mark tl">+</span><span className="hero-mark tr">+</span>
        <span className="hero-mark bl">+</span><span className="hero-mark br">+</span>
        <div className="hero-meta hm-tl"><span className="hm-name">Alex 大表哥</span><span>AI 效率实践者</span></div>
        <div className="hero-meta hm-tr">AI HAMSTER HOLE — 2026</div>
        <div className="hero-meta hm-bl">Learn · Build · Automate</div>
        <div className="hero-meta hm-right">一个人的能力边界，可以被技术重新打开</div>
      </motion.div>

      <NoiseOverlay />
      <main className="content">
        <Hero cueOpacity={cueOpacity} />
        <Resume lang={lang} />
        <Works lang={lang} innerRef={worksRef} />
      </main>
    </>
  )
}
