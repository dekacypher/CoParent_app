import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getActivities, getChildren } from "@/lib/api";
import { supabaseApi } from "@/lib/supabase";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Heart, MapPin, Clock, Navigation, Loader2, Calendar } from "lucide-react";
import { getEventImageUrl } from "@/lib/images";

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
    startTime: "",
    endTime: "",
    childId: 0,
  });
  const [activityImages, setActivityImages] = useState<Record<string, string>>({});

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["activities"],
    queryFn: () => getActivities()
  });

  const { data: children = [] } = useQuery({
    queryKey: ["children"],
    queryFn: getChildren,
  });

  const addToPlanMutation = useMutation({
    mutationFn: async (eventData: any) => {
      // Transform the data to match Supabase schema
      const supabaseEvent = {
        child_id: eventData.childId || null,
        title: eventData.title,
        start_date: eventData.startDate,
        end_date: eventData.endDate,
        start_time: eventData.startTime,
        end_time: eventData.endTime,
        time_zone: eventData.timeZone || 'Europe/Oslo',
        parent: eventData.parent || 'A',
        type: eventData.type || 'activity',
        description: eventData.description || null,
        location: eventData.location || null,
        recurrence: eventData.recurrence || null,
        recurrence_interval: eventData.recurrenceInterval || 1,
        recurrence_end: eventData.recurrenceEnd || null,
        recurrence_days: eventData.recurrenceDays || null,
      };

      const { data, error } = await supabaseApi.createEvent(supabaseEvent);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast({
        title: "Added to calendar!",
        description: "Activity has been added to your calendar.",
      });
      setIsAddToPlanOpen(false);
      setPlanFormData({ date: "", startTime: "", endTime: "", childId: 0 });
      setSelectedActivity(null);
    },
    onError: (error: any) => {
      console.error("Error adding activity:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to add activity to calendar.",
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
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.latitude}&lon=${location.longitude}`,
              { signal: controller.signal }
            );
            clearTimeout(timeoutId);

            if (response.ok) {
              const data = await response.json();
              const city = data.address?.city || data.address?.town || data.address?.village ||
                           data.address?.suburb || data.address?.county || "Your area";
              setUserLocation({
                ...location,
                city,
              });
            } else {
              setUserLocation({ ...location, city: "Your area" });
            }
          } catch (error) {
            console.error("Error getting city name:", error);
            setUserLocation({ ...location, city: "Your area" });
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

  // Fetch real image from Wikipedia for a place
  const fetchRealPlaceImage = async (placeName: string, category: string, city: string): Promise<string | null> => {
    try {
      // Try multiple search strategies
      const searchQueries = [
        `${placeName} ${city}`,
        `${placeName} ${category}`,
        placeName,
        `${placeName} building`,
      ];

      for (const query of searchQueries) {
        try {
          const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=3&prop=pageimages|pageterms&piprop=original&pithumbsize=600&format=json&origin=*`;
          const response = await fetch(searchUrl);

          if (response.ok) {
            const data = await response.json();
            const pages = data.query?.pages;

            if (pages) {
              // Find the most relevant page with an image
              for (const page of Object.values(pages)) {
                const p = page as any;
                if (p?.thumbnail?.source && p?.terms?.description?.[0]) {
                  // Check if description is relevant
                  const desc = p.terms.description[0].toLowerCase();
                  const placeLower = placeName.toLowerCase();

                  if (desc.includes(category.toLowerCase()) ||
                      desc.includes(placeLower) ||
                      desc.includes('building') ||
                      desc.includes('place')) {
                    return p.thumbnail.source;
                  }
                }
              }

              // Fallback to first page with image
              for (const page of Object.values(pages)) {
                const p = page as any;
                if (p?.thumbnail?.source) {
                  return p.thumbnail.source;
                }
              }
            }
          }
        } catch {
          continue; // Try next query
        }
      }
    } catch (error) {
      console.log(`Failed to fetch Wikipedia image for ${placeName}:`, error);
    }

    return null;
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

  // Synchronous version for initial render (will be updated by async fetch)
  const getPlaceholderImage = (category: string, name: string, index: number): string => {
    // Category-based images from Lorem Picsum with consistent hash
    const categoryImageIds: Record<string, number[]> = {
      'Outdoor': [237, 238, 239, 240, 241, 242, 243, 244, 245, 246], // Nature/outdoor
      'Educational': [25, 26, 27, 28, 29, 30, 31, 32, 33, 34], // Library/museum
      'Sports': [100, 101, 102, 103, 104, 105, 106, 107, 108, 109], // Sports
      'Arts & Crafts': [50, 51, 52, 53, 54, 55, 56, 57, 58, 59], // Art
      'Entertainment': [150, 151, 152, 153, 154, 155, 156, 157, 158, 159] // Theater/cinema
    };

    const imageIds = categoryImageIds[category] || categoryImageIds['Outdoor'];
    let hash = 0;
    const str = name.toLowerCase();
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }

    const imageId = imageIds[Math.abs(hash) % imageIds.length];
    return `https://picsum.photos/id/${imageId}/400/300`;
  };

  // Fetch nearby activities using OpenStreetMap Overpass API
  const fetchNearbyActivities = async (location: Location) => {
    try {
      const radius = 16093; // 10 miles in meters
      const { latitude, longitude } = location;

      // Create abort controller with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

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
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Overpass API returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      const activities: NearbyActivity[] = data.elements
        .filter((element: any) => element.tags?.name) // Only include named places
        .map((element: any, index: number) => {
          const lat = element.lat || element.center?.lat;
          const lon = element.lon || element.center?.lon;
          const distance = calculateDistance(latitude, longitude, lat, lon);
          const category = categorizePlace(element.tags);

          // Build the exact address from OSM data
          const street = element.tags["addr:street"];
          const housenumber = element.tags["addr:housenumber"];
          const postcode = element.tags["addr:postcode"];
          const city = element.tags["addr:city"] || element.tags["addr:town"] || element.tags["addr:village"] || location.city;

          // Try to get the most complete address possible
          let addressParts = [];
          if (housenumber && street) {
            addressParts.push(`${housenumber} ${street}`);
          } else if (street) {
            addressParts.push(street);
          }
          if (postcode) addressParts.push(postcode);
          if (city) addressParts.push(city);

          // If we still don't have a good address, use the place name with city
          let address: string;
          if (addressParts.length > 0) {
            address = addressParts.join(", ");
          } else if (city) {
            // Try reverse geocoding to get a street name
            address = `${element.tags.name}, ${city}`;
          } else {
            address = element.tags.name;
          }

          return {
            id: `osm-${element.id}`,
            name: element.tags.name,
            category,
            description: element.tags.description || `A ${category.toLowerCase()} facility.`,
            address,
            distance: Math.round(distance * 10) / 10,
            rating: undefined,
            image: getPlaceholderImage(category, element.tags.name, index),
            city: location.city || "Unknown",
          };
        })
        .filter((activity: NearbyActivity) => activity.distance <= 10) // Within 10 miles
        .sort((a: NearbyActivity, b: NearbyActivity) => a.distance - b.distance) // Sort by distance
        .slice(0, 20); // Limit to 20 results

      setNearbyActivities(activities);

      // Fetch real images for each activity from Wikipedia
      activities.forEach(async (activity) => {
        const realImage = await fetchRealPlaceImage(activity.name, activity.category, activity.city || location.city || "");
        if (realImage) {
          setActivityImages(prev => ({ ...prev, [activity.id]: realImage }));
        }
      });

      if (activities.length === 0) {
        toast({
          title: "No activities found",
          description: "Try expanding your search radius or check back later.",
        });
      }
    } catch (error: any) {
      console.error("Error fetching nearby activities:", error);

      // Show helpful error message based on what went wrong
      let errorMessage = "Unable to fetch nearby activities. Please try again later.";

      if (error.name === 'AbortError') {
        errorMessage = "Request timed out. The location service is taking too long to respond.";
      } else if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
        errorMessage = "Network error. Please check your internet connection.";
      }

      toast({
        variant: "destructive",
        title: "Location services unavailable",
        description: errorMessage,
      });

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

          // Get relevant image based on event keywords instead of cycling
          const image = event.image?.url || event.imageUrl ||
            getEventImageUrl(name, category.toLowerCase(), event.id || `city-${index}`);

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
            image: "https://picsum.photos/id/237/400/300",
            url: `https://www.google.com/search?q=family+events+${encodeURIComponent(targetCity)}`
          },
          {
            id: "fallback-2",
            name: "Kids Workshop",
            category: "Kids",
            description: "Interactive and educational workshops for children of all ages.",
            date: new Date().toLocaleDateString(),
            location: targetCity,
            image: "https://picsum.photos/id/238/400/300",
            url: `https://www.google.com/search?q=kids+activities+${encodeURIComponent(targetCity)}`
          },
          {
            id: "fallback-3",
            name: "Outdoor Adventure",
            category: "Outdoor",
            description: "Explore the outdoors with fun activities for the whole family.",
            date: new Date().toLocaleDateString(),
            location: targetCity,
            image: "https://picsum.photos/id/239/400/300",
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
  const handleAddToPlan = (activity: { name: string; description: string; type: string; address?: string; location?: string; time?: string }) => {
    setSelectedActivity(activity);
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    setPlanFormData({
      ...planFormData,
      date: today,
      startTime: activity.time || "",
      endTime: ""
    });
    setIsAddToPlanOpen(true);
  };

  // Handle Add to Plan form submission
  const handleAddToPlanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedActivity) return;

    // Get address from selectedActivity if available (for nearby activities)
    const address = (selectedActivity as any).address || null;
    const location = (selectedActivity as any).location || "";

    // Set time - if only startTime provided, set endTime 2 hours later
    let startTime = planFormData.startTime || "09:00";
    let endTime = planFormData.endTime;

    if (!endTime && planFormData.startTime) {
      // Calculate endTime 2 hours after startTime
      const [hours, minutes] = planFormData.startTime.split(':').map(Number);
      const endHour = (hours + 2) % 24;
      endTime = `${String(endHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    } else if (!endTime) {
      endTime = "11:00";
    }

    // Map activity type to valid event type
    const eventTypeMapping: Record<string, string> = {
      'activity': 'custody',
      'city-event': 'custody',
      'Outdoor': 'custody',
      'Educational': 'school',
      'Sports': 'activity',
      'Arts & Crafts': 'activity',
      'Entertainment': 'activity'
    };

    const eventType = eventTypeMapping[selectedActivity.type] || 'custody';

    addToPlanMutation.mutate({
      childId: planFormData.childId || children[0]?.id || 1,
      title: selectedActivity.name,
      startDate: planFormData.date,
      endDate: planFormData.date,
      startTime,
      endTime,
      timeZone: "Europe/Oslo",
      parent: "A",
      type: eventType,
      description: selectedActivity.description,
      location: address || location,
      recurrence: null,
      recurrenceInterval: 1,
      recurrenceEnd: null,
      recurrenceDays: null,
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
                      src={activityImages[activity.id] || activity.image || "https://picsum.photos/id/237/400/300"}
                      alt={activity.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = activity.image || "https://picsum.photos/id/237/400/300";
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
                        type: "activity",
                        address: activity.address,
                        location: activity.address
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
                        target.src = "https://picsum.photos/id/237/400/300";
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
                        type: "city-event",
                        location: event.location,
                        time: event.time
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
                    src={activity.image || "https://picsum.photos/id/237/400/300"}
                    alt={activity.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "https://picsum.photos/id/237/400/300";
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="plan-start-time">Start Time</Label>
                    <Input
                      id="plan-start-time"
                      type="time"
                      value={planFormData.startTime}
                      onChange={(e) => setPlanFormData({ ...planFormData, startTime: e.target.value })}
                      placeholder="09:00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="plan-end-time">End Time</Label>
                    <Input
                      id="plan-end-time"
                      type="time"
                      value={planFormData.endTime}
                      onChange={(e) => setPlanFormData({ ...planFormData, endTime: e.target.value })}
                      placeholder="11:00"
                    />
                  </div>
                </div>
                {(selectedActivity as any)?.address && (
                  <div className="space-y-2">
                    <Label>Address</Label>
                    <p className="text-sm text-muted-foreground">{(selectedActivity as any).address}</p>
                  </div>
                )}
                {(selectedActivity as any)?.location && !(selectedActivity as any)?.address && (
                  <div className="space-y-2">
                    <Label>Location</Label>
                    <p className="text-sm text-muted-foreground">{(selectedActivity as any).location}</p>
                  </div>
                )}
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
                      target.src = "https://picsum.photos/id/237/400/300";
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
