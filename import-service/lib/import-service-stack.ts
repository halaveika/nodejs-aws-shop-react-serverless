import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apiGateway from '@aws-cdk/aws-apigatewayv2-alpha';
import { HttpLambdaIntegration } from '@aws-cdk/aws-apigatewayv2-integrations-alpha';
import * as s3Notifications from 'aws-cdk-lib/aws-s3-notifications';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Role } from 'aws-cdk-lib/aws-iam';
import { HttpLambdaAuthorizer, HttpLambdaResponseType } from '@aws-cdk/aws-apigatewayv2-authorizers-alpha';
import * as path from 'path';
import { Construct } from 'constructs';
import * as dotenv from 'dotenv';
dotenv.config();

export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const lambdaRoleArn = process.env.S3_BUCKER_LAMBDA_ROLE || '';
    const queue = sqs.Queue.fromQueueArn(this, 'ImportFileQueue', process.env.SQS_QUEUE_ARN || '' );
    const shared: NodejsFunctionProps = {
      runtime: lambda.Runtime.NODEJS_14_X,
      environment: {
        S3_BUCKET_IMPORT_NAME: process.env.S3_BUCKET_IMPORT_NAME || '',
        S3_BUCKET_IMPORT_REGION: process.env.S3_BUCKET_IMPORT_REGION || '',
        SQS_QUEUE_URL: queue.queueUrl,
        SQS_REGION: queue.env.region,
      },
      role: Role.fromRoleArn(this, 'LambdaRole', lambdaRoleArn)
    };

    const bucket = s3.Bucket.fromBucketName(this, 'ImportedBucket', process.env.S3_BUCKET_IMPORT_NAME || '');

    const importProductsFile = new NodejsFunction(this, 'importProductsFile', {
      ...shared,
      functionName: 'importProductsFile',
      entry: path.join(__dirname,'../lambda/importProductsFile.ts'),
      handler: 'importProductsFile',
    });

    bucket.grantReadWrite(importProductsFile);

    const importFileParser = new NodejsFunction(this, 'importFileParser', {
      ...shared,
      functionName: 'importFileParser',
      entry: path.join(__dirname,'../lambda/importFileParser.ts'),
      handler: 'importFileParser',
    });

    bucket.grantReadWrite(importFileParser);
    queue.grantSendMessages(importFileParser);

    bucket.addEventNotification(s3.EventType.OBJECT_CREATED_PUT, new s3Notifications.LambdaDestination(importFileParser), { prefix: 'uploaded/' });

    const api = new apiGateway.HttpApi(this, 'ImportApi', {
      corsPreflight: {
        allowHeaders: ['*'],
        allowOrigins: ['*'],
        allowMethods: [apiGateway.CorsHttpMethod.ANY],
      },
    });

    const basicAuthorizer  = lambda.Function.fromFunctionArn(this, 'basicAuthorizer', process.env.BASIC_AUTHORIZER_LAMBDA_ARN || '');
    const authorizer = new HttpLambdaAuthorizer('Authorizer', basicAuthorizer, {
      responseTypes: [HttpLambdaResponseType.SIMPLE],
    });

    api.addRoutes({
      integration: new HttpLambdaIntegration('GetImportProductsFile', importProductsFile),
      path: '/import',
      methods: [apiGateway.HttpMethod.GET],
      authorizer,
    });
  }
}
