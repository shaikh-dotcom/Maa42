import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ScreenId,
  ArticleItem,
  CareMember,
  AudioTrack,
  UserProfile,
} from "./types";
import { Header } from "./components/Header";
import { BottomNav } from "./components/BottomNav";
import { LandingScreen } from "./components/LandingScreen";
import { HomeScreen } from "./components/HomeScreen";
import { SophiaScreen } from "./components/SophiaScreen";
import { TrackerScreen } from "./components/TrackerScreen";
import { CareCircleScreen } from "./components/CareCircleScreen";
import { MessagesScreen } from "./components/MessagesScreen";
import { LoadingScreen } from "./components/LoadingScreen";
import { AuthModal } from "./components/AuthModal";
import { SosModal } from "./components/SosModal";
import { KickCounterModal } from "./components/KickCounterModal";
import { MoodModal } from "./components/MoodModal";
import { ArticleModal } from "./components/ArticleModal";
import { PdfPreviewModal } from "./components/PdfPreviewModal";
import { ContactMemberModal } from "./components/ContactMemberModal";
import { ProfileModal } from "./components/ProfileModal";
import { ResourcesModal } from "./components/ResourcesModal";
import { FindPeopleModal } from "./components/FindPeopleModal";
import { NotificationsPanel } from "./components/NotificationsPanel";
import { ChatModal } from "./components/ChatModal";
import { ScreenTransitionSkeleton } from "./components/ScreenTransitionSkeleton";
import { Maa42Logo } from "./components/Maa42Logo";
import { useAuth } from "./hooks/useAuth";
import { openConversation } from "./hooks/useMessages";

// Shown only while we don't yet know whether the visitor is signed in, or
// briefly on the landing page before auth resolves. Dashboard screens are
// never rendered with this — they wait for the real Firestore profile.
const PLACEHOLDER_PROFILE: UserProfile = {
  name: "",
  week: 0,
  trimester: 1,
  postpartumDay: 0,
  dueDate: "",
  isPostpartum: false,
};

