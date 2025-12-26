import { config } from 'dotenv';
config(); // Load .env file

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function setupTestDB() {
  // Clean up test data
  await prisma.eventLog.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.warrantyUnit.deleteMany({});
  await prisma.returnRequest.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  
  console.log('✓ Test database cleaned');
}

export async function teardownTestDB() {
  await prisma.$disconnect();
}

export { prisma };
