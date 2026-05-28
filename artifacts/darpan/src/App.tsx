import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Tenders from "@/pages/tenders";
import TenderDetail from "@/pages/tender-detail";
import Contractors from "@/pages/contractors";
import ContractorDetail from "@/pages/contractor-detail";
import RtiTracker from "@/pages/rti-tracker";
import RtiDetail from "@/pages/rti-detail";
import Analytics from "@/pages/analytics";
import Sandbox from "@/pages/sandbox";
import Whistleblower from "@/pages/whistleblower";
import Scorecard from "@/pages/scorecard";
import OfficialsWatch from "@/pages/officials";
import CorruptionNetwork from "@/pages/network";
import MarchRush from "@/pages/march-rush";
import PitchDeck from "@/pages/pitch-deck";
import ProductJourney from "@/pages/product-journey";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/pitch-deck" component={PitchDeck} />
      <Route path="/product-journey" component={ProductJourney} />
      <Route path="/scorecard" component={Scorecard} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/tenders" component={Tenders} />
      <Route path="/tenders/:id" component={TenderDetail} />
      <Route path="/contractors" component={Contractors} />
      <Route path="/contractors/:id" component={ContractorDetail} />
      <Route path="/rti-tracker" component={RtiTracker} />
      <Route path="/rti/:id" component={RtiDetail} />
      <Route path="/whistleblower" component={Whistleblower} />
      <Route path="/officials" component={OfficialsWatch} />
      <Route path="/network" component={CorruptionNetwork} />
      <Route path="/march-rush" component={MarchRush} />
      <Route path="/sandbox" component={Sandbox} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
