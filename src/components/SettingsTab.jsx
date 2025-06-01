import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

const SettingsTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    gender: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [hasSavedData, setHasSavedData] = useState(false);

  useEffect(() => {
    const loadUserData = async () => {
      if (user) {
        try {
          // Get user data from Supabase
          const { data: { user: userData }, error } = await supabase.auth.getUser();
          
          if (error) throw error;

          if (userData) {
            const userMetadata = userData.user_metadata || {};
            setFormData({
              name: userMetadata.name || '',
              email: userData.email || '',
              gender: userMetadata.gender || ''
            });
            setHasSavedData(!!(userMetadata.name || userMetadata.gender));
          }
        } catch (error) {
          console.error('Error loading user data:', error);
          toast({
            title: "Error",
            description: "Failed to load user data",
            variant: "destructive",
          });
        }
      }
    };

    loadUserData();
  }, [user, toast]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGenderChange = (value) => {
    setFormData(prev => ({
      ...prev,
      gender: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Update user metadata in Supabase
      const { error } = await supabase.auth.updateUser({
        data: {
          name: formData.name,
          gender: formData.gender
        }
      });

      if (error) throw error;

      toast({
        title: "Settings updated",
        description: "Your account settings have been saved successfully.",
      });
      setHasSavedData(true);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating user data:', error);
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = () => {
    // Reset form data to empty values
    setFormData({
      name: '',
      email: user?.email || '',
      gender: ''
    });
    setHasSavedData(false);
    setIsEditing(true);
  };

  const handleCancel = async () => {
    try {
      // Get the latest user data from Supabase
      const { data: { user: userData }, error } = await supabase.auth.getUser();
      
      if (error) throw error;

      if (userData) {
        const userMetadata = userData.user_metadata || {};
        setFormData({
          name: userMetadata.name || '',
          email: userData.email || '',
          gender: userMetadata.gender || ''
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      toast({
        title: "Error",
        description: "Failed to restore previous settings",
        variant: "destructive",
      });
    }
    setIsEditing(false);
    setHasSavedData(true);
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
          <CardDescription>Manage your account preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter your name"
                  disabled={hasSavedData && !isEditing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                  disabled
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select
                  value={formData.gender}
                  onValueChange={handleGenderChange}
                  disabled={hasSavedData && !isEditing}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                type="submit" 
                disabled={isLoading || (hasSavedData && !isEditing)}
                onClick={hasSavedData && !isEditing ? handleEditClick : undefined}
              >
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
              {isEditing && (
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsTab;
