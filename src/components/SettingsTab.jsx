
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GeminiSetup from './GeminiSetup';

const SettingsTab = () => {
  return (
    <Tabs defaultValue="api" className="w-full max-w-3xl mx-auto">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="api">API Settings</TabsTrigger>
        <TabsTrigger value="account">Account</TabsTrigger>
      </TabsList>
      <TabsContent value="api" className="mt-6">
        <GeminiSetup />
      </TabsContent>
      <TabsContent value="account" className="mt-6">
        <div className="text-center py-8">
          <h3 className="text-lg font-medium mb-2">Account Settings</h3>
          <p className="text-gray-500">Account settings coming soon</p>
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default SettingsTab;
