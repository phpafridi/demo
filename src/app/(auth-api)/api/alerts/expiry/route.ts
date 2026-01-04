import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const today = new Date();
    
    // Get all products that have expiration enabled
    const productsWithExpiration = await prisma.tbl_product.findMany({
      where: {
        has_expiration: true,
        expiration_date: {
          not: null
        }
      },
      include: {
        inventories: true,
        subcategory: {
          include: {
            category: true
          }
        }
      }
    });

    // Filter products based on their individual alert settings
    const expiringProducts = productsWithExpiration.filter(product => {
      if (!product.expiration_date) return false;
      
      const expiryDate = new Date(product.expiration_date);
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      // Use the product's individual alert setting, default to 30 if not set
      const alertDays = product.days_before_expiry_alert || 30;
      
      return daysUntilExpiry > 0 && daysUntilExpiry <= alertDays;
    });

    const expiredProducts = productsWithExpiration.filter(product => {
      if (!product.expiration_date) return false;
      
      const expiryDate = new Date(product.expiration_date);
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      return daysUntilExpiry <= 0;
    });

    return NextResponse.json({
      success: true,
      data: {
        expiring: expiringProducts,
        expired: expiredProducts
      }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch expiry alerts" },
      { status: 500 }
    );
  }
}