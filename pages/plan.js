import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function Plan() {
  const [planData, setPlanData] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in via Supabase
    const session = supabase.auth.session();
    if (!session) {
      alert("Please log in to access your plan.");
      router.push('/login');
      return;
    }

    async function fetchPlan() {
      try {
        const response = await fetch('/api/daily');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch plan");
        }
        const data = await response.json();
        setPlanData(data);
      } catch (error) {
        console.error("Error fetching plan:", error);
        setPlanData({ error: error.message });
      } finally {
        setLoading(false);
      }
    }
    
    fetchPlan();
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white">
      <h1 className="text-4xl font-bold mb-4">Your Daily Plan</h1>
      <div className="max-w-3xl w-full p-8 bg-white text-black rounded-lg shadow-lg">
        {loading ? (
          <p>Loading your plan...</p>
        ) : planData?.error ? (
          <p>Error: {planData.error}</p>
        ) : (
          <>
            <h2 className="text-3xl font-bold mb-2">Day {planData.day}</h2>
            <p className="text-xl">{planData.plan}</p>
          </>
        )}
      </div>
    </div>
  );
}
