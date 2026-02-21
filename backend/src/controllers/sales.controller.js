const pool = require("../config/db");
const { v4: uuidv4 } = require("uuid");

exports.createSale = async (req, res) => {
  const { business_id, user_id } = req.user;
  const { customer_id, items, payment_status } = req.body; // items: [{product_id, quantity}]

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    let totalAmount = 0;
    let totalProfit = 0;
    const saleId = uuidv4();

    // 1. Process each item
    for (const item of items) {
      // Get product info with row lock for stock validation (FOR UPDATE)
      const productRes = await client.query(
        "SELECT * FROM products WHERE id = $1 AND business_id = $2 FOR UPDATE",
        [item.product_id, business_id],
      );

      if (productRes.rows.length === 0) {
        throw new Error(`Product ${item.product_id} not found`);
      }

      const product = productRes.rows[0];

      // 2. Stock Validation
      if (product.stock_quantity < item.quantity) {
        throw new Error(
          `Insufficient stock for ${product.name}. Available: ${product.stock_quantity}`,
        );
      }

      const itemTotal = Number(product.sale_price) * item.quantity;
      const itemProfit =
        (Number(product.sale_price) - Number(product.cost_price)) *
        item.quantity;

      totalAmount += itemTotal;
      totalProfit += itemProfit;

      // 3. Deduct Stock
      await client.query(
        "UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2",
        [item.quantity, item.product_id],
      );

      // 4. Record Sale Item
      await client.query(
        `INSERT INTO sale_items (id, sale_id, product_id, quantity, unit_price, unit_cost, profit)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          uuidv4(),
          saleId,
          item.product_id,
          item.quantity,
          product.sale_price,
          product.cost_price,
          itemProfit,
        ],
      );
    }

    // 5. Record Sale
    const saleRes = await client.query(
      `INSERT INTO sales (id, business_id, user_id, customer_id, total_amount, total_profit, payment_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        saleId,
        business_id,
        user_id,
        customer_id || null,
        totalAmount,
        totalProfit,
        payment_status || "paid",
      ],
    );

    // 6. Handle Credit Customer Balance
    if (
      customer_id &&
      (payment_status === "credit" || payment_status === "partial")
    ) {
      const unpaidAmount = totalAmount; // For simplicity, assuming full credit if 'credit'
      await client.query(
        "UPDATE customers SET balance = balance + $1 WHERE id = $2 AND business_id = $3",
        [unpaidAmount, customer_id, business_id],
      );
    }

    await client.query("COMMIT");
    res.status(201).json(saleRes.rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Sale transaction failed:", err);
    res.status(400).json({ error: err.message || "Sale processing failed" });
  } finally {
    client.release();
  }
};

exports.getSales = async (req, res) => {
  const { business_id } = req.user;

  try {
    const result = await pool.query(
      `SELECT s.*, c.name as customer_name 
       FROM sales s 
       LEFT JOIN customers c ON s.customer_id = c.id 
       WHERE s.business_id = $1 
       ORDER BY s.created_at DESC`,
      [business_id],
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch sales" });
  }
};
