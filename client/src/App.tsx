import { useEffect, useRef, useState, lazy, Suspense } from 'react'
import { motion, useInView, useScroll, useTransform, useSpring } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowRight, MapPin, Phone, Mail, Globe, Send, Github, ExternalLink, ChevronDown, Brain, Cpu, Rocket, Shield, Zap, Users, Linkedin } from 'lucide-react'
import Hero3D from './components/Hero3D'
import InteractiveParticles from './components/InteractiveParticles'
import FloatingOrbs from './components/FloatingOrbs'
import NeuralCanvas from './components/NeuralCanvas'
import GravityParticles from './components/GravityParticles'
import ScrollSnake from './components/ScrollSnake'
import { TextReveal, Spotlight } from './components/Effects'

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

/* ─── CUSTOM CURSOR ─── */
function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function move(e: MouseEvent) {
      if (dotRef.current) {
        dotRef.current.style.left = e.clientX - 4 + 'px'
        dotRef.current.style.top = e.clientY - 4 + 'px'
      }
      if (ringRef.current) {
        ringRef.current.style.left = e.clientX - 20 + 'px'
        ringRef.current.style.top = e.clientY - 20 + 'px'
      }
    }
    function over() { ringRef.current?.classList.add('hover') }
    function out() { ringRef.current?.classList.remove('hover') }

    window.addEventListener('mousemove', move)
    document.querySelectorAll('a, button, .hoverable').forEach(el => {
      el.addEventListener('mouseenter', over)
      el.addEventListener('mouseleave', out)
    })
    return () => window.removeEventListener('mousemove', move)
  }, [])

  return (
    <>
      <div ref={dotRef} className="cursor-dot" />
      <div ref={ringRef} className="cursor-ring" />
    </>
  )
}

/* ─── SCROLL REVEAL ─── */
function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}

/* ─── ANIMATED COUNTER ─── */
function Counter({ value, label }: { value: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true })
  return (
    <div ref={ref} className="glass-card p-6 md:p-8 text-center min-w-[140px]">
      <div className="text-3xl md:text-5xl font-bold text-white mb-2">{value}</div>
      <div className="text-sm text-white/50">{label}</div>
    </div>
  )
}

/* ─── GSAP HEADING ANIMATION ─── */
function GsapHeading({ children, className = '', delay = 0 }: { children: string; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!ref.current) return
    const words = ref.current.querySelectorAll('.gsap-word')
    gsap.fromTo(
      words,
      { yPercent: 120, opacity: 0, rotateX: -30 },
      {
        yPercent: 0, opacity: 1, rotateX: 0,
        duration: 0.9, ease: 'power3.out', stagger: 0.05, delay,
        scrollTrigger: { trigger: ref.current, start: 'top 85%', once: true },
      }
    )
  }, [delay])
  return (
    <div ref={ref} className={className} style={{ perspective: '600px' }}>
      {children.split(' ').map((word, i) => (
        <span key={i} className="gsap-word inline-block mr-[0.25em]" style={{ willChange: 'transform, opacity' }}>
          {word}
        </span>
      ))}
    </div>
  )
}

/* ─── GSAP COUNTER ANIMATION ─── */
function GsapCounter({ value, label }: { value: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const numRef = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    if (!ref.current || !numRef.current) return
    const num = parseInt(value) || 0
    if (num === 0) return
    const obj = { val: 0 }
    gsap.to(obj, {
      val: num, duration: 2, ease: 'power2.out',
      scrollTrigger: { trigger: ref.current, start: 'top 85%', once: true },
      onUpdate: () => { numRef.current!.textContent = Math.round(obj.val) + (value.includes('+') ? '+' : '') },
    })
  }, [value])
  return (
    <div ref={ref} className="glass-card p-6 md:p-8 text-center min-w-[140px]">
      <div className="text-3xl md:text-5xl font-bold text-white mb-2">
        <span ref={numRef}>{value}</span>
      </div>
      <div className="text-sm text-white/50">{label}</div>
    </div>
  )
}

/* ─── SECTION HEADER ─── */
function SectionHeader({ tag, title, accent }: { tag: string; title: string; accent: string }) {
  return (
    <Reveal>
      <div className="mb-12 md:mb-16">
        <div className="inline-flex items-center gap-2 mb-4 opacity-50">
          <div className="w-2 h-2 rounded-full bg-accent-purple" />
          <span className="text-sm font-mono tracking-wider uppercase">{tag}</span>
        </div>
        <GsapHeading className="text-3xl md:text-5xl lg:text-6xl font-semibold tracking-tight" delay={0.1}>
          {title}
        </GsapHeading>
        <div className="text-3xl md:text-5xl lg:text-6xl font-semibold tracking-tight -mt-1">
          <span className="text-white/70 italic">{accent}</span>
        </div>
      </div>
    </Reveal>
  )
}

