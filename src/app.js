const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/products", require("./routes/product.routes"));
app.use("/api/sales", require("./routes/sales.routes"));
app.use("/api/customers", require("./routes/customer.routes"));
app.use("/api/analytics", require("./routes/analytics.routes"));

app.get("/", (req, res) => {
  res.send("SME Dashboard API running...");
});

module.exports = app;
