import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthGuard } from "./components/AuthGuard";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import HardDisks from "./pages/HardDisks";
import Inward from "./pages/Inward";
import Outward from "./pages/Outward";
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<AuthGuard><Dashboard /></AuthGuard>} />
          <Route path="/hard-disks" element={<AuthGuard><HardDisks /></AuthGuard>} />
          <Route path="/inward" element={<AuthGuard><Inward /></AuthGuard>} />
          <Route path="/outward" element={<AuthGuard><Outward /></AuthGuard>} />
          <Route path="/reports" element={<AuthGuard><Reports /></AuthGuard>} />
          <Route path="/settings" element={<AuthGuard><Settings /></AuthGuard>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
