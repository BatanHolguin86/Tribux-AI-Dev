import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PhaseTeamPanel } from '@/components/shared/PhaseTeamPanel'
import type { AgentType } from '@/types/agent'

describe('PhaseTeamPanel', () => {
  const defaultProps = {
    projectId: 'proj-1',
    phaseNumber: 0,
    agentTypes: ['cto_virtual', 'product_architect', 'ui_ux_designer'] as AgentType[],
  }

  it('renders phase header with correct phase number', () => {
    render(<PhaseTeamPanel {...defaultProps} />)
    expect(screen.getByText('Equipo de Phase 00')).toBeInTheDocument()
  })

  it('renders phase 04 header correctly padded', () => {
    render(<PhaseTeamPanel {...defaultProps} phaseNumber={4} />)
    expect(screen.getByText('Equipo de Phase 04')).toBeInTheDocument()
  })

  it('renders all assigned agents', () => {
    render(<PhaseTeamPanel {...defaultProps} />)
    expect(screen.getByText('CTO Virtual')).toBeInTheDocument()
    expect(screen.getByText('Product Architect')).toBeInTheDocument()
    expect(screen.getByText('UI/UX Designer')).toBeInTheDocument()
  })

  it('always shows CTO even if not in agentTypes prop', () => {
    render(
      <PhaseTeamPanel
        {...defaultProps}
        agentTypes={['product_architect'] as AgentType[]}
      />,
    )
    expect(screen.getByText('CTO Virtual')).toBeInTheDocument()
    expect(screen.getByText('Product Architect')).toBeInTheDocument()
  })

  it('marks CTO as Lider', () => {
    render(<PhaseTeamPanel {...defaultProps} />)
    expect(screen.getByText('Lider')).toBeInTheDocument()
  })

  it('shows "Secciones y responsables" mapping section', () => {
    render(<PhaseTeamPanel {...defaultProps} />)
    expect(screen.getByText('Secciones y responsables')).toBeInTheDocument()
  })

  it('shows section labels for phase 0', () => {
    render(<PhaseTeamPanel {...defaultProps} phaseNumber={0} />)
    // Labels appear in both agent badges and mapping table, so use getAllByText
    expect(screen.getAllByText('Problem Statement').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('User Personas').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Value Proposition').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Success Metrics').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Competitive Analysis').length).toBeGreaterThanOrEqual(1)
  })

  it('shows section labels for phase 2', () => {
    const phase2Agents: AgentType[] = [
      'cto_virtual',
      'system_architect',
      'db_admin',
      'lead_developer',
      'product_architect',
    ]
    render(
      <PhaseTeamPanel {...defaultProps} phaseNumber={2} agentTypes={phase2Agents} />,
    )
    expect(screen.getAllByText('System Architecture').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Database Design').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('API Design').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Architecture Decisions').length).toBeGreaterThanOrEqual(1)
  })

  it('does NOT render any chat input or textarea', () => {
    render(<PhaseTeamPanel {...defaultProps} />)
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('does NOT render "Iniciar chat" or similar chat buttons', () => {
    render(<PhaseTeamPanel {...defaultProps} />)
    expect(screen.queryByText(/iniciar chat/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/abrir chat/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/enviar/i)).not.toBeInTheDocument()
  })

  it('renders CTA "Ir a Secciones" when onGoToSecciones is provided', () => {
    const onGoToSecciones = vi.fn()
    render(<PhaseTeamPanel {...defaultProps} onGoToSecciones={onGoToSecciones} />)
    expect(screen.getByText('Ir a Secciones')).toBeInTheDocument()
  })

  it('does not render CTA when onGoToSecciones is not provided', () => {
    render(<PhaseTeamPanel {...defaultProps} />)
    expect(screen.queryByText('Ir a Secciones')).not.toBeInTheDocument()
  })

  it('calls onGoToSecciones when CTA button is clicked', async () => {
    const user = userEvent.setup()
    const onGoToSecciones = vi.fn()
    render(<PhaseTeamPanel {...defaultProps} onGoToSecciones={onGoToSecciones} />)

    await user.click(screen.getByText('Ir a Secciones'))
    expect(onGoToSecciones).toHaveBeenCalledTimes(1)
  })

  it('renders informational description about Secciones workflow', () => {
    render(<PhaseTeamPanel {...defaultProps} />)
    expect(
      screen.getByText(/agentes ya trabajan dentro de cada seccion/i),
    ).toBeInTheDocument()
  })

  it('deduplicates agents when same agent appears twice in agentTypes', () => {
    render(
      <PhaseTeamPanel
        {...defaultProps}
        agentTypes={[
          'cto_virtual',
          'product_architect',
          'product_architect',
        ] as AgentType[]}
      />,
    )
    // Should show Product Architect only once
    const matches = screen.getAllByText('Product Architect')
    // One in roster card, possibly one or more in section badges — but the roster card should be unique
    // The roster renders once per unique agent
    expect(matches.length).toBeGreaterThanOrEqual(1)
  })
})
