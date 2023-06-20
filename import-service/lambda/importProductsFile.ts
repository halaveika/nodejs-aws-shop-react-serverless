import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export async function importProductsFile(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const fileName = event.queryStringParameters?.name;
    console.log('importProductsFile input: ',JSON.stringify(event));
    if (!fileName) {
      return {
        statusCode: 400,
        body: JSON.stringify({errorMessage:'Please provide a file name.'}),
      };
    }
    const s3 = new S3Client({ region: process.env.S3_BUCKET_IMPORT_REGION });
    const params = {
      Bucket: process.env.S3_BUCKET_IMPORT_NAME,
      Key: `uploaded/${fileName}`,
      ContentType: 'text/csv',
    };
    const command = new PutObjectCommand(params);
    const url = await getSignedUrl(s3, command, { expiresIn: 60 });
    return {
      statusCode: 200,
      body: JSON.stringify(url),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error' })
    };
  }
}