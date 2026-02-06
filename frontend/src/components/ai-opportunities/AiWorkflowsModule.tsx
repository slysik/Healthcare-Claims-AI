import { useState, useCallback, useRef } from 'react'
import {
  Zap,
  Check,
  AlertCircle,
  Loader2,
  Circle,
  ChevronRight,
  RotateCcw,
  ArrowLeft,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { MOCK_WORKFLOWS, MOCK_ACTIVITY_LOG } from '@/mocks/aiOpportunities'
import type { Workflow, WorkflowStep, ActivityLogEntry } from '@/mocks/aiOpportunities'
import { AiDisclaimer, ActivityLog, HandoffCTA } from './shared'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ModuleState = 'selection' | 'running' | 'complete' | 'error'
type StepStatus = WorkflowStep['status']

// ---------------------------------------------------------------------------
// Sub-Components
// ---------------------------------------------------------------------------

function WorkflowCard({
  workflow,
  onSelect,
}: {
  workflow: Workflow
  onSelect: (w: Workflow) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(workflow)}
      className={cn(
        'group flex items-start gap-3 rounded-lg border border-bcbs-100 bg-white p-4 text-left',
        'transition-all duration-200 hover:border-bcbs-300 hover:shadow-md hover:shadow-bcbs-100/50',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bcbs-400 focus-visible:ring-offset-2',
      )}
    >
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-bcbs-50 text-bcbs-600 group-hover:bg-bcbs-100 transition-colors">
        <Zap className="h-4 w-4" />
      </div>
      <div className="flex-1 space-y-1">
        <h3 className="text-sm font-semibold text-gray-900 group-hover:text-bcbs-700 transition-colors">
          {workflow.title}
        </h3>
        <p className="text-xs text-gray-500 leading-relaxed">{workflow.description}</p>
        <p className="text-[10px] text-gray-400">{workflow.steps.length} steps</p>
      </div>
      <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-gray-300 group-hover:text-bcbs-500 transition-colors" />
    </button>
  )
}

function StatusBadge({ status }: { status: StepStatus }) {
  switch (status) {
    case 'pending':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
          <Circle className="h-2.5 w-2.5" />
          Pending
        </span>
      )
    case 'active':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">
          <Loader2 className="h-2.5 w-2.5 animate-spin" />
          Running
        </span>
      )
    case 'complete':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
          <Check className="h-2.5 w-2.5" />
          Complete
        </span>
      )
    case 'error':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700">
          <AlertCircle className="h-2.5 w-2.5" />
          Error
        </span>
      )
  }
}

function StepItem({
  step,
  index,
  isLast,
}: {
  step: WorkflowStep
  index: number
  isLast: boolean
}) {
  const isActive = step.status === 'active'
  const isComplete = step.status === 'complete'
  const isError = step.status === 'error'

  return (
    <div className="flex gap-3">
      {/* Vertical stepper line + number */}
      <div className="flex flex-col items-center">
        <div
          className={cn(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all duration-300',
            isComplete && 'bg-green-500 text-white',
            isActive && 'bg-bcbs-500 text-white ring-4 ring-bcbs-100',
            isError && 'bg-red-500 text-white',
            step.status === 'pending' && 'bg-gray-200 text-gray-500',
          )}
        >
          {isComplete ? (
            <Check className="h-3.5 w-3.5" />
          ) : isError ? (
            <AlertCircle className="h-3.5 w-3.5" />
          ) : (
            index + 1
          )}
        </div>
        {!isLast && (
          <div
            className={cn(
              'w-0.5 flex-1 min-h-[24px] transition-all duration-300',
              isComplete ? 'bg-green-300' : 'bg-gray-200',
            )}
          />
        )}
      </div>

      {/* Content */}
      <div className={cn('flex-1 pb-4', isLast && 'pb-0')}>
        <div className="flex flex-wrap items-center gap-2">
          <h4
            className={cn(
              'text-sm font-semibold transition-colors',
              isActive ? 'text-bcbs-700' : isComplete ? 'text-green-700' : 'text-gray-700',
            )}
          >
            {step.label}
          </h4>
          <StatusBadge status={step.status} />
        </div>
        <p className="mt-1 text-xs text-gray-500 leading-relaxed">{step.description}</p>
        <p className="mt-1 text-[10px] text-gray-400">
          Est. time: {step.estimatedTime}
        </p>
        {isActive && (
          <div className="mt-2">
            <HandoffCTA
              label="Prefer to complete this with an agent?"
              context={`workflow-step-${step.id}`}
            />
          </div>
        )}
      </div>
    </div>
  )
}

