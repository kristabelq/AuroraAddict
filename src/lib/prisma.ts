import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Use DATABASE_URL (connection pooler) for queries - more reliable for local dev
// DIRECT_URL is used for migrations (requires direct connection)
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
})

// Graceful shutdown
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma

  // Handle cleanup on hot reload
  if ((module as any).hot) {
    (module as any).hot.dispose(() => {
      prisma.$disconnect()
    })
  }
}
