
import { prisma } from "@/lib/prisma";


import { NextRequest, NextResponse } from "next/server";


export async function POST(request: NextRequest) {

  const data = await request.formData();

  const customer_code = data.get('customer_code') as string;
  const customer_name = data.get('customer_name') as string;
  const email = data.get('email') as string;
  const phone = data.get('phone') as string;
  const discount = data.get('discount') as string;
  const address = data.get('address') as string;

  // if (!file || !name || !email || !password1) {
  //   return NextResponse.json({ success: false })
  // }

  try {
    const update_customer = await prisma.tbl_customer.update({
      where: { email: email },
      data: {
        customer_name,
        email,
        phone,
        address,
        discount
      }
    })

    if (update_customer) {

      return NextResponse.json({ msg: "Customer Updated" });
    }

  }
  catch (error) {
    return NextResponse.json({ error: error });
  }


}