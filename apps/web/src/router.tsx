import { SignIn, SignedIn, SignedOut } from "@clerk/clerk-react";
import { Redirect, Route, Switch } from "wouter";
import { AppLayout } from "./components/layout/AppLayout";
import {
  AiReplyPage,
  AnalyticsPage,
  BookingsPage,
  CalendarPage,
  DashboardPage,
  HousekeepingPage,
  InventoryPage,
  LoginPage,
  MaintenancePage,
  MessagesPage,
  NotFoundPage,
  OrdersPage,
  PropertiesPage,
  PropertyDetailPage,
  SettingsPage,
  VendorsPage,
} from "./pages";
import { CookiePolicyPage, PrivacyPage, TermsPage } from "./pages/legal";

const ProductRoutes = () => (
  <AppLayout>
    <Switch>
      <Route path="/" component={DashboardPage} />
      <Route path="/properties" component={PropertiesPage} />
      <Route path="/properties/:id" component={PropertyDetailPage} />
      <Route path="/bookings" component={BookingsPage} />
      <Route path="/calendar" component={CalendarPage} />
      <Route path="/housekeeping" component={HousekeepingPage} />
      <Route path="/inventory" component={InventoryPage} />
      <Route path="/maintenance" component={MaintenancePage} />
      <Route path="/vendors" component={VendorsPage} />
      <Route path="/orders" component={OrdersPage} />
      <Route path="/messages" component={MessagesPage} />
      <Route path="/ai-reply" component={AiReplyPage} />
      <Route path="/analytics" component={AnalyticsPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/legal/terms" component={TermsPage} />
      <Route path="/legal/privacy" component={PrivacyPage} />
      <Route path="/legal/cookies" component={CookiePolicyPage} />
      <Route component={NotFoundPage} />
    </Switch>
  </AppLayout>
);

const AuthenticatedRouter = () => (
  <>
    <Route path="/login" component={LoginPage} />
    <Route path="/sign-in">
      {() => <SignIn routing="path" path="/sign-in" />}
    </Route>
    <Route>
      <SignedOut>
        <Redirect to="/login" />
      </SignedOut>
      <SignedIn>
        <ProductRoutes />
      </SignedIn>
    </Route>
  </>
);

const UnauthenticatedRouter = () => <ProductRoutes />;

export const AppRouter = ({ authEnabled }: { authEnabled: boolean }) =>
  authEnabled ? <AuthenticatedRouter /> : <UnauthenticatedRouter />;
