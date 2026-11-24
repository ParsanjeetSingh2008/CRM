import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { STATUS_LIST, STATUS_STYLES } from '../../lib/constants'
import { LEAD_FIELDS, emptyLead, leadSchema, toLeadPayload } from '../../lib/validation'
import { useCreateLead, useUpdateLead } from '../../hooks/useLeads'
import { Button } from '../ui/Button'
import { Field, controlClass } from '../ui/Field'
import { Modal } from '../ui/Modal'

const toFormValues = (lead) =>
  lead
    ? {
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        business_name: lead.business_name,
        status: lead.status,
        notes: lead.notes ?? '',
      }
    : emptyLead

/**
 * Add / edit form. `lead` = null means "add". Validation runs in the browser
 * first (zod); anything the server rejects (e.g. duplicate email) is shown
 * on the matching field.
 */
export function LeadFormModal({ open, lead, onOpenChange }) {
  const isEdit = Boolean(lead)
  const createLead = useCreateLead()
  const updateLead = useUpdateLead()

  const {
    register,
    handleSubmit,
    reset,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(leadSchema),
    defaultValues: toFormValues(lead),
    mode: 'onTouched',
  })

  // Reload the form whenever it opens for a different lead.
  useEffect(() => {
    if (open) reset(toFormValues(lead))
  }, [open, lead, reset])

  const status = watch('status')

  const onSubmit = async (values) => {
    const payload = toLeadPayload(values)
    try {
      if (isEdit) {
        await updateLead.mutateAsync({ id: lead.id, lead: payload })
        toast.success('Lead updated', { description: payload.name })
      } else {
        await createLead.mutateAsync(payload)
        toast.success('Lead added', { description: `${payload.name} · ${payload.business_name}` })
      }
      onOpenChange(false)
    } catch (error) {
      const fieldErrors = (error.details || []).filter((d) => LEAD_FIELDS.includes(d.field))
      fieldErrors.forEach(({ field, message }, index) =>
        setError(field, { type: 'server', message }, { shouldFocus: index === 0 }),
      )
      if (fieldErrors.length === 0) {
        toast.error(isEdit ? "Couldn't update lead" : "Couldn't add lead", {
          description: error.message,
        })
      }
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={(next) => !isSubmitting && onOpenChange(next)}
      title={isEdit ? 'Edit lead' : 'Add a new lead'}
      description={
        isEdit ? `Update the details for ${lead.name}.` : 'Fill in the details of the new enquiry.'
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="grid gap-4 px-6 py-5 sm:grid-cols-2">
          <Field label="Full name" error={errors.name?.message}>
            {(props) => (
              <input
                {...props}
                {...register('name')}
                autoComplete="name"
                placeholder="e.g. Aarav Sharma"
                className={`h-11 ${controlClass(errors.name)}`}
              />
            )}
          </Field>

          <Field label="Business name" error={errors.business_name?.message}>
            {(props) => (
              <input
                {...props}
                {...register('business_name')}
                autoComplete="organization"
                placeholder="e.g. BrightPixel Studios"
                className={`h-11 ${controlClass(errors.business_name)}`}
              />
            )}
          </Field>

          <Field label="Email" error={errors.email?.message}>
            {(props) => (
              <input
                {...props}
                {...register('email')}
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="name@company.com"
                className={`h-11 ${controlClass(errors.email)}`}
              />
            )}
          </Field>

          <Field label="Phone" error={errors.phone?.message}>
            {(props) => (
              <input
                {...props}
                {...register('phone')}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="+91 98765 43210"
                className={`h-11 ${controlClass(errors.phone)}`}
              />
            )}
          </Field>

          <fieldset className="sm:col-span-2">
            <legend className="mb-1.5 text-sm font-semibold text-ink">Status</legend>
            <div className="grid grid-cols-3 gap-2">
              {STATUS_LIST.map((option) => {
                const selected = status === option
                return (
                  <label
                    key={option}
                    className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold ring-1 transition-colors has-focus-visible:ring-2 has-focus-visible:ring-brand ${
                      selected
                        ? `${STATUS_STYLES[option].pill} ring-current`
                        : 'bg-white text-ink-soft ring-line hover:bg-surface-muted'
                    }`}
                  >
                    <input type="radio" value={option} {...register('status')} className="sr-only" />
                    <span
                      className={`size-2 rounded-full ${STATUS_STYLES[option].dot}`}
                      aria-hidden="true"
                    />
                    {option}
                  </label>
                )
              })}
            </div>
          </fieldset>

          <div className="sm:col-span-2">
            <Field label="Notes" optional error={errors.notes?.message}>
              {(props) => (
                <textarea
                  {...props}
                  {...register('notes')}
                  rows={3}
                  placeholder="Anything worth remembering about this enquiry"
                  className={`resize-y py-2.5 ${controlClass(errors.notes)}`}
                />
              )}
            </Field>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-line bg-surface-muted px-6 py-4 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {isEdit ? 'Save changes' : 'Add lead'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
