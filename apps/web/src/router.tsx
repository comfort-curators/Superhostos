import { Switch, Route } from 'wouter';
import Dashboard from '../pages/Dashboard';
import Properties from '../pages/Properties';

export function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/properties" component={Properties} />
      <Route path="/calendar">Calendar View</Route>
      <Route>404 Not Found</Route>
    </Switch>
  );
}
