import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const invitationSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: ['employee', 'manager'], required: true },
  tokenHash: { type: String, required: true },
  status: { type: String, enum: ['pending', 'accepted', 'expired'], default: 'pending' },
  invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  expiresAt: { type: Date, required: true }
}, { timestamps: true });

// Note: The actual raw token is NOT stored in the database, only the hash.
// The user receives the raw token in the link.
// We provide a helper to compare it.
invitationSchema.methods.matchToken = async function (enteredToken) {
  return await bcrypt.compare(enteredToken, this.tokenHash);
};

export default mongoose.model('Invitation', invitationSchema);
