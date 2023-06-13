import { APIGatewayProxyResult } from 'aws-lambda';
import { Client } from 'pg';

export async function getProductsList(): Promise<APIGatewayProxyResult> {
  try {
    const client = new Client({
      user: process.env.PG_DB_USER || '',
      host: process.env.PG_DB_HOST || '',
      database: process.env.PG_DB_DATABASE || '',
      password: process.env.PG_DB_PASSWORD || '',
      port: process.env.PG_DB_PORT ? parseInt(process.env.PG_DB_PORT) : 5432,
    });
    await client.connect();

    const query = `
      SELECT p.id, p.title, p.description, p.price, s.count
      FROM products p
      INNER JOIN stocks s ON p.id = s.product_id
    `;

    const result = await client.query(query);

    const products = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      price: row.price,
      count: row.count
    }));

    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify(products)
    };
  } catch (error) {
    console.error('Error retrieving products:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error' })
    };
  }
}