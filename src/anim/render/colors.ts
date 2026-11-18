/** CSS tokens the stage reads. Resolved once on mount and on theme change, never per frame. */
export const STAGE_TOKENS = [
  'floor', 'floor-edge', 'wall', 'wall-side', 'court-line', 'ball', 'ball-edge', 'good', 'bad', 'target', 'target-edge',
  'figure', 'figure-far', 'figure-edge', 'racquet', 'accent', 'stage', 'shadow', 'ink', 'surface',
] as const
export type StageToken = (typeof STAGE_TOKENS)[number]
export type StageColors = Record<StageToken, string>

export function readStageColors(el: Element = document.documentElement): StageColors {
  const cs = getComputedStyle(el)
  const out = {} as StageColors
  for (const k of STAGE_TOKENS) out[k] = cs.getPropertyValue('--' + k).trim()
  return out
}

/** Calls back when the theme changes (data-theme attribute or the system setting). Returns an unsubscribe. */
export function onThemeChange(cb: () => void): () => void {
  const mo = new MutationObserver(cb)
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  const mq = matchMedia('(prefers-color-scheme: dark)')
  mq.addEventListener('change', cb)
  return () => {
    mo.disconnect()
    mq.removeEventListener('change', cb)
  }
}
