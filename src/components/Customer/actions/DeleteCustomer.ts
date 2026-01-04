'use server'

import { prisma } from '@/lib/prisma';

export async function DeleteCustomer(CustomerCode: number) {
    try {
        const user = await prisma.tbl_customer.findUnique({
            where: { customer_code: CustomerCode },
        });

        if (!user) {
            return { success: false, error: 'User not found' };
        }

        await prisma.tbl_customer.delete({
            where: { customer_code: CustomerCode },
        });

        return { success: true };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}
