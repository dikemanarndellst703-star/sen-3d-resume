import { useRef, useState, useSyncExternalStore, type CSSProperties, type KeyboardEvent } from 'react'
import { motion, useMotionValueEvent, useScroll, useTransform, type MotionValue } from 'framer-motion'
import { WORKS } from '../data/works'
import { useMotionPreference } from '../hooks/useMotionPreference'
import { useVisibleAnimation } from '../hooks/useVisibleAnimation'
import './flagship-sections.css'

const compactQuery = window.matchMedia('(max-width: 759px), (max-height: 619px)')
const subscribeCompact = (notify: () => void) => {
  compactQuery.addEventListener('change', notify)
  return () => compactQuery.removeEventListener('change', notify)
}
const ROUTE_WORDS = ['START', 'CREATE', 'BUILD', 'FLOW']
const ROUTE_LINES = ['每一种新能力，\n都从一个好问题开始。', '让脑海中的画面，\n有迹可循。', '从「我有个想法」，\n到「这是我做的」。', '把时间，\n还给真正重要的事。']

function RouteArtwork({ index, progress, natural, reduced, enabled }: { index: number; progress: MotionValue<number>; natural: boolean; reduced: boolean; enabled: boolean }) {
  const turn = useTransform(progress, [0, 1], [14 - index * 8, -10 - index * 8])
  const lift = useTransform(progress, [0, 1], [index * 25 - 20, index * 25 - 100])
  const { ref, playing } = useVisibleAnimation<HTMLDivElement>(enabled && !reduced)
  return <div ref={ref} className={`flagship-route-art art-${index}`} data-looping={playing} data-motion={reduced ? 'reduced' : playing ? 'playing' : 'paused'} aria-hidden="true">
    <span className="flagship-art-word">{ROUTE_WORDS[index]}</span>
    <motion.div className="flagship-art-object" style={natural ? undefined : { rotate: turn, y: lift }}>
      {index === 0 && <div className="route-lens"><span className="lens-frame" /><span className="lens-surface" /><span className="lens-pupil" /><span className="lens-light" /></div>}
      {index === 1 && <div className="route-slices">{Array.from({ length: 8 }, (_, i) => <span key={i} style={{ '--slice': i } as CSSProperties} />)}</div>}
      {index === 2 && <div className="route-brackets"><span>&#123;</span><i /><span>&#125;</span></div>}
      {index === 3 && <div className="route-flow">{Array.from({ length: 11 }, (_, i) => <span key={i} style={{ '--fin': i } as CSSProperties} />)}</div>}
    </motion.div>
    <span className="flagship-art-caption">{['A NEW WAY TO THINK.', 'IMAGINATION, IN FOCUS.', 'IDEAS INTO EXISTENCE.', 'MORE TIME. MORE POSSIBLE.'][index]}</span>
  </div>
}

export default function FlagshipRoutes() {
  const section = useRef<HTMLElement>(null)
  const tabs = useRef<(HTMLButtonElement | null)[]>([])
  const panels = useRef<(HTMLElement | null)[]>([])
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const reduced = useMotionPreference()
  const compact = useSyncExternalStore(subscribeCompact, () => compactQuery.matches, () => false)
  const natural = compact || reduced
  const { scrollYProgress } = useScroll({ target: section, offset: ['start start', 'end end'] })
  const x = useTransform(scrollYProgress, [0, 1], ['0%', '-75%'])
  const line = useTransform(scrollYProgress, [0, 1], ['0%', '100%'])
  useMotionValueEvent(scrollYProgress, 'change', (value) => {
    if (!natural) setActive(Math.max(0, Math.min(3, Math.round(value * 3))))
  })

  function goToRoute(index: number, focus = false) {
    const element = section.current
    if (!element) return
    const panel = panels.current[index]
    const top = natural && panel
      ? panel.getBoundingClientRect().top + window.scrollY - 88
      : element.getBoundingClientRect().top + window.scrollY + Math.max(0, element.offsetHeight - window.innerHeight) * index / 3
    if (focus) tabs.current[index]?.focus({ preventScroll: true })
    window.scrollTo({ top, behavior: reduced ? 'instant' : 'smooth' })
    if (natural) setActive(index)
  }

  function onTabKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next: number
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % 4
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index + 3) % 4
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = 3
    else return
    event.preventDefault()
    goToRoute(next, true)
  }

  return <section ref={section} className={`flagship-routes${natural ? ' is-natural' : ''}`} id="learning-map" aria-labelledby="flagship-map-title" data-tone={active % 2 ? 'light' : 'dark'}>
    <div className="flagship-routes-sticky">
      <div className="flagship-routes-heading">
        <h2 id="flagship-map-title">四条路线。无限可能。</h2>
        <span>FIND YOUR NEXT CHAPTER</span>
        <a href="#alex-story">{natural ? '认识 Alex' : '跳过路线展示'} <span aria-hidden="true">↓</span></a>
      </div>
      <motion.div className="flagship-routes-track" style={{ x: natural ? '0%' : x }}>
        {WORKS.zh.sections.map((route, index) => <article
          className={`flagship-route route-${index}`}
          key={route.id}
          id={`flagship-route-${route.id}`}
          ref={(element) => { panels.current[index] = element }}
          role={natural ? undefined : 'tabpanel'}
          aria-labelledby={natural ? `route-title-${route.id}` : `route-tab-${route.id}`}
          aria-hidden={!natural && active !== index}
        >
          <div className="flagship-route-copy">
            <p className="flagship-route-label"><span>{route.no} / 04</span><span>{ROUTE_WORDS[index]} WITH AI</span></p>
            <h3 id={`route-title-${route.id}`}>{route.title}</h3>
            <p className="flagship-route-statement">{ROUTE_LINES[index]}</p>
            <ul className="flagship-route-links">{route.items.map((item) => <li key={item.name}><a href={item.link} target="_blank" rel="noopener noreferrer" tabIndex={natural || active === index ? 0 : -1}><span>{item.name}</span><span className="route-link-meta">{item.meta}</span><span className="route-link-arrow" aria-hidden="true">↗</span></a></li>)}</ul>
            <p className="flagship-route-audience">{route.footer}</p>
          </div>
          <RouteArtwork index={index} progress={scrollYProgress} natural={natural} reduced={reduced} enabled={!paused && (natural || active === index)} />
        </article>)}
      </motion.div>
      <div className="flagship-routes-navigation">
        <div className="flagship-route-tabs" role={natural ? undefined : 'tablist'} aria-label="选择 AI 学习路线">
          {WORKS.zh.sections.map((route, index) => <button key={route.id} id={`route-tab-${route.id}`} ref={(element) => { tabs.current[index] = element }} role={natural ? undefined : 'tab'} aria-selected={natural ? undefined : active === index} aria-controls={`flagship-route-${route.id}`} tabIndex={natural || active === index ? 0 : -1} onClick={() => goToRoute(index)} onKeyDown={(event) => onTabKey(event, index)}><span>{route.no}</span>{route.title}<i aria-hidden="true" /></button>)}
        </div>
        <button className="flagship-loop-toggle" type="button" disabled={reduced} aria-pressed={paused} aria-label={reduced ? '已跟随系统减少动态效果' : paused ? '播放学习路线循环动效' : '暂停学习路线循环动效'} onClick={() => setPaused(value => !value)}>
          <span className={`flagship-loop-symbol${paused || reduced ? ' is-paused' : ''}`} aria-hidden="true" />
          {reduced ? '已减少动态' : paused ? '播放动效' : '暂停动效'}
        </button>
        <span className="flagship-route-scroll-hint">{natural ? '选择你的起点' : '继续下滑，发现下一种可能'} <span aria-hidden="true">↓</span></span>
      </div>
      {!natural && <div className="flagship-route-progress" aria-hidden="true"><motion.span style={{ width: line }} /></div>}
    </div>
  </section>
}
