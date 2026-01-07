import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Use DIRECT_URL (session pooler on port 5432) to avoid transaction pooler cache issues
// The transaction pooler (port 6543) caches prepared statements aggressively
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
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
