import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { Shirt, Menu, X, Home, Calendar, Settings, LogOut, User } from 'lucide-react';

export const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const location = useLocation();
  
  const isActive = (path) => {
    return location.pathname === path;
  };
  
  const toggleMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  const closeMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className="bg-white shadow-sm">
      <nav className="mx-auto flex max-w-7xl items-center justify-between p-4 lg:px-8" aria-label="Global">
        <div className="flex lg:flex-1">
          <Link to={user ? "/dashboard" : "/"} className="-m-1.5 p-1.5 flex items-center" onClick={closeMenu}>
            <Shirt className="h-8 w-8 text-primary" />
            <span className="ml-2 text-xl font-bold">Clos8</span>
          </Link>
        </div>
        
        <div className="flex lg:hidden">
          <button
            type="button"
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
            onClick={toggleMenu}
          >
            <span className="sr-only">Open main menu</span>
            {mobileMenuOpen ? (
              <X className="h-6 w-6" aria-hidden="true" />
            ) : (
              <Menu className="h-6 w-6" aria-hidden="true" />
            )}
          </button>
        </div>
        
        <div className="hidden lg:flex lg:gap-x-8">
          {!user ? (
            <>
              <Link to="/" className={`text-sm font-semibold leading-6 ${isActive('/') ? 'text-primary' : 'text-gray-900'}`}>
                Home
              </Link>
              <Link to="/about" className={`text-sm font-semibold leading-6 ${isActive('/about') ? 'text-primary' : 'text-gray-900'}`}>
                About
              </Link>
            </>
          ) : (
            <>
              <Link to="/dashboard" className={`text-sm font-semibold leading-6 ${isActive('/dashboard') ? 'text-primary' : 'text-gray-900'} flex items-center`}>
                <Home className="mr-1 h-4 w-4" /> Dashboard
              </Link>
              <Link to="/wardrobe" className={`text-sm font-semibold leading-6 ${isActive('/wardrobe') ? 'text-primary' : 'text-gray-900'} flex items-center`}>
                <Shirt className="mr-1 h-4 w-4" /> Wardrobe
              </Link>
              <Link to="/outfits" className={`text-sm font-semibold leading-6 ${isActive('/outfits') ? 'text-primary' : 'text-gray-900'} flex items-center`}>
                <Calendar className="mr-1 h-4 w-4" /> Outfits
              </Link>
              <Link to="/settings" className={`text-sm font-semibold leading-6 ${isActive('/settings') ? 'text-primary' : 'text-gray-900'} flex items-center`}>
                <Settings className="mr-1 h-4 w-4" /> Settings
              </Link>
            </>
          )}
        </div>
        
        <div className="hidden lg:flex lg:flex-1 lg:justify-end">
          {!user ? (
            <Link to="/login" className="text-sm font-semibold leading-6 text-gray-900">
              Log in <span aria-hidden="true">&rarr;</span>
            </Link>
          ) : (
            <Button variant="ghost" onClick={signOut} className="text-sm font-semibold leading-6">
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </Button>
          )}
        </div>
      </nav>
      
      {/* Mobile menu, show/hide based on mobile menu state */}
      {mobileMenuOpen && (
        <div className="lg:hidden" role="dialog" aria-modal="true">
          <div className="fixed inset-0 z-10"></div>
          <div className="fixed inset-y-0 right-0 z-10 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
            <div className="flex items-center justify-between">
              <Link to={user ? "/dashboard" : "/"} className="-m-1.5 p-1.5 flex items-center" onClick={closeMenu}>
                <Shirt className="h-8 w-8 text-primary" />
                <span className="ml-2 text-xl font-bold">Clos8</span>
              </Link>
              <button
                type="button"
                className="-m-2.5 rounded-md p-2.5 text-gray-700"
                onClick={closeMenu}
              >
                <span className="sr-only">Close menu</span>
                <X className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-6 flow-root">
              <div className="-my-6 divide-y divide-gray-500/10">
                <div className="space-y-2 py-6">
                  {!user ? (
                    <>
                      <Link
                        to="/"
                        className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                        onClick={closeMenu}
                      >
                        Home
                      </Link>
                      <Link
                        to="/about"
                        className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                        onClick={closeMenu}
                      >
                        About
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/dashboard"
                        className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50 flex items-center"
                        onClick={closeMenu}
                      >
                        <Home className="mr-2 h-4 w-4" /> Dashboard
                      </Link>
                      <Link
                        to="/wardrobe"
                        className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50 flex items-center"
                        onClick={closeMenu}
                      >
                        <Shirt className="mr-2 h-4 w-4" /> My Wardrobe
                      </Link>
                      <Link
                        to="/outfits"
                        className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50 flex items-center"
                        onClick={closeMenu}
                      >
                        <Calendar className="mr-2 h-4 w-4" /> Weekly Outfits
                      </Link>
                      <Link
                        to="/settings"
                        className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50 flex items-center"
                        onClick={closeMenu}
                      >
                        <Settings className="mr-2 h-4 w-4" /> Settings
                      </Link>
                    </>
                  )}
                </div>
                <div className="py-6">
                  {!user ? (
                    <Link
                      to="/login"
                      className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                      onClick={closeMenu}
                    >
                      Log in
                    </Link>
                  ) : (
                    <>
                      <div className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-500 flex items-center">
                        <User className="mr-2 h-4 w-4" /> {user.email}
                      </div>
                      <button
                        onClick={() => { signOut(); closeMenu(); }}
                        className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50 w-full text-left flex items-center"
                      >
                        <LogOut className="mr-2 h-4 w-4" /> Sign out
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
