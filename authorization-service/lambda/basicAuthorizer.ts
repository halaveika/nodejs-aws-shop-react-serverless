import { APIGatewayAuthorizerResult } from 'aws-lambda';

export async function basicAuthorizer(event: any): Promise<any> {
  console.log('basicAuthorizer input: ',JSON.stringify(event));
  const { routeArn } = event;
    const authorizationToken = event.headers.authorization;
    if (!event.headers || !event.headers.authorization) {
      return generatePolicy('user', 'Deny' ,routeArn)
    }

    const payload = authorizationToken.split(' ')[1];
    const [username, password] = Buffer.from(payload, 'base64')
    .toString('utf-8')
    .split(':');
    const expectedPassword = process.env.TEST_PASSWORD;
    if (!expectedPassword || password !== expectedPassword) {
      return generatePolicy('user', 'Deny' ,routeArn)
    }

    const expectedUsername = process.env.MY_GITHUB_ACCOUNT_LOGIN;
    if (!expectedUsername || username !== expectedUsername) {
      return generatePolicy('user', 'Deny' ,routeArn)
    }

    return generatePolicy('user', 'Allow' ,routeArn)
}

function generatePolicy(principalId: string, effect: 'Allow' | 'Deny', resource: string): APIGatewayAuthorizerResult {
  const policy: APIGatewayAuthorizerResult = {
    principalId: principalId,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: effect,
          Resource: resource,
        },
      ],
    },
  };

  return policy;
}
