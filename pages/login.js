import { useState } from 'react';
import { useRouter } from 'next/router';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    const { error } = await supabase.auth.signIn({ email, password });
    if (error) {
      alert("Login error: " + error.message);
    } else {
      alert("Login successful.");
      router.push('/plan');
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white">
      <h1 className="text-4xl font-bold mb-4">Login</h1>
      <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md px-4">
        <input 
          type="email" 
          placeholder="Email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required 
          className="w-full p-2 rounded border border-gray-300"
        />
        <input 
          type="password" 
          placeholder="Password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required 
          className="w-full p-2 rounded border border-gray-300"
        />
        <button type="submit" className="bg-white text-black font-bold px-6 py-3 rounded-full hover:bg-gray-200 transition">
          Login
        </button>
      </form>
    </div>
  );
}

