import Link from 'next/link'
import type { EvaluationProfile } from '@/lib/types'
import { EVALUATION_LADDER } from '@/lib/types'

function LadderViz({
  max,
  distribution,
}: {
  max: number
  distribution: number[] | null
}) {
  return (
    <div className="space-y-1">
      {EVALUATION_LADDER.map((rung) => {
        const isMax = rung.level === max
        const inDist = distribution?.includes(rung.level)
        let bg = 'bg-gray-100'
        if (isMax) bg = 'bg-blue-500'
        else if (inDist) bg = 'bg-blue-200'

        return (
          <div key={rung.level} className="flex items-center gap-2 text-xs">
            <span className="w-5 text-right text-muted font-mono">
              {rung.level}
            </span>
            <div
              className={`h-3 rounded ${bg}`}
              style={{ width: inDist || isMax ? '100%' : '100%', maxWidth: '200px', opacity: inDist || isMax ? 1 : 0.3 }}
            />
            <span className={`truncate ${isMax ? 'font-medium' : 'text-muted'}`}>
              {rung.type}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function EvalRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="py-2.5 sm:flex sm:gap-4">
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted sm:w-40 shrink-0 mb-1 sm:mb-0 sm:pt-0.5">
        {label}
      </dt>
      <dd className="text-sm">{children}</dd>
    </div>
  )
}

export default function EvaluationSection({ evaluation }: { evaluation: EvaluationProfile }) {
  return (
    <section className="mt-10">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-semibold">Evidence quality</h2>
        <Link
          href="/methodology"
          className="text-xs text-primary hover:underline"
        >
          How we assess this
        </Link>
      </div>

      <div className="mt-4 rounded-lg border border-border p-5">
        <dl className="divide-y divide-border">
          {evaluation.claimType && (
            <EvalRow label="Claim type">
              <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 text-blue-800 text-xs font-medium capitalize">
                {evaluation.claimType}
              </span>
            </EvalRow>
          )}

          {evaluation.evaluationLadderMax !== null && (
            <EvalRow label="Evaluation ladder">
              <div className="space-y-2">
                <p>
                  Max rung: <strong>{evaluation.evaluationLadderMax}</strong> —{' '}
                  {EVALUATION_LADDER.find(
                    (r) => r.level === evaluation.evaluationLadderMax
                  )?.type ?? ''}
                </p>
                <LadderViz
                  max={evaluation.evaluationLadderMax}
                  distribution={evaluation.evaluationLadderDistribution}
                />
              </div>
            </EvalRow>
          )}

          {evaluation.unitOfEvaluation && (
            <EvalRow label="Unit of evaluation">
              <p>{evaluation.unitOfEvaluation}</p>
              {evaluation.unitIndependenceNote && (
                <p className="text-xs text-muted mt-1">
                  {evaluation.unitIndependenceNote}
                </p>
              )}
            </EvalRow>
          )}

          {evaluation.selectionFunnelRatio && (
            <EvalRow label="Selection funnel">
              {evaluation.selectionFunnelRatio}
            </EvalRow>
          )}

          {evaluation.pipelineComponents && evaluation.pipelineComponents.length > 0 && (
            <EvalRow label="Pipeline">
              <ul className="space-y-1">
                {evaluation.pipelineComponents.map((c, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted shrink-0" />
                    {c}
                  </li>
                ))}
              </ul>
              {evaluation.creditAssignment && (
                <p className="text-xs text-muted mt-2">
                  Credit: {evaluation.creditAssignment}
                </p>
              )}
            </EvalRow>
          )}

          <EvalRow label="Rigour checks">
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
              <span>
                SOTA baseline:{' '}
                {evaluation.sotaBaselineNamed ? (
                  <span className="text-green-700">named</span>
                ) : (
                  <span className="text-muted">not recorded</span>
                )}
              </span>
              <span>
                Ablation:{' '}
                {evaluation.ablationPresent === true ? (
                  <span className="text-green-700">yes</span>
                ) : evaluation.ablationPresent === false ? (
                  <span className="text-amber-700">no</span>
                ) : (
                  <span className="text-muted">not recorded</span>
                )}
              </span>
              <span>
                Failures enumerated:{' '}
                {evaluation.failuresEnumerated === true ? (
                  <span className="text-green-700">yes</span>
                ) : evaluation.failuresEnumerated === false ? (
                  <span className="text-amber-700">no</span>
                ) : (
                  <span className="text-muted">not recorded</span>
                )}
              </span>
              <span>
                Interventional evidence:{' '}
                {evaluation.interventionalEvidence === true ? (
                  <span className="text-green-700">yes</span>
                ) : evaluation.interventionalEvidence === false ? (
                  <span className="text-amber-700">no</span>
                ) : (
                  <span className="text-muted">not recorded</span>
                )}
              </span>
            </div>
          </EvalRow>

          {(evaluation.statedScope || evaluation.effectiveScope) && (
            <EvalRow label="Scope">
              {evaluation.statedScope && (
                <p>
                  <span className="text-xs text-muted">Stated: </span>
                  {evaluation.statedScope}
                </p>
              )}
              {evaluation.effectiveScope && (
                <p className="mt-1">
                  <span className="text-xs text-muted">Effective: </span>
                  {evaluation.effectiveScope}
                </p>
              )}
            </EvalRow>
          )}

          {evaluation.dualUseNote && (
            <EvalRow label="Dual-use note">
              <p className="text-amber-800">{evaluation.dualUseNote}</p>
            </EvalRow>
          )}

          {evaluation.sotaBaselineNamed && (
            <EvalRow label="SOTA baseline">
              {evaluation.sotaBaselineNamed}
            </EvalRow>
          )}
        </dl>
      </div>
    </section>
  )
}
