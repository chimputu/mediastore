// Navbar.tsx
'use client';

import { useState } from 'react';
import { UserButton } from '@clerk/nextjs';
import { Home, Search, Upload, X, Grid3X3, List } from 'lucide-react';

interface NavbarProps {
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploading: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
}

export default function Navbar({
  onUpload,
  uploading,
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
}: NavbarProps) {
  const [showSearch, setShowSearch] = useState(false);

  return (
    <nav className="sticky top-0 z-20 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left - Logo */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-black rounded-lg flex items-center justify-center">
            <Home className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <h1 className="text-base sm:text-lg font-bold text-black hidden sm:block">MediaStore</h1>
        </div>

        {/* Center - Search */}
        <div className="flex-1 max-w-xs sm:max-w-md">
          {showSearch ? (
            <div className="relative">
              <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search media..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full bg-gray-100 border border-gray-200 rounded-xl py-1.5 sm:py-2 pl-8 sm:pl-10 pr-8 sm:pr-10 text-xs sm:text-sm text-black placeholder-gray-400 focus:outline-none focus:border-black transition-colors"
                autoFocus
              />
              <button
                onClick={() => {
                  setShowSearch(false);
                  onSearchChange('');
                }}
                className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 p-0.5 sm:p-1 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowSearch(true)}
              className="w-full bg-gray-100 border border-gray-200 rounded-xl py-1.5 sm:py-2 px-3 sm:px-4 text-xs sm:text-sm text-gray-500 flex items-center gap-1.5 sm:gap-2 hover:bg-gray-200 transition-colors"
            >
              <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Search media...</span>
              <span className="xs:hidden">Search...</span>
            </button>
          )}
        </div>

        {/* Right - Actions */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {/* View Toggle */}
          <div className="hidden sm:flex items-center bg-gray-100 rounded-xl p-0.5">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
              }`}
              title="Grid view"
            >
              <Grid3X3 className="w-4 h-4 text-gray-700" />
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
              }`}
              title="List view"
            >
              <List className="w-4 h-4 text-gray-700" />
            </button>
          </div>

          {/* Upload Button */}
          <label className="cursor-pointer">
            <div className="flex items-center gap-1 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-black hover:bg-gray-800 rounded-xl text-xs sm:text-sm font-medium text-white transition-colors">
              <Upload className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:block">{uploading ? 'Uploading...' : 'Upload'}</span>
              <span className="sm:hidden">{uploading ? '...' : '+'}</span>
            </div>
            <input
              type="file"
              className="hidden"
              onChange={onUpload}
              accept="*/*"
              disabled={uploading}
            />
          </label>

          {/* User */}
          <div className="scale-90 sm:scale-100">
            <UserButton />
          </div>
        </div>
      </div>
    </nav>
  );
}