import { z } from 'zod'
import { STATUS_LIST } from './constants'

/**
 * Form validation. These rules mirror backend/app/schemas/lead.py so users see
 * mistakes instantly, while the backend still validates everything again.
 */

const PHONE_PATTERN = /^\+?[0-9\s\-().]+$/
const countDigits = (value) => (value.match(/\d/g) || []).length

export const leadSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required.')
    .min(2, 'Name must be at least 2 characters.')
    .max(100, 'Name must be at most 100 characters.'),
  email: z
    .string()
    .trim()
    .min(1, 'Email is required.')
    .max(255, 'Email must be at most 255 characters.')
    .pipe(z.email({ message: 'Enter a valid email address.' })),
  phone: z
    .string()
    .trim()
    .min(1, 'Phone number is required.')
    .regex(PHONE_PATTERN, 'Phone can only contain digits, spaces, +, -, ( ) and dots.')
    .refine(
      (value) => countDigits(value) >= 7 && countDigits(value) <= 15,
      'Phone must contain between 7 and 15 digits.',
    ),
  business_name: z
    .string()
    .trim()
    .min(1, 'Business name is required.')
    .min(2, 'Business name must be at least 2 characters.')
    .max(150, 'Business name must be at most 150 characters.'),
  status: z.enum(STATUS_LIST, { message: 'Choose a status.' }),
  notes: z.string().trim().max(1000, 'Notes must be at most 1000 characters.'),
})

export const LEAD_FIELDS = ['name', 'email', 'phone', 'business_name', 'status', 'notes']

export const emptyLead = {
  name: '',
  email: '',
  phone: '',
  business_name: '',
  status: 'New',
  notes: '',
}

// ---------- Accounts (mirror backend/app/schemas/auth.py) ----------

const emailField = z
  .string()
  .trim()
  .min(1, 'Email is required.')
  .pipe(z.email({ message: 'Enter a valid email address.' }))

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, 'Password is required.'),
})

export const signupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters.')
    .max(100, 'Name must be at most 100 characters.'),
  email: emailField,
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .max(128, 'Password must be at most 128 characters.')
    .refine((v) => /[A-Za-z]/.test(v) && /\d/.test(v), 'Use at least one letter and one number.'),
})

/** Shape the validated form values into the JSON body the API expects. */
export const toLeadPayload = (values) => ({ ...values, notes: values.notes || null })
