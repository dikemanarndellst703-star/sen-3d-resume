import { useEffect, useRef, useState, type Ref } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { WORKS, type WorkListItem, type WorkSection, type WorksLang } from '../data/works'

const DESTINATION = 'https://ai.alexdbg.com/'

function WorkLine({ item, data }: { item: WorkListItem; data: WorksLang }) {
  return (
    <li className="wk-line">
      <a className="wk-line-btn" href={item.link || DESTINATION} target="_blank" rel="noopener noreferrer">
        <span className="wk-line-name">{item.name}</span>
        <span className="wk-line-meta">
          {item.meta && <span className="wk-line-num">{item.meta}</span>}
          {item.tags?.map((tag) => <span key={tag} className="wk-line-tag">{tag}</span>)}
          <span className="wk-line-arrow" aria-label={data.visitLabel}>↗</span>
        </span>
      </a>
    </li>
  )
}

function SectionCard({ section, data }: { section: WorkSection; data: WorksLang }) {
  return (
    <article className="wk-card" data-variant={section.id}>
      <header className="wk-card-head">
        <span className="wk-card-no">ROUTE / {section.no}</span>
        <h3 className="wk-card-title">{section.title}</h3>
        <span className="wk-card-tagline">{section.tagline}</span>
      </header>
      <div className="wk-card-cover" aria-hidden="true">
        <div className="wk-card-cover-ph">
          <span className="wk-card-cover-word">AI</span>
          <span className="wk-card-cover-no">{section.no}</span>
          <span className="wk-card-cover-orbit" />
        </div>
      </div>
      <div className="wk-card-body">
        <ul className="wk-list">
          {section.items.map((item) => <WorkLine key={item.name} item={item} data={data} />)}
        </ul>
        {section.footer && <p className="wk-card-summary">{section.footer}</p>}
      </div>
    </article>
  )
}

export default function Works({ lang, innerRef }: { lang: 'en' | 'zh'; innerRef: Ref<HTMLElement> }) {
  const data = WORKS[lang]
  const galleryRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: galleryRef, offset: ['start start', 'end end'] })
  const [scrollRange, setScrollRange] = useState(0)

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    const measure = () => setScrollRange(Math.max(0, track.scrollWidth - window.innerWidth))
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(track)
    window.addEventListener('resize', measure)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [lang])

  const x = useTransform(scrollYProgress, [0, 1], [0, -scrollRange])
  const hintOpacity = useTransform(scrollYProgress, [0.84, 1], [1, 0])

  return (
    <section className="works" lang={lang} ref={innerRef}>
      <div className="wk-gallery" ref={galleryRef} style={{ height: `calc(100vh + ${scrollRange}px)` }}>
        <div className="wk-gallery-sticky">
          <span className="wk-gallery-title"><small>CHOOSE YOUR ROUTE</small>{data.title}</span>
          <motion.div className="wk-track" ref={trackRef} style={{ x }}>
            {data.sections.map((section) => <SectionCard key={section.id} section={section} data={data} />)}
          </motion.div>
          <div className="wk-progress" aria-hidden="true"><motion.div className="wk-progress-fill" style={{ scaleX: scrollYProgress }} /></div>
          <motion.span className="wk-hint" style={{ opacity: hintOpacity }} aria-hidden="true">{data.hint}</motion.span>
        </div>
      </div>

      <section className="closing-cta">
        <img src={`${import.meta.env.BASE_URL}brand/ai-hamster-hole-logo.png`} alt="AI 仓鼠洞" />
        <p className="section-kicker">READY TO START?</p>
        <h2>不用一次学会所有 AI。<br /><em>先走出你的第一步。</em></h2>
        <p>完整课程、工具地图与实战路径，都在 AI 仓鼠洞等你。</p>
        <a href={DESTINATION} target="_blank" rel="noopener noreferrer">前往 ai.alexdbg.com <span aria-hidden="true">↗</span></a>
        <footer><span>AI 仓鼠洞</span><span>Alex 大表哥 · 2026</span></footer>
      </section>
    </section>
  )
}
