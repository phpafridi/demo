'use server'
import { join } from "path";
import { writeFile } from "fs/promises";
import { prisma } from "@/lib/prisma";

type ResultType =
  | { success: true }
  | { success: false; error: string };

export async function AddBusinessProfile(formData: FormData): Promise<ResultType> {
  try {
    const company_name = formData.get('company_name') as string;
    const company_email = formData.get('company_email') as string;
    const address = formData.get('address') as string;
    const phone = formData.get('phone') as string;
    const logo_image = formData.get('file') as File | null;
    const currency = "nill";

    if (!company_name || !company_email || !address || !phone) {
      return { success: false, error: "Missing required fields." };
    }

    let logoFileName: string | null = null;

    // Handle file upload if provided
    if (logo_image) {
      const bytes = await logo_image.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Save inside public/uploads
      logoFileName = `${Date.now()}-${logo_image.name}`;
      const path = join(process.cwd(), "uploads", logoFileName);
      await writeFile(path, buffer);
    }

    // Update if exists, otherwise insert
    await prisma.tbl_business_profile.upsert({
      where: { business_profile_id: 1 }, // assuming single profile with id 1
      update: {
        company_name,
        email: company_email,
        address,
        phone,
        currency,
        ...(logoFileName ? { logo: logoFileName } : {}), // only update if new file uploaded
      },
      create: {
        company_name,
        email: company_email,
        address,
        phone,
        currency,
        logo: logoFileName,
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error saving business profile:", error);
    return { success: false, error: "Failed to save business profile." };
  }
}
