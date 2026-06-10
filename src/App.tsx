import { useState, useEffect, lazy, Suspense } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Header from "./components/Header";
import BottomNav from "./components/BottomNav";
import Frontier from "./components/Frontier";
import ChronicleSidebar from "./components/ChronicleSidebar";

// Lazy load heavy components to reduce initial bundle size
const OperatorProfile = lazy(() => import("./components/OperatorProfile"));
const LandingPortal = lazy(() => import("./components/LandingPortal"));
const OnboardingEvaluation = lazy(() => import("./components/OnboardingEvaluation"));
const MaverickEngine = lazy(() => import("./components/MaverickEngine"));
const MaverickJournal = lazy(() => import("./components/MaverickJournal"));

// Loading fallback for lazy-loaded components
const LoadingFallback = () => (
  <div className="min-h-screen bg-black text-[#e2e2e2] flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00f0ff] mx-auto mb-4"></div>
      <p className="text-[#888]">Loading...</p>
    </div>
  </div>
);

function AppContent() {
  const { user, loading } = useAuth();
  const [isEntered, setIsEntered] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("frontier");
  const [evaluationResult, setEvaluationResult] = useState<any | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [currentPath, setCurrentPath] = useState<string>(window.location.pathname);

  // Handle route changes
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Check if we should skip landing portal (from OAuth callback)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const skipLanding = urlParams.get('skip_landing');
    const hasAccessToken = urlParams.get('access_token');
    const hasRefreshToken = urlParams.get('refresh_token');

    // Skip landing if explicitly flagged or if OAuth tokens are present
    if (skipLanding === 'true' || hasAccessToken || hasRefreshToken) {
      setIsEntered(true);
      setActiveTab('frontier');
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Load onboarding evaluation from localStorage
  useEffect(() => {
    try {
      const cachedEvaluation = localStorage.getItem("hasex_evaluation");
      if (cachedEvaluation) {
        setEvaluationResult(JSON.parse(cachedEvaluation));
      }
    } catch (err) {
      console.error("HASEX_OS // Error reading onboarding from localStorage:", err);
    }
  }, []);

  // Handle onboarding completion
  const handleOnboardingComplete = (results: any) => {
    localStorage.setItem("hasex_evaluation", JSON.stringify(results));
    setEvaluationResult(results);
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-[#e2e2e2] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00f0ff] mx-auto mb-4"></div>
          <p className="text-[#888]">Loading...</p>
        </div>
      </div>
    );
  }

  // Always show landing portal first - never persist isEntered
  if (!isEntered) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <LandingPortal onEnter={() => {
          setIsEntered(true);
          setActiveTab("frontier"); // Go directly to frontier after sign up
        }} />
      </Suspense>
    );
  }

  // Header dynamic subtitle mapper
  const getHeaderSubtitle = () => {
    switch (activeTab) {
      case "frontier": return "FRONTIER";
      case "hasex": return "ADAPTIVE CORE";
      case "profile": return "PROFILE";
      case "journal": return "CHRONICLE";
      default: return "";
    }
  };

  // Show onboarding evaluation if not completed
  if (!evaluationResult) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <OnboardingEvaluation onCompleted={handleOnboardingComplete} />
      </Suspense>
    );
  }

  return (
    <div className={`min-h-screen bg-black text-[#e2e2e2] flex flex-col font-sans relative antialiased select-none pb-28 ${activeTab === "hasex" ? "overflow-hidden" : ""}`}>
      {/* Absolute top grid background decor */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,240,255,0.02)_0%,transparent_75%)] pointer-events-none select-none z-0" />

      {/* Top Header App bar */}
      <Header
        currentTab={activeTab}
        onNavigate={(tab) => {
          setActiveTab(tab);
        }}
        titleSuffix={getHeaderSubtitle()}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Reactive History Sidebar drawer */}
      <ChronicleSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} onNavigate={setActiveTab} />

      {/* Main Container Canvas */}
      <main className={
        activeTab === "hasex"
          ? "flex-grow pt-16 w-full flex flex-col items-stretch justify-stretch z-10 relative bg-black h-[calc(100vh-140px)] overflow-hidden"
          : "flex-grow pt-24 px-4 sm:px-8 max-w-7xl mx-auto w-full flex flex-col items-center justify-center z-10 relative"
      }>
        <div className={activeTab === "hasex" ? "w-full h-full flex flex-col" : "w-full"}>
          {/* FRONTIER HOMEPAGE VIEW */}
          {activeTab === "frontier" && (
            <div className="w-full pb-8">
              <Frontier onNavigate={setActiveTab} />
            </div>
          )}

          {/* MAVERICK COMMAND ENGINE TAB */}
          {activeTab === "hasex" && (
            <Suspense fallback={<LoadingFallback />}>
              <div className="w-full h-full flex flex-col overflow-hidden">
                <MaverickEngine />
              </div>
            </Suspense>
          )}

          {/* MAVERICK JOURNAL GUIDED MODULE */}
          {activeTab === "journal" && (
            <Suspense fallback={<LoadingFallback />}>
              <div className="w-full pb-8">
                <MaverickJournal />
              </div>
            </Suspense>
          )}

          {/* OPERATOR PROFILE REGISTRY TAB */}
          {activeTab === "profile" && (
            <Suspense fallback={<LoadingFallback />}>
              <div className="w-full select-none">
                <OperatorProfile />
              </div>
            </Suspense>
          )}
        </div>
      </main>

      {/* Persistent Bottom Nav */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
