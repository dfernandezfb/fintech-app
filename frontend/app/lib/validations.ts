import * as yup from 'yup'
import type { ValidationError } from 'yup'

export const createTransactionSchema = yup.object({
  fromUserId: yup
    .string()
    .required('Por favor, seleccione un remitente.'),

  toUserId: yup
    .string()
    .required('Por favor, seleccione un destinatario.')
    .test(
      'not-same-as-sender',
      'El remitente y el destinatario deben ser usuarios diferentes.',
      function (value) { return value !== this.parent.fromUserId }
    ),

  amount: yup
    .number()
    .typeError('Por favor, ingrese un monto válido.')
    .positive('El monto debe ser mayor que 0.')
    .required('Por favor, ingrese un monto.'),
})

export const rejectTransactionSchema = yup.object({
  reason: yup.string().trim().optional().default(''),
})

export type FieldErrors = Record<string, string>

export function extractFieldErrors(err: ValidationError): FieldErrors {
  const result: FieldErrors = {}
  const items = err.inner.length > 0 ? err.inner : [err]
  for (const item of items) {
    if (item.path && !result[item.path]) {
      result[item.path] = item.message
    }
  }
  return result
}
