import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PhaseWorkspaceTabs } from '@/components/shared/PhaseWorkspaceTabs'
import type { AgentType } from '@/types/agent'

describe('PhaseWorkspaceTabs', () => {
  const defaultProps = {
    phaseNumber: 0,
    projectId: 'proj-1',
    phaseAgents: ['cto_virtual', 'product_architect'] as AgentType[],
  }

  it('renders Secciones and Equipo tabs', () => {
    render(
      <PhaseWorkspaceTabs {...defaultProps} teamContent={<div>Team</div>}>
        <div>Sections content</div>
      </PhaseWorkspaceTabs>,
    )
    expect(screen.getByText('Secciones')).toBeInTheDocument()
    expect(screen.getByText('Equipo')).toBeInTheDocument()
  })

  it('does not render Herramientas tab when hasTools is false', () => {
    render(
      <PhaseWorkspaceTabs {...defaultProps} teamContent={<div>Team</div>}>
        <div>Sections</div>
      </PhaseWorkspaceTabs>,
    )
    expect(screen.queryByText('Herramientas')).not.toBeInTheDocument()
  })

  it('renders Herramientas tab when hasTools is true', () => {
    render(
      <PhaseWorkspaceTabs
        {...defaultProps}
        hasTools={true}
        teamContent={<div>Team</div>}
        toolsContent={<div>Tools</div>}
      >
        <div>Sections</div>
      </PhaseWorkspaceTabs>,
    )
    expect(screen.getByText('Herramientas')).toBeInTheDocument()
  })

  it('shows Secciones content by default', () => {
    render(
      <PhaseWorkspaceTabs {...defaultProps} teamContent={<div>Team panel</div>}>
        <div>Active sections content</div>
      </PhaseWorkspaceTabs>,
    )
    expect(screen.getByText('Active sections content')).toBeInTheDocument()
    expect(screen.queryByText('Team panel')).not.toBeInTheDocument()
  })

  it('switches to Equipo tab on click', async () => {
    const user = userEvent.setup()
    render(
      <PhaseWorkspaceTabs {...defaultProps} teamContent={<div>Team panel</div>}>
        <div>Sections content</div>
      </PhaseWorkspaceTabs>,
    )

    await user.click(screen.getByText('Equipo'))
    expect(screen.getByText('Team panel')).toBeInTheDocument()
    expect(screen.queryByText('Sections content')).not.toBeInTheDocument()
  })

  it('switches to Herramientas tab on click', async () => {
    const user = userEvent.setup()
    render(
      <PhaseWorkspaceTabs
        {...defaultProps}
        hasTools={true}
        teamContent={<div>Team</div>}
        toolsContent={<div>Design tools here</div>}
      >
        <div>Sections</div>
      </PhaseWorkspaceTabs>,
    )

    await user.click(screen.getByText('Herramientas'))
    expect(screen.getByText('Design tools here')).toBeInTheDocument()
    expect(screen.queryByText('Sections')).not.toBeInTheDocument()
  })

  it('supports render function pattern for teamContent', async () => {
    const user = userEvent.setup()
    const teamRenderFn = vi.fn((goToSecciones: () => void) => (
      <div>
        <span>Team render fn</span>
        <button onClick={goToSecciones}>Back to sections</button>
      </div>
    ))

    render(
      <PhaseWorkspaceTabs {...defaultProps} teamContent={teamRenderFn}>
        <div>Main sections</div>
      </PhaseWorkspaceTabs>,
    )

    // Switch to Equipo tab
    await user.click(screen.getByText('Equipo'))
    expect(screen.getByText('Team render fn')).toBeInTheDocument()
    expect(teamRenderFn).toHaveBeenCalledWith(expect.any(Function))
  })

  it('goToSecciones callback switches back to Secciones tab', async () => {
    const user = userEvent.setup()
    render(
      <PhaseWorkspaceTabs
        {...defaultProps}
        teamContent={(goToSecciones) => (
          <div>
            <span>Team view</span>
            <button onClick={goToSecciones}>Go back</button>
          </div>
        )}
      >
        <div>Main sections</div>
      </PhaseWorkspaceTabs>,
    )

    // Switch to Equipo
    await user.click(screen.getByText('Equipo'))
    expect(screen.getByText('Team view')).toBeInTheDocument()
    expect(screen.queryByText('Main sections')).not.toBeInTheDocument()

    // Click goToSecciones
    await user.click(screen.getByText('Go back'))
    expect(screen.getByText('Main sections')).toBeInTheDocument()
    expect(screen.queryByText('Team view')).not.toBeInTheDocument()
  })

  it('respects initialTab prop', () => {
    render(
      <PhaseWorkspaceTabs
        {...defaultProps}
        initialTab="equipo"
        teamContent={<div>Team first</div>}
      >
        <div>Sections</div>
      </PhaseWorkspaceTabs>,
    )
    expect(screen.getByText('Team first')).toBeInTheDocument()
    expect(screen.queryByText('Sections')).not.toBeInTheDocument()
  })
})
