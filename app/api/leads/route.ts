import { z } from 'zod'
import { createProjectFromBrief } from '@/src/lib/project-intake'

const LeadSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  company: z.string().optional(),
  offerSummary: z.string().min(8),
  targetAudience: z.string().min(3),
  primaryGoal: z.string().min(3),
  packageHint: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const json = await request.json()
    const input = LeadSchema.parse(json)

    const result = await createProjectFromBrief({
      name: input.name,
      email: input.email,
      company: input.company,
      brief: {
        offerSummary: input.offerSummary,
        targetAudience: input.targetAudience,
        primaryGoal: input.primaryGoal,
        packageHint: input.packageHint,
      },
    })

    return Response.json({
      projectId: result.project.id,
      quote: result.quote,
      mode: result.mode,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid request'
    return new Response(JSON.stringify({ error: message }), { status: 400 })
  }
}
