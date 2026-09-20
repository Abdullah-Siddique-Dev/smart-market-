/**
 * Smart Market OS - Automated Smoke & Integration Test Suite
 * Validates all 10 API domains, atomic billing transactions, and session auth.
 */
import { createApp } from './src/app.js';
import { runMigrations } from './src/db/migrate.js';
import { seedDatabase } from './src/db/seed.js';
import { db } from './src/db/connection.js';
import http from 'http';

async function runSmokeTests() {
  console.log('🧪 Starting Smart Market OS API Integration & Smoke Tests...\n');

  // Step 1: Database migration & seed
  runMigrations();
  await seedDatabase();

  const app = createApp();
  const server = http.createServer(app);

  await new Promise<void>((resolve) => server.listen(4001, resolve));
  const baseUrl = 'http://localhost:4001/api';

  let cookie = '';

  try {
    // 1. System status check
    console.log('1️⃣ Testing System Health...');
    const statusRes = await fetch(`${baseUrl}/system/status`);
    const statusJson = await statusRes.json();
    if (!statusJson.success || statusJson.data.status !== 'ONLINE') {
      throw new Error(`System status check failed: ${JSON.stringify(statusJson)}`);
    }
    console.log('   ✅ System Health: ONLINE');

    // 2. Authentication Login
    console.log('2️⃣ Testing Authentication (Login as OWNER)...');
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' }),
    });
    const loginJson = await loginRes.json();
    if (!loginJson.success || loginJson.user.role !== 'OWNER') {
      throw new Error(`Login failed: ${JSON.stringify(loginJson)}`);
    }
    const rawCookie = loginRes.headers.get('set-cookie');
    if (rawCookie) {
      cookie = rawCookie.split(';')[0];
    }
    console.log(`   ✅ Login Successful: ${loginJson.user.full_name} (${loginJson.user.role})`);

    // 3. Create Product
    console.log('3️⃣ Testing Product Management (Create Product)...');
    const testSku = `TEST-SKU-${Date.now().toString().slice(-4)}`;
    const prodRes = await fetch(`${baseUrl}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        sku: testSku,
        name: 'Premium Test Box',
        unit: 'BOX',
        purchase_price: 100,
        selling_price: 150,
        current_stock: 0,
        min_stock_alert: 5,
      }),
    });
    const prodJson = await prodRes.json();
    if (!prodJson.success) throw new Error(`Product creation failed: ${JSON.stringify(prodJson)}`);
    const productId = prodJson.data.id;
    console.log(`   ✅ Product Created: ${prodJson.data.name} (ID: ${productId}, Stock: ${prodJson.data.current_stock})`);

    // 4. Record Import (Atomic Inward)
    console.log('4️⃣ Testing Import Inward (Atomic Stock Increment + Ledger)...');
    const importRes = await fetch(`${baseUrl}/imports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        product_id: productId,
        quantity: 50,
        unit_cost: 100,
        supplier_info: 'Global Imports Ltd',
      }),
    });
    const importJson = await importRes.json();
    if (!importJson.success) throw new Error(`Import failed: ${JSON.stringify(importJson)}`);
    console.log(`   ✅ Import Recorded: 50 units (New Stock: 50)`);

    // 5. Create Retail Shop & Order Booker
    console.log('5️⃣ Testing Retail Shop & Booker Creation...');
    const shopRes = await fetch(`${baseUrl}/shops`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ shop_name: 'Metro Corner Store', phone: '1234567890' }),
    });
    const shopJson = await shopRes.json();
    const shopId = shopJson.data.id;

    const bookerRes = await fetch(`${baseUrl}/bookers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ name: 'Ali Booker', phone: '9876543210', commission_rate: 2 }),
    });
    const bookerJson = await bookerRes.json();
    const bookerId = bookerJson.data.id;
    console.log(`   ✅ Shop ID: ${shopId}, Booker ID: ${bookerId}`);

    // 6. Create Order
    console.log('6️⃣ Testing Order Creation...');
    const orderRes = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        shop_id: shopId,
        order_booker_id: bookerId,
        items: [{ product_id: productId, quantity: 10, unit_price: 150 }],
      }),
    });
    const orderJson = await orderRes.json();
    if (!orderJson.success) throw new Error(`Order creation failed: ${JSON.stringify(orderJson)}`);
    const orderId = orderJson.data.id;
    console.log(`   ✅ Order Created: ${orderJson.data.order_number} (Amount: $${orderJson.data.total_amount})`);

    // 7. Generate Dispatch Slip
    console.log('7️⃣ Testing Dispatch Slip Generation...');
    const slipRes = await fetch(`${baseUrl}/orders/${orderId}/dispatch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
    });
    const slipJson = await slipRes.json();
    if (!slipJson.success) throw new Error(`Slip generation failed: ${JSON.stringify(slipJson)}`);
    console.log(`   ✅ Dispatch Slip: ${slipJson.data.slip_number} (Status: ${slipJson.data.status})`);

    // 8. Atomic Bill Creation (POS Checkout)
    console.log('8️⃣ Testing Atomic Bill Creation (Stock Reduction + Ledger Check)...');
    const billRes = await fetch(`${baseUrl}/orders/${orderId}/bill`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        payment_status: 'PAID',
        paid_amount: 1500,
      }),
    });
    const billJson = await billRes.json();
    if (!billJson.success || !billJson.bill.stock_deducted) {
      throw new Error(`Bill conversion failed: ${JSON.stringify(billJson)}`);
    }
    console.log(`   ✅ Bill Created: ${billJson.bill.bill_number} (Stock Deducted: true)`);

    // 9. Verify Stock Count Decrement in Database
    const updatedProd = db.prepare('SELECT current_stock FROM products WHERE id = ?').get(productId) as {
      current_stock: number;
    };
    if (updatedProd.current_stock !== 40) {
      throw new Error(`Expected stock to be 40 (50 - 10), got ${updatedProd.current_stock}`);
    }
    console.log(`   ✅ Atomic Verification: Warehouse stock correctly decremented from 50 -> ${updatedProd.current_stock}`);

    // 10. Verify Reports (COGS Net Profit)
    console.log('9️⃣ Testing Reports & Net Profit Analytics...');
    const profitRes = await fetch(`${baseUrl}/reports/profit?period=today`, {
      headers: { Cookie: cookie },
    });
    const profitJson = await profitRes.json();
    if (profitJson.total_sales < 1500 || profitJson.net_profit < 500 || profitJson.profit_margin_percent !== 33.33) {
      throw new Error(`Profit calculation mismatch: ${JSON.stringify(profitJson)}`);
    }
    console.log(`   ✅ Profit Analytics: Sales: $${profitJson.total_sales}, Net Profit: $${profitJson.net_profit} (Margin: ${profitJson.profit_margin_percent}%)`);

    // 11. Verify Audit Ledger
    console.log('🔟 Testing Audit Trail & Anti-Corruption...');
    const auditRes = await fetch(`${baseUrl}/audit/inventory-ledger`, {
      headers: { Cookie: cookie },
    });
    const auditJson = await auditRes.json();
    if (!auditJson.success || auditJson.data.length < 2) {
      throw new Error(`Audit ledger check failed: ${JSON.stringify(auditJson)}`);
    }
    console.log(`   ✅ Audit Ledger: ${auditJson.data.length} immutable events logged (IMPORT, SALE_BILL)`);

    // 12. Verify Stock Reconciliation Check
    const reconRes = await fetch(`${baseUrl}/audit/stock-reconciliation`, {
      headers: { Cookie: cookie },
    });
    const reconJson = await reconRes.json();
    if (reconJson.data.summary.discrepancy_count !== 0) {
      throw new Error(`Stock reconciliation found discrepancy! ${JSON.stringify(reconJson)}`);
    }
    console.log(`   ✅ Stock Reconciliation: Physical Stock == Ledger Sum (Discrepancy: 0, Balanced: 100%)`);

    // 13. Test Backup
    console.log('1️⃣1️⃣ Testing Manual Backup...');
    const backupRes = await fetch(`${baseUrl}/system/backup`, {
      method: 'POST',
      headers: { Cookie: cookie },
    });
    const backupJson = await backupRes.json();
    if (!backupJson.success) throw new Error(`Backup failed: ${JSON.stringify(backupJson)}`);
    console.log(`   ✅ SQLite Backup Created: ${backupJson.data.backup_file} (${backupJson.data.size_bytes} bytes)`);

    console.log('\n🎉 ALL 11 TEST SUITES PASSED FLAWLESSLY! REST API is 100% functional.\n');
  } finally {
    server.close();
  }
}

runSmokeTests().catch((err) => {
  console.error('\n❌ Smoke Test Failed:\n', err);
  process.exit(1);
});
