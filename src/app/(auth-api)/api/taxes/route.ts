import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const taxes = await prisma.tbl_tax.findMany();

    return NextResponse.json({ success: true, data: taxes });
  } catch (error) {
    console.error("Error fetching taxes:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch taxes" }, { status: 500 });
  }
}
