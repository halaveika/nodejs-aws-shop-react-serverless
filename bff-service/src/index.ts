import express, { Request, Response, NextFunction } from 'express';
import axios, { AxiosResponse, Method } from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use(async (req: Request, res: Response, next: NextFunction) => {
  const recipientServiceName = req.params.recipientServiceName;
  const recipientURL = process.env[recipientServiceName];
  const query = req.query;

  if (!recipientURL) {
    return res.status(502).json({ error: 'Cannot process request' });
  }

  try {
    const { method, body } = req;
    const queryString = Object.keys(query).length > 0 ? `?${require('querystring').stringify(query)}` : '';

    const response: AxiosResponse = await axios({
      method: method as Method,
      url: `${recipientURL}${queryString}`,
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
