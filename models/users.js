import mongoose from 'mongoose';

const userSchema = mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
  userType: { type: String, required: true },
  password: { type: String, required: true, expose: false },
});

export default mongoose.model('User', userSchema);
