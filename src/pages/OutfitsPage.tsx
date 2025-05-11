import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOutfit } from "@/context/OutfitContext";
import { useWardrobe } from "@/hooks/useWardrobeContext";
import { DayOfWeek, Outfit } from "@/types";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { RefreshCw, Heart, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

const DAYS_OF_WEEK = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" },
];

const OutfitDisplay = ({
  outfit,
  onRegenerate,
  isRegenerating,
  onFavorite,
  isFavorite,
}: {
  outfit: Outfit;
  onRegenerate: () => void;
  isRegenerating: boolean;
  onFavorite: () => void;
  isFavorite: boolean;
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  // Show animation when outfit changes
  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 500);
    return () => clearTimeout(timer);
  }, [outfit.upper.id, outfit.bottom.id]);

  return (
    <motion.div
      initial={{ opacity: 0.8 }}
      animate={{ opacity: isAnimating ? 0.8 : 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="outfit-card">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-gray-500 mb-2">Top</div>
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative">
                <img
                  src={outfit.upper.image_url}
                  alt={outfit.upper.name || "Upper clothing"}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder.svg";
                  }}
                />
              </div>
              <p className="mt-2 text-sm text-center">{outfit.upper.name}</p>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500 mb-2">
                Bottom
              </div>
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative">
                <img
                  src={outfit.bottom.image_url}
                  alt={outfit.bottom.name || "Bottom clothing"}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder.svg";
                  }}
                />
              </div>
              <p className="mt-2 text-sm text-center">{outfit.bottom.name}</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={onRegenerate}
            disabled={isRegenerating}
          >
            {isRegenerating ? (
              <>
                <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
                Regenerating...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-3 w-3" />
                Regenerate
              </>
            )}
          </Button>
          <Button
            variant={isFavorite ? "default" : "outline"}
            size="sm"
            className={`w-10 p-0 ${
              isFavorite ? "bg-red-500 hover:bg-red-600" : ""
            }`}
            onClick={onFavorite}
          >
            <Heart
              className={`h-4 w-4 ${isFavorite ? "fill-white text-white" : ""}`}
            />
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

