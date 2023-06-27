import { APIGatewayProxyResult } from 'aws-lambda';
import { PublishCommand } from '@aws-sdk/client-sns'
import { createProduct } from './createProduct'; 
import snsCleint from '../lib/sns'
import { Product } from '../models/Product';

export async function  catalogBatchProcess(event: any): Promise<any> {
  try {
    console.log('sqs event', event)
    for (const record of event.Records) {
      const newProductResponse = await createProduct(JSON.parse(record.body));
      const newProductData = JSON.parse(newProductResponse.body);
      console.log(newProductData);

      await snsCleint.send(
        new PublishCommand({
          Subject: 'New files added to Catalog',
          Message: JSON.stringify(newProductData),
          TopicArn: process.env.IMPORT_PRODUCT_TOPIC_ARN,
          MessageAttributes: {
            count: {
              DataType: 'Number',
              StringValue: newProductData.count
            }
          }
        }

        )
      )
    }
    return {
      statusCode: 200,
      body: JSON.stringify(event.Records),
    };
  } catch (error) {
    console.log(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error' }),
    };
  }
}