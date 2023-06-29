import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apiGateway from '@aws-cdk/aws-apigatewayv2-alpha';
import { HttpLambdaIntegration } from '@aws-cdk/aws-apigatewayv2-integrations-alpha';
import * as path from 'path';
import { Construct } from 'constructs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as dotenv from 'dotenv';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
dotenv.config();

export class ProductServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const importProductTopic = new sns.Topic(this, 'ImportProductTopic', {
      topicName: 'import-product-topic'
    })

    const importQueue = new sqs.Queue(this, 'ImportQueue', {
      queueName: 'import-file-queue'
    })

  
    const filterBigStock = sns.SubscriptionFilter.numericFilter({greaterThan: 10});
    const filterSmallStock = sns.SubscriptionFilter.numericFilter({lessThanOrEqualTo: 10});

    new sns.Subscription(this, 'BigStockSubscription', {
      endpoint: process.env.BIG_STOCK_EMAIL!,
      protocol: sns.SubscriptionProtocol.EMAIL ,
      topic: importProductTopic,
      filterPolicy: { count : filterBigStock }
    })

    new sns.Subscription(this, 'SmallStockSubscription', {
      endpoint: process.env.SMALL_STOCK_EMAIL!,
      protocol: sns.SubscriptionProtocol.EMAIL ,
      topic: importProductTopic,
      filterPolicy: { count : filterSmallStock }
    })

    const shared: NodejsFunctionProps = {
      runtime: lambda.Runtime.NODEJS_14_X,
      environment: {
        PG_DB_USER: process.env.PG_DB_USER || '',
        PG_DB_HOST: process.env.PG_DB_HOST || '',
        PG_DB_DATABASE: process.env.PG_DB_DATABASE || '',
        PG_DB_PASSWORD: process.env.PG_DB_PASSWORD || '',
        PG_DB_PORT: process.env.PG_DB_PORT || '5432',
        IMPORT_PRODUCT_TOPIC_ARN: importProductTopic.topicArn
      },
    };

    const catalogBatchProcess = new NodejsFunction(this, 'CatalogBatchProcess', {
      ...shared,
      functionName: 'catalogBatchProcess',
      entry: path.join(__dirname,'../lambda/catalogBatchProcess.ts'),
      handler: 'catalogBatchProcess'
    })

    importProductTopic.grantPublish(catalogBatchProcess);
    catalogBatchProcess.addEventSource(new SqsEventSource(importQueue, { batchSize: 5 }));

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

    const createProduct = new NodejsFunction(this, 'CreateProduct', {
      ...shared,
      functionName: 'createProduct',
      entry: path.join(__dirname, '../lambda/createProduct.ts'),
      handler: 'createProduct'
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
    
    api.addRoutes({
      integration: new HttpLambdaIntegration('CreateProductIntegration', createProduct),
      path: '/products',
      methods: [apiGateway.HttpMethod.POST],
    });
  }
}