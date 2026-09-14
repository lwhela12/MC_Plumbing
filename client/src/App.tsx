import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Plumbers from "./pages/Plumbers";
import WeeklyPayroll from "./pages/WeeklyPayroll";
import Reports from "./pages/Reports";
import Login from "./pages/Login";

function Router() {
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/me"],
    queryFn: async () => {
      const response = await fetch("/api/me");
      if (!response.ok) {
        if (response.status === 401) {
          return null; // Not authenticated
        }
        throw new Error("Failed to check authentication");
      }
      return response.json();
    },
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Show login/register if not authenticated
  if (!user) {
    return (
      <Switch>
        <Route component={Login} />
      </Switch>
    );
  }

  // Show main app if authenticated
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/plumbers" component={Plumbers} />
        <Route path="/weekly-payroll" component={WeeklyPayroll} />
        <Route path="/reports" component={Reports} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
