const express = require("express");
const router = express.Router();
const JobRequest = require("../models/JobRequest");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { sendJobAcceptanceEmail, sendJobCompletionEmail } = require("../services/emailService");

// Helper function to get Sri Lanka time (UTC+5:30)
const getSriLankaTime = () => {
  const now = new Date();
  const sriLankaTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
  return sriLankaTime;
};

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: "No token provided. Please login." 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
    req.userId = decoded.id;
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: "Invalid token. Please login again." 
    });
  }
};

// GET /api/jobs - list all jobs with optional filters
router.get("/", async (req, res) => {
  try {
    const { category, status, location, search, userId } = req.query;
    const filter = {};
    
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (userId) filter.user = userId;
    
    if (location) {
      filter.location = { $regex: location, $options: 'i' };
    }
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const jobs = await JobRequest.find(filter)
      .populate('user', 'name email role')
      .populate('acceptedBy', 'name email role')
      .populate('completedBy', 'name email role')
      .sort({ createdAt: -1 });
      
    res.status(200).json({
      success: true,
      count: jobs.length,
      data: jobs
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ 
      success: false,
      message: "Error fetching jobs",
      error: error.message 
    });
  }
});

// GET /api/jobs/my-jobs - get current user's jobs (protected route)
router.get("/my-jobs", verifyToken, async (req, res) => {
  try {
    const jobs = await JobRequest.find({ user: req.userId })
      .populate('acceptedBy', 'name email role')
      .populate('completedBy', 'name email role')
      .sort({ createdAt: -1 });
      
    res.status(200).json({
      success: true,
      count: jobs.length,
      data: jobs
    });
  } catch (error) {
    console.error('Error fetching my jobs:', error);
    res.status(500).json({ 
      success: false,
      message: "Error fetching your jobs",
      error: error.message 
    });
  }
});

// GET /api/jobs/provider-jobs - get jobs accepted by provider
router.get("/provider-jobs", verifyToken, async (req, res) => {
  try {
    const jobs = await JobRequest.find({ acceptedBy: req.userId })
      .populate('user', 'name email role')
      .populate('completedBy', 'name email role')
      .sort({ createdAt: -1 });
      
    res.status(200).json({
      success: true,
      count: jobs.length,
      data: jobs
    });
  } catch (error) {
    console.error('Error fetching provider jobs:', error);
    res.status(500).json({ 
      success: false,
      message: "Error fetching your accepted jobs",
      error: error.message 
    });
  }
});

// GET /api/jobs/:id - fetch a single job
router.get("/:id", async (req, res) => {
  try {
    const job = await JobRequest.findById(req.params.id)
      .populate('user', 'name email role')
      .populate('acceptedBy', 'name email role')
      .populate('completedBy', 'name email role');
    
    if (!job) {
      return res.status(404).json({ 
        success: false,
        message: "Job not found" 
      });
    }
    
    res.status(200).json({
      success: true,
      data: job
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ 
        success: false,
        message: "Job not found" 
      });
    }
    console.error('Error fetching job:', error);
    res.status(500).json({ 
      success: false,
      message: "Error fetching job",
      error: error.message 
    });
  }
});

// POST /api/jobs - create a new job (protected route)
router.post("/", verifyToken, async (req, res) => {
  try {
    console.log('Creating job for user:', req.userId);
    console.log('Request body:', req.body);
    
    const { title, description, category, location, contactName, contactEmail, status } = req.body;
    
    const requiredFields = ['title', 'description', 'category', 'location', 'contactName', 'contactEmail'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }
    
    const jobData = {
      title,
      description,
      category,
      location,
      contactName,
      contactEmail,
      user: req.userId,
      createdAt: getSriLankaTime(),
      updatedAt: getSriLankaTime()
    };
    
    if (status && ["Open", "In Progress", "Closed"].includes(status)) {
      jobData.status = status;
    }
    
    const job = await JobRequest.create(jobData);
    console.log('Job created successfully:', job._id);
    
    const populatedJob = await JobRequest.findById(job._id)
      .populate('user', 'name email role')
      .populate('acceptedBy', 'name email role')
      .populate('completedBy', 'name email role');
    
    res.status(201).json({
      success: true,
      data: populatedJob
    });
  } catch (error) {
    console.error('Error creating job:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false,
        message: "Validation error",
        errors: messages 
      });
    }
    res.status(500).json({ 
      success: false,
      message: "Error creating job",
      error: error.message 
    });
  }
});

