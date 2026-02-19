const pool = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");

exports.register = async (req, res) => {
  const { name, email, password, businessName } = req.body;

  try {
    const businessId = uuidv4();
    const userId = uuidv4();

    await pool.query(
      "INSERT INTO businesses (id, name) VALUES ($1, $2)",
      [businessId, businessName]
    );

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      "INSERT INTO users (id, name, email, password, business_id) VALUES ($1,$2,$3,$4,$5)",
      [userId, name, email, hashedPassword, businessId]
    );

    res.status(201).json({ message: "Registered successfully" });
  } catch (err) {
    res.status(500).json({ error: "Registration failed" });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE email=$1",
      [email]
    );

    if (result.rows.length === 0)
      return res.status(400).json({ error: "User not found" });

    const user = result.rows[0];

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword)
      return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      {
        user_id: user.id,
        business_id: user.business_id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
};
