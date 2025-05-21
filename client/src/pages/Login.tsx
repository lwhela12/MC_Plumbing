import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Login() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      apiRequest("POST", "/api/login-with-token", { token })
        .then(() => navigate("/"))
        .catch(err => setError(err.message));
    }
  }, [navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest("POST", "/api/login", { username: email, password });
      navigate("/");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-medium text-center">Login</h1>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <Input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <Input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
        <Button type="submit" className="w-full">Login</Button>
        <div className="text-center text-sm">
          <a href="/forgot-password" className="text-blue-600 hover:underline mr-2">Forgot password?</a>
          <a href="/register" className="text-blue-600 hover:underline">Create account</a>
        </div>
      </form>
    </div>
  );
}