// PATCH /api/jobs/:id - update status only (with email notifications and tracking)
router.patch("/:id", async (req, res) => {
  try {
    const { status } = req.body;
    const providerId = req.headers.providerid;
    const userId = req.headers.userid; // Add this for homeowner updates
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status field is required"
      });
    }
    
    const validStatuses = ["Open", "In Progress", "Closed"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be 'Open', 'In Progress', or 'Closed'"
      });
    }
    
    const job = await JobRequest.findById(req.params.id)
      .populate('user', 'name email')
      .populate('acceptedBy', 'name email');
    
    if (!job) {
      return res.status(404).json({ 
        success: false,
        message: "Job not found" 
      });
    }
    
    const oldStatus = job.status;
    const sriLankaTime = getSriLankaTime();
    
    // Update status and track who accepted/completed
    job.status = status;
    job.updatedAt = sriLankaTime;
    
    // If job is being accepted (Open -> In Progress)
    if (oldStatus === 'Open' && status === 'In Progress' && providerId) {
      job.acceptedBy = providerId;
      job.acceptedAt = sriLankaTime;
    }
    
    // If job is being completed (In Progress -> Closed)
    if (oldStatus === 'In Progress' && status === 'Closed' && providerId) {
      job.completedBy = providerId;
      job.completedAt = sriLankaTime;
    }
    
    // If homeowner is closing the job directly
    if (status === 'Closed' && userId && !providerId) {
      if (job.acceptedBy) {
        job.completedBy = job.acceptedBy;
      }
      job.completedAt = sriLankaTime;
    }
    
    await job.save();
    
    let emailSent = false;
    
    // Send email notification when job is accepted
    if (oldStatus === 'Open' && status === 'In Progress' && providerId) {
      try {
        const provider = await User.findById(providerId);
        
        if (provider && job.user && job.user.email) {
          await sendJobAcceptanceEmail(
            job.user.email,
            job.user.name,
            provider.name,
            job.title,
            job._id
          );
          emailSent = true;
          console.log(`Acceptance email sent to homeowner: ${job.user.email}`);
        }
      } catch (emailError) {
        console.error('Error sending acceptance email:', emailError);
      }
    }
    
    // Send email notification when job is completed
    if (status === 'Closed' && job.user && job.user.email) {
      try {
        let providerName = 'A service provider';
        
        if (providerId) {
          const provider = await User.findById(providerId);
          if (provider) providerName = provider.name;
        } else if (job.acceptedBy) {
          providerName = job.acceptedBy.name;
        }
        
        await sendJobCompletionEmail(
          job.user.email,
          job.user.name,
          providerName,
          job.title,
          job._id
        );
        emailSent = true;
        console.log(`Completion email sent to homeowner: ${job.user.email}`);
      } catch (emailError) {
        console.error('Error sending completion email:', emailError);
      }
    }
    
    // Get updated job with populated fields
    const updatedJob = await JobRequest.findById(req.params.id)
      .populate('user', 'name email role')
      .populate('acceptedBy', 'name email role')
      .populate('completedBy', 'name email role');
    
    res.status(200).json({
      success: true,
      data: updatedJob,
      emailSent: emailSent
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ 
        success: false,
        message: "Job not found" 
      });
    }
    console.error('Error updating job status:', error);
    res.status(500).json({ 
      success: false,
      message: "Error updating job status",
      error: error.message 
    });
  }
});

// DELETE /api/jobs/:id - delete a job
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const job = await JobRequest.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ 
        success: false,
        message: "Job not found" 
      });
    }
    
    if (job.user.toString() !== req.userId) {
      return res.status(403).json({ 
        success: false,
        message: "You are not authorized to delete this job" 
      });
    }
    
    await job.deleteOne();
    
    res.status(200).json({
      success: true,
      message: "Job deleted successfully"
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ 
        success: false,
        message: "Job not found" 
      });
    }
    console.error('Error deleting job:', error);
    res.status(500).json({ 
      success: false,
      message: "Error deleting job",
      error: error.message 
    });
  }
});

module.exports = router;