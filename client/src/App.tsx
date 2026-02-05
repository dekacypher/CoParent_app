import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { GoogleAuthProvider } from "@/components/GoogleAuthProvider";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/LandingPage";
import Home from "@/pages/Home";
import CalendarPage from "@/pages/CalendarPage";
import ActivitiesPage from "@/pages/ActivitiesPage";
import SocialPage from "@/pages/SocialPage";
import EducationPage from "@/pages/EducationPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import ExpensesPage from "@/pages/ExpensesPage";
import MessagesPage from "@/pages/MessagesPage";
import DocumentsPage from "@/pages/DocumentsPage";
import SettingsPage from "@/pages/SettingsPage";
import TestPage from "@/pages/TestPage";
import DebugAuth from "@/pages/DebugAuth";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/dashboard" component={Home} />
      <Route path="/calendar" component={CalendarPage} />
      <Route path="/messages" component={MessagesPage} />
      <Route path="/expenses" component={ExpensesPage} />
      <Route path="/documents" component={DocumentsPage} />
      <Route path="/activities" component={ActivitiesPage} />
      <Route path="/social" component={SocialPage} />
      <Route path="/education" component={EducationPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/test" component={TestPage} />
      <Route path="/debug-auth" component={DebugAuth} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <GoogleAuthProvider>
        <AuthProvider>
          <ThemeProvider>
            <TooltipProvider delayDuration={0}>
              <Toaster />
              <Router />
            </TooltipProvider>
          </ThemeProvider>
        </AuthProvider>
      </GoogleAuthProvider>
    </QueryClientProvider>
  );
}

export default App;
