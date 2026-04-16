'use client';

import { useActionState } from 'react';
import { Upload } from 'lucide-react';
import { submitSkill, type SubmitSkillState } from '@/app/actions/submit';
import { AGENTS } from '@/data/agents';

const initialState: SubmitSkillState = {
  ok: false,
  message: '',
};

export function SubmitSkillForm() {
  const [state, formAction, pending] = useActionState(submitSkill, initialState);

  return (
    <form action={formAction} className="space-y-6">
      {state.message && (
        <div className={`rounded-2xl border px-4 py-3 text-sm ${state.ok ? 'border-emerald-300/30 bg-emerald-300/10 text-emerald-100' : 'border-red-300/30 bg-red-300/10 text-red-100'}`}>
          {state.message}
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-semibold text-[var(--text-primary)]">
          Skill name *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          className="input-shell mt-2 block w-full rounded-2xl px-4 py-3 text-sm placeholder:text-[var(--text-muted)]"
          placeholder="e.g. frontend-design"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-semibold text-[var(--text-primary)]">
          Description *
        </label>
        <textarea
          id="description"
          name="description"
          required
          rows={5}
          className="input-shell mt-2 block w-full rounded-2xl px-4 py-3 text-sm placeholder:text-[var(--text-muted)]"
          placeholder="Describe what this skill does, when to use it, and which agent workflows it improves."
        />
      </div>

      <div>
        <label htmlFor="repositoryUrl" className="block text-sm font-semibold text-[var(--text-primary)]">
          GitHub repository URL *
        </label>
        <input
          type="url"
          id="repositoryUrl"
          name="repositoryUrl"
          required
          className="input-shell mt-2 block w-full rounded-2xl px-4 py-3 text-sm placeholder:text-[var(--text-muted)]"
          placeholder="https://github.com/username/repo"
        />
      </div>

      <div>
        <label htmlFor="documentationUrl" className="block text-sm font-semibold text-[var(--text-primary)]">
          Documentation URL
        </label>
        <input
          type="url"
          id="documentationUrl"
          name="documentationUrl"
          className="input-shell mt-2 block w-full rounded-2xl px-4 py-3 text-sm placeholder:text-[var(--text-muted)]"
          placeholder="https://github.com/username/repo/blob/main/SKILL.md"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="category" className="block text-sm font-semibold text-[var(--text-primary)]">
            Category
          </label>
          <input
            type="text"
            id="category"
            name="category"
            className="input-shell mt-2 block w-full rounded-2xl px-4 py-3 text-sm placeholder:text-[var(--text-muted)]"
            placeholder="Design, Testing & Review, Cloud & DevOps"
          />
        </div>
        <div>
          <label htmlFor="tags" className="block text-sm font-semibold text-[var(--text-primary)]">
            Tags
          </label>
          <input
            type="text"
            id="tags"
            name="tags"
            className="input-shell mt-2 block w-full rounded-2xl px-4 py-3 text-sm placeholder:text-[var(--text-muted)]"
            placeholder="design, frontend, review"
          />
        </div>
      </div>

      <fieldset>
        <legend className="mb-3 block text-sm font-semibold text-[var(--text-primary)]">
          Compatible agents *
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {AGENTS.map((agent) => (
            <label key={agent.id} className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 transition-colors hover:border-cyan-300/25">
              <input type="checkbox" name="agents" value={agent.id} className="rounded border-[var(--border-active)] text-[var(--accent-cyan)] focus:ring-[var(--accent-cyan)]" />
              <span className="text-sm text-[var(--text-secondary)]">{agent.name}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <button
        type="submit"
        disabled={pending}
        className="btn-primary w-full"
      >
        <Upload className="h-4 w-4" />
        {pending ? 'Submitting...' : 'Submit skill'}
      </button>
    </form>
  );
}
