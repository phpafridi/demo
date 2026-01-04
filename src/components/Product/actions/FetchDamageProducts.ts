'use server';
import { prisma } from '@/lib/prisma';

export default async function FetchDamageProducts() {
    const DamageProducts = await prisma.tbl_damage_product.findMany({
        include: {
            product: {
                select: {
                    packet_size: true,
                    measurement_units: true
                }
            }
        }
    });
    
    return DamageProducts.map(item => ({
        ...item,
        packet_size: item.product?.packet_size ?? 0,
        measurement_units: item.product?.measurement_units || 'pcs'
    }));
}