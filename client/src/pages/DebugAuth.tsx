import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

export default function DebugAuth() {
  const { user, session, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [result, setResult] = useState<any>(null);

  const testLogin = async () => {
    setResult({ loading: true });

    try {
      // Test direct Supabase auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      setResult({ success: !error, data, error: error?.message, user: data?.user });
    } catch (e: any) {
      setResult({ success: false, error: e.message });
    }
  };

  const checkUsers = async () => {
    // Check if we can query users
    const { data, error } = await supabase
      .from('profiles')
      .select('*');

    setResult({ profiles: data, error: error?.message });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Authentication Debug Page</h1>

        {/* Current Auth State */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Current Auth State</h2>
          <div className="space-y-2 font-mono text-sm">
            <p><strong>Loading:</strong> {loading.toString()}</p>
            <p><strong>User:</strong> {user ? JSON.stringify(user, null, 2) : 'Not logged in'}</p>
            <p><strong>Session:</strong> {session ? 'Active' : 'None'}</p>
          </div>
        </div>

        {/* Test Login */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Login</h2>
          <div className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border rounded"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded"
            />
            <button
              onClick={testLogin}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Test Login
            </button>
          </div>
        </div>

        {/* Check Database */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Check Database</h2>
          <button
            onClick={checkUsers}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Check Profiles Table
          </button>
        </div>

        {/* Results */}
        {result && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Results</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
