import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.policy.upsert({
    where: { name: 'default-operator-policy' },
    update: {
      active: true,
      configJson: {
        pricing: {
          refresh: { min: 79, max: 79 },
          starter: { min: 99, max: 149 },
          pro: { min: 199, max: 249 },
        },
        refunds: { manualApprovalAbove: 25 },
        messaging: { dailyOutboundLimit: 20 },
        deployments: { allowedTargets: ['preview'] },
        payments: { allowPaymentLinksOnly: true },
      },
    },
    create: {
      name: 'default-operator-policy',
      active: true,
      configJson: {
        pricing: {
          refresh: { min: 79, max: 79 },
          starter: { min: 99, max: 149 },
          pro: { min: 199, max: 249 },
        },
        refunds: { manualApprovalAbove: 25 },
        messaging: { dailyOutboundLimit: 20 },
        deployments: { allowedTargets: ['preview'] },
        payments: { allowPaymentLinksOnly: true },
      },
    },
  })

  console.log('Seeded default operator policy')
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
