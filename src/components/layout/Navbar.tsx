
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { Menu, X } from 'lucide-react';

export function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  
  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <nav className="bg-white border-b border-gray-200 py-4 px-6 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/" className="text-2xl font-bold text-primary">
            Clos8
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          {user ? (
            <>
              <Link to="/dashboard" className="text-gray-600 hover:text-primary">
                Dashboard
              </Link>
              <Link to="/wardrobe" className="text-gray-600 hover:text-primary">
                My Wardrobe
              </Link>
              <Link to="/outfits" className="text-gray-600 hover:text-primary">
                Outfits
              </Link>
              <Button variant="outline" onClick={handleSignOut}>
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link to="/about" className="text-gray-600 hover:text-primary">
                About
              </Link>
              <Link to="/login" className="text-gray-600 hover:text-primary">
                Login
              </Link>
              <Button asChild>
                <Link to="/signup">Sign Up</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <Button variant="ghost" size="icon" onClick={toggleMenu}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden pt-4 pb-3 border-t border-gray-200 mt-3">
          <div className="space-y-3 px-4">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="block text-gray-600 hover:bg-gray-50 p-2 rounded"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  to="/wardrobe"
                  className="block text-gray-600 hover:bg-gray-50 p-2 rounded"
                  onClick={() => setIsMenuOpen(false)}
                >
                  My Wardrobe
                </Link>
                <Link
                  to="/outfits"
                  className="block text-gray-600 hover:bg-gray-50 p-2 rounded"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Outfits
                </Link>
                <Button variant="outline" onClick={handleSignOut} className="w-full">
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link
                  to="/about"
                  className="block text-gray-600 hover:bg-gray-50 p-2 rounded"
                  onClick={() => setIsMenuOpen(false)}
                >
                  About
                </Link>
                <Link
                  to="/login"
                  className="block text-gray-600 hover:bg-gray-50 p-2 rounded"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
                <Button className="w-full" asChild>
                  <Link to="/signup" onClick={() => setIsMenuOpen(false)}>
                    Sign Up
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
