import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { Client } from 'pg';
import { v4 as uuidv4 } from 'uuid';

export async function createProduct(event: APIGatewayProxyEvent) {
  try {
    console.log('Incoming createProduct request:', JSON.stringify(event));

    const client = new Client({
      user: process.env.PG_DB_USER || '',
      host: process.env.PG_DB_HOST || '',
      database: process.env.PG_DB_DATABASE || '',
      password: process.env.PG_DB_PASSWORD || '',
      port: process.env.PG_DB_PORT ? parseInt(process.env.PG_DB_PORT) : 5432,
    });
    await client.connect();

    // Start the transaction
    await client.query('BEGIN');

    const { title, description, price, count } = JSON.parse(event.body || '');
    console.log('New product title:', title);
    console.log('New product description:', description);
    console.log('New product price:', price);
    console.log('New product count:', count);

    if (!title || !description || !price || !count) {
      await client.query('ROLLBACK');
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid product data' })
      };
    }

    const productId = uuidv4();

    try {
      const productQuery = `
        INSERT INTO products (id, title, description, price)
        VALUES ($1, $2, $3, $4)
      `;
      await client.query(productQuery, [productId, title, description, price]);

      const stockQuery = `
        INSERT INTO stocks (product_id, count)
        VALUES ((SELECT id FROM products WHERE id = $1), $2)
      `;
      await client.query(stockQuery, [productId, count]);

      // Commit the transaction
      await client.query('COMMIT');

      const recordedData = {
        id: productId,
        title,
        description,
        price,
        count
      };

      return {
        statusCode: 201,
        body: JSON.stringify({...recordedData })
      };
    } catch (error) {
      // Rollback the transaction
      await client.query('ROLLBACK');

      console.error('Error creating product:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ message: 'Internal Server Error' })
      };
    } finally {
      await client.end();
    }
  } catch (error) {
    console.error('Error connecting to the database:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error' })
    };
  }
}