function ProgressBar({ completed, total }: { completed: number; total: number }) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-gray-600">Progress</span>
        <span className="font-semibold text-bcbs-600">{pct}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-bcbs-500 transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[10px] text-gray-400">
        {completed} of {total} steps complete
      </p>
    </div>
  )
}

function CompletionSummary({
  workflow,
  onReset,
}: {
  workflow: Workflow
  onReset: () => void
}) {
  return (
    <div className="rounded-lg border border-green-200 bg-green-50 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white">
          <Check className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-green-800">Workflow Complete</h3>
          <p className="text-xs text-green-600">{workflow.title}</p>
        </div>
      </div>
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-gray-700">Summary</h4>
        <p className="text-sm text-gray-600 leading-relaxed">
          All {workflow.steps.length} steps have been completed successfully. Your{' '}
          {workflow.title.toLowerCase()} process is ready. Review the activity log below for
          a detailed record of each action taken.
        </p>
        <h4 className="mt-3 text-xs font-semibold text-gray-700">Next Steps</h4>
        <ul className="list-disc pl-4 text-sm text-gray-600 space-y-1">
          <li>Review the completed actions in the activity log</li>
          <li>Save or export the workflow results for your records</li>
          <li>Contact Member Services if you need additional assistance</li>
        </ul>
      </div>
      <button
        type="button"
        onClick={onReset}
        className={cn(
          'inline-flex items-center gap-2 rounded-lg border border-bcbs-200 bg-white px-4 py-2',
          'text-sm font-medium text-bcbs-600 hover:bg-bcbs-50 transition-colors',
        )}
      >
        <RotateCcw className="h-3.5 w-3.5" />
        Start Another Workflow
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Workflow Execution Logic
// ---------------------------------------------------------------------------

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function AiWorkflowsModule() {
  const [moduleState, setModuleState] = useState<ModuleState>('selection')
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null)
  const [steps, setSteps] = useState<WorkflowStep[]>([])
  const [logEntries, setLogEntries] = useState<ActivityLogEntry[]>([])
  const abortRef = useRef(false)

  const completedCount = steps.filter((s) => s.status === 'complete').length

  const addLogEntry = useCallback((action: string, detail: string) => {
    setLogEntries((prev) => [
      {
        timestamp: new Date().toISOString(),
        action,
        detail,
        source: 'AI Workflows',
      },
      ...prev,
    ])
  }, [])

  const runWorkflow = useCallback(
    async (workflow: Workflow) => {
      const workingSteps = workflow.steps.map((s) => ({ ...s, status: 'pending' as const }))
      setSteps(workingSteps)
      setModuleState('running')
      abortRef.current = false

      // Choose one random step index (not first or last) to simulate an error+retry
      const errorStepIdx =
        workingSteps.length > 2
          ? 1 + Math.floor(Math.random() * (workingSteps.length - 2))
          : -1

      for (let i = 0; i < workingSteps.length; i++) {
        if (abortRef.current) return

        // Set current step to active
        setSteps((prev) =>
          prev.map((s, idx) => (idx === i ? { ...s, status: 'active' as const } : s)),
        )
        addLogEntry('Step Started', `Started: ${workingSteps[i]?.label ?? 'Unknown step'}`)

        // Simulate work (1-3s)
        const workTime = 1000 + Math.random() * 2000
        await delay(workTime)

        if (abortRef.current) return

        // Simulate error on the chosen step, then retry
        if (i === errorStepIdx) {
          setSteps((prev) =>
            prev.map((s, idx) => (idx === i ? { ...s, status: 'error' as const } : s)),
          )
          addLogEntry(
            'Step Error',
            `Error on: ${workingSteps[i]?.label ?? 'Unknown step'}. Retrying...`,
          )
          await delay(1000)

          if (abortRef.current) return

          // Retry: set back to active briefly
          setSteps((prev) =>
            prev.map((s, idx) => (idx === i ? { ...s, status: 'active' as const } : s)),
          )
          addLogEntry('Step Retry', `Retrying: ${workingSteps[i]?.label ?? 'Unknown step'}`)
          await delay(1500)

          if (abortRef.current) return
        }

        // Mark step as complete
        setSteps((prev) =>
          prev.map((s, idx) => (idx === i ? { ...s, status: 'complete' as const } : s)),
        )
        addLogEntry(
          'Step Complete',
          `Completed: ${workingSteps[i]?.label ?? 'Unknown step'}`,
        )
      }

      setModuleState('complete')
      addLogEntry('Workflow Complete', `Finished: ${workflow.title}`)
    },
    [addLogEntry],
  )

  const handleSelect = useCallback(
    (workflow: Workflow) => {
      setSelectedWorkflow(workflow)
      setLogEntries([])
      addLogEntry('Workflow Selected', `Selected: ${workflow.title}`)
      void runWorkflow(workflow)
    },
    [runWorkflow, addLogEntry],
  )

  const handleReset = useCallback(() => {
    abortRef.current = true
    setModuleState('selection')
    setSelectedWorkflow(null)
    setSteps([])
    setLogEntries([])
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-bcbs-100">
          <Zap className="h-5 w-5 text-bcbs-600" />
        </div>
        <h2 className="text-lg font-bold text-gray-900">AI Assistant Workflows</h2>
      </div>

      {/* Selection View */}
      {moduleState === 'selection' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Choose a guided workflow. The AI assistant will walk you through each step.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {MOCK_WORKFLOWS.map((wf) => (
              <WorkflowCard key={wf.id} workflow={wf} onSelect={handleSelect} />
            ))}
          </div>
        </div>
      )}

      {/* Running / Complete View */}
      {moduleState !== 'selection' && selectedWorkflow && (
        <div className="space-y-5">
          {/* Back button */}
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1 text-sm font-medium text-bcbs-600 hover:text-bcbs-700 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to workflows
          </button>

          {/* Workflow title */}
          <div className="rounded-lg border border-bcbs-100 bg-white p-4">
            <h3 className="text-sm font-bold text-gray-900">{selectedWorkflow.title}</h3>
            <p className="mt-1 text-xs text-gray-500">{selectedWorkflow.description}</p>
          </div>

          {/* Progress */}
          <ProgressBar completed={completedCount} total={steps.length} />

          {/* Stepper */}
          <div className="rounded-lg border border-bcbs-100 bg-white p-4">
            {steps.map((step, idx) => (
              <StepItem
                key={step.id}
                step={step}
                index={idx}
                isLast={idx === steps.length - 1}
              />
            ))}
          </div>

          {/* Completion Summary */}
          {moduleState === 'complete' && (
            <CompletionSummary workflow={selectedWorkflow} onReset={handleReset} />
          )}

          {/* Activity Log */}
          {logEntries.length > 0 && (
            <ActivityLog entries={logEntries} maxVisible={5} />
          )}

          {/* Trust */}
          <AiDisclaimer variant="inline" />
        </div>
      )}

      {/* Bottom-level trust for selection view */}
      {moduleState === 'selection' && (
        <>
          <AiDisclaimer variant="banner" />
          <ActivityLog entries={MOCK_ACTIVITY_LOG.slice(0, 5)} maxVisible={3} />
        </>
      )}
    </div>
  )
}
