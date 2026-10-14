import { NextResponse } from 'next/server';

// 1. الحصول على Access Token المعتمد من CJ Dropshipping
async function getCJAccessToken() {
  const res = await fetch('https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: process.env.CJ_EMAIL,
      password: process.env.CJ_API_KEY, // أو الـ API Key المخصص
    }),
  });
  const data = await res.json();
  if (data.result) {
    return data.data.accessToken;
  }
  throw new Error('فشل الحصول على Access Token من CJ');
}

// 2. معالج الطلب الآلي للسحب الجماعي (Bulk Import)
export async function GET(request: Request) {
  try {
    const accessToken = await getCJAccessToken();

    // جلب قائمة المنتجات بكثافة (يمكنك تغيير الفئة أو الكلمة المفتاحية)
    const response = await fetch('https://developers.cjdropshipping.com/api2.0/v1/product/list?pageSize=100&pageNum=1', {
      method: 'GET',
      headers: {
        'CJ-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (!result.result || !result.data?.list) {
      return NextResponse.json({ success: false, message: 'تعذر جلب المنتجات من المورد' }, { status: 400 });
    }

    const products = result.data.list;

    // 3. معالجة وتخزين المنتجات في قاعدة بياناتك تلقائياً
    const syncedProducts = products.map((item: any) => ({
      id: item.pid,
      title: item.productNameEn,
      sku: item.productSku,
      image: item.productImage,
      price: parseFloat(item.sellPrice),
      category: item.categoryName,
      variantsCount: item.variants ? item.variants.length : 0,
      updatedAt: new Date().toISOString(),
    }));

    // TODO: ادخل كود الحفظ لقاعدة بياناتك هنا (مثلاً: Supabase, MongoDB, أو Prisma/Postgres)
    // await db.product.upsertMany({ data: syncedProducts });

    return NextResponse.json({
      success: true,
      message: `تمت المزامنة الآلية بنجاح لـ ${syncedProducts.length} منتج!`,
      data: syncedProducts,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
