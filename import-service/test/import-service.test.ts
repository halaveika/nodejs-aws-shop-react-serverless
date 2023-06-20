import * as awsMock from 'aws-sdk-mock';
import { importProductsFile } from '../lambda/importProductsFile';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import * as s3RequestPresigner from '@aws-sdk/s3-request-presigner';

const mockEvent: APIGatewayProxyEvent = {
  body: null,
  headers: {},
  multiValueHeaders: {},
  httpMethod: '',
  isBase64Encoded: false,
  path: '',
  pathParameters: null,
  queryStringParameters: null,
  multiValueQueryStringParameters: null,
  requestContext: {} as any,
  resource: '',
  stageVariables: null,
};

jest.mock('@aws-sdk/s3-request-presigner', () => {
  const originalModule = jest.requireActual('@aws-sdk/s3-request-presigner');
  return {
    ...originalModule,
    getSignedUrl: jest.fn(() => Promise.resolve('test')),
  };
});

describe('importProductsFile', () => {
  afterEach(() => {
    awsMock.restore(); 
  });

  it('should return a signed URL when a file name is provided', async () => {
    awsMock.mock('S3', 'getObject', async (params: GetObjectCommand) => {
      return { body: 'test' };
    });
  
    const result: APIGatewayProxyResult = await importProductsFile({ ...mockEvent, queryStringParameters: { name: 'test.csv' } });
  
    expect(result.statusCode).toBe(200);
    expect(result.body).toBeDefined();
  });

  it('should return a 400 status code when no file name is provided', async () => {
    const result: APIGatewayProxyResult = await importProductsFile({ ...mockEvent, queryStringParameters: {} });

    expect(result.statusCode).toBe(400);
    expect(result.body).toBeDefined();
  });

  it('should return a 500 status code when an error occurs', async () => {
    jest.spyOn(s3RequestPresigner, 'getSignedUrl').mockImplementation(()=> {
      throw new Error('Test error')
    }); 
  
    const result: APIGatewayProxyResult = await importProductsFile({ ...mockEvent, queryStringParameters: { name: 'test.csv' } });
  
    expect(result.statusCode).toBe(500);
    expect(result.body).toBeDefined();
  });
});
