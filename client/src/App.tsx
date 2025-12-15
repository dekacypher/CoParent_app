import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import CalendarPage from "@/pages/CalendarPage";
import ActivitiesPage from "@/pages/ActivitiesPage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/calendar" component={CalendarPage} />
      <Route path="/activities" component={ActivitiesPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={0}>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
