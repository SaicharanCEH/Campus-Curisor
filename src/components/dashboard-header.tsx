'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Bus, Search, User, LogOut, ChevronDown, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { naturalLanguageBusSearch } from '@/ai/flows/natural-language-bus-search';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './ui/card';
import { Skeleton } from './ui/skeleton';

interface DashboardHeaderProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

interface SearchResult {
  busRoute: string;
  estimatedArrivalTime: string;
  confidenceScore: number;
}

export default function DashboardHeader({
  isAuthenticated,
  onLogout,
}: DashboardHeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setSearchResult(null);

    try {
      const result = await naturalLanguageBusSearch({ query: searchQuery });
      setSearchResult(result);
    } catch (error) {
      console.error('Search failed:', error);
      toast({
        variant: 'destructive',
        title: 'Search Error',
        description: 'Could not perform the search. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      <Link href="/" className="flex items-center gap-2 font-semibold">
        <Bus className="h-6 w-6 text-primary" />
        <span className="font-headline text-lg">Campus Cruiser</span>
      </Link>
      <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <form onSubmit={handleSearch} className="ml-auto flex-1 sm:flex-initial">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="e.g., 'Next bus to the library'"
              className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </form>
        {isLoading && <Skeleton className="w-[300px] h-24 rounded-lg" />}
        {!isLoading && searchResult && (
          <Card className="absolute top-20 sm:right-40 md:right-48 lg:right-60 z-50 w-full max-w-sm">
            <CardHeader>
              <CardTitle className="text-base">Search Result</CardTitle>
              <CardDescription>
                Found based on your query: &quot;{searchQuery}&quot;
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>
                <strong>Route:</strong> {searchResult.busRoute}
              </p>
              <p>
                <strong>ETA:</strong> {searchResult.estimatedArrivalTime}
              </p>
            </CardContent>
            <CardFooter className="text-sm text-muted-foreground">
              Confidence: {Math.round(searchResult.confidenceScore * 100)}%
            </CardFooter>
          </Card>
        )}

        <Button variant="ghost" size="icon" className="rounded-full">
            <Bell className="h-5 w-5" />
            <span className="sr-only">Toggle notifications</span>
        </Button>

        {isAuthenticated ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full">
                <User className="h-5 w-5" />
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuItem>Support</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button asChild>
            <Link href="/login">Login</Link>
          </Button>
        )}
      </div>
    </header>
  );
}
