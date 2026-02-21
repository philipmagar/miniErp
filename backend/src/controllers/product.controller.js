const pool = require("../config/db");
const { v4: uuidv4 } = require("uuid");

exports.getProducts = async (req, res) => {
  const { business_id } = req.user; // From auth middleware

  try {
    const result = await pool.query(
      "SELECT * FROM products WHERE business_id = $1 ORDER BY created_at DESC",
      [business_id],
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch products" });
  }
};

exports.addProduct = async (req, res) => {
  const { business_id } = req.user;
  const {
    name,
    description,
    category,
    cost_price,
    sale_price,
    stock_quantity,
  } = req.body;

  try {
    const id = uuidv4();
    const result = await pool.query(
      `INSERT INTO products (id, business_id, name, description, category, cost_price, sale_price, stock_quantity)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        id,
        business_id,
        name,
        description,
        category,
        cost_price,
        sale_price,
        stock_quantity,
      ],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to add product" });
  }
};

exports.updateStock = async (req, res) => {
  const { business_id } = req.user;
  const { id } = req.params;
  const { stock_quantity } = req.body;

  try {
    const result = await pool.query(
      "UPDATE products SET stock_quantity = $1 WHERE id = $2 AND business_id = $3 RETURNING *",
      [stock_quantity, id, business_id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to update stock" });
  }
};
