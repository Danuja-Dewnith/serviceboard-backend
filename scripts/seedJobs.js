const mongoose = require("mongoose");
const dotenv = require("dotenv");
const JobRequest = require("../models/JobRequest");

dotenv.config();

const sampleJobs = [
  {
    title: "Leaking kitchen tap",
    description: "Need a plumber to fix a leaking kitchen tap. Water is dripping constantly.",
    category: "Plumbing",
    location: "Glasgow",
    contactName: "John Smith",
    contactEmail: "john@example.com",
    status: "Open"
  },
  {
    title: "Install ceiling lights",
    description: "Need electrician to install 3 ceiling lights in living room and dining area.",
    category: "Electrical",
    location: "Edinburgh",
    contactName: "Sarah Johnson",
    contactEmail: "sarah@example.com",
    status: "In Progress"
  },
  {
    title: "Paint living room",
    description: "Looking for painter to paint living room walls (white color).",
    category: "Painting",
    location: "Glasgow",
    contactName: "Mike Brown",
    contactEmail: "mike@example.com",
    status: "Open"
  },
  {
    title: "Fix broken cabinet",
    description: "Need joiner to repair a broken kitchen cabinet door.",
    category: "Joinery",
    location: "Aberdeen",
    contactName: "Emma Wilson",
    contactEmail: "emma@example.com",
    status: "Closed"
  },
  {
    title: "Emergency plumbing",
    description: "Burst pipe in bathroom, need immediate assistance!",
    category: "Plumbing",
    location: "Glasgow",
    contactName: "David Clark",
    contactEmail: "david@example.com",
    status: "Open"
  }
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");
    
    // Clear existing jobs
    await JobRequest.deleteMany();
    console.log("Cleared existing jobs");
    
    // Insert sample jobs
    const jobs = await JobRequest.insertMany(sampleJobs);
    console.log(`${jobs.length} sample jobs inserted`);
    
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
};

seedDatabase();