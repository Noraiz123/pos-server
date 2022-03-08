import mongoose from 'mongoose';

const ordersSchema = mongoose.Schema({
  status: { type: String, required: true },
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true,
  },
  cashier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  salesman: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
  },
  orderItems: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: 'Products' },
      paidPrice: Number,
      currentPrice: Number,
      quantity: Number,
    },
  ],
  total: { type: Number },
  createdAt: {
    type: Date,
    default: new Date(),
  },
});

export default mongoose.model('Orders', ordersSchema);
