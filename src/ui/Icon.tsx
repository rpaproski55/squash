const PATHS: Record<string, string> = {
  play: 'M8 5.5v13l11-6.5z',
  pause: 'M7 5h3.5v14H7zM13.5 5H17v14h-3.5z',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  x: 'M6.5 6.5l11 11M17.5 6.5l-11 11',
  back: 'M15 5l-7 7 7 7',
  chevron: 'M9 5l7 7-7 7',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  home: 'M4 11l8-6.5 8 6.5V20h-5.5v-5.5h-5V20H4z',
  ladder: 'M7 3v18M17 3v18M7 7.5h10M7 12h10M7 16.5h10',
  chart: 'M4 19h16M6.5 15l4-4.5 3 3L19 7',
  up: 'M7 14l5-5 5 5',
  down: 'M7 10l5 5 5-5',
  flat: 'M6 12h12',
  spark: 'M12 3.5l2.2 5.6 5.8.6-4.4 3.9 1.3 5.9L12 16.5l-4.9 3 1.3-5.9L4 9.7l5.8-.6z',
  trash: 'M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12',
}
const FILLED = new Set(['play', 'pause', 'spark'])

export function Icon({ name, size = 22 }: { name: keyof typeof PATHS | string; size?: number }) {
  const filled = FILLED.has(name)
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"
      fill={filled ? 'currentColor' : 'none'} stroke={filled ? 'none' : 'currentColor'}
      strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <path d={PATHS[name]} />
    </svg>
  )
}
