import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apiGateway from '@aws-cdk/aws-apigatewayv2-alpha';
import { HttpLambdaIntegration } from '@aws-cdk/aws-apigatewayv2-integrations-alpha';
import * as path from 'path';
import { Construct } from 'constructs';
import dbconfig from '../config/pg-config';

export class ProductServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const shared: NodejsFunctionProps = {
      runtime: lambda.Runtime.NODEJS_14_X,
      environment: {...dbconfig, port: dbconfig.port.toString(),}
    };

    const getProductsList = new NodejsFunction(this, 'GetProductsList', {
      ...shared,
      functionName: 'getProductsList',
      entry: path.join(__dirname,'../lambda/getProductsList.ts'),
      handler: 'getProductsList'
    });

    const getProductsById = new NodejsFunction(this, 'getProductsById', {
      ...shared,
      functionName: 'getProductsById',
      entry: path.join(__dirname,'../lambda/getProductsById.ts'),
      handler: 'getProductsById'
    });

    const api = new apiGateway.HttpApi(this, 'ProductApi', {
      corsPreflight: {
        allowHeaders: ['*'],
        allowOrigins: ['*'],
        allowMethods: [apiGateway.CorsHttpMethod.ANY],
      },
    });
    

    api.addRoutes({
      integration: new HttpLambdaIntegration('GetProductsListIntegration', getProductsList),
      path: '/products',
      methods: [apiGateway.HttpMethod.GET],
    });

    api.addRoutes({
      integration: new HttpLambdaIntegration('GetProductsByIdIntegration', getProductsById),
      path: '/products/{productId}',
      methods: [apiGateway.HttpMethod.GET],
    });
  }
}