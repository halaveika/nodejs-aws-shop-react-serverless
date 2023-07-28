
import express, { Request, Response, NextFunction } from 'express';
import axios, { AxiosResponse, Method } from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use(async (req: Request, res: Response, next: NextFunction) => {
  const recipientServiceName = req.path.split('/')[1];
  const recipientURL = process.env[recipientServiceName];
  console.log('recipientServiceName',recipientServiceName);
  console.log('recipientURL', recipientURL);
  console.log('product', process.env.product);
  console.log('cart', process.env.cart);
  if (!recipientURL) {
    return res.status(502).json({ error: 'Cannot process request' });
  }

  try {
    const { method, body } = req;
    console.log('method', method);
    console.log('body', body);
    const endpoint = req.originalUrl.replace(`/${recipientServiceName}`, '');
    const queryString = req.url.replace(req.path, '');

    const response: AxiosResponse = await axios({
      method: method as Method,
      url: `${recipientURL}${endpoint}${queryString}`,
      data: body,
    });

    return res.status(response.status).json(response.data);
  } catch (error: any) { 
    return res.status(error.response?.status || 500).json(error.response?.data || { error: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`BFF Service is running on port ${PORT}`);
});