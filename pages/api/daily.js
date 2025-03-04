// pages/api/daily.js

import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import cookie from 'cookie';
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
  
  // Parse cookies to retrieve the token
  const cookies = cookie.parse(req.headers.cookie || '');
  const token = cookies.token;
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }
  
  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    console.error("Token verification error:", err);
    return res.status(401).json({ message: "Failed to authenticate token" });
  }
  
  // Extract email from token payload
  const { email } = decoded;
  if (!email) {
    return res.status(400).json({ message: "Invalid token payload" });
  }
  
  // Query the profiles table in Supabase for this user's profile
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('start_date, hasPaid')
    .eq('email', email)
    .single();
  
  if (error || !profile) {
    console.error("Error fetching profile:", error);
    return res.status(500).json({ message: "Error fetching profile", error });
  }
  
  // Check if the user has paid
  if (!profile.hasPaid) {
    return res.status(403).json({ message: "Payment required to access the plan." });
  }
  
  // Calculate the current day based on the stored start_date
  const startDate = new Date(profile.start_date);
  const now = new Date();
  const diffMs = now - startDate;
  const dayNumber = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
  const totalDays = 60;
  const currentDay = Math.min(dayNumber, totalDays);
  
  // For demonstration, create a dummy daily plan message
  const dailyPlan = `Day ${currentDay}: Your personalized tasks for today go here.`;
  
  return res.status(200).json({ day: currentDay, plan: dailyPlan });
}
