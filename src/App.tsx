import { useEffect, useState } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Members from "./pages/Members";
import Charter from "./pages/Charter";
import AdminLogin from "./pages/AdminLogin";
import Admin from "./pages/Admin";
import NewsDetail from "./pages/NewsDetail";
import NotFound from "./pages/NotFound";
import { authAPI, setStoredUser } from "./lib/api";

const queryClient = new QueryClient();

const App = () => {
  const [authChecked, setAuthChecked] = useState(false);

  // Проверяем аутентификацию при загрузке (восстанавливаем из cookies)
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const result = await authAPI.verify();
        if (result.valid && result.user) {
          setStoredUser(result.user);
        }
      } catch (error) {
        // Пользователь не авторизован - это нормально
      } finally {
        setAuthChecked(true);
      }
    };

    verifyAuth();
  }, []);

  if (!authChecked) {
    return <div className="w-full h-screen bg-black" />; // Loading screen
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/members" element={<Members />} />
            <Route path="/charter" element={<Charter />} />
            <Route path="/adminka" element={<AdminLogin />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/news/:id" element={<NewsDetail />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;