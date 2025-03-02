// pages/api/dodo-webhook.js

// This API route handles webhooks from Dodo Payments.
// It expects a POST request with a JSON payload containing an "email" and "status".
// In a production app, you should verify the webhook signature to ensure the request is genuine.

export default function handler(req, res) {
  if (req.method === 'POST') {
    console.log('Webhook received:', req.body);

    // Extract email and status from the payload
    const { email, status } = req.body;

    // Check that both email and status exist in the payload
    if (!email || !status) {
      console.error("Invalid payload: Missing email or status.");
      return res.status(400).send('Invalid payload.');
    }

    // Process the payment confirmation
    if (status === 'paid') {
      // Here you would normally update your database to mark the user as paid.
      // For example, find the user by email and set hasPaid to true.
      console.log(`Payment confirmed for ${email}. User marked as paid.`);
      return res.status(200).send('Payment confirmed.');
    } else {
      console.error(`Payment status for ${email} is not "paid".`);
      return res.status(400).send('Payment not confirmed.');
    }
  } else {
    // If the method is not POST, return 405 Method Not Allowed
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
