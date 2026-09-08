import { useRef, type KeyboardEvent } from 'react'
import { motion } from 'framer-motion'
import { WORKS } from '../data/works'
import { useStore } from '../store'

const ICONS = ['✳', '◈', '</>', '↗']
const ROUTE_COPY = [
  { before: '一个好问题，', after: '打开新可能。', prompt: '帮我把这个想法，变成一个可执行的计划。', result: '从提问开始，找到你的第一步。' },
  { before: '脑海里的画面，', after: '现在看得见。', prompt: '一颗橙色星球，漂浮在柔软的薄荷色宇宙。', result: '从灵感到画面，让创意有形状。' },
  { before: '你的第一个作品，', after: '从一句话开始。', prompt: '帮我做一个记录灵感的小网站。', result: '说出需求，把想法做成可以使用的产品。' },
  { before: '少一点重复，', after: '多一点自由。', prompt: '整理今天的资料，再生成一份清晰的摘要。', result: '让 AI 接手重复任务，把时间留给创造。' },
]

function RouteArt({ index }: { index: number }) {
  return <div className={`route-art route-art-${index}`} aria-hidden="true">
    <span className="art-orbit orbit-one" /><span className="art-orbit orbit-two" />
    {index === 0 ? <div className="art-dialog"><span>一个好问题</span><i /><i /><i className="short" /><b>✳</b></div> : index === 1 ? <div className="art-picture"><div className="art-sun" /><div className="art-hill hill-back" /><div className="art-hill hill-front" /><span>IMAGINE.</span></div> : index === 2 ? <div className="art-window"><div><i /><i /><i /></div><strong>&lt;<span>想法</span>/&gt;</strong><small>HELLO, YOUR FIRST IDEA.</small></div> : <div className="art-flow"><span>✳</span><i /><span>✓</span><i /><span>↗</span></div>}
    <span className="art-spark">✦</span><span className="art-dot" />
  </div>
}

export default function Works({ lang }: { lang: 'zh' | 'en' }) {
  const route = useStore((s) => s.route)
  const setRoute = useStore((s) => s.setRoute)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const data = WORKS[lang]
  const section = data.sections[route]
  const copy = ROUTE_COPY[route]
  function onKey(event: KeyboardEvent<HTMLButtonElement>, i: number) {
    let next: number
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (i + 1) % 4
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (i + 3) % 4
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = 3
    else return
    event.preventDefault(); setRoute(next); tabRefs.current[next]?.focus()
  }
  return <>
    <section className="learning-section" id="learning-map" aria-labelledby="routes-title">
      <div className="learning-heading"><div><p className="eyebrow">FIND YOUR FIRST STEP</p><h2 id="routes-title">从你想做的事，<br /><em>开始。</em></h2></div><p>没有唯一的起点。<br />选一件你想做的事，<br />让仓鼠陪你走第一程。</p></div>
      <div className="route-tabs" role="tablist" aria-label="AI 学习路线">{data.sections.map((s, i) => <button key={s.id} ref={(el) => { tabRefs.current[i] = el }} type="button" role="tab" id={`route-tab-${i}`} aria-selected={route === i} aria-controls={`route-panel-${i}`} tabIndex={route === i ? 0 : -1} onKeyDown={(e) => onKey(e, i)} onClick={() => setRoute(i)}><span className="route-tab-icon" aria-hidden="true">{ICONS[i]}</span><span>{s.title}</span><span className="tab-arrow" aria-hidden="true">↗</span></button>)}</div>
      <motion.div role="tabpanel" id={`route-panel-${route}`} aria-labelledby={`route-tab-${route}`} tabIndex={0} className="route-panel" initial={false} animate={{ opacity: 1 }}>
        <div className="route-visual"><RouteArt key={route} index={route} /><span className="route-visual-caption">{copy.result}</span></div>
        <div className="route-content"><p className="route-kicker">{section.title} · {section.tagline}</p><h3>{copy.before}<br />{copy.after}</h3><ul className="route-lessons">{section.items.map((item, i) => <li key={item.name}><a href={item.link} target="_blank" rel="noopener noreferrer"><span className="lesson-no">0{i + 1}</span><span>{item.name}</span><span aria-hidden="true">↗</span></a></li>)}</ul><p className="route-fit">{section.footer}</p><a className="route-cta" href="https://ai.alexdbg.com/" target="_blank" rel="noopener noreferrer">开始这条学习路线 <span aria-hidden="true">↗</span></a></div>
      </motion.div>
      <p className="route-note"><span aria-hidden="true">✳</span> 不用一次学会所有 AI。每完成一件小事，你就比昨天多一种可能。</p>
    </section>
    <section className="closing-cta"><p className="eyebrow">YOUR NEXT CHAPTER</p><h2>把「等我学会」，<br />变成<span>「我做到了」。</span></h2><div><p>完整课程、工具地图与实战路径，<br />都在 AI 仓鼠洞等你。</p><a className="primary-cta" href="https://ai.alexdbg.com/" target="_blank" rel="noopener noreferrer">现在，进入 AI 仓鼠洞 <span aria-hidden="true">↗</span></a></div><span className="closing-daisy" aria-hidden="true">✳</span></section>
  </>
}
