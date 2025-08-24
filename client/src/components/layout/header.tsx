import { Link, useLocation } from "wouter";
import { Brain, Bell } from "lucide-react";

export function Header() {
  const [location] = useLocation();

  const navItems = [
    { label: "Dashboard", path: "/dashboard", key: "dashboard" },
    { label: "My Quizzes", path: "/library", key: "library" },
    { label: "Results", path: "/results", key: "results" },
    { label: "Settings", path: "/settings", key: "settings" },
  ];

  const isActive = (path: string) => {
    if (path === location) return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="bg-white border-b border-studywise-gray-200 sticky top-0 z-50" data-testid="header-navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center" data-testid="link-home-logo">
            <Brain className="text-primary text-xl mr-2" />
            <span className="text-xl font-semibold text-studywise-gray-900">StudyWise AI</span>
          </Link>
          
          {/* Navigation Menu */}
          <nav className="hidden md:flex space-x-8" data-testid="nav-main">
            {navItems.map((item) => (
              <Link
                key={item.key}
                href={item.path}
                className={`transition-colors ${
                  isActive(item.path)
                    ? "text-studywise-gray-900 font-medium"
                    : "text-studywise-gray-500 hover:text-studywise-gray-900"
                }`}
                data-testid={`nav-${item.key}`}
              >
                {item.label}
              </Link>
            ))}
            <a href="#" className="text-studywise-gray-500 hover:text-studywise-gray-900" data-testid="link-help">
              Help
            </a>
          </nav>
          
          {/* User Avatar */}
          <div className="flex items-center space-x-4">
            <button className="relative" data-testid="button-notifications">
              <Bell className="text-studywise-gray-400 text-lg" />
            </button>
            <img 
              src="https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=32&h=32&q=80" 
              alt="User Avatar" 
              className="w-8 h-8 rounded-full"
              data-testid="img-user-avatar"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
