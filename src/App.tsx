import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import MembersGate from "./pages/MembersGate";
import Charter from "./pages/Charter";
import AdminLogin from "./pages/AdminLogin";
import Admin from "./pages/Admin";
import NewsDetail from "./pages/NewsDetail";
import Auth from "./pages/Auth";
import ResetPasswordRequest from "./pages/ResetPasswordRequest";
import ResetPassword from "./pages/ResetPassword";
import Profile from "./pages/Profile";
import UsersAdmin from "./components/admin/UsersAdmin";
import ReportsAdmin from "./components/admin/ReportsAdmin";
import NotFound from "./pages/NotFound";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Компонент который рендерит приложение только после загрузки AuthContext
function AppContent() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center">
        <div className="text-white text-lg">Загрузка...</div>
      </div>
    );
  }

  return (
    <>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/members" element={<MembersGate />} />
          <Route path="/charter" element={<Charter />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/auth/reset-password-request" element={<ResetPasswordRequest />} />
          <Route path="/auth/reset-password/:token" element={<ResetPassword />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/adminka" element={<AdminLogin />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/users" element={<UsersAdmin isAdminUser={false} />} />
          <Route path="/admin/reports" element={<ReportsAdmin />} />
          <Route path="/news/:id" element={<NewsDetail />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
