import Layout from "@/components/Layout";
import { useQuery } from "@tanstack/react-query";
import { getFriends, getSocialEvents } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, UserPlus, Calendar as CalendarIcon, MapPin } from "lucide-react";

export default function SocialPage() {
  const { data: friends = [], isLoading: friendsLoading } = useQuery({
    queryKey: ["friends"],
    queryFn: () => getFriends()
  });

  if (friendsLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </Layout>
    );
  }
  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in duration-500">
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Social & Friends</h1>
            <p className="text-muted-foreground">Plan playdates and shared activities with friends and family.</p>
          </div>
          <Button>
            <UserPlus className="w-4 h-4 mr-2" /> Add Friend
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Friends List */}
          <div className="lg:col-span-2 space-y-6">
             <h2 className="text-xl font-display font-bold flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" /> Your Circle
             </h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {friends.map((friend) => (
                   <Card key={friend.id} className="border-none shadow-sm soft-shadow hover:bg-muted/20 transition-colors cursor-pointer">
                      <CardContent className="p-4 flex items-center gap-4">
                         <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                            <AvatarFallback className="bg-primary/10 text-primary font-bold">{friend.avatar}</AvatarFallback>
                         </Avatar>
                         <div className="flex-1">
                            <div className="flex items-center justify-between">
                               <h3 className="font-bold text-foreground">{friend.name}</h3>
                               <Badge variant="secondary" className="text-xs font-normal">{friend.relation}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                               {friend.kids.length > 0 ? `Kids: ${friend.kids.join(", ")}` : "No kids listed"}
                            </p>
                         </div>
                      </CardContent>
                      <div className="px-4 pb-4 flex gap-2">
                         <Button size="sm" variant="outline" className="flex-1 h-8 text-xs">Plan Activity</Button>
                         <Button size="sm" variant="ghost" className="h-8 text-xs text-muted-foreground">View Profile</Button>
                      </div>
                   </Card>
                ))}
             </div>

             <div className="mt-8">
                <h2 className="text-xl font-display font-bold mb-4">Upcoming Social Events</h2>
                <Card className="border-none shadow-sm soft-shadow">
                   <CardContent className="p-0">
                      {[1, 2].map((i) => (
                         <div key={i} className="flex items-center p-4 border-b last:border-0 hover:bg-muted/30 transition-colors">
                            <div className="bg-orange-100 text-orange-600 rounded-lg p-3 text-center min-w-[60px]">
                               <span className="block text-xs font-bold uppercase">Mar</span>
                               <span className="block text-xl font-bold">2{i}</span>
                            </div>
                            <div className="ml-4 flex-1">
                               <h4 className="font-bold text-foreground">Birthday Party: Mikey Johnson</h4>
                               <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Johnson's House</span>
                                  <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> With The Johnsons</span>
                               </div>
                            </div>
                            <Button variant="secondary" size="sm">RSVP</Button>
                         </div>
                      ))}
                   </CardContent>
                </Card>
             </div>
          </div>

          {/* Suggestions Sidebar */}
          <div className="space-y-6">
             <Card className="bg-gradient-to-br from-pink-500 to-rose-600 text-white border-none shadow-lg">
                <CardHeader>
                   <CardTitle className="text-white">Plan a Playdate</CardTitle>
                </CardHeader>
                <CardContent>
                   <p className="text-pink-100 text-sm mb-4">
                      The weekend of March 22nd is open for both you and The Johnsons.
                   </p>
                   <Button variant="secondary" className="w-full bg-white text-pink-600 hover:bg-white/90 border-none">
                      Suggest Activity
                   </Button>
                </CardContent>
             </Card>

             <Card>
                <CardHeader>
                   <CardTitle className="text-sm font-bold uppercase text-muted-foreground tracking-wider">Pending Invites</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                   <div className="flex items-start gap-3">
                      <Avatar className="w-8 h-8">
                         <AvatarFallback className="bg-blue-100 text-blue-600">T</AvatarFallback>
                      </Avatar>
                      <div>
                         <p className="text-sm font-medium">Tom invited you to "Zoo Trip"</p>
                         <p className="text-xs text-muted-foreground mt-0.5">Apr 05 • 10:00 AM</p>
                         <div className="flex gap-2 mt-2">
                            <Button size="sm" className="h-7 text-xs">Accept</Button>
                            <Button size="sm" variant="outline" className="h-7 text-xs">Decline</Button>
                         </div>
                      </div>
                   </div>
                </CardContent>
             </Card>
          </div>

        </div>
      </div>
    </Layout>
  );
}
