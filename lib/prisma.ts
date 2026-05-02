import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function buildDbUrl(): string {
  const cwd = process.cwd().replace(/\\/g, "/");
  // Windows path: C:/... → file:///C:/...
  // Unix path: /home/... → file:///home/...
  if (/^[A-Za-z]:/.test(cwd)) {
    return `file:///${cwd}/dev.db`;
  }
  return `file://${cwd}/dev.db`;
}

function createPrismaClient() {
  const adapter = new PrismaLibSql({ url: buildDbUrl() });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
