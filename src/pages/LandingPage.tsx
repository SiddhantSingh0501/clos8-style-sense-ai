
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

const LandingPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-primary-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="md:w-1/2 space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">
                Your Smart Wardrobe Assistant
              </h1>
              <p className="text-xl text-gray-600">
                Clos8 helps you plan outfits and match clothing intelligently using AI recommendations.
                Never worry about what to wear again!
              </p>
              <div className="pt-4 flex flex-col sm:flex-row gap-4">
                <Button size="lg" asChild>
                  <Link to="/signup">Get Started</Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link to="/login">Sign In</Link>
                </Button>
              </div>
            </div>
            <div className="md:w-1/2">
              <img
                src="https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=800&auto=format"
                alt="Organized wardrobe"
                className="rounded-lg shadow-xl w-full h-auto object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Key Features</h2>
            <p className="mt-4 text-xl text-gray-600">
              Discover how Clos8 transforms your daily outfit planning
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center mb-5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Daily Outfit Generator</h3>
              <p className="text-gray-600">
                Get intelligent outfit suggestions for each day of the week based on your wardrobe.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center mb-5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">AI-Powered Matching</h3>
              <p className="text-gray-600">
                Our intelligent system uses Google Gemini to find perfect clothing combinations.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center mb-5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Wardrobe Management</h3>
              <p className="text-gray-600">
                Easily organize and categorize your clothing collection with detailed metadata.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">How It Works</h2>
            <p className="mt-4 text-xl text-gray-600">
              Simple steps to transform your daily outfit planning
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="h-16 w-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6 text-white text-xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Add Your Clothes</h3>
              <p className="text-gray-600">
                Upload photos and categorize your clothing items with our easy-to-use form.
              </p>
            </div>

            <div className="text-center">
              <div className="h-16 w-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6 text-white text-xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">Generate Outfits</h3>
              <p className="text-gray-600">
                Let our AI analyze your wardrobe and create perfect matching outfits.
              </p>
            </div>

            <div className="text-center">
              <div className="h-16 w-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6 text-white text-xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Plan Your Week</h3>
              <p className="text-gray-600">
                View your weekly outfit schedule and never stress about what to wear.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to Transform Your Wardrobe Experience?
          </h2>
          <p className="text-xl text-white opacity-90 mb-8 max-w-3xl mx-auto">
            Join Clos8 today and let our smart assistant help you look your best every day.
          </p>
          <Button size="lg" variant="secondary" className="text-primary font-medium" asChild>
            <Link to="/signup">Get Started Now</Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LandingPage;
