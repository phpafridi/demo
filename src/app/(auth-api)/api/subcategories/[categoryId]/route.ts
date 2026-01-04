import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Do NOT over-type `context`. Just let TS infer it.
export async function GET(
  req: Request,
  { params }: { params: any }   // 👈 loose typing here
) {
  const id = Number(params.categoryId);

  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    const subcategories = await prisma.tbl_subcategory.findMany({
      where: { category_id: id },
    });

    return NextResponse.json({ success: true, data: subcategories });
  } catch (error) {
    console.error("❌ Error fetching subcategories:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch subcategories" },
      { status: 500 }
    );
  }
}
