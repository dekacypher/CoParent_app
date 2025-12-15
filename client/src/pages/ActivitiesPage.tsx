import Layout from "@/components/Layout";
import { useQuery } from "@tanstack/react-query";
import { getActivities } from "@/lib/api";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, Heart, MapPin, Clock } from "lucide-react";

export default function ActivitiesPage() {
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["activities"],
    queryFn: () => getActivities()
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-muted-foreground">Loading activities...</div>
        </div>
      </Layout>
    );
  }
  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="max-w-2xl">
           <h1 className="text-3xl font-display font-bold text-foreground mb-2">Discover Activities</h1>
           <p className="text-muted-foreground">Find age-appropriate events, classes, and fun things to do during your parenting time.</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search activities..." className="pl-9 bg-white" />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
             <Button variant="secondary" className="whitespace-nowrap">All</Button>
             <Button variant="outline" className="whitespace-nowrap">Outdoor</Button>
             <Button variant="outline" className="whitespace-nowrap">Educational</Button>
             <Button variant="outline" className="whitespace-nowrap">Arts & Crafts</Button>
             <Button variant="outline" className="whitespace-nowrap">Sports</Button>
          </div>
        </div>

        {/* Activity Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {activities.map((activity) => (
             <Card key={activity.id} className="overflow-hidden border-none shadow-md soft-shadow hover:translate-y-[-4px] transition-all duration-300">
               <div className="relative h-48">
                 <img src={activity.image} alt={activity.title} className="w-full h-full object-cover" />
                 <Button size="icon" variant="secondary" className="absolute top-2 right-2 rounded-full w-8 h-8 bg-white/80 hover:bg-white text-red-500">
                   <Heart className="w-4 h-4" />
                 </Button>
                 <Badge className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-md text-white border-none">
                    {activity.category}
                 </Badge>
               </div>
               
               <CardHeader className="p-4 pb-2">
                 <h3 className="font-display font-bold text-lg leading-tight">{activity.title}</h3>
               </CardHeader>
               
               <CardContent className="p-4 pt-2 space-y-3">
                 <p className="text-sm text-muted-foreground line-clamp-2">{activity.description}</p>
                 
                 <div className="flex flex-wrap gap-3 text-xs font-medium text-foreground/80">
                   <div className="flex items-center gap-1.5 bg-secondary/30 px-2 py-1 rounded-md">
                     <Clock className="w-3.5 h-3.5 opacity-70" /> {activity.duration}
                   </div>
                    <div className="flex items-center gap-1.5 bg-secondary/30 px-2 py-1 rounded-md">
                     <MapPin className="w-3.5 h-3.5 opacity-70" /> 5 mi away
                   </div>
                 </div>
               </CardContent>

               <CardFooter className="p-4 pt-0">
                 <Button className="w-full">Add to Plan</Button>
               </CardFooter>
             </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}
