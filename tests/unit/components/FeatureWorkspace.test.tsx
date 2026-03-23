import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { KiroDocumentType } from '@/types/feature'

// Mock KiroChat — it has heavy deps (useChat, TextStreamChatTransport)
// We expose the callbacks so we can simulate approval/generation from tests
let capturedKiroChatProps: Record<string, unknown> = {}

vi.mock('@/components/phase-01/KiroChat', () => ({
  KiroChat: (props: Record<string, unknown>) => {
    capturedKiroChatProps = props
    return (
      <div data-testid="kiro-chat">
        <span data-testid="kiro-doctype">{String(props.docType)}</span>
        <span data-testid="kiro-has-document">{String(props.hasDocument)}</span>
        <span data-testid="kiro-doc-status">{String(props.docStatus)}</span>
      </div>
    )
  },
}))

vi.mock('@/components/shared/document/DocumentPanel', () => ({
  DocumentPanel: () => <div data-testid="document-panel" />,
}))

import { FeatureWorkspace } from '@/components/phase-01/FeatureWorkspace'

function makeFeature(overrides?: {
  documents?: Partial<Record<KiroDocumentType, { id: string; content: string | null; version: number; status: string } | null>>
}) {
  return {
    id: 'feat-1',
    name: 'Test Feature',
    description: 'A test feature',
    status: 'in_progress',
    documents: {
      requirements: { id: 'doc-req', content: '# Requirements', version: 1, status: 'approved' },
      design: { id: 'doc-des', content: '# Design', version: 1, status: 'draft' },
      tasks: null,
      ...overrides?.documents,
    } as Record<KiroDocumentType, { id: string; content: string | null; version: number; status: string } | null>,
    conversations: {
      requirements: [],
      design: [],
      tasks: [],
    },
  }
}

