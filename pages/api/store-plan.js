// pages/api/store-plan.js

import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const JWT_SECRET = process.env.JWT_SECRET;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  // Retrieve the token from the cookies
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }
  
  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
  
  // For Supabase Auth tokens, the user ID is typically stored in the `sub` property.
  const userId = decoded.sub || decoded.user_id;
  if (!userId) {
    return res.status(400).json({ error: "User ID not found in token" });
  }
  
  const { planData } = req.body;
  if (!planData || !Array.isArray(planData) || planData.length !== 60) {
    return res.status(400).json({ error: "Plan data must be an array of 60 items" });
  }
  
  // Prepare data for insertion: one row per day
  const insertData = planData.map((plan, index) => ({
    user_id: userId,
    day: index + 1,
    plan: plan
  }));
  
  const { error } = await supabase
    .from('daily_plans')
    .insert(insertData);
  
  if (error) {
    console.error("Error inserting plan data:", error);
    return res.status(500).json({ error: error.message });
  }
  
  return res.status(201).json({ message: "Daily plan stored successfully" });
}
