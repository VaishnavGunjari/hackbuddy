import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { LogOut, Home, Flame, MessageSquare } from 'lucide-react';

export default function DashboardLayout() {
    const navigate = useNavigate();
    const { logout } = useAuth();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="flex h-screen bg-background">
            {/* Sidebar */}
            <aside className="hidden w-64 border-r bg-card md:flex flex-col">
                <div className="flex h-14 items-center border-b px-4">
                    <Link to="/dashboard" className="flex items-center gap-2 font-bold text-xl text-primary">
                        <Flame className="h-6 w-6" />
                        HackMate
                    </Link>
                </div>
                <nav className="flex-1 space-y-2 p-2 font-medium">
                    <Link to="/dashboard" className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-accent hover:text-accent-foreground">
                        <Home className="h-4 w-4" />
                        Hackathons
                    </Link>
                    <Link to="/dashboard/matches" className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-accent hover:text-accent-foreground">
                        <Flame className="h-4 w-4" />
                        Matches
                    </Link>
                    <Link to="/dashboard/chat" className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-accent hover:text-accent-foreground">
                        <MessageSquare className="h-4 w-4" />
                        Messages
                    </Link>
                </nav>
                <div className="p-4 border-t">
                    <Button variant="outline" className="w-full justify-start gap-2" onClick={handleLogout}>
                        <LogOut className="h-4 w-4" />
                        Log out
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <header className="flex h-14 items-center border-b bg-card px-6 lg:hidden">
                    <Link to="/dashboard" className="font-bold">HackMate</Link>
                </header>
                <div className="p-6">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
