import { useState } from "react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Register() {
  const [, navigate] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!username) {
        setError("Username is required");
        return;
      }
      
      await apiRequest("POST", "/api/register", { 
        username,
        passwordHash: password 
      });
      
      // If successful, redirect to login
      navigate("/login");
    } catch (err: any) {
      console.error("Registration error:", err);
      setError(err.message || "Registration failed");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-medium text-center">Create Account</h1>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <Input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
        <Input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
        <Button type="submit" className="w-full">Register</Button>
        <div className="text-center text-sm">
          <a href="/login" className="text-blue-600 hover:underline">Back to login</a>
        </div>
      </form>
    </div>
  );
}

