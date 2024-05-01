import express from "express";
import "dotenv/config";

import db from "./db/conn.mjs";

import Learner from './models/learner.mjs';
import Grades from "./models/grades.mjs";


const PORT = process.env.PORT ||5050;
const app = express();

app.use(express.json());


//Validation
db.collection('grades', {
	validator: {
		$jsonSchema: {
			bsonType: 'object',
			required: ['class_id', 'learner_id'],
			properties: {
				class_id: {
					bsonType: 'int',
					minimum: 0,
					maximum: 300,
					description: 'class_id must be an integer between 0 and 300'
				},
				learner_id: {
					bsonType: 'int',
					minimum: 0,
					description: 'learner_id must be an integer greater than or equal to 0'
				}
			}
		}
	},
	validationAction: 'warn'
});


// Find invalid documents.
app.get("/", async (req, res) => {
  try {
    const invalidDocuments = await Learner.find({}).or([
      { name: { $exists: false } },
      { enrolled: { $exists: false } },
      { year: { $exists: false } },
      { campus: { $exists: false } },
      { year: { $lt: 1995 } },
      { campus: { $nin: [
          "Remote",
          "Boston",
          "New York",
          "Denver",
          "Los Angeles",
          "Seattle",
          "Dallas",
        ] } }
    ]).exec();

    res.status(204).send(invalidDocuments);
  } catch (error) {
    console.error("Error finding invalid documents:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Create a GET route at /grades/stats
// Within this route, create an aggregation pipeline that returns the following information:
// The number of learners with a weighted average (as calculated by the existing routes) higher than 70%.
// The total number of learners.
// The percentage of learners with an average above 70% (a ratio of the above two outputs).

app.get("/grades/stats", async (req, res) => {
  try {
    const result = await Grades.aggregate([
      {
        $match: {
          "scores.score": { $exists: true, $type: "double" } // Filter documents where scores.score exists and is of type double
        }
      },
      {
        $unwind: "$scores"
      },
      {
        $match: {
          "scores.score": { $gt: 70 } // Perform comparison only on valid scores
        }
      },
      {
        $group: {
          _id: null,
          totalLearners: { $sum: 1 },
          learnersAbove70: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          "Total Number of Learners": "$totalLearners",
          "Number of Learners With Grade Above 70": "$learnersAbove70",
          "Percentage of Learners With Grade Above 70": {
            $multiply: [
              { $divide: ["$learnersAbove70", "$totalLearners"] },
              100
            ]
          }
        }
      }
    ]);

    if (!result || result.length === 0) {
      res.status(404).send("Not found");
    } else {
      res.status(200).send(result[0]);
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});




// Create a GET route at /grades/stats/:id
// Within this route, mimic the above aggregation pipeline, but only for learners within a class that has a class_id equal to the specified :id.


app.get("/grades/stats/:id", async (req, res) => {
  try {
    const classId = Number(req.params.id);

    // Perform aggregation using Mongoose
    const result = await Grades.aggregate([
      {
        $match: {
          class_id: { $eq: classId } // Match documents with the specified class_id
        }
      },
      {
        $project: {
          avg: { $avg: { $toDouble: "$scores.score" } }, // Convert score to double and calculate average
        },
      },
      {
        $facet: {
          learnersAbove70: [
            {
              $match: { avg: { $gt: 70 } }, // Match learners with average score above 70
            },
            {
              $count: "count", // Count the matched learners
            },
          ],
          totalLearners: [
            {
              $count: "count", // Count the total number of learners
            },
          ],
        },
      },
      {
        $project: {
          totalLearners: { $arrayElemAt: ["$totalLearners.count", 0] },
          learnersAbove70: { $arrayElemAt: ["$learnersAbove70.count", 0] },
        },
      },
      {
        $project: {
          "Number of Learners With Grade Above 70": "$learnersAbove70",
          "Total Number of Learners": "$totalLearners",
          "Percentage of Learners With Grade Above 70": {
            $cond: {
              if: { $eq: ["$totalLearners", 0] }, // Handle division by zero
              then: 0,
              else: {
                $multiply: [
                  { $divide: ["$learnersAbove70", "$totalLearners"] },
                  100,
                ],
              }
            }
          },
        },
      },
    ]);

    if (!result || result.length === 0) {
      res.status(404).send("Not found");
    } else {
      res.status(200).send(result[0]);
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});




// Global error handling
app.use((err, _req, res, next) => {
  res.status(500).send("Seems like we messed up somewhere...");
});

// Start the Express server
app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});
