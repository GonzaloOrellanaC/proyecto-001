import mongoose from 'mongoose';
import { z } from 'zod';
import { SaleModel } from '../models/Sale.js';
import { ProductModel } from '../models/Product.js';
import { decreaseStock } from './inventory.service.js';

export const CreateSaleInput = z.object({
  orgId: z.string(),
  storeId: z.string(),
  items: z.array(z.object({ productId: z.string(), qty: z.number().int().positive() }))
});

export async function createSale(userId: string, input: z.infer<typeof CreateSaleInput>) {
  const parsed = CreateSaleInput.parse(input);
  try {
    // get product prices
    const products = await ProductModel.find({ _id: { $in: parsed.items.map(i => i.productId) } }).select('price').lean();
    const priceMap = new Map(products.map(p => [String(p._id), p.price as number]));
    const items = parsed.items.map(i => {
      const price = priceMap.get(i.productId) ?? 0;
      const total = price * i.qty;
      return { productId: new mongoose.Types.ObjectId(i.productId), qty: i.qty, price, total };
    });
    const total = items.reduce((sum, it) => sum + it.total, 0);

    // decrease stock
    for (const it of parsed.items) {
      await decreaseStock(null, parsed.orgId, parsed.storeId, it.productId, it.qty);
    }

    // create sale
    const sale = await SaleModel.create({ orgId: parsed.orgId, storeId: parsed.storeId, userId, total, items });
    return sale.toObject();
  } catch (err) {
    throw err;
  }
}
