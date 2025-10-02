'use client';

import { Button } from '@/components/ui/button2';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { useState } from 'react';

const SettingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 11 8 11 8a13.16 13.16 0 0 1-1.67 2.68"/>
    <path d="M6.61 6.61A13.526 13.526 0 0 0 1 12s4 8 11 8a9.74 9.74 0 0 0 5.39-1.61"/>
    <line x1="2" y1="2" x2="22" y2="22"/>
  </svg>
);

export default function Header() {
  const [hyperBrowserApiKey, setHyperBrowserApiKey] = useState('');
  const [twelveLabsApiKey, setTwelveLabsApiKey] = useState('');
  const [showHyperBrowserApiKey, setShowHyperBrowserApiKey] = useState(false);
  const [showTwelveLabsApiKey, setShowTwelveLabsApiKey] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleHyperBrowserApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHyperBrowserApiKey(e.target.value);
  };

  const handleTwelveLabsApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTwelveLabsApiKey(e.target.value);
  };

  const toggleHyperBrowserApiKeyVisibility = () => {
    setShowHyperBrowserApiKey(!showHyperBrowserApiKey);
  };

  const toggleTwelveLabsApiKeyVisibility = () => {
    setShowTwelveLabsApiKey(!showTwelveLabsApiKey);
  };

  return (
    <header className="w-full bg-[#171717]">
      <div className="flex justify-end items-center h-16 px-8">
        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <DialogTrigger asChild>
            <Button
              size="icon"
              className="bg-[#FAFAFA] text-[#18181B] hover:bg-[#E4E4E7] p-2.5 rounded-md transition-colors shadow-sm"
            >
              <SettingsIcon />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] bg-[#171717] border-gray-800">
            <DialogHeader>
              <DialogTitle className="text-[#FAFAFA] text-xl">Environment Variables</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              {/* Hyperbrowser API Key */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="hyperbrowser-api-key" className="text-[#FAFAFA] text-sm font-medium">
                    HYPERBROWSER_API_KEY
                  </label>
                  <a 
                    href="https://app.hyperbrowser.ai/settings?tab=api_key" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 text-xs underline"
                  >
                    Get API Key
                  </a>
                </div>
                <div className="relative">
                  <Input
                    id="hyperbrowser-api-key"
                    type={showHyperBrowserApiKey ? 'text' : 'password'}
                    value={hyperBrowserApiKey}
                    onChange={handleHyperBrowserApiKeyChange}
                    placeholder="Enter your Hyperbrowser API key"
                    className="w-full bg-[#262626] border-gray-600 text-[#FAFAFA] placeholder-gray-400 focus:border-gray-400 pr-10"
                  />
                  <Button
                    type="button"
                    onClick={toggleHyperBrowserApiKeyVisibility}
                    size="icon"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 bg-transparent hover:bg-gray-700 text-gray-400 hover:text-[#FAFAFA] p-0"
                  >
                    {showHyperBrowserApiKey ? <EyeOffIcon /> : <EyeIcon />}
                  </Button>
                </div>
                <p className="text-gray-400 text-xs">
                  This API key will be used to authenticate with the Hyperbrowser service.
                </p>
              </div>

              {/* Twelve Labs API Key */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="twelvelabs-api-key" className="text-[#FAFAFA] text-sm font-medium">
                    TWELVELABS_API_KEY
                  </label>
                  <a 
                    href="https://playground.twelvelabs.io/dashboard/api-keys" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 text-xs underline"
                  >
                    Get API Key
                  </a>
                </div>
                <div className="relative">
                  <Input
                    id="twelvelabs-api-key"
                    type={showTwelveLabsApiKey ? 'text' : 'password'}
                    value={twelveLabsApiKey}
                    onChange={handleTwelveLabsApiKeyChange}
                    placeholder="Enter your Twelve Labs API key"
                    className="w-full bg-[#262626] border-gray-600 text-[#FAFAFA] placeholder-gray-400 focus:border-gray-400 pr-10"
                  />
                  <Button
                    type="button"
                    onClick={toggleTwelveLabsApiKeyVisibility}
                    size="icon"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 bg-transparent hover:bg-gray-700 text-gray-400 hover:text-[#FAFAFA] p-0"
                  >
                    {showTwelveLabsApiKey ? <EyeOffIcon /> : <EyeIcon />}
                  </Button>
                </div>
                <p className="text-gray-400 text-xs">
                  This API key will be used to authenticate with the Twelve Labs video analysis service.
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </header>
  );
}
