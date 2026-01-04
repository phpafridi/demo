'use server';
import { prisma } from '@/lib/prisma';

export default async function FetchUser() {
  const users = await prisma.user.findMany();
  return users;
}