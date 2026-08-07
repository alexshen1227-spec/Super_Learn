/** Shared UI kit — quiet lab aesthetic, 44px touch targets, visible focus. */
import { createPortal } from 'react-dom'
import { useEffect, useId, useRef, type ReactNode } from 'react'
import type { SkillState } from '../domain/types'
import { STATE_LABEL } from '../engine/mastery'
import { useNav } from './nav'
import { IconSettings } from './icons'
import { DIFFICULTY_INFO, difficultyInfo, type Difficulty } from '../content/difficulty'

export function Button({
  children,
  onClick,
  kind = 'primary',
  disabled,
  className = '',
  type = 'button',
  ariaLabel,
}: {
  children: ReactNode
  onClick?: () => void
  kind?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
  disabled?: boolean
  className?: string
  type?: 'button' | 'submit'
  ariaLabel?: string
}) {
  const styles: Record<string, string> = {
    primary: 'bg-accent text-bg font-semibold hover:opacity-90 active:opacity-80 disabled:opacity-40',
    secondary: 'bg-surface2 text-ink border border-line-strong hover:bg-surface3 disabled:opacity-40',
    ghost: 'bg-transparent text-accent hover:bg-accent-soft disabled:opacity-40',
    danger: 'bg-bad-soft text-bad border border-bad/40 hover:opacity-85 disabled:opacity-40',
    success: 'bg-good text-bg font-semibold hover:opacity-90 disabled:opacity-40',
  }
  return (
    <button
      type={type}
      aria-label={ariaLabel}
      className={`min-h-11 px-4 rounded-xl text-[15px] transition-[color,background-color,border-color,opacity,transform] inline-flex items-center justify-center gap-2 select-none disabled:cursor-not-allowed active:scale-[0.99] ${styles[kind]} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

export function Card({ children, className = '', onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  const classes = `block w-full text-left bg-surface border border-line rounded-2xl shadow-card ${onClick ? 'interactive-card cursor-pointer active:bg-surface2' : ''} ${className}`
  if (onClick) return <button type="button" className={classes} onClick={onClick}>{children}</button>
  return <div className={classes}>{children}</div>
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 items-baseline justify-between mt-7 mb-2.5 px-1">
      <h2 className="font-display font-semibold text-[15px] tracking-wide text-muted uppercase">{children}</h2>
      {right}
    </div>
  )
}

export function Chip({ children, tone = 'neutral', className = '' }: { children: ReactNode; tone?: 'neutral' | 'accent' | 'good' | 'warn' | 'bad'; className?: string }) {
  const tones = {
    neutral: 'bg-surface2 text-muted border-line',
    accent: 'bg-accent-soft text-accent border-accent/30',
    good: 'bg-good-soft text-good border-good/30',
    warn: 'bg-warn-soft text-warn border-warn/30',
    bad: 'bg-bad-soft text-bad border-bad/30',
  }
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium border rounded-full px-2.5 py-1 whitespace-nowrap ${tones[tone]} ${className}`}>
      {children}
    </span>
  )
}

export function DifficultyBadge({ difficulty, showName = false }: { difficulty: number; showName?: boolean }) {
  const info = difficultyInfo(difficulty)
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-medium border rounded-full px-2.5 py-1 whitespace-nowrap bg-surface2 text-muted border-line"
      title={`${info.level} of 5 — ${info.name}: ${info.description}`}
      aria-label={`Difficulty ${info.level} of 5, ${info.name}. ${info.description}`}
    >
      <span className="font-mono tracking-[-0.08em] text-warn" aria-hidden>
        {'★'.repeat(info.level)}{'☆'.repeat(5 - info.level)}
      </span>
      {showName ? <span>{info.name}</span> : null}
    </span>
  )
}

