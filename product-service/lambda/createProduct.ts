import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { Client } from 'pg';

export async function createProduct(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const client = new Client({
      user: process.env.PG_DB_USER || '',
      host: process.env.PG_DB_HOST || '',
      database: process.env.PG_DB_DATABASE || '',
      password: process.env.PG_DB_PASSWORD || '',
      port: process.env.PG_DB_PORT ? parseInt(process.env.PG_DB_PORT) : 5432,
    });
    await client.connect();

    const { title, description, price, count } = JSON.parse(event.body || '');

    if (!title || !description || !price || !count) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid product data' })
      };
    }

    const query = `
      INSERT INTO products (title, description, price)
      VALUES ($1, $2, $3)
      RETURNING id
    `;
    const result = await client.query(query, [title, description, price]);
    const productId = result.rows[0].id;

    const stockQuery = `
      INSERT INTO stocks (product_id, count)
      VALUES ($1, $2)
    `;
    await client.query(stockQuery, [productId, count]);

    await client.end();

    return {
      statusCode: 201,
      body: JSON.stringify({ message: 'Product created successfully' })
    };
  } catch (error) {
    console.error('Error creating product:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error' })
    };
  }
}