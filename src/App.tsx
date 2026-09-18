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
import { BotScreen } from "./components/BotScreen";
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
import { MaterniBotBrainSkeleton } from "./components/MaterniBotBrainSkeleton";
import { Maa42Logo } from "./components/Maa42Logo";
import { useAuth } from "./hooks/useAuth";
import { useMaterniBotWake } from "./hooks/useMaterniBotWake";
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

  // -------------------------------------------------------------------------
  // MaterniBot wake state
  // -------------------------------------------------------------------------
  // Only wake MaterniBot for an authenticated user with a loaded profile.
  // This prevents random landing-page visitors from consuming your Render
  // Free instance hours.
  const materniBot = useMaterniBotWake(Boolean(currentUser && profile));

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

  // Messaging
  const [findPeopleOpen, setFindPeopleOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const [chatModal, setChatModal] = useState<{
    conversationId: string | null;
    otherUid: string;
    otherName: string;
  }>({
    conversationId: null,
    otherUid: "",
    otherName: "",
  });

  // -------------------------------------------------------------------------
  // Authentication → dashboard redirect
  // -------------------------------------------------------------------------
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
  }, [
    authLoading,
    currentUser,
    profile,
    currentScreen,
    didInitialAuthRedirect,
  ]);

  // -------------------------------------------------------------------------
  // Password reset link handling
  // -------------------------------------------------------------------------
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get("mode");
    const oobCode = params.get("oobCode");

    if (mode === "resetPassword" && oobCode) {
      setAuthModal({
        isOpen: true,
        mode: "reset",
        resetCode: oobCode,
      });

      setCurrentScreen("landing");

      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  // -------------------------------------------------------------------------
  // Navigation
  // -------------------------------------------------------------------------
  const handleNavigate = (screen: ScreenId) => {
    if (screen === currentScreen) {
      // If the user taps the already-open Bot tab, verify the service again.
      if (screen === "bot" && currentUser && profile) {
        void materniBot.wakeNow();
      }

      return;
    }

    if (screen !== "landing" && (!currentUser || !profile)) {
      setAuthModal({
        isOpen: true,
        mode: "signin",
      });

      return;
    }

    // When navigating to MaterniBot, perform a fresh health check.
    // This protects against the bot having gone back to sleep after
    // the user has been sitting on the website for >15 minutes.
    if (screen === "bot" && currentUser && profile) {
      void materniBot.wakeNow();
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    setScreenLoading(true);

    setTimeout(() => {
      setCurrentScreen(screen);
      setScreenLoading(false);
    }, 420);
  };

  const handleNavigateToSophiaWithPrompt = (prompt?: string) => {
    if (prompt) {
      setSophiaInitialPrompt(prompt);
    }

    handleNavigate("sophia");
  };

  const handleUpdateUser = (updated: Partial<UserProfile>) => {
    persistProfile(updated);
  };

  const handleSignOut = async () => {
    await signOutUser();

    setCurrentScreen("landing");
  };

  const handleGoToLanding = () => {
    setCurrentScreen("landing");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // -------------------------------------------------------------------------
  // Audio resource navigation
  // -------------------------------------------------------------------------
  const handleSelectAudioFromResources = (track: AudioTrack) => {
    setPendingTrackId(track.id);

    handleNavigate("tracker");
  };

  // -------------------------------------------------------------------------
  // Messaging
  // -------------------------------------------------------------------------
  const handleOpenChatWithUser = async (
    otherUid: string,
    otherName: string,
  ) => {
    if (!profile) {
      return;
    }

    const conversationId = await openConversation(
      otherUid,
      otherName,
      profile.name,
    );

    setFindPeopleOpen(false);

    setChatModal({
      conversationId,
      otherUid,
      otherName,
    });
  };

  const handleOpenChatFromNotification = (
    conversationId: string,
    otherUid: string,
    otherName: string,
  ) => {
    setChatModal({
      conversationId,
      otherUid,
      otherName,
    });
  };

  const handleCloseChat = () => {
    setChatModal({
      conversationId: null,
      otherUid: "",
      otherName: "",
    });
  };

  const user = profile ?? PLACEHOLDER_PROFILE;

  const showBrandedLoader = isInitialLoading || authLoading || showSyncLoader;

  return (
    <div className="min-h-screen bg-surface font-body text-on-surface flex flex-col selection:bg-primary/20 relative">
      {/* Branded Clinical Loading Screen */}
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

      {/* Header */}
      {currentScreen !== "landing" ? (
        <Header
          currentScreen={currentScreen}
          user={user}
          onOpenSos={() =>
            setSosModal({
              isOpen: true,
              initialTab: "hotline",
            })
          }
          onOpenProfile={() => setProfileModalOpen(true)}
          onOpenNotifications={() => setNotificationsOpen(true)}
          onGoToLanding={handleGoToLanding}
          onTriggerLoadingScreen={() => setShowSyncLoader(true)}
        />
      ) : (
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
                  onClick={() =>
                    setAuthModal({
                      isOpen: true,
                      mode: "signin",
                    })
                  }
                  className="text-xs font-semibold text-primary hover:text-primary-container px-3 py-1.5 rounded-full transition-colors cursor-pointer"
                >
                  Sign In
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() =>
                    setAuthModal({
                      isOpen: true,
                      mode: "signup",
                    })
                  }
                  className="text-xs font-semibold bg-primary text-on-primary hover:bg-primary-container px-4 py-1.5 rounded-full transition-all shadow-sm cursor-pointer"
                >
                  Enter Dashboard
                </motion.button>
              </>
            )}
          </div>
        </header>
      )}

      {/* Main Content */}
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
              {/* Landing */}
              {currentScreen === "landing" && (
                <motion.div
                  key="landing"
                  initial={{
                    opacity: 0,
                    y: 10,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  exit={{
                    opacity: 0,
                    y: -10,
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <LandingScreen
                    onNavigate={handleNavigate}
                    isAuthenticated={Boolean(currentUser && profile)}
                    onOpenSignIn={() =>
                      setAuthModal({
                        isOpen: true,
                        mode: "signin",
                      })
                    }
                    onOpenSignUp={() =>
                      setAuthModal({
                        isOpen: true,
                        mode: "signup",
                      })
                    }
                  />
                </motion.div>
              )}

              {/* Home */}
              {currentScreen === "home" && profile && (
                <motion.div
                  key="home"
                  initial={{
                    opacity: 0,
                    y: 10,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  exit={{
                    opacity: 0,
                    y: -10,
                  }}
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

              {/* Sophia */}
              {currentScreen === "sophia" && profile && (
                <motion.div
                  key="sophia"
                  initial={{
                    opacity: 0,
                    y: 10,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  exit={{
                    opacity: 0,
                    y: -10,
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <SophiaScreen
                    user={profile}
                    initialPrompt={sophiaInitialPrompt}
                    onClearInitialPrompt={() => setSophiaInitialPrompt("")}
                    onOpenSos={() =>
                      setSosModal({
                        isOpen: true,
                        initialTab: "hotline",
                      })
                    }
                  />
                </motion.div>
              )}

              {/* Tracker */}
              {currentScreen === "tracker" && profile && (
                <motion.div
                  key="tracker"
                  initial={{
                    opacity: 0,
                    y: 10,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  exit={{
                    opacity: 0,
                    y: -10,
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <TrackerScreen
                    user={profile}
                    initialTrackId={pendingTrackId}
                    onClearInitialTrackId={() => setPendingTrackId("")}
                  />
                </motion.div>
              )}

              {/* MaterniBot */}
              {currentScreen === "bot" && profile && (
                <motion.div
                  key="bot"
                  initial={{
                    opacity: 0,
                    y: 10,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  exit={{
                    opacity: 0,
                    y: -10,
                  }}
                  transition={{ duration: 0.3 }}
                >
                  {materniBot.isReady ? (
                    <BotScreen user={profile} />
                  ) : (
                    <MaterniBotBrainSkeleton message="MaterniBot brain building..." />
                  )}
                </motion.div>
              )}

              {/* Care Circle */}
              {currentScreen === "circle" && profile && (
                <motion.div
                  key="circle"
                  initial={{
                    opacity: 0,
                    y: 10,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  exit={{
                    opacity: 0,
                    y: -10,
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <CareCircleScreen
                    profile={profile}
                    onOpenSosContraction={() =>
                      setSosModal({
                        isOpen: true,
                        initialTab: "timer",
                      })
                    }
                    onOpenSosHotline={() =>
                      setSosModal({
                        isOpen: true,
                        initialTab: "hotline",
                      })
                    }
                    onPreviewPdf={(summaryText) =>
                      setPdfPreview({
                        isOpen: true,
                        summaryText,
                      })
                    }
                    onContactMember={(member, mode) =>
                      setContactModal({
                        member,
                        mode,
                      })
                    }
                  />
                </motion.div>
              )}

              {/* Messages */}
              {currentScreen === "messages" && profile && (
                <motion.div
                  key="messages"
                  initial={{
                    opacity: 0,
                    y: 10,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  exit={{
                    opacity: 0,
                    y: -10,
                  }}
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

      {/* Bottom Navigation */}
      {currentScreen !== "landing" && (
        <BottomNav
          currentScreen={currentScreen}
          onSelectScreen={handleNavigate}
          onOpenResources={() => setResourcesModalOpen(true)}
        />
      )}

      {/* Authentication */}
      <AuthModal
        isOpen={authModal.isOpen}
        initialMode={authModal.mode}
        onSignIn={signIn}
        onSignUp={signUp}
        onRequestPasswordReset={requestPasswordReset}
        onVerifyResetCode={verifyResetCode}
        onResetPassword={resetPassword}
        resetCode={authModal.resetCode}
        onClose={() =>
          setAuthModal({
            isOpen: false,
            mode: "signin",
          })
        }
        onSuccess={() => handleNavigate("home")}
      />

      {/* SOS */}
      <SosModal
        isOpen={sosModal.isOpen}
        initialTab={sosModal.initialTab}
        onClose={() =>
          setSosModal({
            isOpen: false,
            initialTab: "timer",
          })
        }
      />

      {/* Kick counter */}
      <KickCounterModal
        isOpen={kickModalOpen}
        onClose={() => setKickModalOpen(false)}
        onSaveKickSession={logKickSession}
      />

      {/* Mood */}
      <MoodModal
        isOpen={moodModalOpen}
        onClose={() => setMoodModalOpen(false)}
        onSaveMood={logMood}
      />

      {/* Article */}
      <ArticleModal
        article={selectedArticle}
        onClose={() => setSelectedArticle(null)}
      />

      {/* PDF */}
      <PdfPreviewModal
        isOpen={pdfPreview.isOpen}
        summaryText={pdfPreview.summaryText}
        user={user}
        onClose={() =>
          setPdfPreview({
            isOpen: false,
            summaryText: "",
          })
        }
      />

      {/* Contact member */}
      <ContactMemberModal
        member={contactModal.member}
        mode={contactModal.mode}
        onClose={() =>
          setContactModal({
            member: null,
            mode: "chat",
          })
        }
      />

      {/* Profile */}
      <ProfileModal
        isOpen={profileModalOpen}
        user={user}
        onUpdateUser={handleUpdateUser}
        onClose={() => setProfileModalOpen(false)}
        onGoToLanding={handleGoToLanding}
      />

      {/* Resources */}
      <ResourcesModal
        isOpen={resourcesModalOpen}
        onClose={() => setResourcesModalOpen(false)}
        onSelectArticle={(art) => setSelectedArticle(art)}
        onSelectAudioTrack={handleSelectAudioFromResources}
      />

      {/* Find people */}
      <FindPeopleModal
        isOpen={findPeopleOpen}
        onClose={() => setFindPeopleOpen(false)}
        onOpenChat={handleOpenChatWithUser}
      />

      {/* Notifications */}
      <NotificationsPanel
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        onOpenChat={handleOpenChatFromNotification}
      />

      {/* 1:1 chat */}
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
