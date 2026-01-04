import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { writeFile } from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { join } from "path";

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();

    const file = data.get("file") as File | null;
    const name = data.get("name") as string;
    const old_email = data.get("old_email") as string; // original email
    const email = data.get("email") as string;
    const password1 = data.get("password") as string;
    const user_type = data.get("user_type") as string;
    const menus = JSON.parse(data.get("menus") as string) as string[];

    // Handle file upload if provided
    let imageName: string | null = null;
    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const path = join(process.cwd(), "uploads", file.name);
      await writeFile(path, buffer);
      imageName = file.name;
    }

    // Hash password only if provided
    const hashedPassword = password1 ? await bcrypt.hash(password1, 10) : undefined;

    // Update user
    const update_user = await prisma.user.update({
      where: { email : old_email },
      data: {
        name,
        email,
        ...(hashedPassword && { password: hashedPassword }),
        ...(imageName && { image: imageName }),
        flag: user_type,
      },
    });

    if (!update_user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // If admin (flag=1), no role assignment
    if (update_user.flag === "1") {
      return NextResponse.json({ msg: "Admin Updated" });
    }

    // Reset old roles
    await prisma.user_role.deleteMany({ where: { email } });

    // Insert new roles
    if (menus.length > 0) {
      await prisma.user_role.createMany({
        data: menus.map((menu) => ({
          email,
          menu_name: menu,
        })),
      });
    }

    return NextResponse.json({ msg: "User Updated" });
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
