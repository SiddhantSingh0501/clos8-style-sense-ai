
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useOutfit } from '@/context/OutfitContext';
import { useWardrobe } from '@/context/WardrobeContext';
import { Outfit } from '@/types';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { RefreshCw } from 'lucide-react';

const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' },
];

const OutfitDisplay = ({ outfit }: { outfit: Outfit }) => {
  return (
    <Card className="outfit-card">
      <CardContent className="p-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm font-medium text-gray-500 mb-2">Top</div>
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
              <img 
                src={outfit.upper.imageUrl} 
                alt={outfit.upper.name || "Upper clothing"} 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500 mb-2">Bottom</div>
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
              <img 
                src={outfit.bottom.imageUrl} 
                alt={outfit.bottom.name || "Bottom clothing"} 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const OutfitsPage = () => {
  const { weeklyOutfits, generateWeeklyOutfits, isLoading } = useOutfit();
  const { clothingItems } = useWardrobe();
  
  useEffect(() => {
    // If we have clothing items but no outfits, generate them automatically
    if (clothingItems.length > 0 && weeklyOutfits.length === 0) {
      generateWeeklyOutfits();
    }
  }, [clothingItems, weeklyOutfits, generateWeeklyOutfits]);
  
  const handleGenerateOutfits = () => {
    generateWeeklyOutfits();
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-grow py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Weekly Outfits</h1>
            <p className="text-gray-600 mt-1">Your AI-powered outfit suggestions for the week</p>
          </div>
          <Button 
            className="mt-4 md:mt-0"
            onClick={handleGenerateOutfits}
            disabled={isLoading || clothingItems.length === 0}
          >
            {isLoading ? (
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
        
        {clothingItems.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Your wardrobe is empty</h3>
            <p className="text-gray-600 mb-4">
              Add some clothes to your wardrobe to get outfit recommendations.
            </p>
            <Button asChild>
              <a href="/wardrobe">Go to My Wardrobe</a>
            </Button>
          </div>
        ) : weeklyOutfits.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No outfits generated yet</h3>
            <p className="text-gray-600 mb-4">
              Generate your weekly outfit plan to get started.
            </p>
            <Button 
              onClick={handleGenerateOutfits}
              disabled={isLoading}
            >
              {isLoading ? 'Generating...' : 'Generate Outfits'}
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="monday">
            <TabsList className="mb-6">
              {DAYS_OF_WEEK.map((day) => (
                <TabsTrigger key={day.value} value={day.value}>
                  {day.label}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {DAYS_OF_WEEK.map((day) => {
              const outfit = weeklyOutfits.find(o => o.day === day.value);
              
              return (
                <TabsContent key={day.value} value={day.value} className="mt-0">
                  {outfit ? (
                    <div className="max-w-md mx-auto">
                      <OutfitDisplay outfit={outfit} />
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <p className="text-gray-600">No outfit generated for {day.label}.</p>
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
