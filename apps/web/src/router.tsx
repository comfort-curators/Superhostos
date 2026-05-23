import { Redirect, Route, Switch } from 'wouter';
import { SignedIn, SignedOut, SignIn } from '@clerk/clerk-react';
import { AppLayout } from './components/layout/AppLayout';
import {
  AiReplyPage,
  AnalyticsPage,
  CalendarPage,
  DashboardPage,
  HousekeepingPage,
  LoginPage,
  MaintenancePage,
  MessagesPage,
  NotFoundPage,
  OrdersPage,
  PropertiesPage,
  PropertyDetailPage,
  SettingsPage,
  VendorsPage
} from './pages';

const ProductRoutes = () => (
  <AppLayout>
    <Switch>
      <Route path="/" component={DashboardPage} />
      <Route path="/properties" component={PropertiesPage} />
      <Route path="/properties/:id" component={PropertyDetailPage} />
      <Route path="/calendar" component={CalendarPage} />
      <Route path="/housekeeping" component={HousekeepingPage} />
      <Route path="/maintenance" component={MaintenancePage} />
      <Route path="/vendors" component={VendorsPage} />
      <Route path="/orders" component={OrdersPage} />
      <Route path="/messages" component={MessagesPage} />
      <Route path="/ai-reply" component={AiReplyPage} />
      <Route path="/analytics" component={AnalyticsPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route component={NotFoundPage} />
    </Switch>
  </AppLayout>
);

const AuthenticatedRouter = () => (
  <>
    <Route path="/login" component={LoginPage} />
    <Route path="/sign-in">{() => <SignIn routing="path" path="/sign-in" />}</Route>
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
