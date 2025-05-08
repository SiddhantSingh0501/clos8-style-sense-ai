
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const AboutPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="flex-grow">
        {/* Hero Section */}
        <section className="bg-primary-100 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-4xl font-bold text-gray-900 mb-6">About Clos8</h1>
              <p className="text-lg text-gray-600">
                Clos8 is a smart wardrobe assistant designed to simplify your daily outfit decisions.
                Using AI-powered recommendations, we help you make the most of your existing wardrobe.
              </p>
            </div>
          </div>
        </section>

        {/* Our Story Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
                <p className="text-gray-600 mb-4">
                  Clos8 was born from a simple observation: despite having full wardrobes, many of us still struggle with the daily question, "What should I wear today?"
                </p>
                <p className="text-gray-600 mb-4">
                  We built Clos8 to solve this problem by combining wardrobe management with intelligent outfit recommendations, helping you look your best without the stress of decision-making.
                </p>
                <p className="text-gray-600">
                  Our mission is to help you rediscover your wardrobe, reduce unnecessary clothing purchases, and make getting dressed the easiest part of your day.
                </p>
              </div>
              <div>
                <img
                  src="https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=800&auto=format"
                  alt="Neatly organized wardrobe"
                  className="rounded-lg shadow-xl"
                />
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900">How Clos8 Works</h2>
              <p className="mt-4 text-xl text-gray-600">
                An intelligent approach to outfit planning
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center mb-5">
                  <span className="text-primary font-bold text-xl">1</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Catalog Your Wardrobe</h3>
                <p className="text-gray-600">
                  Upload photos of your clothing items and categorize them by type, color, and style.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center mb-5">
                  <span className="text-primary font-bold text-xl">2</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">AI Analysis</h3>
                <p className="text-gray-600">
                  Our system uses Google Gemini to analyze your clothing items and find the best combinations.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center mb-5">
                  <span className="text-primary font-bold text-xl">3</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Weekly Outfit Planner</h3>
                <p className="text-gray-600">
                  Get personalized outfit recommendations for each day of the week based on your existing wardrobe.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* AI Technology Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <img
                  src="https://images.unsplash.com/photo-1516110833967-0b5716ca1387?w=800&auto=format"
                  alt="AI Technology"
                  className="rounded-lg shadow-xl"
                />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Powered by AI</h2>
                <p className="text-gray-600 mb-4">
                  Clos8 uses Google's Gemini AI to understand clothing attributes and create harmonious outfit combinations.
                </p>
                <p className="text-gray-600 mb-4">
                  Our system analyzes color theory, style matching, and seasonal appropriateness to create outfits that look great together.
                </p>
                <p className="text-gray-600">
                  The more you use Clos8, the better it learns your preferences and style, creating increasingly personalized recommendations.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-20 bg-primary">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-6">
              Ready to Simplify Your Daily Outfit Decisions?
            </h2>
            <p className="text-xl text-white opacity-90 mb-8 max-w-3xl mx-auto">
              Join Clos8 today and transform how you dress with AI-powered outfit recommendations.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button size="lg" variant="secondary" className="text-primary font-medium" asChild>
                <Link to="/signup">Get Started Now</Link>
              </Button>
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10" asChild>
                <Link to="/login">Sign In</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
      
      <Footer />
    </div>
  );
};

export default AboutPage;
