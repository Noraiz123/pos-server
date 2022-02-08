import mongoose from 'mongoose';

const userSchema = mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  color: { type: String },
  size: { type: String },
  category: { type: String },
  discount: { type: Number, default: 0 },
  quantity: { type: Number, default: 1 },
  imgUrl: { type: String},
  createdAt: {
    type: Date,
    default: new Date(),
  },
});

export default mongoose.model('Products', userSchema);
