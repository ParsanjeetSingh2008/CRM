import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useUpdateLeadStatus } from '../../hooks/useLeads'
import { DeleteLeadDialog } from './DeleteLeadDialog'
import { LeadFormModal } from './LeadFormModal'
import { LeadProfileDrawer } from './LeadProfileDrawer'

/**
 * Owns the lead dialogs (add/edit form, delete confirmation, profile card) so
 * every page, and the "Add lead" button in the header, can open them.
 */
const LeadActionsContext = createContext(null)

export function LeadActionsProvider({ children }) {
  // `open` and `lead` are separate so each dialog keeps its content while it animates closed.
  const [form, setForm] = useState({ open: false, lead: null })
  const [removal, setRemoval] = useState({ open: false, lead: null })
  const [profile, setProfile] = useState({ open: false, lead: null })
  const statusMutation = useUpdateLeadStatus()

  const closeProfile = () => setProfile((current) => ({ ...current, open: false }))

  const openCreate = useCallback(() => setForm({ open: true, lead: null }), [])
  const openProfile = useCallback((lead) => setProfile({ open: true, lead }), [])
  // Only one dialog at a time: leaving the profile for edit/delete closes it.
  const openEdit = useCallback((lead) => {
    closeProfile()
    setForm({ open: true, lead })
  }, [])
  const openDelete = useCallback((lead) => {
    closeProfile()
    setRemoval({ open: true, lead })
  }, [])

  const { mutate: mutateStatus } = statusMutation
  const changeStatus = useCallback(
    (lead, status) => {
      if (lead.status === status) return
      mutateStatus(
        { id: lead.id, status },
        {
          onSuccess: () => toast.success(`${lead.name} marked as ${status}`),
          onError: (error) => toast.error("Couldn't update status", { description: error.message }),
        },
      )
    },
    [mutateStatus],
  )

  const value = useMemo(
    () => ({ openCreate, openProfile, openEdit, openDelete, changeStatus }),
    [openCreate, openProfile, openEdit, openDelete, changeStatus],
  )

  return (
    <LeadActionsContext.Provider value={value}>
      {children}
      <LeadProfileDrawer
        open={profile.open}
        lead={profile.lead}
        onOpenChange={(open) => setProfile((current) => ({ ...current, open }))}
        onEdit={openEdit}
        onDelete={openDelete}
        onStatusChange={changeStatus}
      />
      <LeadFormModal
        open={form.open}
        lead={form.lead}
        onOpenChange={(open) => setForm((current) => ({ ...current, open }))}
      />
      <DeleteLeadDialog
        open={removal.open}
        lead={removal.lead}
        onOpenChange={(open) => setRemoval((current) => ({ ...current, open }))}
      />
    </LeadActionsContext.Provider>
  )
}

export function useLeadActions() {
  const context = useContext(LeadActionsContext)
  if (!context) throw new Error('useLeadActions must be used inside <LeadActionsProvider>')
  return context
}