/* ─── DATA ─── */
const stats = [
  { value: '27+', label: 'AI-проектов' },
  { value: '9+', label: 'отраслей' },
  { value: '15', label: 'инженеров' },
  { value: '5 лет', label: 'в AI-разработке' },
]

const skills = [
  { cat: 'AI & LLM', items: ['GPT-4.1', 'Gemini', 'Qwen', 'Claude', 'DeepSeek', 'OpenRouter API', 'RAG', 'LangChain', 'NLP', 'OCR', 'Prompt Engineering'] },
  { cat: 'AI Dev Tools', items: ['Claude Code', 'GitHub Copilot', 'OpenAI Codex', 'Hermes', 'OpenClaw', 'Qoder', 'Vibe Coding'] },
  { cat: 'Backend', items: ['Python', 'FastAPI', 'aiogram', 'REST API', 'Telegram Bot API', 'Webhooks', 'Payment Gateways'] },
  { cat: 'Frontend', items: ['React', 'Next.js', 'Vue', 'Nuxt', 'TypeScript', 'Vite', 'Bun'] },
  { cat: 'DevOps', items: ['Docker', 'GitHub Actions', 'CI/CD', 'Dokploy', 'VPS'] },
  { cat: 'Data & Infra', items: ['PostgreSQL', 'MySQL', 'Redis', 'Ollama', 'Hugging Face', 'Self-hosted LLM'] },
]

const projects = [
  { title: 'AI-автоматизация торгов по банкротству', result: '4 000 лотов/день · точность 89% · ROI 230%', metric: '8.5 млн', metricLabel: 'чистая прибыль/год', color: '#6b7fa3', business: '8.5 млн ₽ чистой прибыли в год. Автоматизация заменила ручной труд аналитиков — экономия ФОТ и рост маржи.' },
  { title: 'AI-автоматизация тендерных закупок', result: '100 заявок/день · выручка +75%', metric: '+40%', metricLabel: 'выигранных тендеров', color: '#4a6fa5', business: '+40% выигранных тендеров = +75% выручки. Компания получает контракты, которые раньше проигрывала.' },
  { title: 'AI-скоринг лидов и маршрутизация', result: 'Скорость ×3 · конверсия +31%', metric: '2 млн', metricLabel: 'экономия ФОТ/год', color: '#5a8a7a', business: '2 млн ₽ экономии ФОТ в год. Менеджеры работают только с «горячими» лидами — конверсия +31%.' },
  { title: 'Архитектура AI-ассистента СБЕР-тройки', result: 'Утверждённая архитектура для финтех-экосистемы', metric: 'LLM+RAG', metricLabel: 'pipeline', color: '#3d6b8a', business: 'Архитектура для финтех-экосистемы уровня СБЕР. Снижение рисков и времени выхода на рынок.' },
  { title: 'CRM-платформа с AI-агентным кодингом', result: 'Автогенерация модулей, AI-ответы, аналитика чатов', metric: 'AI-CRM', metricLabel: 'full-stack', color: '#6b7fa3', business: 'Скорость разработки ×3 за счёт AI-агентного кодинга. Экономия на найме и ускорение time-to-market.' },
  { title: 'AI-анализ Telegram-чатов', result: 'Авто-выявление задач, сентимент, дашборд', metric: '24/7', metricLabel: 'мониторинг', color: '#4a6fa5', business: 'Мониторинг 24/7 без людей. Раннее выявление проблем = сохранение клиентов и выручки.' },
  { title: 'Архитектура Web App — Andara Energy', result: 'Стек, модель данных, интеграции, безопасность', metric: 'Roadmap', metricLabel: 'ready-to-build', color: '#5a8a7a', business: 'Готовый roadmap = предсказуемый бюджет и сроки. Инвестор видит понятный план до запуска.' },
]

