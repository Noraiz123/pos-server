import mongoose from 'mongoose';

const userSchema = mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  barcode: { type: String },
  retailPrice: { type: Number, required: true },
  color: { type: String },
  size: { type: String },
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true,
  },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Categories' },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendors' },
  discount: { type: Number, default: 0, max: 100 },
  quantity: { type: Number, default: 1 },
  imgUrl: { type: String },
  createdAt: {
    type: Date,
    default: new Date(),
  },
});

export default mongoose.model('Products', userSchema);
