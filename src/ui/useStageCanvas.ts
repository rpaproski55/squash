import { useEffect, useRef } from 'react'
import { STAGE } from '../anim/camera'
import { onThemeChange, readStageColors, type StageColors } from '../anim/render/colors'
import { CanvasStageRenderer } from '../anim/render/canvas'

/**
 * Owns a canvas renderer: creation, sizing (ResizeObserver, device pixel ratio)
 * and theme colours. Drawing is driven by the caller through `redraw`.
 */
export function useStageCanvas(redraw: () => void) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const renderer = useRef<CanvasStageRenderer | null>(null)
  const colors = useRef<StageColors | null>(null)
  const size = useRef<{ w: number; h: number }>({ w: STAGE.w, h: STAGE.h })
  const redrawRef = useRef(redraw)
  redrawRef.current = redraw

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const r = new CanvasStageRenderer(canvas)
    renderer.current = r
    colors.current = readStageColors()
    const fit = () => {
      const box = canvas.getBoundingClientRect()
      if (!box.width) return
      size.current = { w: box.width, h: box.height }
      r.resize(box.width, box.height, window.devicePixelRatio || 1)
      redrawRef.current()
    }
    const ro = new ResizeObserver(fit)
    ro.observe(canvas)
    fit()
    const off = onThemeChange(() => {
      colors.current = readStageColors()
      redrawRef.current()
    })
    return () => {
      ro.disconnect()
      off()
      r.dispose()
      renderer.current = null
    }
  }, [])

  return { canvasRef, renderer, colors, size }
}
