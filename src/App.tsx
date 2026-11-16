import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import { useCallback, useState } from 'react'
import { getDrill } from './content/skills'
import { useDrillResults } from './data/hooks'
import { DevSwing } from './screens/DevSwing'
import { Levels } from './screens/Levels'
import { Progress } from './screens/Progress'
import { SkillScreen } from './screens/SkillScreen'
import { Today } from './screens/Today'
import { Icon } from './ui/Icon'
import { LogSheet, Toast } from './ui/LogSheet'
import { href, useRoute } from './ui/router'

const TABS = [
  { id: '', label: 'Today', icon: 'home' },
  { id: 'levels', label: 'Levels', icon: 'ladder' },
  { id: 'progress', label: 'Progress', icon: 'chart' },
]

export function App() {
  const route = useRoute()
  const [logDrill, setLogDrill] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; celebrate: boolean } | null>(null)
  const drill = getDrill(logDrill ?? 'drive-streak')!
  const results = useDrillResults(drill.id)
  const clearToast = useCallback(() => setToast(null), [])

  const [first = '', second] = route
  let screen
  if (first === 'skill' && second) screen = <SkillScreen id={second} onLog={setLogDrill} />
  else if (first === 'dev' && second === 'swing') screen = <DevSwing />
  else if (first === 'levels') screen = <Levels />
  else if (first === 'progress') screen = <Progress />
  else screen = <Today onLog={setLogDrill} />

  const activeTab = first === 'skill' ? '' : first

  return (
    <MotionConfig reducedMotion="user">
      <div className="app">
        <AnimatePresence mode="wait" initial={false}>
          <motion.main
            key={route.join('/')}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            {screen}
          </motion.main>
        </AnimatePresence>
      </div>

      <div className="tabbar">
        <nav aria-label="Main">
          {TABS.map((t) => (
            <a key={t.id} className="tab" href={href(t.id)} aria-current={activeTab === t.id ? 'page' : undefined}>
              <Icon name={t.icon} size={24} />
              {t.label}
            </a>
          ))}
        </nav>
      </div>

      <LogSheet
        drill={drill}
        results={results}
        open={logDrill !== null}
        onClose={() => setLogDrill(null)}
        onSaved={(message, celebrate) => setToast({ message, celebrate })}
      />
      <Toast message={toast?.message ?? null} celebrate={toast?.celebrate ?? false} onDone={clearToast} />
    </MotionConfig>
  )
}
