import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getActivities, createEvent, getChildren } from "@/lib/api";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Heart, MapPin, Clock, Navigation, Loader2, Calendar } from "lucide-react";

interface Location {
  latitude: number;
  longitude: number;
  city?: string;
}

interface NearbyActivity {
  id: string;
  name: string;
  category: string;
  description: string;
  address: string;
  distance: number; // in miles
  rating?: number;
  image?: string;
  city?: string;
}

interface OsloEvent {
  id: string;
  name: string;
  category: string;
  description: string;
  date: string;
  time?: string;
  location: string;
  image: string;
  price?: string;
  url?: string;
}

export default function ActivitiesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [nearbyActivities, setNearbyActivities] = useState<NearbyActivity[]>([]);
  const [cityEvents, setCityEvents] = useState<OsloEvent[]>([]);
  const [loadingCityEvents, setLoadingCityEvents] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [citySearchQuery, setCitySearchQuery] = useState("");
  const [isAddToPlanOpen, setIsAddToPlanOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<{ name: string; description: string; type: string } | null>(null);
  const [viewDetailsActivity, setViewDetailsActivity] = useState<NearbyActivity | OsloEvent | any | null>(null);
  const [planFormData, setPlanFormData] = useState({
    date: "",
    time: "",
    childId: 0,
  });

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["activities"],
    queryFn: () => getActivities()
  });

  const { data: children = [] } = useQuery({
    queryKey: ["children"],
    queryFn: getChildren,
  });

  const addToPlanMutation = useMutation({
    mutationFn: createEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast({
        title: "Added to calendar!",
        description: "Activity has been added to your calendar.",
      });
      setIsAddToPlanOpen(false);
      setPlanFormData({ date: "", time: "", childId: 0 });
      setSelectedActivity(null);
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add activity to calendar.",
      });
    },
  });

  // Get user's location
  const getUserLocation = () => {
    setLoadingLocation(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setUserLocation(location);

          // Get city name from coordinates (reverse geocoding)
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.latitude}&lon=${location.longitude}`
            );
            const data = await response.json();
            setUserLocation({
              ...location,
              city: data.address.city || data.address.town || data.address.village || "Unknown",
            });
          } catch (error) {
            console.error("Error getting city name:", error);
          }

          // Fetch nearby activities
          fetchNearbyActivities(location);
          setLoadingLocation(false);

          toast({
            title: "Location detected",
            description: "Finding activities near you...",
          });
        },
        (error) => {
          setLoadingLocation(false);
          toast({
            variant: "destructive",
            title: "Location access denied",
            description: "Please enable location services to find nearby activities.",
          });
        }
      );
    } else {
      setLoadingLocation(false);
      toast({
        variant: "destructive",
        title: "Geolocation not supported",
        description: "Your browser doesn't support geolocation.",
      });
    }
  };

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Categorize place types
  const categorizePlace = (tags: any): string => {
    if (tags.leisure === "playground" || tags.leisure === "park" || tags.natural === "park") return "Outdoor";
    if (tags.tourism === "museum" || tags.amenity === "library") return "Educational";
    if (tags.leisure === "sports_centre" || tags.sport) return "Sports";
    if (tags.shop === "art" || tags.craft) return "Arts & Crafts";
    if (tags.amenity === "theatre" || tags.amenity === "cinema") return "Entertainment";
    return "Outdoor";
  };

  // Get appropriate image for place type with variety
  const getPlaceImage = (category: string, name: string, index: number): string => {
    const imagesByCategory: Record<string, string[]> = {
      "Outdoor": [
        "https://images.unsplash.com/photo-1503596476-1c12a8ba09a9?w=400", // Adventure park
        "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400", // Nature/forest
        "https://images.unsplash.com/photo-1551632811-561732d1e306?w=400", // Playground
        "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400", // Park with kids
        "https://images.unsplash.com/photo-1587271449115-6c51e4d26d7d?w=400", // Outdoor activities
      ],
      "Educational": [
        "https://images.unsplash.com/photo-1603873619638-d4f2ca79d1c0?w=400", // Museum interior
        "https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=400", // Science exhibits
        "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400", // Library
        "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400", // Books and learning
        "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400", // Science lab
      ],
      "Sports": [
        "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400", // Soccer/sports
        "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400", // Trampoline
        "https://images.unsplash.com/photo-1576678927484-cc907957088c?w=400", // Basketball
        "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=400", // Swimming pool
        "https://images.unsplash.com/photo-1526232761682-d26e03ac148e?w=400", // Sports center
      ],
      "Arts & Crafts": [
        "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400", // Painting
        "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=400", // Art supplies
        "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=400", // Crafting
        "https://images.unsplash.com/photo-1596548438137-d51ea5c83d4c?w=400", // Kids art
        "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=400", // Creative workshop
      ],
      "Entertainment": [
        "https://images.unsplash.com/photo-1503095396549-807759245b35?w=400", // Theater
        "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400", // Cinema
        "https://images.unsplash.com/photo-1524712245354-2c4e5e7121c0?w=400", // Performance
        "https://images.unsplash.com/photo-1598387993281-cecf8b71a8f8?w=400", // Stage
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400", // Entertainment venue
      ],
    };

    const images = imagesByCategory[category] || imagesByCategory["Outdoor"];

    // Use name hash to get consistent but varied images
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = ((hash << 5) - hash) + name.charCodeAt(i);
      hash = hash & hash;
    }
    const imageIndex = Math.abs(hash + index) % images.length;
    return images[imageIndex];
  };

  // Fetch nearby activities using OpenStreetMap Overpass API
  const fetchNearbyActivities = async (location: Location) => {
    try {
      const radius = 16093; // 10 miles in meters
      const { latitude, longitude } = location;

      // Overpass API query for kid-friendly places
      const query = `
        [out:json][timeout:25];
        (
          node["leisure"="playground"](around:${radius},${latitude},${longitude});
          node["leisure"="park"](around:${radius},${latitude},${longitude});
          node["tourism"="museum"](around:${radius},${latitude},${longitude});
          node["amenity"="library"](around:${radius},${latitude},${longitude});
          node["leisure"="sports_centre"](around:${radius},${latitude},${longitude});
          node["amenity"="theatre"](around:${radius},${latitude},${longitude});
          node["leisure"="swimming_pool"](around:${radius},${latitude},${longitude});
          way["leisure"="playground"](around:${radius},${latitude},${longitude});
          way["leisure"="park"](around:${radius},${latitude},${longitude});
          way["tourism"="museum"](around:${radius},${latitude},${longitude});
        );
        out center 50;
      `;

      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: query,
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (!response.ok) throw new Error('Failed to fetch nearby places');

      const data = await response.json();

      const activities: NearbyActivity[] = data.elements
        .filter((element: any) => element.tags?.name) // Only include named places
        .map((element: any, index: number) => {
          const lat = element.lat || element.center?.lat;
          const lon = element.lon || element.center?.lon;
          const distance = calculateDistance(latitude, longitude, lat, lon);
          const category = categorizePlace(element.tags);

          return {
            id: `osm-${element.id}`,
            name: element.tags.name,
            category,
            description: element.tags.description || `A ${category.toLowerCase()} facility in your area.`,
            address: [element.tags["addr:street"], element.tags["addr:city"]]
              .filter(Boolean)
              .join(", ") || "Address not available",
            distance: Math.round(distance * 10) / 10, // Round to 1 decimal
            rating: undefined,
            image: getPlaceImage(category, element.tags.name, index),
            city: location.city || "Unknown",
          };
        })
        .filter((activity: NearbyActivity) => activity.distance <= 10) // Within 10 miles
        .sort((a: NearbyActivity, b: NearbyActivity) => a.distance - b.distance) // Sort by distance
        .slice(0, 20); // Limit to 20 results

      setNearbyActivities(activities);

      if (activities.length === 0) {
        toast({
          title: "No activities found",
          description: "Try expanding your search radius or check back later.",
        });
      }
    } catch (error) {
      console.error("Error fetching nearby activities:", error);
      // Don't show error toast - just silently use fallback activities
      // Set empty array so the section doesn't show
      setNearbyActivities([]);
    }
  };

  // Fetch city events (more generic, works for any location)
  const fetchCityEvents = async (city?: string) => {
    setLoadingCityEvents(true);
    try {
      // Get user's city or use provided city
      const targetCity = city || userLocation?.city || "your area";

      // Use Eventbrite API or similar generic event API
      // For now, we'll use a fallback to the oslo events with a generic approach
      try {
        const { getOsloEvents } = await import("@/lib/api");
        const data = await getOsloEvents();

        // Transform the API response
        const events: OsloEvent[] = (data.items || data.data || []).slice(0, 12).map((event: any, index: number) => {
          // Extract event details
          const name = event.title || event.name || "Event";
          const description = event.description || event.intro || `A family-friendly event in ${targetCity}`;
          const location = event.location?.name || event.venue?.name || targetCity;
          const date = event.startDate || event.date || new Date().toISOString();

          // Categorize based on event type or tags
          let category = "Family";
          if (event.categories?.some((c: any) => c.name?.toLowerCase().includes("barn") || c.name?.toLowerCase().includes("child"))) {
            category = "Kids";
          } else if (event.categories?.some((c: any) => c.name?.toLowerCase().includes("museum"))) {
            category = "Educational";
          } else if (event.categories?.some((c: any) => c.name?.toLowerCase().includes("outdoor") || c.name?.toLowerCase().includes("park"))) {
            category = "Outdoor";
          } else if (event.categories?.some((c: any) => c.name?.toLowerCase().includes("kultur") || c.name?.toLowerCase().includes("art"))) {
            category = "Arts & Culture";
          }

          // Get image with variety and fallback
          const eventImages = [
            "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400", // Festival/event
            "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400", // Concert/music
            "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400", // Kids event
            "https://images.unsplash.com/photo-1569163139394-de4798aa62b0?w=400", // Museum/cultural
            "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=400", // Outdoor event
            "https://images.unsplash.com/photo-1511578314322-379afb476865?w=400", // Family activity
          ];

          const image = event.image?.url || event.imageUrl || eventImages[index % eventImages.length];

          return {
            id: event.id || `city-${index}`,
            name,
            category,
            description: description.substring(0, 150) + (description.length > 150 ? "..." : ""),
            date: new Date(date).toLocaleDateString(),
            time: event.startTime || "",
            location,
            image,
            price: event.price || event.isFree ? "Free" : undefined,
            url: event.url || event.link || `https://www.google.com/search?q=events+${encodeURIComponent(targetCity)}`,
          };
        });

        setCityEvents(events);
      } catch (apiError) {
        console.error("Error using city events API:", apiError);
        // Create mock events as fallback
        const fallbackEvents: OsloEvent[] = [
          {
            id: "fallback-1",
            name: "Family Fun Day",
            category: "Family",
            description: "Join us for a day of family-friendly activities and entertainment.",
            date: new Date().toLocaleDateString(),
            location: targetCity,
            image: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400",
            url: `https://www.google.com/search?q=family+events+${encodeURIComponent(targetCity)}`
          },
          {
            id: "fallback-2",
            name: "Kids Workshop",
            category: "Kids",
            description: "Interactive and educational workshops for children of all ages.",
            date: new Date().toLocaleDateString(),
            location: targetCity,
            image: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400",
            url: `https://www.google.com/search?q=kids+activities+${encodeURIComponent(targetCity)}`
          },
          {
            id: "fallback-3",
            name: "Outdoor Adventure",
            category: "Outdoor",
            description: "Explore the outdoors with fun activities for the whole family.",
            date: new Date().toLocaleDateString(),
            location: targetCity,
            image: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400",
            url: `https://www.google.com/search?q=outdoor+activities+${encodeURIComponent(targetCity)}`
          }
        ];
        setCityEvents(fallbackEvents);
      }
    } catch (error) {
      console.error("Error fetching city events:", error);
      toast({
        variant: "destructive",
        title: "Error loading events",
        description: "Could not load local events. Please try again later.",
      });
    } finally {
      setLoadingCityEvents(false);
    }
  };

  // Load city events on mount and when location changes
  useEffect(() => {
    if (userLocation?.city) {
      fetchCityEvents(userLocation.city);
    } else {
      fetchCityEvents(); // Will use default fallback
    }
  }, [userLocation?.city]);

  // Handle Add to Plan button click
  const handleAddToPlan = (activity: { name: string; description: string; type: string }) => {
    setSelectedActivity(activity);
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    setPlanFormData({ ...planFormData, date: today });
    setIsAddToPlanOpen(true);
  };

  // Handle Add to Plan form submission
  const handleAddToPlanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedActivity) return;

    addToPlanMutation.mutate({
      childId: planFormData.childId || children[0]?.id || 1,
      title: selectedActivity.name,
      date: planFormData.date,
      parent: "A", // Default parent
      type: selectedActivity.type as any,
      description: selectedActivity.description,
      location: "",
    });
  };

  const filteredNearbyActivities = nearbyActivities.filter(activity => {
    const matchesCategory = selectedCategory === "all" || activity.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch = activity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         activity.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
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

        {/* Location Banner */}
        <div className="bg-gradient-to-r from-teal-50 to-orange-50 border border-teal-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-teal-600" />
              <div>
                <p className="font-semibold text-sm">
                  {userLocation ? `Near ${userLocation.city || "you"}` : "Enable location for nearby activities"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {userLocation
                    ? `Showing ${filteredNearbyActivities.length} activities within 10 miles`
                    : "Get personalized activity suggestions based on your location"
                  }
                </p>
              </div>
            </div>
            <Button
              onClick={getUserLocation}
              disabled={loadingLocation}
              size="sm"
              className="bg-teal-600 hover:bg-teal-700"
            >
              {loadingLocation ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Locating...
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4 mr-2" />
                  {userLocation ? "Update Location" : "Use My Location"}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search activities..."
              className="pl-9 bg-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
            <Button
              variant={selectedCategory === "all" ? "secondary" : "outline"}
              className="whitespace-nowrap"
              onClick={() => setSelectedCategory("all")}
            >
              All
            </Button>
            <Button
              variant={selectedCategory === "outdoor" ? "secondary" : "outline"}
              className="whitespace-nowrap"
              onClick={() => setSelectedCategory("outdoor")}
            >
              Outdoor
            </Button>
            <Button
              variant={selectedCategory === "educational" ? "secondary" : "outline"}
              className="whitespace-nowrap"
              onClick={() => setSelectedCategory("educational")}
            >
              Educational
            </Button>
            <Button
              variant={selectedCategory === "arts & crafts" ? "secondary" : "outline"}
              className="whitespace-nowrap"
              onClick={() => setSelectedCategory("arts & crafts")}
            >
              Arts & Crafts
            </Button>
            <Button
              variant={selectedCategory === "sports" ? "secondary" : "outline"}
              className="whitespace-nowrap"
              onClick={() => setSelectedCategory("sports")}
            >
              Sports
            </Button>
          </div>
        </div>

        {/* Nearby Activities Section */}
        {userLocation && nearbyActivities.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <MapPin className="h-6 w-6 text-teal-600" />
              Near You
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredNearbyActivities.map((activity) => (
                <Card key={activity.id} className="overflow-hidden border-none shadow-md soft-shadow hover:translate-y-[-4px] transition-all duration-300 flex flex-col h-full">
                  <div className="relative h-48 shrink-0">
                    <img
                      src={activity.image || "https://images.unsplash.com/photo-1503095396549-807759245b35?w=400"}
                      alt={activity.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "https://images.unsplash.com/photo-1503095396549-807759245b35?w=400";
                      }}
                    />
                    <Button size="icon" variant="secondary" className="absolute top-2 right-2 rounded-full w-8 h-8 bg-white/80 hover:bg-white text-red-500">
                      <Heart className="w-4 h-4" />
                    </Button>
                    <Badge className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-md text-white border-none">
                      {activity.category}
                    </Badge>
                    {activity.rating && (
                      <Badge className="absolute top-2 left-2 bg-teal-600 text-white border-none">
                        ⭐ {activity.rating}
                      </Badge>
                    )}
                  </div>

                  <CardHeader className="p-4 pb-2 shrink-0">
                    <h3 className="font-display font-bold text-lg leading-tight line-clamp-2 min-h-[3.5rem]">{activity.name}</h3>
                  </CardHeader>

                  <CardContent className="p-4 pt-2 space-y-3 flex-1 min-h-0">
                    <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">{activity.description}</p>

                    <div className="flex flex-wrap gap-2 text-xs font-medium text-foreground/80">
                      <div className="flex items-center gap-1.5 bg-teal-100 text-teal-700 px-2 py-1 rounded-md">
                        <MapPin className="w-3.5 h-3.5 shrink-0" /> {activity.distance.toFixed(1)} mi away
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{activity.address}</p>
                  </CardContent>

                  <CardFooter className="p-4 pt-0 gap-2 shrink-0">
                    <Button className="flex-1" variant="outline" size="sm" onClick={() => setViewDetailsActivity(activity)}>
                      View Details
                    </Button>
                    <Button
                      className="flex-1"
                      size="sm"
                      onClick={() => handleAddToPlan({
                        name: activity.name,
                        description: activity.description,
                        type: "activity"
                      })}
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Add to Plan
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* City Events Section - Dynamic based on user's location */}
        {cityEvents.length > 0 && !loadingCityEvents && (
          <div>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <span className="text-2xl">🎉</span>
              Events in {userLocation?.city || "Your Area"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {cityEvents.map((event) => (
                <Card key={event.id} className="overflow-hidden border-none shadow-md soft-shadow hover:translate-y-[-4px] transition-all duration-300 flex flex-col h-full">
                  <div className="relative h-48 shrink-0">
                    <img
                      src={event.image}
                      alt={event.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "https://images.unsplash.com/photo-1503095396549-807759245b35?w=400";
                      }}
                    />
                    <Badge className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-md text-white border-none">
                      {event.category}
                    </Badge>
                    {event.price && (
                      <Badge className="absolute top-2 left-2 bg-green-600 text-white border-none">
                        {event.price}
                      </Badge>
                    )}
                  </div>

                  <CardHeader className="p-4 pb-2 shrink-0">
                    <h3 className="font-display font-bold text-lg leading-tight line-clamp-2 min-h-[3.5rem]">{event.name}</h3>
                  </CardHeader>

                  <CardContent className="p-4 pt-2 space-y-3 flex-1 min-h-0">
                    <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">{event.description}</p>

                    <div className="flex flex-wrap gap-2 text-xs font-medium text-foreground/80">
                      <div className="flex items-center gap-1.5 bg-secondary/30 px-2 py-1 rounded-md">
                        <Clock className="w-3.5 h-3.5 opacity-70 shrink-0" /> {event.date}
                      </div>
                      {event.time && (
                        <div className="flex items-center gap-1.5 bg-secondary/30 px-2 py-1 rounded-md">
                          {event.time}
                        </div>
                      )}
                    </div>
                    <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <span className="truncate">{event.location}</span>
                    </div>
                  </CardContent>

                  <CardFooter className="p-4 pt-0 gap-2 shrink-0">
                    <Button variant="outline" className="flex-1" size="sm" onClick={() => setViewDetailsActivity(event)}>
                      View Details
                    </Button>
                    <Button
                      className="flex-1"
                      size="sm"
                      onClick={() => handleAddToPlan({
                        name: event.name,
                        description: event.description,
                        type: "city-event"
                      })}
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Add to Plan
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        )}

        {loadingCityEvents && (
          <div className="text-center py-12 text-muted-foreground">
            <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin" />
            <p>Loading events in your area...</p>
          </div>
        )}

        {/* Curated Activities Section */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Curated Activities</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {activities.map((activity) => (
              <Card key={activity.id} className="overflow-hidden border-none shadow-md soft-shadow hover:translate-y-[-4px] transition-all duration-300 flex flex-col h-full">
                <div className="relative h-48 shrink-0">
                  <img
                    src={activity.image || "https://images.unsplash.com/photo-1503095396549-807759245b35?w=400"}
                    alt={activity.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "https://images.unsplash.com/photo-1503095396549-807759245b35?w=400";
                    }}
                  />
                  <Button size="icon" variant="secondary" className="absolute top-2 right-2 rounded-full w-8 h-8 bg-white/80 hover:bg-white text-red-500">
                    <Heart className="w-4 h-4" />
                  </Button>
                  <Badge className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-md text-white border-none">
                    {activity.category}
                  </Badge>
                </div>

                <CardHeader className="p-4 pb-2 shrink-0">
                  <h3 className="font-display font-bold text-lg leading-tight line-clamp-2 min-h-[3.5rem]">{activity.title}</h3>
                </CardHeader>

                <CardContent className="p-4 pt-2 space-y-3 flex-1 min-h-0">
                  <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">{activity.description}</p>

                  <div className="flex flex-wrap gap-2 text-xs font-medium text-foreground/80">
                    <div className="flex items-center gap-1.5 bg-secondary/30 px-2 py-1 rounded-md">
                      <Clock className="w-3.5 h-3.5 opacity-70 shrink-0" /> {activity.duration}
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="p-4 pt-0 shrink-0">
                  <Button
                    className="w-full"
                    size="sm"
                    onClick={() => handleAddToPlan({
                      name: activity.title,
                      description: activity.description,
                      type: activity.category.toLowerCase()
                    })}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Add to Plan
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>

        {/* Add to Plan Dialog */}
        <Dialog open={isAddToPlanOpen} onOpenChange={setIsAddToPlanOpen}>
          <DialogContent>
            <form onSubmit={handleAddToPlanSubmit}>
              <DialogHeader>
                <DialogTitle>Add to Calendar</DialogTitle>
                <DialogDescription>
                  {selectedActivity?.name && `Schedule "${selectedActivity.name}" on your calendar`}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="plan-date">Date</Label>
                  <Input
                    id="plan-date"
                    type="date"
                    value={planFormData.date}
                    onChange={(e) => setPlanFormData({ ...planFormData, date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="plan-time">Time (optional)</Label>
                  <Input
                    id="plan-time"
                    type="time"
                    value={planFormData.time}
                    onChange={(e) => setPlanFormData({ ...planFormData, time: e.target.value })}
                  />
                </div>
                {children.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="plan-child">Child (optional)</Label>
                    <Select
                      value={planFormData.childId.toString()}
                      onValueChange={(value) => setPlanFormData({ ...planFormData, childId: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a child" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">All children</SelectItem>
                        {children.map((child) => (
                          <SelectItem key={child.id} value={child.id.toString()}>
                            {child.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddToPlanOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={addToPlanMutation.isPending}>
                  {addToPlanMutation.isPending ? "Adding..." : "Add to Calendar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* View Details Dialog */}
        <Dialog open={!!viewDetailsActivity} onOpenChange={() => setViewDetailsActivity(null)}>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Activity Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {viewDetailsActivity?.image && (
                <div className="relative h-48 rounded-lg overflow-hidden">
                  <img
                    src={viewDetailsActivity.image}
                    alt={viewDetailsActivity.name || viewDetailsActivity.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "https://images.unsplash.com/photo-1503095396549-807759245b35?w=400";
                    }}
                  />
                </div>
              )}

              <div>
                <h3 className="text-2xl font-bold mb-2">{viewDetailsActivity?.name || viewDetailsActivity?.title}</h3>
                {viewDetailsActivity?.category && (
                  <Badge className="capitalize">{viewDetailsActivity.category}</Badge>
                )}
              </div>

              <div>
                <Label className="text-sm text-muted-foreground">Description</Label>
                <p className="text-sm mt-1">{viewDetailsActivity?.description}</p>
              </div>

              {/* Address/Location */}
              {viewDetailsActivity?.address && (
                <div>
                  <Label className="text-sm text-muted-foreground">Address</Label>
                  <div className="flex items-start gap-2 mt-1">
                    <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                    <p className="text-sm">{viewDetailsActivity.address}</p>
                  </div>
                </div>
              )}

              {viewDetailsActivity?.location && (
                <div>
                  <Label className="text-sm text-muted-foreground">Location</Label>
                  <div className="flex items-start gap-2 mt-1">
                    <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                    <p className="text-sm">{viewDetailsActivity.location}</p>
                  </div>
                </div>
              )}

              {/* Distance (for nearby activities) */}
              {viewDetailsActivity?.distance !== undefined && (
                <div>
                  <Label className="text-sm text-muted-foreground">Distance</Label>
                  <p className="text-sm mt-1">{viewDetailsActivity.distance.toFixed(1)} miles away</p>
                </div>
              )}

              {/* Date and Time (for city events) */}
              {viewDetailsActivity?.date && (
                <div className="flex gap-4">
                  {viewDetailsActivity.date && (
                    <div>
                      <Label className="text-sm text-muted-foreground">Date</Label>
                      <p className="text-sm mt-1">{viewDetailsActivity.date}</p>
                    </div>
                  )}
                  {viewDetailsActivity.time && (
                    <div>
                      <Label className="text-sm text-muted-foreground">Time</Label>
                      <p className="text-sm mt-1">{viewDetailsActivity.time}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Duration (for curated activities) */}
              {viewDetailsActivity?.duration && (
                <div>
                  <Label className="text-sm text-muted-foreground">Duration</Label>
                  <p className="text-sm mt-1">{viewDetailsActivity.duration}</p>
                </div>
              )}

              {/* Price */}
              {viewDetailsActivity?.price && (
                <div>
                  <Label className="text-sm text-muted-foreground">Price</Label>
                  <p className="text-sm mt-1">{viewDetailsActivity.price}</p>
                </div>
              )}

              {/* Rating */}
              {viewDetailsActivity?.rating && (
                <div>
                  <Label className="text-sm text-muted-foreground">Rating</Label>
                  <p className="text-sm mt-1">⭐ {viewDetailsActivity.rating}</p>
                </div>
              )}

              {/* URL/External Link */}
              {viewDetailsActivity?.url && (
                <div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => window.open(viewDetailsActivity.url, '_blank')}
                  >
                    View on External Site
                  </Button>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                onClick={() => {
                  setViewDetailsActivity(null);
                  // Also trigger add to plan
                  if (viewDetailsActivity) {
                    handleAddToPlan({
                      name: viewDetailsActivity.name || viewDetailsActivity.title,
                      description: viewDetailsActivity.description,
                      type: "activity"
                    });
                  }
                }}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Add to Calendar
              </Button>
              <Button variant="outline" onClick={() => setViewDetailsActivity(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
