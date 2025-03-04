// pages/api/get-daily-plan.js

import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const JWT_SECRET = process.env.JWT_SECRET;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
  
  // Retrieve the token from cookies
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
  
  const userId = decoded.sub || decoded.user_id;
  if (!userId) {
    return res.status(400).json({ error: "User ID not found in token" });
  }
  
  // Get the day from query parameters
  const day = parseInt(req.query.day);
  if (!day || day < 1 || day > 60) {
    return res.status(400).json({ error: "Invalid day parameter" });
  }
  
  // Fetch the daily plan for the authenticated user and requested day
  const { data, error } = await supabase
    .from('daily_plans')
    .select('plan')
    .eq('user_id', userId)
    .eq('day', day)
    .single();
  
  if (error) {
    console.error("Error fetching daily plan:", error);
    return res.status(500).json({ error: error.message });
  }
  
  return res.status(200).json({ day, plan: data.plan });
}
