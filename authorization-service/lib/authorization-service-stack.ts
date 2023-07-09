import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import * as dotenv from 'dotenv';
import * as path from 'path';
// import * as sqs from 'aws-cdk-lib/aws-sqs';
dotenv.config();

export class AuthorizationServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const shared: NodejsFunctionProps = {
      runtime: lambda.Runtime.NODEJS_14_X,
      environment: {
        MY_GITHUB_ACCOUNT_LOGIN: process.env.MY_GITHUB_ACCOUNT_LOGIN || '',
        TEST_PASSWORD: process.env.TEST_PASSWORD || '',
      },
    };

    const basicAuthorizer = new NodejsFunction(this, 'BasicAuthorizer', {
      ...shared,
      functionName: 'basicAuthorizer',
      entry: path.join(__dirname,'../lambda/basicAuthorizer.ts'),
      handler: 'basicAuthorizer'
    })

  }
}
