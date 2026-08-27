import { motion } from 'framer-motion'
import { FOCUS_POINTS } from '../data/focusPoints'

const DESTINATION = 'https://ai.alexdbg.com/'

interface StoryEntry {
  period: string
  place: string
  role: string
  points: string[]
  accent?: string
}

const STORY: StoryEntry[] = [
  {
    period: '过去三年',
    place: '持续研究 AI',
    role: '从工具使用者，到 AI 产品实践者',
    points: ['深入研究生成式 AI 与效率工具', '独立做出十几款 AI 产品', '验证 AI 如何真正改变工作方式'],
    accent: '01 / RESEARCH',
  },
  {
    period: '创业实践',
    place: '万有贝果科技',
    role: '创始人',
    points: ['把 AI 方法沉淀成可使用的产品', '用真实业务检验每一套工作流', '关注普通人能立刻获得的效率提升'],
    accent: '02 / BUILD',
  },
  {
    period: '内容影响',
    place: '@Alex 大表哥',
    role: 'AI 领域 30 万粉丝自媒体博主',
    points: ['拆解复杂概念，让 AI 新手也能听懂', '从 ChatGPT、AI 绘画到 AI 编程', '不堆工具，先帮你找到适合自己的路径'],
    accent: '03 / SHARE',
  },
  {
    period: '教学现场',
    place: '2 万+ 学员 · 30 场+ 全国巡回',
    role: '趁早职场系列课 100% 好评金牌讲师',
    points: ['微软 MOS 大师级认证', '把复杂能力拆成可以照着做的步骤', '让学习结果回到真实工作与生活'],
    accent: '04 / TEACH',
  },
  {
    period: '现在',
    place: '让 AI 开始替你工作',
    role: 'AI 仓鼠洞 · 新手学习入口',
    points: ['从“亲自做每件事”进入人机协作', '用更短时间完成更多，而且做得更好', '重新打开一个人的能力边界'],
    accent: '05 / AUTOMATE',
  },
]

const EASE = [0.22, 1, 0.36, 1]
const containerV = { hidden: {}, show: { transition: { staggerChildren: 0.09, delayChildren: 0.04 } } }
const itemV = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { duration: 0.75, ease: EASE } },
}

function Entry({ entry, index }: { entry: StoryEntry; index: number }) {
  return (
    <motion.article
      className="tl-entry"
      data-point={FOCUS_POINTS[index]}
      variants={containerV}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-12% 0px -12% 0px' }}
    >
      <motion.span className="tl-dot" variants={itemV} aria-hidden="true" />
      <div className="tl-body">
        <motion.div className="tl-accent" variants={itemV}>{entry.accent}</motion.div>
        <motion.div className="tl-period" variants={itemV}>{entry.period}</motion.div>
        <motion.h3 className="tl-place" variants={itemV}>{entry.place}</motion.h3>
        <motion.div className="tl-role" variants={itemV}>{entry.role}</motion.div>
        <motion.ul className="tl-points" variants={itemV}>
          {entry.points.map((point) => <li key={point}>{point}</li>)}
        </motion.ul>
        {index === STORY.length - 1 && (
          <motion.a
            className="timeline-cta" variants={itemV}
            href={DESTINATION} target="_blank" rel="noopener noreferrer"
          >
            开始我的 AI 学习路线 <span aria-hidden="true">↗</span>
          </motion.a>
        )}
      </div>
    </motion.article>
  )
}

export default function Resume({ lang }: { lang: 'en' | 'zh' }) {
  return (
    <section className="resume" id="alex-story" lang={lang}>
      <motion.header
        className="resume-intro"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-10% 0px' }}
        transition={{ duration: 0.8, ease: EASE }}
      >
        <p className="section-kicker">ABOUT ALEX · 关于 Alex</p>
        <h2 className="resume-title">一个人的能力边界，<br /><em>可以被技术重新打开。</em></h2>
        <p className="resume-lead">
          Alex 大表哥，万有贝果科技创始人。过去三年持续研究 AI，并做出了十几款 AI 产品。
          他相信，真正有价值的技术不是制造焦虑，而是让每个人都能把想法更快变成现实。
        </p>
      </motion.header>

      <div className="timeline">
        {STORY.map((entry, index) => <Entry key={entry.accent} entry={entry} index={index} />)}
      </div>
    </section>
  )
}
