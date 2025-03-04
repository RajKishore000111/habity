// pages/api/dodo-webhook.js

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DODO_SECRET = process.env.DODO_SECRET;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
  
  console.log('Webhook received:', req.body);

  // Verify the webhook signature
  const signature = req.headers['x-dodo-signature'];
  const payload = JSON.stringify(req.body);
  const expectedSignature = crypto.createHmac('sha256', DODO_SECRET).update(payload).digest('hex');

  if (signature !== expectedSignature) {
    console.error('Invalid webhook signature');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { email, status } = req.body;
  if (!email || !status) {
    console.error("Invalid payload: missing email or status.");
    return res.status(400).json({ error: 'Invalid payload.' });
  }

  if (status === 'paid') {
    // Update the user's profile in Supabase to mark them as paid.
    // Assuming you have a "profiles" table with an "id" column linked to auth.users and a "hasPaid" boolean.
    const { data, error } = await supabase
      .from('profiles')
      .update({ hasPaid: true })
      .eq('email', email); // Alternatively, if your profiles table doesn't store email, you may need to join with auth.users.
    
    if (error) {
      console.error("Error updating profile:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
    console.log(`Payment confirmed for ${email}. Profile updated.`);
    return res.status(200).json({ message: 'Payment confirmed' });
  } else {
    console.error(`Payment status for ${email} is not "paid".`);
    return res.status(400).json({ error: 'Payment not confirmed' });
  }
}
