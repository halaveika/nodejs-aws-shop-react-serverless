import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { Client } from 'pg';
import dbconfig from '../config/pg-config';

export async function getProductsById(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const client = new Client(dbconfig);
    await client.connect();

    const productId = event.pathParameters?.productId;

    if (!productId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid product ID' })
      };
    }

    const query = `
      SELECT p.id, p.title, p.description, p.price, s.count
      FROM products p
      INNER JOIN stocks s ON p.id = s.product_id
      WHERE p.id = $1
    `;

    const result = await client.query(query, [productId]);

    if (result.rows.length === 0) {
      await client.end();
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Product not found' })
      };
    }

    const product = {
      id: result.rows[0].id,
      title: result.rows[0].title,
      description: result.rows[0].description,
      price: result.rows[0].price,
      count: result.rows[0].count
    };

    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify(product)
    };
  } catch (error) {
    console.error('Error retrieving product:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error' })
    };
  }
}