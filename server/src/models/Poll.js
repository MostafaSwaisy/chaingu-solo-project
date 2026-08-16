import mongoose from 'mongoose';

const optionSchema = new mongoose.Schema({ text: { type: String, required: true, trim: true } }, { _id: false });

const pollSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, trim: true },
    options: {
      type: [optionSchema],
      validate: {
        validator: (opts) => opts.length >= 2 && opts.length <= 6,
        message: 'A poll must have between 2 and 6 options',
      },
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    expiresAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const Poll = mongoose.model('Poll', pollSchema);
