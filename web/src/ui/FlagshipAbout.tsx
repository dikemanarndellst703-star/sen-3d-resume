const DESTINATION = 'https://ai.alexdbg.com/'

const STORY = [
  { period: '过去三年', place: '持续研究 AI', role: '从工具使用者，到 AI 产品实践者', points: ['深入研究生成式 AI 与效率工具', '独立做出十几款 AI 产品', '验证 AI 如何真正改变工作方式'], label: 'RESEARCH' },
  { period: '创业实践', place: '万有贝果科技', role: '创始人', points: ['把 AI 方法沉淀成可使用的产品', '用真实业务检验每一套工作流', '关注普通人能立刻获得的效率提升'], label: 'BUILD' },
  { period: '内容影响', place: '@Alex 大表哥', role: 'AI 领域 30 万粉丝自媒体博主', points: ['拆解复杂概念，让 AI 新手也能听懂', '从 ChatGPT、AI 绘画到 AI 编程', '不堆工具，先帮你找到适合自己的路径'], label: 'SHARE' },
  { period: '教学现场', place: '2 万+ 学员 · 30 场+ 全国巡回', role: '趁早职场系列课 100% 好评金牌讲师', points: ['微软 MOS 大师级认证', '把复杂能力拆成可以照着做的步骤', '让学习结果回到真实工作与生活'], label: 'TEACH' },
  { period: '现在', place: '让 AI 开始替你工作', role: 'AI 仓鼠洞 · 新手学习入口', points: ['从“亲自做每件事”进入人机协作', '用更短时间完成更多，而且做得更好', '重新打开一个人的能力边界'], label: 'AUTOMATE' },
]

export default function FlagshipAbout() {
  return <>
    <section className="flagship-about" id="alex-story" aria-labelledby="flagship-about-title">
      <div className="flagship-about-intro">
        <p className="flagship-section-kicker">MEET ALEX <span>你的 AI 同路人</span></p>
        <h2 id="flagship-about-title">一个人。<br />也有<span>无限可能。</span></h2>
        <div className="flagship-about-description"><p>我是 Alex 大表哥，<br />万有贝果科技创始人。</p><p>过去三年，我持续研究 AI，做出了十几款 AI 产品。比起制造工具焦虑，我更想帮你把想法变成现实。</p></div>
      </div>
      <dl className="flagship-about-numbers" aria-label="Alex 的教学与内容影响力">
        <div><dt>AI 内容同路人</dt><dd>30<span>万</span></dd></div>
        <div><dt>培训学员</dt><dd>2<span>万+</span></dd></div>
        <div><dt>全国巡回教学</dt><dd>30<span>场+</span></dd></div>
      </dl>
      <div className="flagship-about-story">
        <div className="flagship-story-heading"><p>把走过的路，<br />变成你的起点。</p><span>THINK. BUILD. SHARE.</span></div>
        <div className="flagship-story-entries">{STORY.map((entry) => <article className="flagship-story-entry" key={entry.label}>
          <div className="flagship-story-meta"><span>{entry.period}</span><span>{entry.label}</span></div>
          <div className="flagship-story-detail"><h3>{entry.place}</h3><p>{entry.role}</p><ul>{entry.points.map((point) => <li key={point}>{point}</li>)}</ul></div>
        </article>)}</div>
      </div>
    </section>
    <section className="flagship-invitation" aria-labelledby="flagship-invitation-title">
      <p className="flagship-section-kicker">YOUR NEXT CHAPTER STARTS HERE</p>
      <h2 id="flagship-invitation-title">让想法，<br /><span>发生。</span></h2>
      <div className="flagship-invitation-bottom"><p>保持好奇。做出第一个作品。<br />开启属于你的 AI 旅程。</p><a href={DESTINATION} target="_blank" rel="noopener noreferrer">进入 AI 仓鼠洞 <span aria-hidden="true">↗</span></a></div>
    </section>
  </>
}
