'use server'

import { prisma } from '@/lib/prisma';

export async function CustomerByEmail(email: string) {
    

    const customer = await prisma.tbl_customer.findUnique({
        where: { email: decodeURIComponent(email) },
    });

    return customer;
}
