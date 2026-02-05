import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useState } from "react";

export default function TestPage() {
  const { user, loading } = useAuth();
  const [testResult, setTestResult] = useState<string>("Testing...");

  const testSupabase = async () => {
    try {
      setTestResult("Testing Supabase connection...");

      // Test 1: Check auth
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      if (authError) {
        setTestResult(`Auth Error: ${authError.message}`);
        return;
      }

      // Test 2: Try to query events table
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('count')
        .limit(1);

      if (eventsError) {
        setTestResult(`Events Table Error: ${eventsError.message}\n${eventsError.hint || ''}`);
        return;
      }

      setTestResult(`✓ Supabase Connected!\n✓ User: ${user?.email || 'Not logged in'}\n✓ Events table accessible`);
    } catch (err: any) {
      setTestResult(`Error: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Debug Page</h1>

        <div className="bg-card border rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold">Authentication Status</h2>
          <p><strong>Loading:</strong> {loading ? "Yes" : "No"}</p>
          <p><strong>User:</strong> {user?.email || "Not logged in"}</p>
          <p><strong>User ID:</strong> {user?.id || "N/A"}</p>
        </div>

        <div className="bg-card border rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold">Supabase Connection Test</h2>
          <button
            onClick={testSupabase}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Test Connection
          </button>
          <pre className="bg-muted p-4 rounded-md whitespace-pre-wrap text-sm">
            {testResult}
          </pre>
        </div>

        <div className="bg-card border rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold">Environment Info</h2>
          <p><strong>Supabase URL:</strong> {import.meta.env.VITE_SUPABASE_URL || "Using fallback"}</p>
          <p><strong>Current URL:</strong> {window.location.href}</p>
        </div>
      </div>
    </div>
  );
}
