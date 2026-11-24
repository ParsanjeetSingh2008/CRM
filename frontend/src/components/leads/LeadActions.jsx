import { Pencil, Trash2 } from 'lucide-react'

const base =
  'flex size-9 items-center justify-center rounded-lg text-ink-faint transition-colors duration-150'

export function LeadActions({ lead, onEdit, onDelete }) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => onEdit(lead)}
        className={`${base} hover:bg-brand-soft hover:text-brand`}
        aria-label={`Edit ${lead.name}`}
        title="Edit"
      >
        <Pencil className="size-4" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={() => onDelete(lead)}
        className={`${base} hover:bg-danger-soft hover:text-danger`}
        aria-label={`Delete ${lead.name}`}
        title="Delete"
      >
        <Trash2 className="size-4" aria-hidden="true" />
      </button>
    </div>
  )
}
