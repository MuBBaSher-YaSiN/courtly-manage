import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";

// Pages
import HomePage from "./pages/HomePage";
import AuthPage from "./pages/AuthPage"; 
import Dashboard from "./pages/Dashboard";
import CasesPage from "./pages/cases/CasesPage";
import HearingsPage from "./pages/HearingsPage";
import DocumentsPage from "./pages/DocumentsPage";
import ProfilePage from "./pages/ProfilePage";
import NotFound from "./pages/NotFound";

import AboutPage from "./pages/AboutPage";

// Admin Pages
import UserManagement from "./pages/admin/UserManagement";
import SystemSettings from "./pages/admin/SystemSettings";
import AuditLogs from "./pages/admin/AuditLogs";

// Other Pages
import NotificationsPage from "./pages/NotificationsPage";
import SearchPage from "./pages/SearchPage";
import FilingsPage from "./pages/FilingsPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/auth" element={<AuthPage />} />
            
            {/* Protected Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/cases" element={
              <ProtectedRoute>
                <AppLayout>
                  <CasesPage />
                </AppLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/hearings" element={
              <ProtectedRoute>
                <AppLayout>
                  <HearingsPage />
                </AppLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/documents" element={
              <ProtectedRoute>
                <AppLayout>
                  <DocumentsPage />
                </AppLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/profile" element={
              <ProtectedRoute>
                <AppLayout>
                  <ProfilePage />
                </AppLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/about" element={<AboutPage />} />
            
            <Route path="/notifications" element={
              <ProtectedRoute>
                <AppLayout>
                  <NotificationsPage />
                </AppLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/search" element={
              <ProtectedRoute>
                <AppLayout>
                  <SearchPage />
                </AppLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/filings" element={
              <ProtectedRoute>
                <AppLayout>
                  <FilingsPage />
                </AppLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/admin/users" element={
              <ProtectedRoute requiredRoles={['admin']}>
                <AppLayout>
                  <UserManagement />
                </AppLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/admin/settings" element={
              <ProtectedRoute requiredRoles={['admin']}>
                <AppLayout>
                  <SystemSettings />
                </AppLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/admin/audit" element={
              <ProtectedRoute requiredRoles={['admin']}>
                <AppLayout>
                  <AuditLogs />
                </AppLayout>
              </ProtectedRoute>
            } />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
