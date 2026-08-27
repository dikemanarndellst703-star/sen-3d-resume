export interface WorkListItem {
  name: string
  meta?: string
  tags?: string[]
  link?: string
  slug?: string
}

export interface WorkSection {
  id: string
  no: string
  title: string
  tagline: string
  items: WorkListItem[]
  footer?: string
}

export interface WorksLang {
  title: string
  hint: string
  visitLabel: string
  sections: WorkSection[]
}

const LINK = 'https://ai.alexdbg.com/'

export const WORKS: Record<'zh' | 'en', WorksLang> = {
  zh: {
    title: 'AI 学习地图',
    hint: '向右探索 · 继续下滑',
    visitLabel: '进入学习站',
    sections: [
      {
        id: 'start',
        no: '01',
        title: 'AI 入门',
        tagline: '先建立正确认知，再选择工具',
        items: [
          { name: 'ChatGPT 从零开始', meta: '对话与提问', tags: ['新手'], link: LINK },
          { name: '找到适合你的 AI 模型', meta: '模型选择', link: LINK },
          { name: '建立第一套提示词方法', meta: 'Prompt', link: LINK },
          { name: '避开新手最常见的坑', meta: '认知地图', link: LINK },
        ],
        footer: '适合：第一次系统接触 AI，或收藏了很多工具却仍不知道从哪开始的人。',
      },
      {
        id: 'art',
        no: '02',
        title: 'AI 绘画',
        tagline: '把脑海里的画面变成作品',
        items: [
          { name: '从描述到高质量画面', meta: '视觉提示词', link: LINK },
          { name: '风格、构图与角色一致性', meta: '创作方法', link: LINK },
          { name: '为内容与品牌快速出图', meta: '实战', link: LINK },
          { name: '让 AI 成为视觉搭档', meta: '工作流', link: LINK },
        ],
        footer: '适合：内容创作者、设计新手，以及想快速表达视觉创意的人。',
      },
      {
        id: 'code',
        no: '03',
        title: 'AI 编程',
        tagline: '不会写代码，也能把想法做出来',
        items: [
          { name: '用自然语言完成第一个网页', meta: 'Vibe Coding', link: LINK },
          { name: '让 AI 帮你理解与修改代码', meta: '协作方式', link: LINK },
          { name: '从需求到可运行的小工具', meta: '产品实战', link: LINK },
          { name: '建立自己的 AI 开发流程', meta: '进阶', link: LINK },
        ],
        footer: '适合：有想法、没技术背景，想亲手做出网站、工具或产品的人。',
      },
      {
        id: 'automate',
        no: '04',
        title: 'AI 效率',
        tagline: '从亲自做每件事，到让 AI 开始工作',
        items: [
          { name: '打造你的 AI 工作助理', meta: '个人系统', link: LINK },
          { name: '把重复任务交给自动化', meta: '工作流', link: LINK },
          { name: '办公、内容与知识管理', meta: '效率工具', link: LINK },
          { name: '重新打开个人能力边界', meta: '长期路线', link: LINK },
        ],
        footer: '目标：不是使用更多工具，而是用更少时间，稳定完成更高质量的工作。',
      },
    ],
  },
  en: {
    title: 'AI Learning Map',
    hint: 'Explore right · Keep scrolling',
    visitLabel: 'Start learning',
    sections: [
      { id: 'start', no: '01', title: 'AI Basics', tagline: 'Build the right mental model first', items: [{ name: 'ChatGPT from zero', meta: 'Conversation', link: LINK }, { name: 'Choose the right model', meta: 'Models', link: LINK }, { name: 'Build your first prompt method', meta: 'Prompting', link: LINK }, { name: 'Avoid common beginner traps', meta: 'Roadmap', link: LINK }], footer: 'For anyone who wants a clear and practical starting point.' },
      { id: 'art', no: '02', title: 'AI Art', tagline: 'Turn an idea into an image', items: [{ name: 'From words to images', meta: 'Visual prompts', link: LINK }, { name: 'Style, composition and consistency', meta: 'Method', link: LINK }, { name: 'Create for content and brands', meta: 'Practice', link: LINK }, { name: 'Make AI your visual partner', meta: 'Workflow', link: LINK }], footer: 'For creators and visual thinkers.' },
      { id: 'code', no: '03', title: 'AI Coding', tagline: 'Build without a traditional coding background', items: [{ name: 'Create your first website', meta: 'Vibe Coding', link: LINK }, { name: 'Understand and edit code with AI', meta: 'Collaboration', link: LINK }, { name: 'From need to working tool', meta: 'Product', link: LINK }, { name: 'Build an AI development workflow', meta: 'Advanced', link: LINK }], footer: 'For people who have an idea and want to ship it.' },
      { id: 'automate', no: '04', title: 'AI Productivity', tagline: 'Let AI start working for you', items: [{ name: 'Build an AI work assistant', meta: 'System', link: LINK }, { name: 'Automate repetitive tasks', meta: 'Workflow', link: LINK }, { name: 'Work, content and knowledge', meta: 'Tools', link: LINK }, { name: 'Expand your capability boundary', meta: 'Roadmap', link: LINK }], footer: 'Use fewer tools to do better work in less time.' },
    ],
  },
}

export const SECTION_COVERS: Record<string, string> = {}
