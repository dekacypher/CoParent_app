import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Calendar, Home, Settings, Heart, Menu, Bell } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navItems = [
    { icon: Home, label: "Dashboard", href: "/" },
    { icon: Calendar, label: "Year Planner", href: "/calendar" },
    { icon: Heart, label: "Activities", href: "/activities" },
    { icon: Settings, label: "Settings", href: "/settings" },
  ];

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6">
        <h1 className="text-2xl font-display font-bold text-primary flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
            cp
          </div>
          Co-Parent
        </h1>
      </div>
      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group cursor-pointer",
                location === item.href
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
              )}
              onClick={() => setIsMobileOpen(false)}>
              <item.icon
                className={cn(
                  "w-5 h-5",
                  location === item.href ? "text-white" : "text-muted-foreground group-hover:text-primary"
                )}
              />
              <span className="font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="p-4 mt-auto">
        <div className="bg-gradient-to-br from-secondary/50 to-white p-4 rounded-xl border border-secondary">
          <p className="text-xs font-semibold text-primary mb-1">Next Handover</p>
          <p className="text-sm font-medium text-foreground">Friday, 5:00 PM</p>
          <p className="text-xs text-muted-foreground mt-1">School Pickup → Parent A</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 border-r border-border bg-sidebar h-screen sticky top-0">
        <NavContent />
      </aside>

      {/* Mobile Nav */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-md border-b border-border z-50 flex items-center px-4 justify-between">
        <h1 className="text-lg font-display font-bold text-primary">Co-Parent</h1>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <Bell className="w-5 h-5" />
          </Button>
          <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64 bg-sidebar border-r border-border">
              <NavContent />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 md:overflow-y-auto h-screen w-full pt-16 md:pt-0">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
