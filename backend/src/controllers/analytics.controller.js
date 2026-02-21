const pool = require("../config/db");

exports.getBasicAnalytics = async (req, res) => {
  const { business_id } = req.user;

  try {
    // 1. Total Sales and Total Profit
    const summaryResult = await pool.query(
      `SELECT 
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COALESCE(SUM(total_profit), 0) as total_profit,
        COUNT(id) as total_sales_count
       FROM sales 
       WHERE business_id = $1`,
      [business_id],
    );

    // 2. Low Stock Alert
    const stockAlertResult = await pool.query(
      `SELECT COUNT(*) as low_stock_count 
       FROM products 
       WHERE business_id = $1 AND stock_quantity <= 5`,
      [business_id],
    );

    // 3. Outstanding Credit
    const creditResult = await pool.query(
      `SELECT COALESCE(SUM(balance), 0) as total_outstanding 
       FROM customers 
       WHERE business_id = $1`,
      [business_id],
    );

    // 4. Monthly Sales Data (Last 6 months)
    const monthlySalesResult = await pool.query(
      `SELECT 
        TO_CHAR(created_at, 'Mon') as month,
        SUM(total_amount) as revenue,
        SUM(total_profit) as profit
       FROM sales
       WHERE business_id = $1 AND created_at > NOW() - INTERVAL '6 months'
       GROUP BY TO_CHAR(created_at, 'Mon'), DATE_TRUNC('month', created_at)
       ORDER BY DATE_TRUNC('month', created_at)`,
      [business_id],
    );

    res.json({
      summary: summaryResult.rows[0],
      lowStockCount: stockAlertResult.rows[0].low_stock_count,
      totalOutstanding: creditResult.rows[0].total_outstanding,
      monthlyChart: monthlySalesResult.rows[0] ? monthlySalesResult.rows : [],
    });
  } catch (err) {
    console.error("Analytics error:", err);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
};
