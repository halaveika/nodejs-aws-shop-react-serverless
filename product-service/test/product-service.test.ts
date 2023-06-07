import { getProductsById } from '../lambda/getProductsById';
import { getProductsList } from '../lambda/getProductsList';
import { products } from '../mocks/produts';

describe('getProductsById', () => {
  it('should return response with the product', async () => {
    const event: any = {
      pathParameters: {
        productId: '7567ec4b-b10c-48c5-9345-fc73c48a80aa'
      }
    };

    const expectedResponse = {
      statusCode: 200,
      body: JSON.stringify(products[0])
    };

    const response = await getProductsById(event);
    expect(response).toEqual(expectedResponse);
  });

  it('should return 404 when the product does not exist', async () => {
    const event: any = {
      pathParameters: {
        productId: 'test'
      }
    };

    const expectedResponse = {
      statusCode: 404,
      body: JSON.stringify({ message: 'Product not found' })
    };

    const response = await getProductsById(event);
    expect(response).toEqual(expectedResponse);
  });

  it('should return 500 error ', async () => {
    const event: any = null;

    const response = await getProductsById(event);
    expect(response.statusCode).toBe(500);
  });
});

describe('getProductsList', () => {
  it('should return response with the products', async () => {
    const expectedResponse = {
      statusCode: 200,
      body: JSON.stringify(products)
    };

    const response = await getProductsList();
    expect(response).toMatchObject(expectedResponse);
  });
});