const OutfitsPage = () => {
  const {
    weeklyOutfits,
    generateWeeklyOutfits,
    regenerateOutfitForDay,
    isLoading,
    isGenerating,
  } = useOutfit();
  const { clothingItems } = useWardrobe();
  const { user } = useAuth();
  const [regeneratingDay, setRegeneratingDay] = useState<DayOfWeek | null>(
    null
  );
  const [activeTab, setActiveTab] = useState("monday");
  const [error, setError] = useState<string | null>(null);
  const [favoriteOutfits, setFavoriteOutfits] = useState<string[]>([]);

  // Load favorite outfits from Supabase
  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    const loadFavorites = async () => {
      try {
        const { data, error } = await supabase
          .from("favorite_outfits")
          .select("outfit_id")
          .eq("user_id", user.id);

        if (error) throw error;

        if (data && isMounted) {
          setFavoriteOutfits(data.map((fav) => fav.outfit_id));
        }
      } catch (err) {
        console.error("Error loading favorites:", err);
      }
    };

    loadFavorites();
    return () => {
      isMounted = false;
    };
  }, [user]);

  useEffect(() => {
    // If we have clothing items but no outfits, generate them automatically
    if (
      clothingItems.length > 0 &&
      weeklyOutfits.length === 0 &&
      !isLoading &&
      !isGenerating
    ) {
      generateWeeklyOutfits().catch((err) => {
        setError("Failed to generate outfits. Please try again later.");
        console.error(err);
      });
    }

    // Get the current day to set as the active tab
    const today = new Date()
      .toLocaleDateString("en-US", { weekday: "long" })
      .toLowerCase() as DayOfWeek;

    if (DAYS_OF_WEEK.some((day) => day.value === today)) {
      setActiveTab(today);
    }
  }, [
    clothingItems,
    weeklyOutfits,
    generateWeeklyOutfits,
    isLoading,
    isGenerating,
  ]);

  const handleGenerateOutfits = async () => {
    setError(null);
    try {
      await generateWeeklyOutfits();
    } catch (err) {
      setError("Failed to generate outfits. Please try again later.");
      console.error(err);
    }
  };

  const handleRegenerateOutfit = async (day: DayOfWeek) => {
    setError(null);
    setRegeneratingDay(day);
    try {
      await regenerateOutfitForDay(day);
    } catch (err) {
      setError(`Failed to regenerate outfit for ${day}. Please try again.`);
      console.error(err);
    } finally {
      setRegeneratingDay(null);
    }
  };

  const handleToggleFavorite = async (outfit: Outfit) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to save favorite outfits",
        variant: "destructive",
      });
      return;
    }

    // Ensure outfit has a valid id before proceeding
    if (!outfit.id) {
      toast({
        title: "Error",
        description: "This outfit cannot be favorited (missing ID)",
        variant: "destructive",
      });
      return;
    }

    try {
      const isFavorite = favoriteOutfits.includes(outfit.id);

      if (isFavorite) {
        // Remove from favorites
        await supabase
          .from("favorite_outfits")
          .delete()
          .match({ user_id: user.id, outfit_id: outfit.id });

        setFavoriteOutfits((prev) => prev.filter((id) => id !== outfit.id));

        toast({
          title: "Removed from favorites",
          description: "Outfit removed from your favorite outfits",
        });
      } else {
        // Add to favorites (use array for insert)
        await supabase
          .from("favorite_outfits")
          .insert([{ user_id: user.id, outfit_id: outfit.id }]);

        setFavoriteOutfits((prev) => [...prev, outfit.id]);

        toast({
          title: "Added to favorites",
          description: "Outfit saved to your favorite outfits",
        });
      }
    } catch (err) {
      console.error("Error updating favorite status:", err);
      toast({
        title: "Error",
        description: "Failed to update favorite status",
        variant: "destructive",
      });
    }
  };

  const isFavorite = (outfitId: string) => {
    return favoriteOutfits.includes(outfitId);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-grow py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Weekly Outfits</h1>
            <p className="text-gray-600 mt-1">
              Your AI-powered outfit suggestions for the week
            </p>
          </div>
          <Button
            className="mt-4 md:mt-0"
            onClick={handleGenerateOutfits}
            disabled={isLoading || isGenerating || clothingItems.length === 0}
          >
            {isLoading || isGenerating ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Generate New Outfits
              </>
            )}
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {clothingItems.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Your wardrobe is empty
            </h3>
            <p className="text-gray-600 mb-4">
              Add some clothes to your wardrobe to get outfit recommendations.
            </p>
            <Button asChild>
              <a href="/wardrobe">Go to My Wardrobe</a>
            </Button>
          </div>
        ) : weeklyOutfits.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No outfits generated yet
            </h3>
            <p className="text-gray-600 mb-4">
              Generate your weekly outfit plan to get started.
            </p>
            <Button
              onClick={handleGenerateOutfits}
              disabled={isLoading || isGenerating}
            >
              {isLoading || isGenerating ? "Generating..." : "Generate Outfits"}
            </Button>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              {DAYS_OF_WEEK.map((day) => {
                const hasOutfit = weeklyOutfits.some(
                  (o) => o.day === day.value
                );
                return (
                  <TabsTrigger
                    key={day.value}
                    value={day.value}
                    className={hasOutfit ? "" : "opacity-70"}
                  >
                    {day.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {DAYS_OF_WEEK.map((day) => {
              const outfit = weeklyOutfits.find((o) => o.day === day.value);

              return (
                <TabsContent key={day.value} value={day.value} className="mt-0">
                  {outfit ? (
                    <div className="max-w-md mx-auto">
                      <OutfitDisplay
                        outfit={outfit}
                        onRegenerate={() =>
                          handleRegenerateOutfit(day.value as DayOfWeek)
                        }
                        isRegenerating={regeneratingDay === day.value}
                        onFavorite={() => handleToggleFavorite(outfit)}
                        isFavorite={isFavorite(outfit.id)}
                      />
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <p className="text-gray-600">
                        No outfit generated for {day.label}.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleRegenerateOutfit(day.value as DayOfWeek)
                        }
                        disabled={isGenerating || regeneratingDay === day.value}
                        className="mt-4"
                      >
                        {regeneratingDay === day.value ? (
                          <>
                            <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="mr-2 h-3 w-3" />
                            Generate Outfit
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default OutfitsPage;
