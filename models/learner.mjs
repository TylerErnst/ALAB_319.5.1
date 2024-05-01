import mongoose from 'mongoose';

const learnerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  enrolled: {
    type: Boolean,
    required: true,
  },
  year: {
    type: Number,
    required: true,
    min: 1995,
  },
  avg: Number,
  campus: {
    type: String,
    enum: [
      "Remote",
      "Boston",
      "New York",
      "Denver",
      "Los Angeles",
      "Seattle",
      "Dallas",
    ],
    required: true,
  },
});

const Learner = mongoose.model('Learner', learnerSchema);

export default Learner;