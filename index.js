import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import userRouter from './routes/user.js';
import productsRoutes from './routes/products.js';

const app = express();

app.use(express.json({ limit: '30mb', extended: true }));
app.use(cors());

app.use('/user', userRouter);
app.use('/products', productsRoutes);

const CONNECTION_URL =
  'mongodb+srv://noraiz:developer123@cluster0.kruef.mongodb.net/myFirstDatabase?retryWrites=true&w=majority';
const PORT = process.env.PORT || 8000;

mongoose
  .connect(CONNECTION_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => app.listen(PORT, () => console.log(`Server Running on Port: http://localhost:${PORT}`)))
  .catch((error) => console.log(`${error} did not connect`));

mongoose.set('useFindAndModify', false);
