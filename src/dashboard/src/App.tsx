import React from 'react';

import { BrowserRouter, Redirect, Route, RouteComponentProps, Switch } from "react-router-dom"

import 'typeface-roboto';
import 'typeface-roboto-mono';

import { Box, CssBaseline, createMuiTheme, CircularProgress } from '@material-ui/core';
import { ThemeProvider } from "@material-ui/styles";

import UserContext, { Provider as UserProvider } from "./contexts/User";
import { Provider as ClustersProvider } from "./contexts/Clusters";
import { Provider as TeamProvider } from './contexts/Teams';

import AppBar from "./layout/AppBar";
import Content from "./layout/Content";
import Drawer from "./layout/Drawer";
import { Provider as DrawerProvider } from "./layout/Drawer/Context";

const Home = React.lazy(() => import('./pages/Home'));
const SignIn = React.lazy(() => import('./pages/SignIn'));
const Submission = React.lazy(() => import('./pages/Submission'));
const Jobs = React.lazy(() => import('./pages/Jobs'));
const Job = React.lazy(() => import('./pages/Job'));
const ClusterStatus = React.lazy(() => import('./pages/ClusterStatus'));
const Vc = React.lazy(() => import('./pages/Vc/index.js'));
const User = React.lazy(() => import('./pages/User/index.js'));
const Access = React.lazy(() => import('./pages/Access/index.js'));

const theme = createMuiTheme();

interface BootstrapProps {
  userName?: string;
  uid?: string;
  Alias?: string;
  Password?: string;
  isAdmin?: boolean;
  _token?: any;
}

const Loading = (
  <Box flex={1} display="flex" alignItems="center" justifyContent="center">
    <CircularProgress />
  </Box>
);

const Contexts: React.FC<BootstrapProps> = ({ userName, uid, Alias, Password, isAdmin, _token, children }) => (
  <BrowserRouter>
    <UserProvider userName={userName} uid={uid} Alias={Alias} Password={Password} isAdmin={isAdmin} token={_token} >
      <TeamProvider>
        <ClustersProvider>
          <ThemeProvider theme={theme}>
            {children}
          </ThemeProvider>
        </ClustersProvider>
      </TeamProvider>
    </UserProvider>
  </BrowserRouter>
);

const Layout: React.FC<RouteComponentProps> = ({ location, history }) => {
  const { userName } = React.useContext(UserContext);

  React.useEffect(() => {
    if (userName === undefined) {
      history.replace('/sign-in');
    }
  }, [userName, history]);

  if (userName === undefined) {
    return null;
  }

  return (
    <>
      <DrawerProvider>
        <Content>
          <AppBar />
          <Drawer />
          <React.Suspense fallback={Loading}>
            <Switch location={location}>
              <Route exact path="/" component={Home} />
              <Route path="/submission" component={Submission} />
              <Route path="/jobs/:cluster" component={Jobs} />
              <Route path="/jobs" component={Jobs} />
              <Route path="/job/:team/:clusterId/:jobId" component={Job} />
              <Route path="/cluster-status" component={ClusterStatus} />
              <Route path="/vc" component={Vc} />
              <Route path="/user" component={User} />
              <Route path="/access" component={Access} />
              <Redirect to="/" />
            </Switch>
          </React.Suspense>
        </Content>
      </DrawerProvider>
    </>
  );
}

const App: React.FC<BootstrapProps> = (props) => (
  <Contexts {...props}>
    <CssBaseline />
    <Box display="flex" minHeight="100vh" maxWidth="100vw">
      <React.Suspense fallback={Loading}>
        <Switch>
          <Route exact path="/sign-in" component={SignIn} />
          <Route component={Layout} />
        </Switch>
      </React.Suspense>
    </Box>
  </Contexts>
);

export default App;
