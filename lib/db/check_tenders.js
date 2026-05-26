import pg from 'pg';

const client = new pg.Client({
  connectionString: "postgresql://neondb_owner:npg_PVxnNzlO67IM@ep-lucky-cloud-ao5noto4-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
});

async function run() {
  try {
    await client.connect();
    console.log("Connected to Neon DB successfully.");

    // Query tender counts
    const countRes = await client.query("SELECT COUNT(*) FROM tenders");
    console.log("Total Tenders count:", countRes.rows[0].count);

    // Query stats from tenders Table
    const statsRes = await client.query("SELECT SUM(CAST(contract_value AS NUMERIC)) as total_val, COUNT(*) as count FROM tenders WHERE fraud_score >= 40");
    console.log("Fraud sum stats (fraud_score >= 40):", statsRes.rows[0]);

    // Let's print some sample tenders
    const samples = await client.query("SELECT id, tender_id, title, contract_value, fraud_score FROM tenders LIMIT 5");
    console.log("Sample tenders:", samples.rows);

    await client.end();
  } catch (err) {
    console.error("Database query error:", err);
    process.exit(1);
  }
}
run();
