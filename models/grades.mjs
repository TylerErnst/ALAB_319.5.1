import mongoose from 'mongoose';

// Define Schema
const gradesSchema = new mongoose.Schema({
    class_id: Number,
    learner_id: Number,
    scores: [{
      type: { type: String, required: true },
      score: { type: Number, required: true }
    }]
  });


// Define Model
const Grades = mongoose.model('Grades', gradesSchema);

export default Grades;