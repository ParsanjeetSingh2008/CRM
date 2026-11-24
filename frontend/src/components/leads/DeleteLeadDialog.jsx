import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useDeleteLead } from '../../hooks/useLeads'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'

/** `lead` stays set while the dialog animates closed, so its text doesn't flicker. */
export function DeleteLeadDialog({ open, lead, onOpenChange }) {
  const deleteLead = useDeleteLead()

  const handleDelete = () => {
    deleteLead.mutate(lead.id, {
      onSuccess: () => {
        toast.success('Lead deleted', { description: lead.name })
        onOpenChange(false)
      },
      onError: (error) => toast.error("Couldn't delete lead", { description: error.message }),
    })
  }

  return (
    <Modal
      size="sm"
      open={open}
      onOpenChange={(next) => !deleteLead.isPending && onOpenChange(next)}
      title="Delete this lead?"
      description={
        lead ? `${lead.name} (${lead.business_name}) will be permanently removed. This can't be undone.` : ''
      }
    >
      <div className="flex flex-col-reverse gap-2 px-6 py-4 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={deleteLead.isPending}>
          Cancel
        </Button>
        <Button variant="danger" onClick={handleDelete} loading={deleteLead.isPending}>
          {!deleteLead.isPending && <Trash2 className="size-4" aria-hidden="true" />}
          Delete lead
        </Button>
      </div>
    </Modal>
  )
}
