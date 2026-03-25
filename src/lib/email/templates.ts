import { PHASE_NAMES } from '@/types/project'

const BRAND_COLOR = '#7c3aed'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

function layout(content: string) {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Inter,system-ui,-apple-system,sans-serif">
<div style="max-width:520px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e4e4e7">
${content}
</div>
<p style="text-align:center;font-size:12px;color:#a1a1aa;margin-top:24px">AI Squad Command Center</p>
</body>
</html>`
}

type PhaseApprovedParams = {
  userName: string
  projectName: string
  phaseNumber: number
  projectId: string
}

export function phaseApprovedEmail({ userName, projectName, phaseNumber, projectId }: PhaseApprovedParams) {
  const phaseName = PHASE_NAMES[phaseNumber] ?? `Phase ${String(phaseNumber).padStart(2, '0')}`
  const nextPhase = phaseNumber + 1
  const nextPhaseName = PHASE_NAMES[nextPhase]

  const nextSection = nextPhaseName
    ? `<p style="font-size:14px;color:#52525b;line-height:1.6">
        La siguiente fase es <strong>Phase ${String(nextPhase).padStart(2, '0')} — ${nextPhaseName}</strong>. Ya esta desbloqueada y lista para trabajar.
      </p>
      <div style="text-align:center;margin-top:24px">
        <a href="${APP_URL}/projects/${projectId}/phase/${String(nextPhase).padStart(2, '0')}"
          style="display:inline-block;padding:10px 24px;background:${BRAND_COLOR};color:#fff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:500">
          Ir a Phase ${String(nextPhase).padStart(2, '0')}
        </a>
      </div>`
    : ''

  const html = layout(`
    <div style="background:${BRAND_COLOR};padding:24px 32px">
      <h1 style="margin:0;color:#fff;font-size:18px;font-weight:600">Phase aprobada</h1>
    </div>
    <div style="padding:24px 32px">
      <p style="font-size:14px;color:#52525b;line-height:1.6">
        Hola ${userName || 'usuario'},
      </p>
      <p style="font-size:14px;color:#52525b;line-height:1.6">
        Has aprobado <strong>Phase ${String(phaseNumber).padStart(2, '0')} — ${phaseName}</strong> en el proyecto <strong>${projectName}</strong>.
      </p>
      ${nextSection}
    </div>
  `)

  return {
    subject: `Phase ${String(phaseNumber).padStart(2, '0')} aprobada — ${projectName}`,
    html,
  }
}

type CycleCompleteParams = {
  userName: string
  projectName: string
  cycleNumber: number
  projectId: string
}

export function cycleCompleteEmail({ userName, projectName, cycleNumber, projectId }: CycleCompleteParams) {
  const html = layout(`
    <div style="background:${BRAND_COLOR};padding:24px 32px">
      <h1 style="margin:0;color:#fff;font-size:18px;font-weight:600">Ciclo IA DLC completado!</h1>
    </div>
    <div style="padding:24px 32px">
      <p style="font-size:14px;color:#52525b;line-height:1.6">
        Hola ${userName || 'usuario'},
      </p>
      <p style="font-size:14px;color:#52525b;line-height:1.6">
        Has completado el <strong>Ciclo ${cycleNumber}</strong> del proyecto <strong>${projectName}</strong>. Las 8 fases del IA DLC han sido aprobadas.
      </p>
      <p style="font-size:14px;color:#52525b;line-height:1.6">
        Tu base de conocimiento y artefactos de diseno se preservan. Puedes iniciar un nuevo ciclo cuando quieras.
      </p>
      <div style="text-align:center;margin-top:24px">
        <a href="${APP_URL}/projects/${projectId}/phase/07"
          style="display:inline-block;padding:10px 24px;background:${BRAND_COLOR};color:#fff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:500">
          Ver proyecto
        </a>
      </div>
    </div>
  `)

  return {
    subject: `Ciclo IA DLC completado — ${projectName}`,
    html,
  }
}
