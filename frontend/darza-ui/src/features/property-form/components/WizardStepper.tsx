import {
  Banknote,
  Building2,
  Check,
  ClipboardCheck,
  Images,
  MapPin,
  Ruler,
  Text,
} from 'lucide-react'

import { stepTitles } from '../wizardSteps'

const icons = [Building2, Banknote, Ruler, MapPin, Images, Text, ClipboardCheck]

interface Props {
  editMode?: boolean
  step: number
  completed: boolean[]
  canVisit: (index: number) => boolean
  onStep: (index: number) => void
  busy: boolean
}

export function WizardStepper({ editMode = false, step, completed, canVisit, onStep, busy }: Props) {
  return (
    <nav aria-label="خطوات الإعلان" className="space-y-4">
      <p className="font-bold md:hidden">{stepTitles[step]}</p>
      <ol className="flex items-start">
        {stepTitles.map((title, index) => {
          const current = index === step
          const done = editMode || (!current && completed[index] && index < step)
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
                disabled={busy || (!editMode && !canVisit(index))}
                onClick={() => onStep(index)}
                className="relative flex w-full min-w-0 flex-col items-center gap-2 px-0.5 text-center disabled:cursor-not-allowed md:px-1"
              >
                <span
                  className={`flex size-10 shrink-0 items-center justify-center rounded-full border-2 ${done ? 'border-primary bg-primary text-on-primary' : current ? 'border-primary bg-surface text-primary' : 'border-border bg-background text-text-muted'} ${current ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`}
                >
                  <Icon className="size-5" aria-hidden="true" />
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
