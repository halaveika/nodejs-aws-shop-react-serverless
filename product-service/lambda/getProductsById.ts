import { products } from '../mocks/products';
import { APIGatewayProxyEvent } from 'aws-lambda';

export const getProductsById = async (event: APIGatewayProxyEvent) => {
  try {
    console.log(getProductsById.name, JSON.stringify(event));
    const productId = event.pathParameters?.productId;
    const product = getProductById(productId!);
    if (!product) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Product not found' })
      };
    }
    return {
      statusCode: 200,
      body: JSON.stringify(product),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: err }),
    };
  }
}

const getProductById = (id :string) => products.find(product => product.id === id)
