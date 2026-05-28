import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TransactionStatusBadge } from './TransactionStatusBadge'

describe('TransactionStatusBadge', () => {
  it('renders "Confirmada" for confirmed status', () => {
    render(<TransactionStatusBadge status="confirmed" />)
    expect(screen.getByText('Confirmada')).toBeInTheDocument()
  })

  it('renders "Pendiente" for pending status', () => {
    render(<TransactionStatusBadge status="pending" />)
    expect(screen.getByText('Pendiente')).toBeInTheDocument()
  })

  it('renders "Rechazada" for rejected status', () => {
    render(<TransactionStatusBadge status="rejected" />)
    expect(screen.getByText('Rechazada')).toBeInTheDocument()
  })

  it('applies green styles for confirmed status', () => {
    render(<TransactionStatusBadge status="confirmed" />)
    const badge = screen.getByText('Confirmada')
    expect(badge.className).toContain('emerald')
  })

  it('applies amber styles for pending status', () => {
    render(<TransactionStatusBadge status="pending" />)
    const badge = screen.getByText('Pendiente')
    expect(badge.className).toContain('amber')
  })

  it('applies red styles for rejected status', () => {
    render(<TransactionStatusBadge status="rejected" />)
    const badge = screen.getByText('Rechazada')
    expect(badge.className).toContain('red')
  })

  it('renders a <span> element', () => {
    const { container } = render(<TransactionStatusBadge status="confirmed" />)
    expect(container.firstChild?.nodeName).toBe('SPAN')
  })
})
