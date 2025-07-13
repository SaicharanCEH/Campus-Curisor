
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bus, Search, User, LogOut, Bell, MessageSquare } from 'lucide-react';
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
import { getNotifications } from '@/ai/flows/get-notifications';
import type { Notification } from '@/types';
import { formatDistanceToNow } from 'date-fns';

interface DashboardHeaderProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

interface SearchResult {
  busRoute: string;
  estimatedArrivalTime: string;
  stops?: { name: string; eta: string }[];
  confidenceScore: number;
}

export default function DashboardHeader({
  isAuthenticated,
  onLogout,
}: DashboardHeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [hasUnread, setHasUnread] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isAuthenticated) {
      const fetchNotifications = async () => {
        const fetchedNotifications = await getNotifications();
        setNotifications(fetchedNotifications);
        const lastViewed = localStorage.getItem('lastNotificationView');
        if (fetchedNotifications.length > 0 && (!lastViewed || new Date(lastViewed) < new Date(fetchedNotifications[0].timestamp))) {
            setHasUnread(true);
        }
      };
      fetchNotifications();
    }
  }, [isAuthenticated]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setSearchResult(null);

    try {
      const result = await naturalLanguageBusSearch({
        query: searchQuery.trim(),
      });
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
  
  const handleBellClick = () => {
    if (hasUnread) {
        setHasUnread(false);
        localStorage.setItem('lastNotificationView', new Date().toISOString());
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
        {isLoading && <Skeleton className="w-[300px] h-24 rounded-lg ml-auto" />}
        {!isLoading && searchResult && (
          <Card className="absolute top-20 sm:right-40 md:right-48 lg:right-60 z-50 w-full max-w-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Search Result</CardTitle>
              <CardDescription>
                Found based on your query: &quot;{searchQuery}&quot;
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-2">
                <strong>Route:</strong> {searchResult.busRoute}
              </p>
              <strong>Stops:</strong>
              <ul>
                {searchResult.stops?.map((stop, index) => (<li key={index}>{stop.name} (ETA: {stop.eta})</li>))}
              </ul>
            </CardContent>
            <CardFooter className="pt-0 text-sm text-muted-foreground">
              Confidence: {Math.round(searchResult.confidenceScore * 100)}%
            </CardFooter>
          </Card>
        )}
        
        {isAuthenticated && (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full relative" onClick={handleBellClick}>
                        <Bell className="h-5 w-5" />
                        {hasUnread && <span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-destructive" />}
                        <span className="sr-only">Toggle notifications</span>
                    </Button>
                </DropdownMenuTrigger>
                 <DropdownMenuContent align="end" className="w-80">
                    <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {notifications.length > 0 ? (
                        notifications.map(notif => (
                            <DropdownMenuItem key={notif.id} className="flex flex-col items-start gap-1 whitespace-normal">
                                <p className="font-medium text-sm">{notif.message}</p>
                                <p className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(notif.timestamp), { addSuffix: true })}
                                </p>
                            </DropdownMenuItem>
                        ))
                    ) : (
                         <div className="flex flex-col items-center justify-center p-4 text-center">
                            <MessageSquare className="h-8 w-8 text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">No notifications yet.</p>
                        </div>
                    )}
                 </DropdownMenuContent>
            </DropdownMenu>
        )}

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
              <DropdownMenuItem asChild><Link href="/profile">Profile</Link></DropdownMenuItem>
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
