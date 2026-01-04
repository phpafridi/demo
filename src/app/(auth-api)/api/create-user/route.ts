import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { writeFile } from "fs/promises";
import { join } from "path";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const user_type = formData.get("user_type") as string;
    const menus = JSON.parse(formData.get("menus") as string || "[]") as string[];

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Save image or use default
    let imageName: string;
    if (file && file.size > 0) {
      const buffer = Buffer.from(await file.arrayBuffer());
      imageName = file.name;
      await writeFile(join(process.cwd(), "uploads", imageName), buffer);
    } else {
      // ✅ fallback to default picture
      imageName = "user.jpg";
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        flag: user_type,
        image: imageName, // either uploaded filename OR default
      },
    });

    // Save roles for normal user
    if (menus.length > 0 && user_type === "0") {
      const rolesData = menus.map((menu) => ({
        email: user.email,
        menu_name: menu,
      }));
      await prisma.user_role.createMany({ data: rolesData, skipDuplicates: true });
    }

    return NextResponse.json({ success: true, user });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
