import {
  Banknote,
  Building2,
  Check,
  ClipboardCheck,
  Images,
  MapPin,
  Ruler,
  Text,
  TriangleAlert,
} from 'lucide-react'

import { stepTitles } from '../wizardSteps'

const icons = [Building2, Banknote, Ruler, MapPin, Images, Text, ClipboardCheck]

interface Props {
  editMode?: boolean
  step: number
  completed: boolean[]
  warnings?: boolean[]
  canVisit: (index: number) => boolean
  onStep: (index: number) => void
  busy: boolean
}

export function WizardStepper({ step, completed, warnings = [], onStep, busy }: Props) {
  return (
    <nav aria-label="خطوات الإعلان" className="space-y-4">
      <p className="font-bold md:hidden">{stepTitles[step]}</p>
      <ol className="flex items-start">
        {stepTitles.map((title, index) => {
          const current = index === step
          const done = !current && completed[index] && index !== 6
          const invalid = !completed[index] && warnings[index] && index !== 6
          const Icon = done ? Check : icons[index]
          return (
            <li key={title} className="relative flex min-w-0 flex-1 justify-center">
              {index < 6 && (
                <span
                  aria-hidden="true"
                  className={`absolute start-1/2 top-5 h-0.5 w-full ${done ? 'bg-primary' : 'bg-border'}`}
                />
              )}
              <button
                type="button"
                aria-label={title}
                aria-current={current ? 'step' : undefined}
                disabled={busy}
                onClick={() => onStep(index)}
                className="relative flex w-full min-w-0 flex-col items-center gap-2 px-0.5 text-center disabled:cursor-not-allowed md:px-1"
              >
                <span
                  className={`relative flex size-10 shrink-0 items-center justify-center rounded-full border-2 ${invalid ? 'border-warning bg-warning-soft text-warning' : done ? 'border-primary bg-primary text-on-primary' : current ? 'border-primary bg-surface text-primary' : 'border-border bg-background text-text-muted'} ${current ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`}
                >
                  <Icon className="size-5" aria-hidden="true" />
                  {invalid && <TriangleAlert aria-label="خطوة غير مكتملة" className="absolute -end-1 -top-1 size-4 rounded-full bg-surface text-warning" />}
                </span>
                <span
                  className={`hidden text-xs md:block ${current ? 'font-bold text-primary' : 'text-text-muted'}`}
                >
                  {title}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
