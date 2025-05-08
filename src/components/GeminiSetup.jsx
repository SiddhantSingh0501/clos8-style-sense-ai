
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { setGeminiApiKey, getGeminiApiKey } from '@/services/geminiService';
import { useToast } from '@/hooks/use-toast';

const GeminiSetup = () => {
  const [apiKey, setApiKey] = useState('');
  const [isKeySet, setIsKeySet] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const savedKey = getGeminiApiKey();
    if (savedKey) {
      setApiKey(savedKey);
      setIsKeySet(true);
    }
  }, []);

  const handleSave = () => {
    if (!apiKey.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a valid API key',
        variant: 'destructive',
      });
      return;
    }

    setGeminiApiKey(apiKey);
    setIsKeySet(true);
    
    toast({
      title: 'Success',
      description: 'Gemini API key has been saved',
    });
  };

  const handleClear = () => {
    setApiKey('');
    setIsKeySet(false);
    localStorage.removeItem('GEMINI_API_KEY');
    
    toast({
      title: 'API Key Removed',
      description: 'Your Gemini API key has been removed',
    });
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Gemini API Setup</CardTitle>
        <CardDescription>
          Configure your Gemini API key for AI-powered outfit suggestions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">Gemini API Key</Label>
            <Input
              id="apiKey"
              type="password" 
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Gemini API key"
              className="w-full"
            />
            <p className="text-sm text-gray-500 mt-1">
              Your API key is stored locally in your browser and is never sent to our servers.
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={handleClear}>
          {isKeySet ? "Remove API Key" : "Cancel"}
        </Button>
        <Button onClick={handleSave}>Save API Key</Button>
      </CardFooter>
    </Card>
  );
};

export default GeminiSetup;
