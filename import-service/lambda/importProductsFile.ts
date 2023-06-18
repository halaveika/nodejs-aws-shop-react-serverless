import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export async function importProductsFile(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'File is imported' })
    };
  } catch (error) {
    console.error('Error connecting to the database:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error' })
    };
  }
}