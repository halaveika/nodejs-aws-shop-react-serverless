import { APIGatewayProxyResult } from 'aws-lambda';

export async function basicAuthorizer(event: any): Promise<APIGatewayProxyResult> {
  console.log('basicAuthorizer input: ',JSON.stringify(event));
  const { authorizationToken } = event;
  try {
    if (!authorizationToken) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Authorization header is missing' }),
      };
    }

    const [username, password] = Buffer.from(authorizationToken, 'base64')
    .toString('utf-8')
    .split(':');

    const expectedPassword = process.env.TEST_PASSWORD;
    if (!expectedPassword || password !== expectedPassword) {
      return {
        statusCode: 403,
        body: JSON.stringify({ message: 'Access denied' }),
      };
    }

    const expectedUsername = process.env.YOUR_GITHUB_ACCOUNT_LOGIN;
    if (!expectedUsername || username !== expectedUsername) {
      return {
        statusCode: 403,
        body: JSON.stringify({ message: 'Invalid username' }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Authorization succeeded' }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error' }),
    };
  }
}

