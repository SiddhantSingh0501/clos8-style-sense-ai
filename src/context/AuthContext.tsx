
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  user: any | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // In a real implementation, we would connect to Supabase auth here
    // For now, we'll check localStorage to simulate auth state
    const checkAuthState = async () => {
      try {
        const storedUser = localStorage.getItem('clos8-user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Error checking auth state:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuthState();
  }, []);

  const signUp = async (email: string, password: string) => {
    try {
      setLoading(true);
      // In real implementation, we would connect to Supabase auth here
      // For now, we'll simulate a successful signup
      const newUser = { id: 'user-123', email };
      localStorage.setItem('clos8-user', JSON.stringify(newUser));
      setUser(newUser);
      toast({
        title: 'Account created successfully!',
        description: 'Welcome to Clos8!',
      });
      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: 'Error creating account',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      // In real implementation, we would connect to Supabase auth here
      // For now, we'll simulate a successful login
      const loginUser = { id: 'user-123', email };
      localStorage.setItem('clos8-user', JSON.stringify(loginUser));
      setUser(loginUser);
      toast({
        title: 'Logged in successfully!',
        description: 'Welcome back!',
      });
      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: 'Error signing in',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      // In real implementation, we would connect to Supabase auth here
      localStorage.removeItem('clos8-user');
      setUser(null);
      toast({
        title: 'Logged out successfully',
      });
      navigate('/');
    } catch (error: any) {
      toast({
        title: 'Error signing out',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
