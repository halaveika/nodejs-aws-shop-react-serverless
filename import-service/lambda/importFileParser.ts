import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export async function importFileParser(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'File is parsed' })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error' })
    };
  }
}