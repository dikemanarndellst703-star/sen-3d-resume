import { AnimatePresence, motion } from 'framer-motion'
import { FOCUS_POINTS } from '../data/focusPoints'
import { useStore } from '../store'

const STORY = [
  { period: '过去三年', place: '持续研究 AI', role: '从工具使用者，到 AI 产品实践者', points: ['深入研究生成式 AI 与效率工具', '独立做出十几款 AI 产品', '验证 AI 如何真正改变工作方式'], label: 'RESEARCH' },
  { period: '创业实践', place: '万有贝果科技', role: '创始人', points: ['把 AI 方法沉淀成可使用的产品', '用真实业务检验每一套工作流', '关注普通人能立刻获得的效率提升'], label: 'BUILD' },
  { period: '内容影响', place: '@Alex 大表哥', role: 'AI 领域 30 万粉丝自媒体博主', points: ['拆解复杂概念，让 AI 新手也能听懂', '从 ChatGPT、AI 绘画到 AI 编程', '不堆工具，先帮你找到适合自己的路径'], label: 'SHARE' },
  { period: '教学现场', place: '2 万+ 学员 · 30 场+ 全国巡回', role: '趁早职场系列课 100% 好评金牌讲师', points: ['微软 MOS 大师级认证', '把复杂能力拆成可以照着做的步骤', '让学习结果回到真实工作与生活'], label: 'TEACH' },
  { period: '现在', place: '让 AI 开始替你工作', role: 'AI 仓鼠洞 · 新手学习入口', points: ['从“亲自做每件事”进入人机协作', '用更短时间完成更多，而且做得更好', '重新打开一个人的能力边界'], label: 'AUTOMATE' },
]

export default function Resume({ lang }: { lang: 'zh' | 'en' }) {
  const chapter = useStore((s) => s.chapter)
  const setChapter = useStore((s) => s.setChapter)
  return <section className="resume" id="alex-story" lang={lang} aria-labelledby="story-title">
    <div className="story-copy">
      <p className="eyebrow">MEET YOUR GUIDE <span className="eyebrow-rule" /></p>
      <h2 id="story-title">一个人的可能，<br /><em>可以更大一点。</em></h2>
      <p className="story-lead">我是 Alex 大表哥，万有贝果科技创始人。过去三年，我持续研究 AI，做出了十几款 AI 产品。比起制造工具焦虑，我更想帮你把想法变成现实。</p>
      <div className="story-accordion">
        {STORY.map((entry, i) => <article className={`story-entry${chapter === i ? ' is-open' : ''}`} data-point={FOCUS_POINTS[i]} key={entry.label}>
          <h3><button id={`story-trigger-${i}`} aria-expanded={chapter === i} aria-controls={`story-panel-${i}`} onClick={() => setChapter(chapter === i ? -1 : i)}><span className="story-period">{entry.period}</span><span className="story-place">{entry.place}</span><span className="accordion-symbol" aria-hidden="true">{chapter === i ? '−' : '+'}</span></button></h3>
          <AnimatePresence initial={false}>{chapter === i && <motion.div id={`story-panel-${i}`} role="region" aria-labelledby={`story-trigger-${i}`} className="story-panel" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: .3, ease: [.22, 1, .36, 1] }}><div><p>{entry.role}</p><ul>{entry.points.map((p) => <li key={p}>{p}</li>)}</ul></div></motion.div>}</AnimatePresence>
        </article>)}
      </div>
      <a className="text-link story-link" href="#learning-map">一起走出第一步 <span aria-hidden="true">↘</span></a>
    </div>
    <span className="story-margin-note" aria-hidden="true">A LITTLE CURIOSITY GOES A LONG WAY.</span>
  </section>
}
