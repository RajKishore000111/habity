// server.js

// Import necessary libraries
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const cors = require('cors');

const saltRounds = 10;
const PORT = process.env.PORT || 3000;

// Load environment variables
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;
const DODO_SECRET = process.env.DODO_SECRET;

// Create an Express app
const app = express();

// Use middleware
app.use(bodyParser.json());
app.use(cookieParser());
app.use(cors({
  origin: true, // In production, restrict this to your domain
  credentials: true
}));

// Connect to MongoDB
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("MongoDB connection error:", err));

// Define a User schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Hashed password
  hasPaid: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

// Helper functions
async function hashPassword(password) {
  return await bcrypt.hash(password, saltRounds);
}

async function checkPassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

// -----------------------
// Dodo Payments Webhook Endpoint
// -----------------------
app.post('/api/dodo-webhook', async (req, res) => {
  console.log('Webhook received:', req.body);

  // Get signature from headers and verify it using DODO_SECRET
  const signature = req.headers['x-dodo-signature'];
  const payload = JSON.stringify(req.body);
  const expectedSignature = crypto.createHmac('sha256', DODO_SECRET).update(payload).digest('hex');

  if (signature !== expectedSignature) {
    console.error('Invalid webhook signature');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { email, status } = req.body;
  if (!email || !status) {
    console.error("Missing email or status in payload.");
    return res.status(400).send('Invalid payload.');
  }

  if (status === 'paid') {
    try {
      let user = await User.findOne({ email });
      if (!user) {
        user = new User({ email, password: "", hasPaid: true });
      } else {
        user.hasPaid = true;
      }
      await user.save();
      console.log(`Payment confirmed for ${email}.`);
      return res.status(200).json({ message: 'Payment confirmed' });
    } catch (err) {
      console.error("Error updating user:", err);
      return res.status(500).send("Internal server error");
    }
  } else {
    console.error(`Payment status for ${email} is not "paid".`);
    return res.status(400).send('Payment not confirmed');
  }
});

// -----------------------
// Signup Endpoint
// -----------------------
app.post('/api/signup', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }
  try {
    let existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists." });
    }
    const hashedPassword = await hashPassword(password);
    const newUser = new User({ email, password: hashedPassword, hasPaid: false });
    await newUser.save();
    return res.status(201).json({ message: "User created successfully. Please complete payment to access your plan." });
  } catch (err) {
    console.error("Error during signup:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// -----------------------
// Login Endpoint
// -----------------------
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const isValid = await checkPassword(password, user.password);
    if (!isValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    // Create a JWT that includes the user's email and payment status
    const token = jwt.sign({ email: user.email, hasPaid: user.hasPaid }, JWT_SECRET, { expiresIn: '1h' });
    // Set the token as an httpOnly cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
    return res.json({ message: "Login successful" });
  } catch (err) {
    console.error("Error during login:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// -----------------------
// Middleware to Protect Routes
// -----------------------
function authMiddleware(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ message: "No token provided" });
  
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: "Failed to authenticate token" });
    if (!decoded.hasPaid) return res.status(403).json({ message: "Payment required" });
    req.user = decoded;
    next();
  });
}

// -----------------------
// Protected Daily Plan Endpoint (Dummy Data)
// -----------------------
app.get('/api/daily', authMiddleware, (req, res) => {
  // In production, fetch and return the user's daily plan data from your database.
  res.json({ day: 1, plan: "Your personalized plan for today: [list your tasks here]." });
});

// -----------------------
// Start the Server
// -----------------------
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