const timeline = [
  { year: '2023 — н.в.', role: 'CTO & Технический директор', company: 'ARTIFICA', desc: 'AI-автоматизация, SaaS-сервисы, веб- и мобильные приложения. Команда 15 инженеров, 27 проектов в 9+ отраслях.' },
  { year: '2012', role: 'Топ-лидер', company: 'NL International', desc: 'Построение коммерческой структуры с нуля до 100+ человек. Система мотивации и обучения.' },
  { year: '2007 — 2009', role: 'Директор', company: 'ООО «Компания Итера»', desc: 'IT-инфраструктура на промышленных объектах.Ethernet-сети, IP-видеонаблюдение, сигнализация.' },
  { year: '2001', role: 'Инженер', company: 'РГРТУ', desc: 'Высшее образование — инженер радиотехники. ЧПУ, программирование, production-среда.' },
]

const photos = ['/assets/photo1.jpg', '/assets/photo2.jpg', '/assets/photo3.jpg', '/assets/photo4.jpg', '/assets/photo5.jpg']

/* ─── MARQUEE ─── */
function TechMarquee() {
  const items = ['GPT-4.1', 'Gemini', 'Claude', 'Qwen', 'DeepSeek', 'FastAPI', 'React', 'Docker', 'PostgreSQL', 'Redis', 'LangChain', 'RAG', 'Ollama', 'Three.js', 'GSAP']
  return (
    <div className="overflow-hidden py-8 border-y border-white/5">
      <div className="marquee-track whitespace-nowrap">
        {[...items, ...items].map((item, i) => (
          <span key={i} className="text-lg md:text-xl font-mono text-white/20 mx-6 md:mx-10">{item}</span>
        ))}
      </div>
    </div>
  )
}