describe('FeatureWorkspace', () => {
  const defaultProps = {
    projectId: 'proj-1',
    onBack: vi.fn(),
    onDocumentGenerated: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    capturedKiroChatProps = {}
  })

  describe('initial active doc type selection', () => {
    it('starts at requirements when none are approved', () => {
      const feature = makeFeature({
        documents: {
          requirements: null,
          design: null,
          tasks: null,
        },
      })
      render(<FeatureWorkspace {...defaultProps} feature={feature} />)
      expect(screen.getByTestId('kiro-doctype').textContent).toBe('requirements')
    })

    it('starts at design when requirements is approved', () => {
      const feature = makeFeature({
        documents: {
          requirements: { id: 'r', content: '', version: 1, status: 'approved' },
          design: { id: 'd', content: '', version: 1, status: 'draft' },
          tasks: null,
        },
      })
      render(<FeatureWorkspace {...defaultProps} feature={feature} />)
      expect(screen.getByTestId('kiro-doctype').textContent).toBe('design')
    })

    it('starts at tasks when requirements and design are approved', () => {
      const feature = makeFeature({
        documents: {
          requirements: { id: 'r', content: '', version: 1, status: 'approved' },
          design: { id: 'd', content: '', version: 1, status: 'approved' },
          tasks: null,
        },
      })
      render(<FeatureWorkspace {...defaultProps} feature={feature} />)
      expect(screen.getByTestId('kiro-doctype').textContent).toBe('tasks')
    })
  })

  describe('document approval flow', () => {
    it('switches to tasks after design is approved via callback', () => {
      const feature = makeFeature()
      render(<FeatureWorkspace {...defaultProps} feature={feature} />)

      // Starts on design (requirements already approved)
      expect(screen.getByTestId('kiro-doctype').textContent).toBe('design')

      // Simulate approval callback from KiroChat
      const onDocumentApproved = capturedKiroChatProps.onDocumentApproved as (next: KiroDocumentType | null) => void
      act(() => {
        onDocumentApproved('tasks')
      })

      // Should now be on tasks
      expect(screen.getByTestId('kiro-doctype').textContent).toBe('tasks')
    })

    it('updates local document status to approved after callback', () => {
      const feature = makeFeature()
      render(<FeatureWorkspace {...defaultProps} feature={feature} />)

      // Design is draft
      expect(screen.getByTestId('kiro-doc-status').textContent).toBe('draft')

      // Approve design → switch to tasks
      const onDocumentApproved = capturedKiroChatProps.onDocumentApproved as (next: KiroDocumentType | null) => void
      act(() => {
        onDocumentApproved('tasks')
      })

      // Now on tasks — hasDocument should be false (tasks doc is null)
      expect(screen.getByTestId('kiro-has-document').textContent).toBe('false')
      expect(screen.getByTestId('kiro-doc-status').textContent).toBe('null')
    })

    it('stays on current doc when next_document is null (last doc approved)', () => {
      const feature = makeFeature({
        documents: {
          requirements: { id: 'r', content: '', version: 1, status: 'approved' },
          design: { id: 'd', content: '', version: 1, status: 'approved' },
          tasks: { id: 't', content: '# Tasks', version: 1, status: 'draft' },
        },
      })
      render(<FeatureWorkspace {...defaultProps} feature={feature} />)

      // Starts on tasks
      expect(screen.getByTestId('kiro-doctype').textContent).toBe('tasks')

      // Approve tasks with no next document
      const onDocumentApproved = capturedKiroChatProps.onDocumentApproved as (next: KiroDocumentType | null) => void
      act(() => {
        onDocumentApproved(null)
      })

      // Stays on tasks
      expect(screen.getByTestId('kiro-doctype').textContent).toBe('tasks')
    })

    it('unlocks tasks tab in stepper after design approval', () => {
      const feature = makeFeature()
      render(<FeatureWorkspace {...defaultProps} feature={feature} />)

      // Tasks tab should be locked (disabled) before design approval
      const tasksButton = screen.getByRole('button', { name: /Tasks/ })
      expect(tasksButton).toBeDisabled()

      // Approve design → switch to tasks
      const onDocumentApproved = capturedKiroChatProps.onDocumentApproved as (next: KiroDocumentType | null) => void
      act(() => {
        onDocumentApproved('tasks')
      })

      // Tasks tab should now be enabled
      const tasksButtonAfter = screen.getByRole('button', { name: /Tasks/ })
      expect(tasksButtonAfter).not.toBeDisabled()
    })

    it('updates progress badge after approval', () => {
      const feature = makeFeature()
      render(<FeatureWorkspace {...defaultProps} feature={feature} />)

      // Initially 1/3 (only requirements approved)
      expect(screen.getByText('1/3')).toBeInTheDocument()

      // Approve design
      const onDocumentApproved = capturedKiroChatProps.onDocumentApproved as (next: KiroDocumentType | null) => void
      act(() => {
        onDocumentApproved('tasks')
      })

      // Now 2/3
      expect(screen.getByText('2/3')).toBeInTheDocument()
    })

    it('does NOT call onDocumentGenerated or reload during approval', () => {
      const feature = makeFeature()
      render(<FeatureWorkspace {...defaultProps} feature={feature} />)

      const onDocumentApproved = capturedKiroChatProps.onDocumentApproved as (next: KiroDocumentType | null) => void
      act(() => {
        onDocumentApproved('tasks')
      })

      // onDocumentGenerated should NOT be called during approval
      expect(defaultProps.onDocumentGenerated).not.toHaveBeenCalled()
    })
  })

  describe('stepper navigation', () => {
    it('can click on approved doc tabs to navigate back', async () => {
      const user = userEvent.setup()
      const feature = makeFeature()
      render(<FeatureWorkspace {...defaultProps} feature={feature} />)

      // Click on Requirements (already approved, should be clickable)
      await user.click(screen.getByRole('button', { name: /Requirements/ }))
      expect(screen.getByTestId('kiro-doctype').textContent).toBe('requirements')
    })

    it('cannot click on locked doc tabs', async () => {
      const user = userEvent.setup()
      const feature = makeFeature()
      render(<FeatureWorkspace {...defaultProps} feature={feature} />)

      // Tasks should be locked
      const tasksButton = screen.getByRole('button', { name: /Tasks/ })
      expect(tasksButton).toBeDisabled()

      await user.click(tasksButton)
      // Should still be on design
      expect(screen.getByTestId('kiro-doctype').textContent).toBe('design')
    })
  })

  describe('KiroChat props', () => {
    it('passes correct props for active doc type', () => {
      const feature = makeFeature()
      render(<FeatureWorkspace {...defaultProps} feature={feature} />)

      expect(capturedKiroChatProps.projectId).toBe('proj-1')
      expect(capturedKiroChatProps.featureId).toBe('feat-1')
      expect(capturedKiroChatProps.featureName).toBe('Test Feature')
      expect(capturedKiroChatProps.docType).toBe('design')
      expect(capturedKiroChatProps.hasDocument).toBe(true)
      expect(capturedKiroChatProps.docStatus).toBe('draft')
    })

    it('remounts KiroChat with new key when switching doc type', () => {
      const feature = makeFeature()
      render(<FeatureWorkspace {...defaultProps} feature={feature} />)

      const firstKey = capturedKiroChatProps.docType

      // Approve design → switch to tasks
      const onDocumentApproved = capturedKiroChatProps.onDocumentApproved as (next: KiroDocumentType | null) => void
      act(() => {
        onDocumentApproved('tasks')
      })

      // KiroChat should now have tasks as docType
      expect(capturedKiroChatProps.docType).toBe('tasks')
      expect(capturedKiroChatProps.docType).not.toBe(firstKey)
    })
  })
})
