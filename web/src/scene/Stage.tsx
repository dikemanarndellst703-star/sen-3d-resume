import { Component, Suspense, useEffect, useRef, useState, type ReactNode } from 'react'
import { Canvas } from '@react-three/fiber'
import { useProgress } from '@react-three/drei'
import { useMotionPreference } from '../hooks/useMotionPreference'
import * as THREE from 'three'
import Scene from './Scene'
import { useStore } from '../store'

class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? <div className="scene-fallback"><img src={`${import.meta.env.BASE_URL}brand/hamster-v2-poster.png`} alt="戴眼镜的仓鼠向导" /><p>仓鼠向导先用照片和你见面，学习路线照常开放。</p></div> : this.props.children }
}

function Progress() {
  const { active, progress, errors } = useProgress()
  if (!active && progress >= 100) return null
  if (errors.length) return null
  return <div className="stage-loading" role="status"><span className="loader-paw">✳</span><span>仓鼠正在准备见面… {Math.round(progress)}%</span></div>
}

export default function Stage() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(true)
  const [compact, setCompact] = useState(window.innerWidth < 760)
  const [message, setMessage] = useState('你好呀，一起做点有意思的事？')
  const reduce = useMotionPreference()
  const night = useStore((s) => s.night)
  const pet = useStore((s) => s.pet)
  const spin = useStore((s) => s.spin)
  const { toggleNight, petHamster, spinHamster } = useStore.getState()
  useEffect(() => {
    const media = window.matchMedia('(max-width: 759px)')
    const update = () => setCompact(media.matches)
    media.addEventListener('change', update)
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting && !document.hidden), { threshold: .01 })
    if (ref.current) observer.observe(ref.current)
    const visibility = () => {
      const rect = ref.current?.getBoundingClientRect()
      setVisible(!document.hidden && !!rect && rect.bottom > 0 && rect.top < window.innerHeight)
    }
    document.addEventListener('visibilitychange', visibility)
    return () => { observer.disconnect(); media.removeEventListener('change', update); document.removeEventListener('visibilitychange', visibility) }
  }, [])
  useEffect(() => {
    if (!pet) return
    const responses = ['收到你的鼓励啦！我们出发吧。', '灵感 +1，今天想做点什么？', '嘿嘿，一起把想法变成作品！']
    setMessage(responses[(pet - 1) % responses.length])
    const timeout = window.setTimeout(() => setMessage('你好呀，一起做点有意思的事？'), 3600)
    return () => window.clearTimeout(timeout)
  }, [pet])
  useEffect(() => {
    if (!spin) return
    setMessage('背上小书包，准备去探索。')
    const timeout = window.setTimeout(() => setMessage('你好呀，一起做点有意思的事？'), 3600)
    return () => window.clearTimeout(timeout)
  }, [spin])
  return <div className="experience-stage" ref={ref}>
    <div className="stage-halo" aria-hidden="true" />
    <div className="stage-label"><span className="live-dot" />你的 AI 学习搭子<span>CURIOUS BY NATURE</span></div>
    <div className="stage-canvas" role="img" aria-label="可互动的三维眼镜仓鼠，站在环形探索舱内。使用下方按钮摸摸它、转一圈或切换灯光。">
      <SceneBoundary><Canvas shadows dpr={compact ? [1, 1.25] : [1, 1.65]} frameloop={visible ? (reduce ? 'demand' : 'always') : 'never'} camera={{ position: [0, 3.5, 10.2], fov: 36, near: .1, far: 50 }} gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping }} fallback={<div className="scene-fallback"><img src={`${import.meta.env.BASE_URL}brand/hamster-v2-poster.png`} alt="仓鼠向导静态展示" /><p>静态模式 · 学习路线照常开放</p></div>}><Suspense fallback={null}><Scene reduced={reduce} compact={compact} /></Suspense></Canvas><Progress /></SceneBoundary>
    </div>
    <div className="stage-caption" aria-hidden="true"><span className="caption-line" /><span>一点好奇心<br /><strong>无限可能。</strong></span></div>
    <div className="stage-controls"><div className="hamster-speech" role="status" aria-live="polite">{message}</div><div className="play-controls" role="group" aria-label="和仓鼠互动"><button onClick={petHamster}><span aria-hidden="true">♡</span>摸摸仓鼠</button><button onClick={spinHamster}><span aria-hidden="true">⟳</span>{reduce ? '转身看看' : '转一圈'}</button><button onClick={toggleNight} aria-pressed={night} aria-label={night ? '切换日间灯光' : '切换夜间灯光'}><span aria-hidden="true">{night ? '☼' : '☾'}</span>{night ? '日间' : '夜间'}</button></div><span className="stage-footnote">{reduce ? '已减少动态效果 · 仍可使用互动按钮' : compact ? '轻触按钮，和仓鼠打个招呼' : '移动鼠标，它的目光会跟着你'}</span></div>
  </div>
}