/* ─── MAIN APP ─── */
export default function App() {
  const { scrollYProgress } = useScroll()
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.95])

  return (
    <div className="noise-overlay min-h-screen bg-brand-dark text-white">
      <ScrollSnake />
      <FloatingOrbs />

      {/* ── SCROLL PROGRESS ── */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[2px] z-[100] origin-left"
        style={{
          scaleX: scrollYProgress,
          background: 'linear-gradient(90deg, #6b7fa3, #4a6fa5, #5a8a7a)',
        }}
      />

      {/* ── NAVIGATION ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-4 md:px-8 py-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-7xl mx-auto flex items-center justify-between backdrop-blur-xl bg-brand-dark/70 rounded-2xl px-6 py-3 border border-white/5"
        >
          <div className="flex items-center gap-1">
            <span className="text-2xl font-black text-accent-purple">R</span>
            <span className="text-2xl font-black text-accent-green">M</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-white/60">
            <a href="#about" className="hover:text-white transition-colors">Обо мне</a>
            <a href="#skills" className="hover:text-white transition-colors">Навыки</a>
            <a href="#projects" className="hover:text-white transition-colors">Проекты</a>
            <a href="#experience" className="hover:text-white transition-colors">Опыт</a>
            <a href="#contact" className="hover:text-white transition-colors">Контакт</a>
          </div>
          <a href="#contact" className="btn-glow text-sm py-2 px-5 hidden md:inline-block">Связаться</a>
        </motion.div>
      </nav>

      {/* ── HERO ── */}
      <motion.section
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative min-h-screen flex items-center justify-center px-4 md:px-8 overflow-hidden"
      >
        <InteractiveParticles />
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-brand-dark z-[1]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-accent-purple/5 blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-accent-blue/5 blur-[100px]" />

        <div className="relative z-10 w-full max-w-3xl mx-auto mt-auto mb-8">
          {/* ── GLASS CARD ── */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative rounded-[2rem] overflow-hidden"
            style={{
              background: 'rgba(10, 10, 15, 0.3)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              border: '1px solid rgba(147, 111, 255, 0.12)',
            }}
          >

            <div className="relative z-10 text-center px-8 md:px-12 py-6 md:py-10">
              <motion.h1
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.6 }}
                className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05] mb-3"
              >
                <span className="text-white">Александр Романов</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.8 }}
                className="text-base md:text-lg text-white/60 max-w-2xl mx-auto mb-3 font-medium"
              >
                CTO · Head of AI & Automation · Technical Director
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 1.0 }}
                className="flex flex-wrap items-center justify-center gap-3 text-xs text-white/40 mb-6"
              >
                <span className="flex items-center gap-1"><MapPin size={14}/> Калининград</span>
                <span>·</span>
                <span>43 года</span>
                <span>·</span>
                <span className="flex items-center gap-1"><Globe size={14}/> artifica.tech</span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 1.2 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-4"
              >
                <a href="#projects" className="btn-glow flex items-center gap-2 text-base px-6 py-3">
                  Смотреть проекты <ArrowRight size={18} />
                </a>
                <a href="#contact" className="flex items-center gap-2 px-6 py-3 rounded-xl border border-white/10 text-white/70 hover:border-accent-purple/30 hover:text-white transition-all">
                  <Send size={16} /> Написать мне
                </a>
              </motion.div>
            </div>
          </motion.div>
        </div>

        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
        >
          <ChevronDown className="w-6 h-6 text-white/20" />
        </motion.div>
      </motion.section>

      {/* ── STATS ── */}
      <section className="px-4 md:px-8 py-16 md:py-24 relative z-10">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 mb-4 opacity-50">
                <div className="w-2 h-2 rounded-full bg-accent-green" />
                <span className="text-sm font-mono tracking-wider uppercase">результаты в цифрах</span>
              </div>
            </div>
          </Reveal>
          <div className="flex flex-wrap justify-center gap-4 md:gap-6">
            {stats.map((s, i) => (
              <Reveal key={i} delay={i * 0.1}>
                <GsapCounter value={s.value} label={s.label} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <TechMarquee />

      {/* ── ABOUT ── */}
      <section id="about" className="px-4 md:px-8 py-20 md:py-32 relative z-10">
        <div className="max-w-6xl mx-auto">
          <SectionHeader tag="about" title="Технический" accent="лидер" />
          <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-start">
            <Reveal>
              <div className="relative group">
                <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-accent-purple/20 to-accent-blue/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <img
                  src="/assets/photo1.jpg"
                  alt="Александр Романов"
                  className="relative rounded-3xl w-full aspect-[3/4] object-cover photo-hover"
                />
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-brand-dark via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="glass-card p-4 text-sm">
                    <div className="text-accent-green font-mono text-xs mb-1">// current_status</div>
                    <div className="text-white/80">CTO ARTIFICA · 15 инженеров · 27 AI-проектов</div>
                  </div>
                </div>
              </div>
            </Reveal>
            <div className="space-y-6">
              <Reveal delay={0.2}>
                <p className="text-lg md:text-xl text-white/70 leading-relaxed">
                  Технический директор с фокусом на <span className="text-accent-purple font-medium">AI, LLM и автоматизацию бизнеса</span>.
                  Управляю кросс-функциональной командой из 15 инженеров. Запустил 27 AI-проектов в 9+ отраслях —
                  от автоматизации торгов до скоринга лидов и архитектурного консалтинга для крупных корпоративных заказчиков.
                </p>
              </Reveal>
              <Reveal delay={0.3}>
                <div className="space-y-4">
                  {[
                    'Перевожу бизнес-задачи в архитектуру AI-решений с измеримым эффектом',
                    'Формирую и масштабирую технические команды',
                    'Строю CI/CD-процессы и деплою AI в продакшн',
                    'Консультирую по AI-стратегии и выбору моделей',
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent-purple mt-2.5 flex-shrink-0" />
                      <span className="text-white/60">{item}</span>
                    </div>
                  ))}
                </div>
              </Reveal>
              <Reveal delay={0.4}>
                <div className="glass-card p-5">
                  <div className="text-accent-green font-mono text-xs mb-3">// ключевые отличия</div>
                  <div className="space-y-2 text-sm text-white/60">
                    <p>📚 Автор курса по нейросетям (4 модуля, с 2022)</p>
                    <p>👥 Управлял структурой 100+ человек (NL International)</p>
                    <p>🔧 Инженерное прошлое (ЧПУ, Ethernet, сигнализации)</p>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ── SKILLS ── */}
      <section id="skills" className="px-4 md:px-8 py-20 md:py-32 bg-brand-surface/50 relative z-10">
        <div className="max-w-6xl mx-auto">
          <SectionHeader tag="skills" title="Технический" accent="стек" />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {skills.map((group, gi) => (
              <Reveal key={gi} delay={gi * 0.1}>
                <div className="glass-card p-6">
                  <div className="text-accent-purple font-mono text-xs mb-4">// {group.cat}</div>
                  <div className="flex flex-wrap gap-2">
                    {group.items.map((item, i) => (
                      <span key={i} className="skill-orb text-sm text-white/70">{item}</span>
                    ))}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <Spotlight className="relative z-10">
      {/* ── PROJECTS ── */}
      <section id="projects" className="px-4 md:px-8 py-20 md:py-32 relative z-10">
        <div className="max-w-6xl mx-auto">
          <SectionHeader tag="projects" title="Ключевые" accent="проекты" />
          <div className="grid md:grid-cols-2 gap-6">
            {projects.map((p, i) => (
              <Reveal key={i} delay={i * 0.08}>
                <div className="flip-card group hoverable" style={{ perspective: '1200px' }}>
                  <div className="flip-card-inner relative">
                    {/* FRONT */}
                    <div className="flip-face glass-card p-6 md:p-8 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-[60px] opacity-20" style={{ background: p.color }} />
                      <div className="relative z-10">
                        <div className="flex items-start justify-between mb-4">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold" style={{ background: `${p.color}20`, color: p.color }}>
                            {String(i + 1).padStart(2, '0')}
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold" style={{ color: p.color }}>{p.metric}</div>
                            <div className="text-xs text-white/40">{p.metricLabel}</div>
                          </div>
                        </div>
                        <h3 className="text-lg md:text-xl font-semibold mb-2 group-hover:text-white transition-colors">{p.title}</h3>
                        <p className="text-sm text-white/50 leading-relaxed">{p.result}</p>
                        <div className="mt-4 text-xs text-white/30 flex items-center gap-1">Ценность для бизнеса →</div>
                      </div>
                    </div>
                    {/* BACK */}
                    <div className="flip-face flip-back p-6 md:p-8 relative overflow-hidden flex flex-col justify-center" style={{ background: `linear-gradient(135deg, ${p.color}26, rgba(13,17,32,0.95))`, border: `1px solid ${p.color}40` }}>
                      <div className="relative z-10">
                        <div className="text-xs font-mono uppercase tracking-wider mb-3" style={{ color: p.color }}>Ценность для бизнеса</div>
                        <div className="text-3xl md:text-4xl font-bold mb-3" style={{ color: p.color }}>{p.metric}</div>
                        <p className="text-sm md:text-base text-white/80 leading-relaxed">{p.business}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      </Spotlight>

      {/* ── EXPERIENCE TIMELINE ── */}
      <section id="experience" className="px-4 md:px-8 py-20 md:py-32 bg-brand-surface/50 relative z-10">
        <div className="max-w-4xl mx-auto">
          <SectionHeader tag="experience" title="Карьерный" accent="путь" />
          <div className="relative pl-12 md:pl-16 space-y-12">
            <div className="timeline-line" />
            {timeline.map((item, i) => (
              <Reveal key={i} delay={i * 0.15}>
                <div className="relative">
                  <div className="timeline-dot" style={{ top: '6px' }} />
                  <div className="glass-card p-6 ml-6">
                    <div className="text-accent-purple font-mono text-xs mb-2">{item.year}</div>
                    <h3 className="text-lg font-semibold mb-1">{item.role}</h3>
                    <div className="text-accent-blue text-sm mb-3">{item.company}</div>
                    <p className="text-sm text-white/50 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── PHOTO GALLERY ── */}
      <section className="px-4 md:px-8 py-20 md:py-32 relative z-10">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 auto-rows-[180px] md:auto-rows-[200px]">
              {photos.map((src, i) => (
                <div key={i} className={`photo-hover rounded-2xl overflow-hidden ${i === 0 ? 'col-span-2 row-span-2' : ''}`}>
                  <img
                    src={src}
                    alt={`Фото ${i + 1}`}
                    className="w-full h-full object-cover hoverable"
                  />
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── EDUCATION ── */}
      <section className="px-4 md:px-8 py-20 md:py-32 bg-brand-surface/50 relative z-10">
        <div className="max-w-4xl mx-auto">
          <SectionHeader tag="education" title="Образование и" accent="развитие" />
          <div className="grid md:grid-cols-2 gap-6">
            <Reveal>
              <div className="glass-card p-6">
                <div className="text-accent-purple font-mono text-xs mb-3">// высшее образование</div>
                <h3 className="text-lg font-semibold mb-2">РГРТУ</h3>
                <p className="text-sm text-white/50">Рязанский государственный радиотехнический университет · Инженер · 2001</p>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="glass-card p-6">
                <div className="text-accent-green font-mono text-xs mb-3">// преподавание</div>
                <h3 className="text-lg font-semibold mb-2">Автор курса по нейросетям</h3>
                <p className="text-sm text-white/50">4 модуля (базовый + продвинутый). LLM, промпт-инжиниринг, интеграция AI. С 2022 года.</p>
              </div>
            </Reveal>
            <Reveal delay={0.2}>
              <div className="glass-card p-6 md:col-span-2">
                <div className="text-accent-blue font-mono text-xs mb-3">// самообразование</div>
                <h3 className="text-lg font-semibold mb-2">Постоянное развитие</h3>
                <p className="text-sm text-white/50">GPT-4.1/GPT-5, Gemini, Qwen, DeepSeek, Claude · RAG, AI-агенты, agentные системы кодинга · Hermes, OpenClaw</p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── WHAT I BRING ── */}
      <section className="px-4 md:px-8 py-20 md:py-32 relative z-10">
        <div className="max-w-6xl mx-auto">
          <SectionHeader tag="value" title="Что я приношу" accent="бизнесу" />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Brain, title: 'AI-архитектура', text: 'Перевожу бизнес-задачи в архитектуру AI-решений с измеримым эффектом: рост выручки, сокращение ФОТ, ускорение процессов', color: '#6b7fa3' },
              { icon: Users, title: 'Команды', text: 'Формирую и масштабирую технические команды — умею нанимать, выстраивать процессы и удерживать результат', color: '#4a6fa5' },
              { icon: Rocket, title: 'CI/CD & Deploy', text: 'Строю предсказуемые CI/CD-процессы и деплою AI-компоненты в продакшн (GitHub Actions, Docker, Dokploy)', color: '#5a8a7a' },
              { icon: Shield, title: 'AI-стратегия', text: 'Консультирую по AI-стратегии, выбору моделей (GPT, Gemini, Qwen, Claude, DeepSeek) и технологическому roadmap', color: '#3d6b8a' },
              { icon: Cpu, title: 'LLM Deployment', text: 'Локальное развёртывание LLM на собственных серверах: Ollama, Hugging Face, оптимизация под железо', color: '#6b7fa3' },
              { icon: Zap, title: '27 проектов', text: 'Реализовал 27 проектов в области AI, автоматизации и цифровых продуктов в 9+ отраслях', color: '#4a6fa5' },
            ].map((item, i) => (
              <Reveal key={i} delay={i * 0.08}>
                <div className="glass-card p-6 md:p-8 group hoverable h-full">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: `${item.color}15` }}>
                    <item.icon size={24} style={{ color: item.color }} />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 group-hover:text-white transition-colors">{item.title}</h3>
                  <p className="text-sm text-white/50 leading-relaxed">{item.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACT CTA ── */}
      <section id="contact" className="px-4 md:px-8 py-20 md:py-32 relative overflow-hidden z-10">
        <GravityParticles />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-accent-purple/5 blur-[150px]" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <Reveal>
            <h2 className="text-3xl md:text-5xl lg:text-7xl font-bold tracking-tight mb-6">
              Давайте<br /><span className="text-white/80">работать вместе</span>
            </h2>
            <p className="text-lg text-white/50 max-w-xl mx-auto mb-10">
              Открыт к удалённому формату и релокации. Готов обсудить AI-стратегию, техническое лидерство и новые проекты.
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <a href="https://t.me/romanoffalex" className="btn-glow flex items-center gap-2 px-8 py-4 text-lg">
                <Send size={20} /> Telegram
              </a>
              <a href="mailto:romanoffalex@artifica.tech" className="flex items-center gap-2 px-8 py-4 rounded-xl border border-white/10 text-white/70 hover:border-accent-purple/30 hover:text-white transition-all">
                <Mail size={18} /> Email
              </a>
              <a href="https://www.linkedin.com/in/romanoffalex/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-8 py-4 rounded-xl border border-white/10 text-white/70 hover:border-accent-blue/40 hover:text-white transition-all">
                <Linkedin size={18} /> LinkedIn
              </a>
            </div>
          </Reveal>
          <Reveal delay={0.3}>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-white/30">
              <a href="tel:+79805000010" className="flex items-center gap-1 hover:text-white/60 transition-colors"><Phone size={14}/> +7 980 500-00-10</a>
              <a href="https://artifica.tech" target="_blank" className="flex items-center gap-1 hover:text-white/60 transition-colors"><Globe size={14}/> artifica.tech</a>
              <span className="flex items-center gap-1"><MapPin size={14}/> Калининград, Россия</span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="px-4 md:px-8 py-8 border-t border-white/5 relative z-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-white/30">
          <div className="flex items-center gap-1">
            <span className="text-xl font-black text-accent-purple">R</span>
            <span className="text-xl font-black text-accent-green">M</span>
            <span className="ml-2">© 2025 Александр Романов</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="https://artifica.tech" target="_blank" className="hover:text-white/60 transition-colors">artifica.tech</a>
            <a href="https://t.me/romanoffalex" target="_blank" className="hover:text-white/60 transition-colors">Telegram</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
