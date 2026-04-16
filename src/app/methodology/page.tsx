import Link from 'next/link'
import { EVALUATION_LADDER } from '@/lib/types'

export const metadata = {
  title: 'Methodology — biotools.fyi',
  description:
    'How we evaluate the evidence behind AI biology tools: claim types, the evaluation ladder, units of analysis, and what to watch for.',
}

export default function MethodologyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground mb-6"
      >
        &larr; Back to directory
      </Link>

      <h1 className="text-3xl font-bold tracking-tight">Methodology</h1>
      <p className="mt-3 text-muted">
        How we assess the evidence behind each tool. This framework was
        developed with input from biologist collaborators and draws on the
        RAND/CLTR Global Risk Index methodology.
      </p>

      {/* Claim type */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">Claim type</h2>
        <p className="mt-2 text-sm leading-relaxed">
          Different types of paper make different kinds of claim, and they
          should be held to different epistemic standards. We classify each
          tool&apos;s primary paper as one of:
        </p>
        <dl className="mt-4 space-y-3 text-sm">
          <div>
            <dt className="font-medium">Generative</dt>
            <dd className="text-muted">
              Produces novel outputs (sequences, structures, molecules). Key
              question: were the designs experimentally validated, and at what
              scale?
            </dd>
          </div>
          <div>
            <dt className="font-medium">Predictive</dt>
            <dd className="text-muted">
              Predicts properties or structures for known inputs. Key question:
              how was the held-out set constructed, and is there leakage?
            </dd>
          </div>
          <div>
            <dt className="font-medium">Diagnostic</dt>
            <dd className="text-muted">
              Classifies, annotates, or scores existing data. Key question: what
              is the ground truth, and how independent are the test units?
            </dd>
          </div>
          <div>
            <dt className="font-medium">Benchmark</dt>
            <dd className="text-muted">
              Introduces a new evaluation framework or dataset. Key question:
              does the benchmark capture what matters in practice?
            </dd>
          </div>
          <div>
            <dt className="font-medium">Methodological</dt>
            <dd className="text-muted">
              Introduces a new architecture, training procedure, or technique.
              Key question: is the improvement due to the method or the data?
            </dd>
          </div>
          <div>
            <dt className="font-medium">Infrastructure</dt>
            <dd className="text-muted">
              Provides tooling, databases, or platforms. Key question: is it
              reliable, maintained, and accessible?
            </dd>
          </div>
        </dl>
      </section>

      {/* Evaluation ladder */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">The evaluation ladder</h2>
        <p className="mt-2 text-sm leading-relaxed">
          Evidence for a tool&apos;s claims ranges from cheap-and-weak (in
          silico self-consistency) to expensive-and-strong (clinical
          validation). We record the <em>maximum</em> rung reached and, where
          possible, the <em>distribution</em> of evidence across rungs.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          A tool that reaches rung 8 with five designs is making a much
          stronger claim than one that reaches rung 8 with one cherry-picked
          design. The distribution matters as much as the maximum.
        </p>

        <div className="mt-6 overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface border-b border-border">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-muted w-12">
                  Level
                </th>
                <th className="text-left px-4 py-2 font-medium text-muted">
                  Type
                </th>
                <th className="text-left px-4 py-2 font-medium text-muted hidden sm:table-cell">
                  Example
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {EVALUATION_LADDER.map((rung) => (
                <tr key={rung.level} className="hover:bg-surface">
                  <td className="px-4 py-2 font-mono text-muted">
                    {rung.level}
                  </td>
                  <td className="px-4 py-2">{rung.type}</td>
                  <td className="px-4 py-2 text-muted hidden sm:table-cell">
                    {rung.example}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Unit of evaluation */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">Unit of evaluation</h2>
        <p className="mt-2 text-sm leading-relaxed">
          The unit at which a paper reports results matters enormously for
          interpreting claims. Common units include per-residue, per-sequence,
          per-structure, per-design, and per-target. Two key pitfalls:
        </p>
        <ul className="mt-3 space-y-2 text-sm list-disc pl-5">
          <li>
            <strong>Independence inflation:</strong> correlated residues within
            a protein inflate per-residue n; designs from the same target are
            not independent observations.
          </li>
          <li>
            <strong>Stated vs. tested unit:</strong> a paper may claim
            per-target generality but only test per-design within a small number
            of targets.
          </li>
        </ul>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          We record both the stated unit and any independence concerns.
        </p>
      </section>

      {/* Selection funnel */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">Selection pressure</h2>
        <p className="mt-2 text-sm leading-relaxed">
          For generative tools, the ratio of candidates generated to candidates
          experimentally tested is critical context. A tool that reports a 90%
          success rate on 10 designs selected from 10,000 candidates is making
          a very different claim to one that tests all candidates.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          We record the selection-funnel ratio where disclosed. Papers that
          omit this ratio warrant extra scrutiny.
        </p>
      </section>

      {/* Pipeline decomposition */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">Pipeline decomposition</h2>
        <p className="mt-2 text-sm leading-relaxed">
          Many tools are part of a multi-step pipeline (e.g. RFdiffusion
          generates backbones, ProteinMPNN designs sequences, AlphaFold 2
          filters). We record which components the paper claims credit for
          versus which are fixed or inherited from other work.
        </p>
      </section>

      {/* Scope */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">Stated vs. effective scope</h2>
        <p className="mt-2 text-sm leading-relaxed">
          Papers often claim broader applicability than their evidence
          supports. We record both the <em>stated scope</em> (what the paper
          claims the tool can do) and the <em>effective scope</em> (what the
          evidence actually demonstrates).
        </p>
      </section>

      {/* How to read */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">How to read tool assessments</h2>
        <p className="mt-2 text-sm leading-relaxed">
          On each tool&apos;s detail page, you&apos;ll see an
          &ldquo;Evidence quality&rdquo; section if we&apos;ve assessed the
          primary paper. Tools showing &ldquo;Not yet assessed&rdquo; simply
          haven&apos;t been reviewed yet — it&apos;s not a judgement.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          These assessments are our best reading of the published evidence.
          They&apos;re not definitive, and we welcome corrections. If you spot
          an error or want to contribute an assessment, please open an issue on{' '}
          <a
            href="https://github.com/JoeyBream/biotools-fyi"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            GitHub
          </a>
          .
        </p>
      </section>

      <div className="mt-12 pt-6 border-t border-border">
        <Link
          href="/"
          className="text-sm text-primary hover:underline"
        >
          &larr; Back to the directory
        </Link>
      </div>
    </div>
  )
}
