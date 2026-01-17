import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute, PublicRoute } from "@/components/ProtectedRoute";
import NotFound from "@/pages/not-found";
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

function Router() {
  return (
    <Switch>
      <Route path="/login" component={() => (
        <PublicRoute>
          <LoginPage />
        </PublicRoute>
      )} />
      <Route path="/register" component={() => (
        <PublicRoute>
          <RegisterPage />
        </PublicRoute>
      )} />
      <Route path="/" component={() => (
        <ProtectedRoute>
          <Home />
        </ProtectedRoute>
      )} />
      <Route path="/calendar" component={() => (
        <ProtectedRoute>
          <CalendarPage />
        </ProtectedRoute>
      )} />
      <Route path="/messages" component={() => (
        <ProtectedRoute>
          <MessagesPage />
        </ProtectedRoute>
      )} />
      <Route path="/expenses" component={() => (
        <ProtectedRoute>
          <ExpensesPage />
        </ProtectedRoute>
      )} />
      <Route path="/documents" component={() => (
        <ProtectedRoute>
          <DocumentsPage />
        </ProtectedRoute>
      )} />
      <Route path="/activities" component={() => (
        <ProtectedRoute>
          <ActivitiesPage />
        </ProtectedRoute>
      )} />
      <Route path="/social" component={() => (
        <ProtectedRoute>
          <SocialPage />
        </ProtectedRoute>
      )} />
      <Route path="/education" component={() => (
        <ProtectedRoute>
          <EducationPage />
        </ProtectedRoute>
      )} />
      <Route path="/settings" component={() => (
        <ProtectedRoute>
          <SettingsPage />
        </ProtectedRoute>
      )} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <TooltipProvider delayDuration={0}>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