export function DifficultyGuide({ compact = false }: { compact?: boolean }) {
  return (
    <div className="rounded-xl border border-line bg-surface2 px-3.5 py-3">
      <p className="text-[12px] font-semibold text-muted uppercase tracking-wide">Difficulty measures task complexity</p>
      <p className="text-[11px] text-faint mt-0.5 leading-snug">
        Stars are not grades or mastery. The coach chooses near your current frontier; accuracy comes before speed.
      </p>
      <div className={`${compact ? 'flex flex-wrap gap-x-3 gap-y-1.5' : 'grid sm:grid-cols-2 gap-x-4 gap-y-2'} mt-2.5`}>
        {([1, 2, 3, 4, 5] as Difficulty[]).map((level) => (
          <div key={level} className="flex items-start gap-2 min-w-0">
            <span className="font-mono text-[11px] text-warn whitespace-nowrap" aria-hidden>{'★'.repeat(level)}{'☆'.repeat(5 - level)}</span>
            <span className="text-[11px] leading-snug">
              <strong className="font-semibold">{DIFFICULTY_INFO[level].name}</strong>
              {compact ? null : <span className="text-faint"> — {DIFFICULTY_INFO[level].description}</span>}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

const STATE_TONE: Record<SkillState, 'neutral' | 'accent' | 'good' | 'warn'> = {
  unseen: 'neutral',
  introduced: 'neutral',
  guided: 'accent',
  independent: 'good',
  retained: 'good',
  transferred: 'good',
}

export function StateBadge({ state, needsReview }: { state: SkillState; needsReview?: boolean }) {
  if (state === 'unseen') {
    return <Chip tone="neutral">Unseen</Chip>
  }
  return (
    <span className="inline-flex gap-1.5 items-center">
      <Chip tone={STATE_TONE[state]}>
        {state === 'retained' || state === 'transferred' ? '✓ ' : ''}
        {STATE_LABEL[state]}
      </Chip>
      {needsReview ? <Chip tone="warn">needs review</Chip> : null}
    </span>
  )
}

export function ProgressBar({ value, max, tone = 'accent', label }: { value: number; max: number; tone?: 'accent' | 'good' | 'warn'; label?: string }) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0
  const tones = { accent: 'bg-accent', good: 'bg-good', warn: 'bg-warn' }
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuetext={`${Math.round(pct)}%`}
      aria-label={label}
      className="h-1.5 rounded-full bg-surface3 overflow-hidden"
    >
      <div className={`h-full rounded-full ${tones[tone]} transition-[width] duration-300`} style={{ width: `${pct}%` }} />
    </div>
  )
}

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  wide?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const titleId = useId()
  useEffect(() => {
    if (!open) return
    const prevFocus = document.activeElement as HTMLElement | null
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      // Focus trap: Tab cycles inside the dialog.
      if (e.key === 'Tab' && ref.current) {
        const focusables = ref.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        )
        if (!focusables.length) return
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          last.focus()
          e.preventDefault()
        } else if (!e.shiftKey && document.activeElement === last) {
          first.focus()
          e.preventDefault()
        } else if (!ref.current.contains(document.activeElement)) {
          first.focus()
          e.preventDefault()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    // focus the dialog for screen readers / keyboard
    ref.current?.focus()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
      prevFocus?.focus?.()
    }
  }, [open, onClose])
  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="presentation">
      <div className="absolute inset-0 bg-overlay anim-fade" onClick={onClose} aria-hidden />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`relative anim-in bg-surface border border-line rounded-t-3xl sm:rounded-3xl shadow-modal w-full ${wide ? 'sm:max-w-2xl' : 'sm:max-w-md'} max-h-[90dvh] sm:max-h-[86dvh] flex flex-col sm:mx-4`}
      >
        <div className="w-10 h-1 rounded-full bg-line-strong mx-auto mt-2 sm:hidden" aria-hidden />
        <div className="flex items-center justify-between gap-4 pl-5 pr-3 pt-2 sm:pt-3 pb-2 shrink-0">
          <h2 id={titleId} className="font-display font-semibold text-lg leading-tight">{title}</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="h-11 w-11 rounded-full text-muted hover:text-ink hover:bg-surface2 active:bg-surface3 grid place-items-center text-xl leading-none shrink-0"
          >
            ×
          </button>
        </div>
        <div className="overflow-y-auto px-5 safe-bottom-content scroll-thin">{children}</div>
      </div>
    </div>,
    document.body,
  )
}

export function Confirm({
  open,
  onCancel,
  onConfirm,
  title,
  body,
  confirmLabel = 'Confirm',
  danger,
}: {
  open: boolean
  onCancel: () => void
  onConfirm: () => void
  title: string
  body: string
  confirmLabel?: string
  danger?: boolean
}) {
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <p className="text-muted text-[15px] leading-relaxed">{body}</p>
      <div className="flex gap-2 mt-5">
        <Button kind="secondary" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button kind={danger ? 'danger' : 'primary'} onClick={onConfirm} className="flex-1">
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}

