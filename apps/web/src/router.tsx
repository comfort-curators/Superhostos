import { Switch, Route } from 'wouter';
import Dashboard from '../pages/Dashboard';
import Properties from '../pages/Properties';
import MasterCalendar from '../pages/MasterCalendar';
import Marketplace from '../pages/Marketplace';

export function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/properties" component={Properties} />
      <Route path="/calendar" component={MasterCalendar} />
      <Route path="/marketplace" component={Marketplace} />
      <Route>404 - Page not found</Route>
    </Switch>
  );
}
