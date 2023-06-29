import { createProduct } from '../lambda/createProduct';
import { products } from '../mocks/products';
import { stocks } from '../mocks/stocks';
import { catalogBatchProcess } from '../lambda/catalogBatchProcess';
import snsClient from '../lib/sns';

jest.mock('../lambda/createProduct');
jest.mock('../lib/sns');
const sendSpy = jest.spyOn(snsClient, 'send');

describe('catalogBatchProcess', () => {
  afterEach(() => {
    jest.resetAllMocks();
    sendSpy.mockReset();
  });

  it('should process each record and publish messages to SNS', async () => {
    const event: any = {
      Records: [
        {
          description: "Short Product Description1",
          count: 20,
          price: 24,
          title: "ProductOne",
        },
        {
          description: "Short Product Description7",
          count: 10,
          price: 15,
          title: "ProductTitle",
        },
        {
          description: "Short Product Description2",
          count: 23,
          price: 23,
          title: "Product",
        },
      ],
    };

    const mockCreateProduct = jest.fn().mockResolvedValue({ statusCode: 200, body: JSON.stringify({ ...products[0], ...stocks[0] }) });
    (createProduct as jest.Mock).mockImplementation(mockCreateProduct);

    const expectedResponse = {
      statusCode: 200,
      body: JSON.stringify(event.Records),
    };

    const response = await catalogBatchProcess(event);
    expect(response).toEqual(expectedResponse);
    expect(mockCreateProduct).toHaveBeenCalledTimes(event.Records.length);
    expect(sendSpy).toHaveBeenCalledTimes(event.Records.length);
  });

  it('should return a 500 response when an error occurs', async () => {
    const event: any = {
      Records: [
        { ...products[0], ...stocks[0] },
        { ...products[1], ...stocks[1] },
        { ...products[2], ...stocks[2] },
      ],
    };

    const mockCreateProduct = jest.fn().mockRejectedValue(new Error('Some error'));
    (createProduct as jest.Mock).mockImplementation(mockCreateProduct);

    const response = await catalogBatchProcess(event);

    expect(response.statusCode).toEqual(500);
    expect(response.body).toEqual(JSON.stringify({ message: 'Internal Server Error' }));
  });
});