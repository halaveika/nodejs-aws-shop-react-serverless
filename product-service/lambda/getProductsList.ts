import { products } from '../mocks/produts';

export const getProductsList = async () => {
  try {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(products)
    };
  } catch(err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: err }),
    };
  }
}
