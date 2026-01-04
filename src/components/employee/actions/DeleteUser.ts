'use server';

import { prisma } from '@/lib/prisma';

export async function deleteUserById(email: string) {

    const user = await prisma.user.findUnique({
        where: { email: email },
    });

    if (!user) {
        throw new Error('User not found');
    }

    await prisma.user.delete({
        where: { email: email },
    });

    

}