export function EmptyState({ icon, title, body, action }: { icon?: string; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="text-center py-10 px-6">
      {icon ? <div className="text-3xl mb-3 opacity-70" aria-hidden>{icon}</div> : null}
      <h3 className="font-display font-semibold text-[16px]">{title}</h3>
      <p className="text-muted text-sm mt-1.5 max-w-xs mx-auto leading-relaxed">{body}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
  ariaLabel: string
}) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="flex gap-1 bg-surface2 border border-line rounded-xl p-1">
      {options.map((o) => (
        <button
          type="button"
          key={o.value}
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`flex-1 min-h-11 px-2 rounded-lg text-sm font-medium transition-colors ${
            value === o.value ? 'bg-surface text-ink shadow-card border border-line' : 'text-muted hover:text-ink'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="min-h-11 w-14 grid place-items-center shrink-0 rounded-xl"
    >
      <span className={`relative block w-12 h-7 rounded-full transition-colors ${checked ? 'bg-accent' : 'bg-surface3 border border-line-strong'}`}>
        <span
          className={`absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-surface border border-line shadow-card transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`}
        />
      </span>
    </button>
  )
}

export function Row({ label, sub, right, onClick }: { label: ReactNode; sub?: ReactNode; right?: ReactNode; onClick?: () => void }) {
  const inner = (
    <>
      <div className="min-w-0 flex-1">
        <div className="text-[15px] font-medium truncate">{label}</div>
        {sub ? <div className="text-[13px] text-muted mt-0.5 leading-snug">{sub}</div> : null}
      </div>
      {right ? <div className="shrink-0 flex items-center gap-2">{right}</div> : null}
    </>
  )
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="w-full min-h-12 flex items-center gap-3 px-4 py-2.5 text-left hover:bg-surface2 active:bg-surface3 transition-colors">
        {inner}
      </button>
    )
  }
  return <div className="w-full min-h-12 flex items-center gap-3 px-4 py-2.5">{inner}</div>
}

export function Divider() {
  return <div className="h-px bg-line mx-4" role="separator" />
}

/** Handle width and the grab radius around it — together a 44px target. */
const THUMB_PX = 20
const GRAB_PX = 22

/**
 * A slider you have to GRAB.
 *
 * A native range input jumps to wherever the track is tapped, so on a phone a
 * stray brush while scrolling past rewrites the value — and for allocation
 * targets that silently reshuffles every other bucket too. Here a press only
 * counts when it lands on the handle; anywhere else on the track is ignored.
 *
 * Tapping the track still FOCUSES the slider, so it doubles as "select this
 * one, then adjust with the arrow keys" — and keyboard behaviour is otherwise
 * untouched, which keeps this usable without a pointer at all.
 */
export function GrabSlider({
  min,
  max,
  value,
  onChange,
  label,
  className = '',
}: {
  min: number
  max: number
  value: number
  onChange: (next: number) => void
  label: string
  className?: string
}) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      aria-label={label}
      onPointerDown={(e) => {
        const el = e.currentTarget
        const rect = el.getBoundingClientRect()
        // The handle's centre travels between half a handle from each end.
        const span = max - min
        const ratio = span > 0 ? (value - min) / span : 0
        const centre = rect.left + THUMB_PX / 2 + ratio * (rect.width - THUMB_PX)
        if (Math.abs(e.clientX - centre) > GRAB_PX) {
          e.preventDefault()
          el.focus()
        }
      }}
      onChange={(e) => onChange(Number(e.target.value))}
      className={`flex-1 ${className}`}
    />
  )
}

/** Consistent screen title and Settings entry point. */
export function HeaderBar({ title, subtitle }: { title: string; subtitle?: string }) {
  const { go, view } = useNav()
  return (
    <header className="pt-safe">
      <div className="flex items-start justify-between gap-4 pt-5 sm:pt-7 pb-1">
        <div className="min-w-0">
          <h1 className="font-display text-[24px] sm:text-[26px] font-bold leading-tight text-balance">{title}</h1>
          {subtitle ? <p className="text-muted text-sm mt-0.5">{subtitle}</p> : null}
        </div>
        {view.name !== 'settings' ? (
          <button
            type="button"
            aria-label="Settings"
            onClick={() => go({ name: 'settings' })}
            className="h-11 w-11 grid place-items-center rounded-full text-muted hover:text-ink hover:bg-surface2 active:bg-surface3 transition-colors mt-0.5 shrink-0"
          >
            <IconSettings size={21} />
          </button>
        ) : null}
      </div>
    </header>
  )
}
