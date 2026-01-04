'use server'

import { prisma } from '@/lib/prisma';

export async function UserByEmail(email: string) {


    const user = await prisma.user.findUnique({
        where: { email: decodeURIComponent(email) },
        include: {
            user_roles: true
        }
    });

    return user;

}