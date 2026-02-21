const pool = require("../config/db");
const { v4: uuidv4 } = require("uuid");

exports.getCustomers = async (req, res) => {
  const { business_id } = req.user;

  try {
    const result = await pool.query(
      "SELECT * FROM customers WHERE business_id = $1 ORDER BY name",
      [business_id],
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch customers" });
  }
};

exports.addCustomer = async (req, res) => {
  const { business_id } = req.user;
  const { name, phone, email, credit_limit } = req.body;

  try {
    const id = uuidv4();
    const result = await pool.query(
      `INSERT INTO customers (id, business_id, name, phone, email, credit_limit, balance)
       VALUES ($1, $2, $3, $4, $5, $6, 0) RETURNING *`,
      [id, business_id, name, phone, email, credit_limit],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to add customer" });
  }
};

exports.updateBalance = async (req, res) => {
  const { business_id } = req.user;
  const { id } = req.params;
  const { amount } = req.body; // Positive for credit, negative for payment

  try {
    const result = await pool.query(
      "UPDATE customers SET balance = balance + $1 WHERE id = $2 AND business_id = $3 RETURNING *",
      [amount, id, business_id],
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to update balance" });
  }
};
