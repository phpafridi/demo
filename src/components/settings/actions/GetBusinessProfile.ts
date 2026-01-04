'use server'
import { prisma } from "@/lib/prisma";

export async function GetBusinessProfile() {
  const profile = await prisma.tbl_business_profile.findFirst();
  return profile;
}