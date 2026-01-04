// app/(admin)/dashboard/actions/FetchCompany.ts
'use server'

import { prisma } from '@/lib/prisma'

// ✅ Fetch the first business profile (you can expand to support multi-company later)
export async function getBusinessProfile() {
  try {
    return await prisma.tbl_business_profile.findFirst()
  } catch (err) {
    console.error("❌ Error fetching business profile:", err)
    throw new Error("Failed to fetch business profile")
  }
}

// ✅ Get company name
export async function getCompanyName(): Promise<string | null> {
  const company = await getBusinessProfile()
  return company?.company_name || null
}

// ✅ Get company logo (relative path)
export async function getCompanyLogo(): Promise<string | null> {
  const company = await getBusinessProfile()
  return company?.logo || null
}

// ✅ Get company logo (with full path)
export async function getCompanyLogoFull(): Promise<string | null> {
  const company = await getBusinessProfile()
  return company?.full_path || null
}

// ✅ Get company address
export async function getCompanyAddress(): Promise<string | null> {
  const company = await getBusinessProfile()
  return company?.address || null
}

// ✅ Get company phone
export async function getCompanyPhone(): Promise<string | null> {
  const company = await getBusinessProfile()
  return company?.phone || null
}

// ✅ Get company email
export async function getCompanyEmail(): Promise<string | null> {
  const company = await getBusinessProfile()
  return company?.email || null
}

// ✅ Get company currency
export async function getCompanyCurrency(): Promise<string | null> {
  const company = await getBusinessProfile()
  return company?.currency || null
}