export const App: React.FC = () => {
  const {
    currentUser,
    profile,
    authLoading,
    signUp,
    signIn,
    requestPasswordReset,
    verifyResetCode,
    resetPassword,
    signOutUser,
    persistProfile,
    logKickSession,
    logMood,
  } = useAuth();

  // Navigation & Screen state
  const [currentScreen, setCurrentScreen] = useState<ScreenId>("landing");
  const [screenLoading, setScreenLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [didInitialAuthRedirect, setDidInitialAuthRedirect] = useState(false);
  const [showSyncLoader, setShowSyncLoader] = useState(false);

  // Modal states
  const [authModal, setAuthModal] = useState<{
    isOpen: boolean;
    mode: "signin" | "signup" | "forgot" | "reset";
    resetCode?: string;
  }>({
    isOpen: false,
    mode: "signin",
  });
  const [sosModal, setSosModal] = useState<{
    isOpen: boolean;
    initialTab: "timer" | "hotline";
  }>({
    isOpen: false,
    initialTab: "timer",
  });
  const [kickModalOpen, setKickModalOpen] = useState(false);
  const [moodModalOpen, setMoodModalOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<ArticleItem | null>(
    null,
  );
  const [pdfPreview, setPdfPreview] = useState<{
    isOpen: boolean;
    summaryText: string;
  }>({
    isOpen: false,
    summaryText: "",
  });
  const [contactModal, setContactModal] = useState<{
    member: CareMember | null;
    mode: "chat" | "call";
  }>({
    member: null,
    mode: "chat",
  });
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [resourcesModalOpen, setResourcesModalOpen] = useState(false);
  const [sophiaInitialPrompt, setSophiaInitialPrompt] = useState<string>("");
  const [pendingTrackId, setPendingTrackId] = useState<string>("");

  // Messaging: find-people search, the notifications dropdown, and the
  // currently-open 1:1 chat (if any). These were previously built as
  // components but never mounted/wired here.
  const [findPeopleOpen, setFindPeopleOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [chatModal, setChatModal] = useState<{
    conversationId: string | null;
    otherUid: string;
    otherName: string;
  }>({ conversationId: null, otherUid: "", otherName: "" });

  // Once a signed-in user's profile is ready, drop them straight into the
  // dashboard instead of the marketing landing page.
  useEffect(() => {
    if (
      !didInitialAuthRedirect &&
      !authLoading &&
      currentUser &&
      profile &&
      currentScreen === "landing"
    ) {
      setCurrentScreen("home");
      setDidInitialAuthRedirect(true);
    }
  }, [authLoading, currentUser, profile, currentScreen, didInitialAuthRedirect]);

  // Handle Firebase Auth email reset links (mode=resetPassword&oobCode=...).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get("mode");
    const oobCode = params.get("oobCode");

    if (mode === "resetPassword" && oobCode) {
      setAuthModal({ isOpen: true, mode: "reset", resetCode: oobCode });
      setCurrentScreen("landing");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  // Signed-out users can browse the landing page freely, but every other
  // screen requires an authenticated + loaded profile — this is the single
  // choke point every "Enter Dashboard" / card / skip button routes through.
  const handleNavigate = (screen: ScreenId) => {
    if (screen === currentScreen) return;

    if (screen !== "landing" && (!currentUser || !profile)) {
      setAuthModal({ isOpen: true, mode: "signin" });
      return;
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
    setScreenLoading(true);
    setTimeout(() => {
      setCurrentScreen(screen);
      setScreenLoading(false);
    }, 420);
  };

  const handleNavigateToSophiaWithPrompt = (prompt?: string) => {
    if (prompt) setSophiaInitialPrompt(prompt);
    handleNavigate("sophia");
  };

  const handleUpdateUser = (updated: Partial<UserProfile>) => {
    persistProfile(updated);
  };

  const handleSignOut = () => {
    signOutUser();
    setCurrentScreen("landing");
  };

  const handleGoToLanding = () => {
    setCurrentScreen("landing");
  };

  // Fixes the old bug where every track played a hardcoded 216Hz tone: we
  // just remember which track was picked and hand it to TrackerScreen,
  // which owns playback and already knows each track's real frequency.
  const handleSelectAudioFromResources = (track: AudioTrack) => {
    setPendingTrackId(track.id);
    handleNavigate("tracker");
  };

  // Opens (creating if it doesn't exist yet) the 1:1 conversation with
  // otherUid and shows the chat modal. Used from Find People, the Messages
  // list ("Start a Conversation"), and a friend's search result.
  const handleOpenChatWithUser = async (
    otherUid: string,
    otherName: string,
  ) => {
    if (!profile) return;
    const conversationId = await openConversation(
      otherUid,
      otherName,
      profile.name,
    );
    setFindPeopleOpen(false);
    setChatModal({ conversationId, otherUid, otherName });
  };

  // Opens a chat we already know the conversationId for — e.g. tapping a
  // "new message" notification.
  const handleOpenChatFromNotification = (
    conversationId: string,
    otherUid: string,
    otherName: string,
  ) => {
    setChatModal({ conversationId, otherUid, otherName });
  };

  const handleCloseChat = () => {
    setChatModal({ conversationId: null, otherUid: "", otherName: "" });
  };

  const user = profile ?? PLACEHOLDER_PROFILE;
  const showBrandedLoader = isInitialLoading || authLoading || showSyncLoader;

  return (
    <div className="min-h-screen bg-surface font-body text-on-surface flex flex-col selection:bg-primary/20 relative">
      {/* Branded Clinical Loading Screen on Launch, Auth Resolution, or Manual Sync */}
      <AnimatePresence>
        {showBrandedLoader && (
          <LoadingScreen
            userName={profile?.name || "there"}
            onComplete={() => {
              setIsInitialLoading(false);
              setShowSyncLoader(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* Header (Visible on Home, Sophia, Tracker, Care Circle, Messages) */}
      {currentScreen !== "landing" ? (
        <Header
          currentScreen={currentScreen}
          user={user}
          onOpenSos={() => setSosModal({ isOpen: true, initialTab: "hotline" })}
          onOpenProfile={() => setProfileModalOpen(true)}
          onOpenNotifications={() => setNotificationsOpen(true)}
          onGoToLanding={handleGoToLanding}
          onTriggerLoadingScreen={() => setShowSyncLoader(true)}
        />
      ) : (
        /* Minimalist top bar for Landing page */
        <header className="w-full max-w-2xl mx-auto pt-6 px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Maa42Logo className="w-8 h-8" />
            <span className="font-bold text-primary text-base sm:text-lg tracking-tight font-headline">
              MedSophia Maa42
            </span>
          </div>
          <div className="flex items-center gap-2">
            {currentUser ? (
              <>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleNavigate("home")}
                  className="text-xs font-semibold bg-primary text-on-primary hover:bg-primary-container px-4 py-1.5 rounded-full transition-all shadow-sm cursor-pointer"
                >
                  Enter Dashboard
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleNavigate("home")}
                  className="text-xs font-semibold text-primary hover:text-primary-container px-3 py-1.5 rounded-full transition-colors cursor-pointer"
                >
                  Get Started
                </motion.button>
              </>
            ) : (
              <>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setAuthModal({ isOpen: true, mode: "signin" })}
                  className="text-xs font-semibold text-primary hover:text-primary-container px-3 py-1.5 rounded-full transition-colors cursor-pointer"
                >
                  Sign In
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setAuthModal({ isOpen: true, mode: "signup" })}
                  className="text-xs font-semibold bg-primary text-on-primary hover:bg-primary-container px-4 py-1.5 rounded-full transition-all shadow-sm cursor-pointer"
                >
                  Enter Dashboard
                </motion.button>
              </>
            )}
          </div>
        </header>
      )}

      {/* Main Content Area with Animated Screen Transitions */}
      <main
        className={`flex-1 ${currentScreen !== "landing" ? "pt-24" : "pt-2"}`}
      >
        <AnimatePresence mode="wait">
          {screenLoading ? (
            <motion.div
              key="screen-loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ScreenTransitionSkeleton />
            </motion.div>
          ) : (
            <>
              {currentScreen === "landing" && (
                <motion.div
                  key="landing"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <LandingScreen
                    onNavigate={handleNavigate}
                    isAuthenticated={Boolean(currentUser && profile)}
                    onOpenSignIn={() =>
                      setAuthModal({ isOpen: true, mode: "signin" })
                    }
                    onOpenSignUp={() =>
                      setAuthModal({ isOpen: true, mode: "signup" })
                    }
                  />
                </motion.div>
              )}

              {currentScreen === "home" && profile && (
                <motion.div
                  key="home"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <HomeScreen
                    user={profile}
                    onNavigateToSophia={handleNavigateToSophiaWithPrompt}
                    onOpenKickCounter={() => setKickModalOpen(true)}
                    onOpenMoodLogger={() => setMoodModalOpen(true)}
                    onSelectArticle={(art) => setSelectedArticle(art)}
                    onOpenResources={() => setResourcesModalOpen(true)}
                    onOpenFindPeople={() => setFindPeopleOpen(true)}
                  />
                </motion.div>
              )}

              {currentScreen === "sophia" && profile && (
                <motion.div
                  key="sophia"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <SophiaScreen
                    user={profile}
                    initialPrompt={sophiaInitialPrompt}
                    onClearInitialPrompt={() => setSophiaInitialPrompt("")}
                    onOpenSos={() =>
                      setSosModal({ isOpen: true, initialTab: "hotline" })
                    }
                  />
                </motion.div>
              )}

              {currentScreen === "tracker" && profile && (
                <motion.div
                  key="tracker"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <TrackerScreen
                    user={profile}
                    initialTrackId={pendingTrackId}
                    onClearInitialTrackId={() => setPendingTrackId("")}
                  />
                </motion.div>
              )}

              {currentScreen === "circle" && profile && (
                <motion.div
                  key="circle"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <CareCircleScreen
                    onOpenSosContraction={() =>
                      setSosModal({ isOpen: true, initialTab: "timer" })
                    }
                    onOpenSosHotline={() =>
                      setSosModal({ isOpen: true, initialTab: "hotline" })
                    }
                    onPreviewPdf={(summaryText) =>
                      setPdfPreview({ isOpen: true, summaryText })
                    }
                    onContactMember={(member, mode) =>
                      setContactModal({ member, mode })
                    }
                  />
                </motion.div>
              )}

              {currentScreen === "messages" && profile && (
                <motion.div
                  key="messages"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <MessagesScreen
                    onOpenChat={handleOpenChatWithUser}
                    onFindPeople={() => setFindPeopleOpen(true)}
                  />
                </motion.div>
              )}
            </>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation (Visible on all app screens, including Messages) */}
      {currentScreen !== "landing" && (
        <BottomNav
          currentScreen={currentScreen}
          onSelectScreen={handleNavigate}
          onOpenResources={() => setResourcesModalOpen(true)}
        />
      )}

      {/* Modals & Dialogs */}
      <AuthModal
        isOpen={authModal.isOpen}
        initialMode={authModal.mode}
        onSignIn={signIn}
        onSignUp={signUp}
        onRequestPasswordReset={requestPasswordReset}
        onVerifyResetCode={verifyResetCode}
        onResetPassword={resetPassword}
        resetCode={authModal.resetCode}
        onClose={() => setAuthModal({ isOpen: false, mode: "signin" })}
        onSuccess={() => handleNavigate("home")}
      />

      <SosModal
        isOpen={sosModal.isOpen}
        initialTab={sosModal.initialTab}
        onClose={() => setSosModal({ isOpen: false, initialTab: "timer" })}
      />

      <KickCounterModal
        isOpen={kickModalOpen}
        onClose={() => setKickModalOpen(false)}
        onSaveKickSession={logKickSession}
      />

      <MoodModal
        isOpen={moodModalOpen}
        onClose={() => setMoodModalOpen(false)}
        onSaveMood={logMood}
      />

      <ArticleModal
        article={selectedArticle}
        onClose={() => setSelectedArticle(null)}
      />

      <PdfPreviewModal
        isOpen={pdfPreview.isOpen}
        summaryText={pdfPreview.summaryText}
        user={user}
        onClose={() => setPdfPreview({ isOpen: false, summaryText: "" })}
      />

      <ContactMemberModal
        member={contactModal.member}
        mode={contactModal.mode}
        onClose={() => setContactModal({ member: null, mode: "chat" })}
      />

      <ProfileModal
        isOpen={profileModalOpen}
        user={user}
        onUpdateUser={handleUpdateUser}
        onClose={() => setProfileModalOpen(false)}
        onGoToLanding={handleSignOut}
      />

      <ResourcesModal
        isOpen={resourcesModalOpen}
        onClose={() => setResourcesModalOpen(false)}
        onSelectArticle={(art) => setSelectedArticle(art)}
        onSelectAudioTrack={handleSelectAudioFromResources}
      />

      {/* Messaging: find people, notifications, and the active 1:1 chat.
          These components already existed but were never mounted here. */}
      <FindPeopleModal
        isOpen={findPeopleOpen}
        onClose={() => setFindPeopleOpen(false)}
        onOpenChat={handleOpenChatWithUser}
      />

      <NotificationsPanel
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        onOpenChat={handleOpenChatFromNotification}
      />

      <ChatModal
        conversationId={chatModal.conversationId}
        otherUid={chatModal.otherUid}
        otherName={chatModal.otherName}
        onClose={handleCloseChat}
        onBlocked={handleCloseChat}
      />
    </div>
  );
};

export default App;
