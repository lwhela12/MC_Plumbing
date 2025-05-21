import { Switch, Route } from "wouter";
import { queryClient, getQueryFn } from "./lib/queryClient";
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
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";

function Router() {
  const { data: user, isLoading } = useQuery(["/api/me"], getQueryFn({ on401: "returnNull" }));

  if (isLoading) return null;

  if (!user) {
    return (
      <Switch>
        <Route path="/register" component={Register} />
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route component={Login} />
      </Switch>
    );
  }

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
