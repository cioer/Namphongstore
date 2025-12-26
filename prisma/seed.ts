/* eslint-disable @typescript-eslint/no-require-imports */
// Use require to avoid TS server caching issues with generated Prisma client
const { PrismaClient, Prisma } = require('@prisma/client');

// Define enum values as constants
const Role = {
  ADMIN: 'ADMIN',
  SALES: 'SALES', 
  TECH: 'TECH',
} as const;

const OrderStatus = {
  NEW: 'NEW',
  CONFIRMED: 'CONFIRMED',
  SHIPPING: 'SHIPPING',
  DELIVERED: 'DELIVERED',
  CANCELLED_BY_CUSTOMER: 'CANCELLED_BY_CUSTOMER',
  CANCELLED_BY_SHOP: 'CANCELLED_BY_SHOP',
} as const;

const prisma = new PrismaClient();

// Helper to generate Vietnamese phone numbers
function randomPhone() {
  const prefixes = ['090', '091', '092', '093', '094', '096', '097', '098', '099'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const number = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
  return `${prefix}${number}`;
}

// Helper for VN names
const vnNames = [
  'Nguyễn Văn An', 'Trần Thị Bình', 'Lê Văn Cường', 'Phạm Thị Dung',
  'Hoàng Văn Em', 'Vũ Thị Fuyến', 'Đặng Văn Giang', 'Bùi Thị Hà',
  'Đỗ Văn Hùng', 'Ngô Thị Lan', 'Dương Văn Minh', 'Phan Thị Nga',
];

function randomName() {
  return vnNames[Math.floor(Math.random() * vnNames.length)];
}

// VN cities
const vnCities = ['Hà Nội', 'TP Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ'];

// Product data: Vietnamese electronics
const categoryData = [
  { name: 'Tủ lạnh', slug: 'tu-lanh', desc: 'Tủ lạnh các loại' },
  { name: 'Máy giặt', slug: 'may-giat', desc: 'Máy giặt cửa trên, cửa ngang' },
  { name: 'Điều hòa', slug: 'dieu-hoa', desc: 'Điều hòa nhiệt độ, máy lạnh' },
  { name: 'Tivi', slug: 'tivi', desc: 'Tivi LED, Smart TV' },
  { name: 'Bếp điện', slug: 'bep-dien', desc: 'Bếp từ, bếp hồng ngoại' },
  { name: 'Nồi cơm điện', slug: 'noi-com-dien', desc: 'Nồi cơm điện tử' },
];

const brands = {
  'tu-lanh': ['Samsung', 'LG', 'Panasonic', 'Toshiba', 'Electrolux'],
  'may-giat': ['Samsung', 'LG', 'Panasonic', 'Toshiba', 'Electrolux'],
  'dieu-hoa': ['Daikin', 'Panasonic', 'LG', 'Samsung', 'Mitsubishi'],
  'tivi': ['Samsung', 'LG', 'Sony', 'TCL', 'Panasonic'],
  'bep-dien': ['Kangaroo', 'Sunhouse', 'Bluestone', 'Electrolux'],
  'noi-com-dien': ['Toshiba', 'Panasonic', 'Sharp', 'Cuckoo'],
};

const specsTemplates: Record<string, any> = {
  'tu-lanh': {
    'Dung tích': ['180L', '200L', '250L', '300L', '350L', '400L'],
    'Công nghệ': ['Inverter', 'Digital Inverter', 'Không'],
    'Số cửa': ['1 cửa', '2 cửa', 'Multi Door'],
  },
  'may-giat': {
    'Khối lượng': ['7kg', '8kg', '9kg', '10kg', '11kg'],
    'Loại máy': ['Cửa trên', 'Cửa ngang'],
    'Công nghệ': ['Inverter', 'AI', 'Thông thường'],
  },
  'dieu-hoa': {
    'Công suất': ['9000 BTU', '12000 BTU', '18000 BTU', '24000 BTU'],
    'Loại': ['1 chiều', '2 chiều'],
    'Công nghệ': ['Inverter', 'Gas R32', 'Plasma'],
  },
  'tivi': {
    'Kích thước': ['32 inch', '43 inch', '50 inch', '55 inch', '65 inch'],
    'Độ phân giải': ['HD', 'Full HD', '4K UHD', '8K'],
    'Hệ điều hành': ['Android TV', 'WebOS', 'Tizen', 'Google TV'],
  },
  'bep-dien': {
    'Loại bếp': ['Bếp từ', 'Bếp hồng ngoại', 'Bếp điện từ'],
    'Số vùng nấu': ['1 vùng', '2 vùng', '3 vùng'],
    'Công suất': ['1200W', '2000W', '2200W'],
  },
  'noi-com-dien': {
    'Dung tích': ['1.0L', '1.2L', '1.5L', '1.8L'],
    'Công nghệ': ['Điện tử', 'IH', 'Fuzzy Logic'],
    'Nồi': ['Nồi đồng', 'Nồi nhôm', 'Nồi kim cương'],
  },
};

function generateSpecs(categorySlug: string) {
  const template = specsTemplates[categorySlug] || {};
  const specs: Record<string, string> = {};
  for (const [key, values] of Object.entries(template)) {
    specs[key] = (values as string[])[Math.floor(Math.random() * (values as string[]).length)];
  }
  return specs;
}

const gifts = [
  'Tặng nồi nấu phở',
  'Tặng bộ dụng cụ nhà bếp',
  'Tặng phiếu mua hàng 500K',
  'Miễn phí lắp đặt',
  'Bảo hành vàng 2 năm',
  'Tặng quạt mini',
];

function randomGifts() {
  const count = Math.floor(Math.random() * 3);
  const selected = [];
  for (let i = 0; i < count; i++) {
    selected.push(gifts[Math.floor(Math.random() * gifts.length)]);
  }
  return selected;
}

// Sample image URLs (using placeholder)
function productImages(count: number = 3) {
  const urls = [];
  for (let i = 0; i < count; i++) {
    urls.push(`https://via.placeholder.com/400x400.png?text=Product+${i + 1}`);
  }
  return urls;
}

async function main() {
  console.log('🌱 Starting seed...');

  // Clean existing data
  await prisma.eventLog.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.returnRequest.deleteMany();
  await prisma.warrantyUnit.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ Cleaned existing data');

  // 1. Create Users
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@namphong.vn',
      password_hash: 'admin123', // Demo password for easy testing
      full_name: 'Admin Nam Phong',
      phone: '0901234567',
      role: Role.ADMIN,
    },
  });

  const salesUser = await prisma.user.create({
    data: {
      email: 'sales@namphong.vn',
      password_hash: 'sales123', // Demo password for easy testing
      full_name: 'Nhân viên Bán hàng',
      phone: '0901234568',
      role: Role.SALES,
    },
  });

  const techUser = await prisma.user.create({
    data: {
      email: 'tech@namphong.vn',
      password_hash: 'tech123', // Demo password for easy testing
      full_name: 'Kỹ thuật viên',
      phone: '0901234569',
      role: Role.TECH,
    },
  });

  console.log('✅ Created users');

  // 2. Create Categories
  const categories = [];
  for (const cat of categoryData) {
    const category = await prisma.category.create({
      data: {
        name: cat.name,
        slug: cat.slug,
        description: cat.desc,
        image_url: `https://via.placeholder.com/200x200.png?text=${encodeURIComponent(cat.name)}`,
      },
    });
    categories.push(category);
  }

  console.log(`✅ Created ${categories.length} categories`);

  // 3. Create Products (50-200 products)
  const productCount = 100; // Adjust as needed
  const products = [];

  for (let i = 0; i < productCount; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const brandList = brands[category.slug as keyof typeof brands] || ['Generic'];
    const brand = brandList[Math.floor(Math.random() * brandList.length)];
    
    const priceOriginal = Math.floor(Math.random() * 50000000) + 1000000; // 1M - 50M VND
    const discountPercent = Math.random() > 0.6 ? Math.floor(Math.random() * 40) + 5 : 0;
    const priceSale = priceOriginal * (100 - discountPercent) / 100;
    
    // Promo window (some products have active promos)
    const hasPromo = Math.random() > 0.7;
    const promoStart = hasPromo ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) : null;
    const promoEnd = hasPromo ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null;

    const productName = `${brand} ${category.name} Model ${i + 1}`;
    const slug = `${brand.toLowerCase()}-${category.slug}-${i + 1}`.replace(/\s+/g, '-');

    const product = await prisma.product.create({
      data: {
        category_id: category.id,
        name: productName,
        slug,
        brand,
        description: `Mô tả chi tiết cho ${productName}. Sản phẩm chất lượng cao, tiết kiệm điện, bảo hành chính hãng.`,
        specs: generateSpecs(category.slug),
        gifts: randomGifts(),
        images: productImages(3),
        price_original: priceOriginal,
        price_sale: priceSale,
        discount_percent: discountPercent,
        promo_start: promoStart,
        promo_end: promoEnd,
        warranty_months: [12, 24, 36][Math.floor(Math.random() * 3)],
        stock_quantity: Math.floor(Math.random() * 100) + 10,
        is_active: true,
      },
    });

    products.push(product);
  }

  console.log(`✅ Created ${products.length} products`);

  // 4. Create Orders with comprehensive demo data (50 orders)
  const orders = [];
  const orderStatuses = [
    OrderStatus.NEW, OrderStatus.NEW, OrderStatus.NEW, // More new orders for demo
    OrderStatus.CONFIRMED, OrderStatus.CONFIRMED, 
    OrderStatus.SHIPPING, OrderStatus.SHIPPING,
    OrderStatus.DELIVERED, OrderStatus.DELIVERED, OrderStatus.DELIVERED, OrderStatus.DELIVERED, // More delivered
    OrderStatus.CANCELLED_BY_CUSTOMER, OrderStatus.CANCELLED_BY_SHOP,
  ];

  // Create 50 orders with realistic time distribution (last 3 months)
  for (let i = 1; i <= 50; i++) {
    const status = orderStatuses[Math.floor(Math.random() * orderStatuses.length)];
    const orderCode = `NP${Date.now().toString().slice(-8)}${i.toString().padStart(3, '0')}`;
    
    // Random 1-4 items per order (more variety)
    const itemCount = Math.floor(Math.random() * 4) + 1;
    const orderItemsData = [];
    let totalAmount = 0;

    // Create realistic order date (last 3 months)
    const daysAgo = Math.floor(Math.random() * 90);
    const orderDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

    for (let j = 0; j < itemCount; j++) {
      const product = products[Math.floor(Math.random() * products.length)];
      const qty = Math.floor(Math.random() * 3) + 1;
      const unitPrice = Number(product.price_sale);
      totalAmount += unitPrice * qty;

      orderItemsData.push({
        product: {
          connect: { id: product.id }
        },
        snapshot_name: product.name,
        quantity: qty,
        unit_price_at_purchase: unitPrice,
        promo_snapshot: product.discount_percent > 0 ? {
          discount_percent: product.discount_percent,
          promo_start: product.promo_start,
          promo_end: product.promo_end,
        } : Prisma.JsonNull,
        warranty_months_snapshot: product.warranty_months,
      });
    }

    // Set delivered date for appropriate statuses
    let deliveredDate = null;
    if (status === OrderStatus.DELIVERED) {
      deliveredDate = new Date(orderDate.getTime() + Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000);
    }

    const order = await prisma.order.create({
      data: {
        order_code: orderCode,
        customer_name: randomName(),
        customer_phone: randomPhone(),
        customer_email: Math.random() > 0.3 ? `customer${i}@gmail.com` : null,
        customer_address: `${Math.floor(Math.random() * 500) + 1} ${['Đường Lê Lợi', 'Đường Nguyễn Trãi', 'Đường Hai Bà Trưng', 'Đường Trần Hưng Đạo', 'Đường Cách Mạng Tháng 8'][Math.floor(Math.random() * 5)]}`,
        customer_ward: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường Bến Nghé', 'Phường Đa Kao'][Math.floor(Math.random() * 5)],
        customer_district: ['Quận 1', 'Quận 2', 'Quận 3', 'Quận Bình Thạnh', 'Quận Tân Bình'][Math.floor(Math.random() * 5)],
        customer_city: vnCities[Math.floor(Math.random() * vnCities.length)],
        notes: Math.random() > 0.6 ? ['Giao giờ hành chính', 'Giao cuối tuần', 'Gọi trước khi giao', 'Giao tận tay'][Math.floor(Math.random() * 4)] : null,
        status,
        total_amount: totalAmount,
        delivered_date: deliveredDate,
        created_at: orderDate,
        updated_at: new Date(),
        items: {
          create: orderItemsData,
        },
      },
      include: {
        items: true,
      },
    });

    orders.push(order);

    // Create warranty units for delivered orders
    if (status === OrderStatus.DELIVERED && deliveredDate) {
      for (const item of order.items) {
        const product = products.find(p => p.id === item.product_id);
        const warrantyMonths = product?.warranty_months || 12;

        for (let unitNo = 1; unitNo <= item.quantity; unitNo++) {
          const warrantyCode = `NP-WTY-${deliveredDate.getFullYear().toString().slice(-2)}${(deliveredDate.getMonth() + 1).toString().padStart(2, '0')}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
          const endDate = new Date(deliveredDate);
          endDate.setMonth(endDate.getMonth() + warrantyMonths);

          // Some warranties might be expired or replaced for demo
          const now = new Date();
          let warrantyStatus = 'ACTIVE';
          if (endDate < now) warrantyStatus = 'EXPIRED';
          else if (Math.random() < 0.1) warrantyStatus = 'REPLACED'; // 10% chance

          await prisma.warrantyUnit.create({
            data: {
              order_item_id: item.id,
              unit_no: unitNo,
              warranty_code_auto: warrantyCode,
              warranty_months_at_purchase: warrantyMonths,
              start_date: deliveredDate,
              end_date: endDate,
              status: warrantyStatus as any,
            },
          });
        }
      }
    }

    // Add random event logs for more realistic order history
    if (Math.random() < 0.7) {
      await prisma.eventLog.create({
        data: {
          order: { connect: { id: order.id } },
          event_type: `ORDER_${status}`,
          metadata: { order_code: orderCode, status: status },
          created_at: new Date(orderDate.getTime() + Math.floor(Math.random() * 24 * 60 * 60 * 1000)),
        },
      });
    }
  }

  console.log(`✅ Created ${orders.length} orders with comprehensive demo data`);

  // 5. Create comprehensive Return Requests (20+ returns for good demo)
  const deliveredOrders = orders.filter(o => o.status === OrderStatus.DELIVERED);
  const returnStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED'];
  
  if (deliveredOrders.length > 0) {
    const returnCount = Math.min(25, deliveredOrders.length);
    
    for (let i = 0; i < returnCount; i++) {
      const order = deliveredOrders[i];
      const warrantyUnits = await prisma.warrantyUnit.findMany({
        where: {
          order_item: {
            order_id: order.id,
          },
        },
      });

      if (warrantyUnits.length > 0) {
        const status = returnStatuses[Math.floor(Math.random() * returnStatuses.length)];
        const returnDate = new Date(order.delivered_date!.getTime() + Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000);
        
        const reasons = [
          'Sản phẩm bị lỗi kỹ thuật',
          'Không đúng model đã đặt',
          'Bị hư hỏng trong quá trình vận chuyển',
          'Sản phẩm không hoạt động',
          'Khách hàng đổi ý không muốn mua',
          'Sản phẩm có tiếng ồn bất thường',
          'Màn hình bị sọc, không hiển thị',
          'Không làm lạnh được',
          'Nút bấm không hoạt động',
          'Rò rỉ nước, gas lạnh'
        ];

        const returnRequest = await prisma.returnRequest.create({
          data: {
            order_id: order.id,
            warranty_unit_id: warrantyUnits[Math.floor(Math.random() * warrantyUnits.length)].id,
            reason: reasons[Math.floor(Math.random() * reasons.length)],
            images: [
              '/uploads/return-sample-1.jpg', 
              '/uploads/return-sample-2.jpg',
              ...(Math.random() > 0.5 ? ['/uploads/return-sample-3.jpg'] : [])
            ],
            status: status as any,
            admin_note: status !== 'PENDING' ? (
              status === 'APPROVED' ? 'Đã kiểm tra, chấp nhận đổi trả theo chính sách bảo hành' :
              status === 'REJECTED' ? 'Không đủ điều kiện bảo hành - hư hỏng do người dùng' :
              'Đã hoàn thành thay thế sản phẩm mới cho khách hàng'
            ) : null,
            created_at: returnDate,
            updated_at: status !== 'PENDING' ? new Date(returnDate.getTime() + Math.floor(Math.random() * 5) * 24 * 60 * 60 * 1000) : returnDate,
          },
        });

        // Add event logs for return requests
        await prisma.eventLog.create({
          data: {
            order: { connect: { id: order.id } },
            return_request: { connect: { id: returnRequest.id } },
            event_type: 'RETURN_CREATED',
            metadata: { reason: returnRequest.reason },
            created_at: returnDate,
          },
        });

        if (status !== 'PENDING') {
          await prisma.eventLog.create({
            data: {
              order: { connect: { id: order.id } },
              return_request: { connect: { id: returnRequest.id } },
              event_type: `RETURN_${status}`,
              metadata: { status: status, action: status === 'APPROVED' ? 'chấp nhận' : status === 'REJECTED' ? 'từ chối' : 'hoàn thành' },
              created_at: new Date(returnDate.getTime() + Math.floor(Math.random() * 3) * 24 * 60 * 60 * 1000),
            },
          });
        }
      }
    }
    console.log(`✅ Created ${returnCount} return requests with event logs`);
  }

  // 6. Create comprehensive Audit Logs for product changes (50 entries)
  const fieldChanges = [
    { field: 'price_sale', old_value: 15000000, new_value: 13500000, description: 'Cập nhật giá bán' },
    { field: 'price_original', old_value: 18000000, new_value: 16000000, description: 'Cập nhật giá gốc' },
    { field: 'discount_percent', old_value: 0, new_value: 15, description: 'Thêm khuyến mãi' },
    { field: 'discount_percent', old_value: 10, new_value: 0, description: 'Kết thúc khuyến mãi' },
    { field: 'stock_quantity', old_value: 5, new_value: 25, description: 'Nhập kho' },
    { field: 'stock_quantity', old_value: 15, new_value: 8, description: 'Bán hàng' },
    { field: 'is_active', old_value: true, new_value: false, description: 'Tạm ngừng bán' },
    { field: 'is_active', old_value: false, new_value: true, description: 'Mở lại bán' },
    { field: 'warranty_months', old_value: 12, new_value: 24, description: 'Nâng cấp bảo hành' },
    { field: 'description', old_value: 'Mô tả cũ', new_value: 'Mô tả mới với thêm thông tin', description: 'Cập nhật mô tả' },
  ];
  
  for (let i = 0; i < 50; i++) {
    const product = products[Math.floor(Math.random() * products.length)];
    const change = fieldChanges[Math.floor(Math.random() * fieldChanges.length)];
    const auditDate = new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000);
    
    const beforeJson = { [change.field]: change.old_value };
    const afterJson = { [change.field]: change.new_value };
    
    await prisma.auditLog.create({
      data: {
        product: { connect: { id: product.id } },
        user: { connect: { id: [adminUser.id, salesUser.id, techUser.id][Math.floor(Math.random() * 3)] } },
        action: 'UPDATE',
        before_json: beforeJson,
        after_json: afterJson,
        changed_fields: [change.field],
        created_at: auditDate,
      },
    });
  }
  
  console.log('✅ Created 50 comprehensive audit log entries');

  // 7. Add some Event Logs for system events
  const systemEvents = [
    'SYSTEM_BACKUP',
    'SYSTEM_MAINTENANCE', 
    'PRODUCT_IMPORT',
    'PROMOTION_STARTED',
    'PROMOTION_ENDED'
  ];

  for (let i = 0; i < 20; i++) {
    const eventDate = new Date(Date.now() - Math.floor(Math.random() * 60) * 24 * 60 * 60 * 1000);
    const eventType = systemEvents[Math.floor(Math.random() * systemEvents.length)];
    
    await prisma.eventLog.create({
      data: {
        event_type: eventType,
        metadata: { system_event: true, description: `${eventType.replace('_', ' ').toLowerCase()}` },
        created_at: eventDate,
      },
    });
  }

  console.log('✅ Created 20 system event logs');

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
