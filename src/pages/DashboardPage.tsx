import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useWardrobe } from '@/context/WardrobeContext';
import { useOutfit } from '@/context/OutfitContext';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Loader2, ShoppingBag, Calendar, Shirt, RefreshCw } from 'lucide-react';

const DashboardPage = () => {
  const { user } = useAuth();
  const { clothingItems, getItemsByType } = useWardrobe();
  const { weeklyOutfits, getCurrentOutfit, generateWeeklyOutfits, isLoading } = useOutfit();
  
  const upperItems = getItemsByType('upper');
  const bottomItems = getItemsByType('bottom');
  const todayOutfit = getCurrentOutfit();
  
  // Get current day name
  const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  
  useEffect(() => {
    // If we have clothing items but no outfits, generate them automatically on dashboard load
    if (clothingItems.length > 0 && weeklyOutfits.length === 0) {
      generateWeeklyOutfits();
    }
  }, [clothingItems, weeklyOutfits, generateWeeklyOutfits]);
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="flex-grow py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back{user?.firstName ? `, ${user.firstName}` : ''}!</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">My Wardrobe</CardTitle>
              <CardDescription>Your clothing collection</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-3xl font-bold">{clothingItems.length}</p>
                  <p className="text-sm text-gray-500">Total Items</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm"><span className="font-medium">{upperItems.length}</span> Upper items</p>
                  <p className="text-sm"><span className="font-medium">{bottomItems.length}</span> Bottom items</p>
                </div>
              </div>
              <Button variant="outline" className="w-full mt-4" asChild>
                <Link to="/wardrobe">
                  <Shirt className="mr-2 h-4 w-4" />
                  Manage Wardrobe
                </Link>
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Weekly Plan</CardTitle>
              <CardDescription>Your outfit schedule</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-3xl font-bold">{weeklyOutfits.length}</p>
                  <p className="text-sm text-gray-500">Outfits Planned</p>
                </div>
                <div className="text-right">
                  <p className="text-sm">
                    {weeklyOutfits.length > 0 ? 'Complete for this week' : 'No outfits generated'}
                  </p>
                </div>
              </div>
              <Button variant="outline" className="w-full mt-4" asChild>
                <Link to="/outfits">
                  <Calendar className="mr-2 h-4 w-4" />
                  View Weekly Plan
                </Link>
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Shopping List</CardTitle>
              <CardDescription>Items you might need</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-3xl font-bold">0</p>
                  <p className="text-sm text-gray-500">Suggested Items</p>
                </div>
                <div>
                  <p className="text-sm">Coming soon!</p>
                </div>
              </div>
              <Button variant="outline" className="w-full mt-4" disabled>
                <ShoppingBag className="mr-2 h-4 w-4" />
                View Shopping List
              </Button>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-lg">{currentDay}'s Outfit</CardTitle>
                    <CardDescription>Recommended for today</CardDescription>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => generateWeeklyOutfits()}
                    disabled={isLoading || clothingItems.length === 0}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Refresh
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {clothingItems.length === 0 ? (
                  <div className="text-center py-6 bg-gray-50 rounded-lg">
                    <p className="text-gray-600 mb-4">Your wardrobe is empty.</p>
                    <Button asChild>
                      <Link to="/wardrobe">Add Clothing Items</Link>
                    </Button>
                  </div>
                ) : !todayOutfit ? (
                  <div className="text-center py-6 bg-gray-50 rounded-lg">
                    <p className="text-gray-600 mb-4">No outfit planned for today.</p>
                    <Button onClick={() => generateWeeklyOutfits()} disabled={isLoading}>
                      {isLoading ? 'Generating...' : 'Generate Outfits'}
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-2">Top</p>
                      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={todayOutfit.upper.image_url}
                          alt={todayOutfit.upper.name || "Today's top"}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-2">Bottom</p>
                      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={todayOutfit.bottom.image_url}
                          alt={todayOutfit.bottom.name || "Today's bottom"}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
                <CardDescription>Manage your wardrobe</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link to="/wardrobe">
                    <Shirt className="mr-2 h-4 w-4" />
                    Add New Clothing Item
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link to="/outfits">
                    <Calendar className="mr-2 h-4 w-4" />
                    View Weekly Outfits
                  </Link>
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  disabled={clothingItems.length === 0 || isLoading}
                  onClick={() => generateWeeklyOutfits()}
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  {isLoading ? 'Generating Outfits...' : 'Generate New Outfits'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default DashboardPage;
