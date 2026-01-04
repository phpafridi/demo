'use server';
import { prisma } from '@/lib/prisma';

export async function FetchCustomerData() {
    const customers = prisma.tbl_customer.findMany();
    return customers;
}
