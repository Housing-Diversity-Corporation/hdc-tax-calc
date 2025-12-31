import React from 'react';
import {
  Menu,
  Calculator,
  Building2,
  User,
  FileText,
  Settings,
  LogOut,
  ChevronRight,
  Moon,
  Sun
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '../ui/navigation-menu';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
} from '../ui/sheet';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../ui/collapsible';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useTheme } from '../../contexts/ThemeContext';
import { tokenService } from '../../services/api';
import { cn } from '../../lib/utils';
import './NavbarShadcn.css';

interface NavbarProps {
  onNavigateHome: () => void;
  onNavigateToAccount: () => void;
  onNavigateToCalculator: () => void;
  onNavigateToTaxProfile: () => void;
  onNavigateToInvestments?: () => void;
  onNavigateToInvestorAnalysis?: () => void;
  onNavigateToSettings: () => void;
  onLogout: () => void;
  currentView?: string;
  showAnalysisTab?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({
  onNavigateHome,
  onNavigateToAccount,
  onNavigateToCalculator,
  onNavigateToTaxProfile,
  onNavigateToInvestments,
  onNavigateToInvestorAnalysis,
  onNavigateToSettings,
  onLogout,
  currentView = '',
  showAnalysisTab = false
}) => {
  const { isDarkMode, toggleTheme } = useTheme();
  const [profileImageUrl, setProfileImageUrl] = React.useState<string>('');
  const [userInitial, setUserInitial] = React.useState<string>('U');
  const [cacheBuster, setCacheBuster] = React.useState<number>(Date.now());
  const [isProfileMenuOpen, setIsProfileMenuOpen] = React.useState(false);

  // Fetch profile image and user info on mount
  React.useEffect(() => {
    setCacheBuster(Date.now());
    const fetchProfileData = async () => {
      try {
        const token = tokenService.getToken();
        if (!token) {
          console.log('No auth token found, using default avatar');
          setUserInitial('U');
          return;
        }

        // Fetch profile image
        const imageResponse = await fetch('http://localhost:8080/api/user/profile-image/url', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (imageResponse.ok) {
          const imageData = await imageResponse.json();
          setProfileImageUrl(imageData.imageUrl || '');
        }

        // Fetch user info for initial
        const userResponse = await fetch('http://localhost:8080/api/account/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (userResponse.ok) {
          const userData = await userResponse.json();
          const initial = userData.fullName?.charAt(0).toUpperCase() || userData.username?.charAt(0).toUpperCase() || 'U';
          setUserInitial(initial);
        }
      } catch (error) {
        console.error('Failed to fetch profile data:', error);
        setUserInitial('U');
      }
    };

    fetchProfileData();
  }, []);

  return (
    <nav className="navbar">
      <div className="navbar-content">
        {/* Left: Logo */}
        <div className="navbar-left">
          <img
            src={isDarkMode ? '/HDCLOGOWhiteCenter.png' : '/HDCLOGOBlk.png'}
            alt="HDC Logo"
            className="navbar-logo"
            onClick={onNavigateHome}
            style={{ cursor: 'pointer' }}
          />
        </div>

        {/* Center: Navigation Menu - Desktop */}
        <div className="navbar-center">
          <NavigationMenu className="desktop-only">
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger
                  className={cn(
                    "nav-link bg-transparent hover:bg-[rgba(255,255,255,0.1)]",
                    (currentView === 'calculator' || currentView === 'investments' || currentView === 'investor-analysis') && 'active'
                  )}
                >
                  <Building2 className="h-4 w-4 mr-2" />
                  OZ Benefits
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[240px] gap-1 p-2">
                    <li>
                      <NavigationMenuLink asChild>
                        <Button
                          variant="ghost"
                          onClick={onNavigateToCalculator}
                          className="flex items-center w-full select-none rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground justify-start h-auto font-medium"
                        >
                          <Calculator className="mr-2 h-4 w-4" />
                          <span className="text-sm font-medium">OZ Benefits Calculator</span>
                        </Button>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink asChild>
                        <Button
                          variant="ghost"
                          onClick={() => onNavigateToInvestments && onNavigateToInvestments()}
                          className="flex items-center w-full select-none rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground justify-start h-auto font-medium"
                        >
                          <Building2 className="mr-2 h-4 w-4" />
                          <span className="text-sm font-medium">Available Investments</span>
                        </Button>
                      </NavigationMenuLink>
                    </li>
                    {showAnalysisTab && (
                      <li>
                        <NavigationMenuLink asChild>
                          <Button
                            variant="ghost"
                            onClick={() => onNavigateToInvestorAnalysis && onNavigateToInvestorAnalysis()}
                            className="flex items-center w-full select-none rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground justify-start h-auto font-medium"
                          >
                            <Calculator className="mr-2 h-4 w-4" />
                            <span className="text-sm font-medium">Investment Analysis</span>
                          </Button>
                        </NavigationMenuLink>
                      </li>
                    )}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Right: Profile Avatar & Hamburger */}
        <div className="navbar-right">
          {/* Profile Menu */}
          <Popover open={isProfileMenuOpen} onOpenChange={setIsProfileMenuOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-8 w-8 min-h-8 min-w-8 max-h-8 max-w-8 rounded-full p-0 shrink-0"
                style={{ height: '32px', width: '32px', minHeight: '32px', minWidth: '32px', maxHeight: '32px', maxWidth: '32px' }}
                onMouseEnter={() => setIsProfileMenuOpen(true)}
                onMouseLeave={() => setIsProfileMenuOpen(false)}
              >
                <Avatar className="h-8 w-8" style={{ height: '32px', width: '32px' }}>
                  <AvatarImage
                    src={profileImageUrl ? `${profileImageUrl}?t=${cacheBuster}` : undefined}
                    alt="Profile"
                    className="object-cover h-full w-full"
                    style={{ height: '32px', width: '32px', objectFit: 'cover' }}
                  />
                  <AvatarFallback className="bg-[#7fbd45] text-white text-sm">{userInitial}</AvatarFallback>
                </Avatar>
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="w-56 p-1"
              onMouseEnter={() => setIsProfileMenuOpen(true)}
              onMouseLeave={() => setIsProfileMenuOpen(false)}
            >
              <Button
                variant="ghost"
                onClick={() => {
                  onNavigateToAccount();
                  setIsProfileMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors justify-start h-auto font-normal"
              >
                <User className="h-4 w-4" />
                Account
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  onNavigateToTaxProfile();
                  setIsProfileMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors justify-start h-auto font-normal"
              >
                <FileText className="h-4 w-4" />
                Tax Profile
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  onNavigateToSettings();
                  setIsProfileMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors justify-start h-auto font-normal"
              >
                <Settings className="h-4 w-4" />
                Settings
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  toggleTheme();
                }}
                className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors justify-start h-auto font-normal"
              >
                {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {isDarkMode ? 'Light Mode' : 'Dark Mode'}
              </Button>
              <div className="h-px bg-border my-1" />
              <Button
                variant="ghost"
                onClick={() => {
                  onLogout();
                  setIsProfileMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors justify-start h-auto font-normal"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </PopoverContent>
          </Popover>

          {/* Hamburger Menu (Mobile) */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="mobile-only">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="top" className="bg-background/95 backdrop-blur-sm max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <img
                    src={isDarkMode ? '/HDCLOGOWhiteCenter.png' : '/HDCLOGOBlk.png'}
                    alt="HDC Logo"
                    className="h-6"
                  />
                  <span className="font-semibold text-foreground">HDC Calculator</span>
                </div>
              </div>
              <nav className="grid gap-2 py-6">
                <Collapsible className="grid gap-2">
                  <CollapsibleTrigger className="flex w-full items-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100 hover:text-gray-900 focus:bg-gray-100 focus:text-gray-900 focus:outline-none disabled:pointer-events-none disabled:opacity-50 [&[data-state=open]>svg]:rotate-90 dark:hover:bg-gray-800 dark:hover:text-gray-50 dark:focus:bg-gray-800 dark:focus:text-gray-50">
                    OZ Benefits
                    <ChevronRight className="ml-auto h-5 w-5 transition-all" />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="-mx-6 grid gap-2 bg-gray-100 p-6 dark:bg-gray-800">
                      <SheetClose asChild>
                        <Button
                          variant="ghost"
                          onClick={onNavigateToCalculator}
                          className="flex w-full items-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-200 hover:text-gray-900 focus:bg-gray-200 focus:text-gray-900 focus:outline-none disabled:pointer-events-none disabled:opacity-50 dark:hover:bg-gray-700 dark:hover:text-gray-50 dark:focus:bg-gray-700 dark:focus:text-gray-50 justify-start h-auto"
                        >
                          <Calculator className="mr-2 h-4 w-4" />
                          OZ Benefits Calculator
                        </Button>
                      </SheetClose>
                      <SheetClose asChild>
                        <Button
                          variant="ghost"
                          onClick={() => onNavigateToInvestments && onNavigateToInvestments()}
                          className="flex w-full items-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-200 hover:text-gray-900 focus:bg-gray-200 focus:text-gray-900 focus:outline-none disabled:pointer-events-none disabled:opacity-50 dark:hover:bg-gray-700 dark:hover:text-gray-50 dark:focus:bg-gray-700 dark:focus:text-gray-50 justify-start h-auto"
                        >
                          <Building2 className="mr-2 h-4 w-4" />
                          Available Investments
                        </Button>
                      </SheetClose>
                      {showAnalysisTab && (
                        <SheetClose asChild>
                          <Button
                            variant="ghost"
                            onClick={() => onNavigateToInvestorAnalysis && onNavigateToInvestorAnalysis()}
                            className="flex w-full items-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-200 hover:text-gray-900 focus:bg-gray-200 focus:text-gray-900 focus:outline-none disabled:pointer-events-none disabled:opacity-50 dark:hover:bg-gray-700 dark:hover:text-gray-50 dark:focus:bg-gray-700 dark:focus:text-gray-50 justify-start h-auto"
                          >
                            <Calculator className="mr-2 h-4 w-4" />
                            Investment Analysis
                          </Button>
                        </SheetClose>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
                <Collapsible className="grid gap-2">
                  <CollapsibleTrigger className="flex w-full items-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100 hover:text-gray-900 focus:bg-gray-100 focus:text-gray-900 focus:outline-none disabled:pointer-events-none disabled:opacity-50 [&[data-state=open]>svg]:rotate-90 dark:hover:bg-gray-800 dark:hover:text-gray-50 dark:focus:bg-gray-800 dark:focus:text-gray-50">
                    Account
                    <ChevronRight className="ml-auto h-5 w-5 transition-all" />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="-mx-6 grid gap-2 bg-gray-100 p-6 dark:bg-gray-800">
                      <SheetClose asChild>
                        <Button
                          variant="ghost"
                          onClick={onNavigateToAccount}
                          className="flex w-full items-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-200 hover:text-gray-900 focus:bg-gray-200 focus:text-gray-900 focus:outline-none disabled:pointer-events-none disabled:opacity-50 dark:hover:bg-gray-700 dark:hover:text-gray-50 dark:focus:bg-gray-700 dark:focus:text-gray-50 justify-start h-auto"
                        >
                          <User className="mr-2 h-4 w-4" />
                          Account Page
                        </Button>
                      </SheetClose>
                      <SheetClose asChild>
                        <Button
                          variant="ghost"
                          onClick={onNavigateToTaxProfile}
                          className="flex w-full items-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-200 hover:text-gray-900 focus:bg-gray-200 focus:text-gray-900 focus:outline-none disabled:pointer-events-none disabled:opacity-50 dark:hover:bg-gray-700 dark:hover:text-gray-50 dark:focus:bg-gray-700 dark:focus:text-gray-50 justify-start h-auto"
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          Tax Profile
                        </Button>
                      </SheetClose>
                      <SheetClose asChild>
                        <Button
                          variant="ghost"
                          onClick={onNavigateToSettings}
                          className="flex w-full items-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-200 hover:text-gray-900 focus:bg-gray-200 focus:text-gray-900 focus:outline-none disabled:pointer-events-none disabled:opacity-50 dark:hover:bg-gray-700 dark:hover:text-gray-50 dark:focus:bg-gray-700 dark:focus:text-gray-50 justify-start h-auto"
                        >
                          <Settings className="mr-2 h-4 w-4" />
                          Settings
                        </Button>
                      </SheetClose>
                      <Button
                        variant="ghost"
                        onClick={toggleTheme}
                        className="flex w-full items-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-200 hover:text-gray-900 focus:bg-gray-200 focus:text-gray-900 focus:outline-none disabled:pointer-events-none disabled:opacity-50 dark:hover:bg-gray-700 dark:hover:text-gray-50 dark:focus:bg-gray-700 dark:focus:text-gray-50 justify-start h-auto"
                      >
                        {isDarkMode ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                        {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                      </Button>
                      <div className="h-px bg-border my-2" />
                      <SheetClose asChild>
                        <Button
                          variant="ghost"
                          onClick={onLogout}
                          className="flex w-full items-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-200 hover:text-gray-900 focus:bg-gray-200 focus:text-gray-900 focus:outline-none disabled:pointer-events-none disabled:opacity-50 dark:hover:bg-gray-700 dark:hover:text-gray-50 dark:focus:bg-gray-700 dark:focus:text-gray-50 justify-start h-auto"
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          Logout
                        </Button>
                      </SheetClose>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
