import { CareMember, AudioTrack, ArticleItem } from "./types";

export const ASSETS = {
  logo: "/logo.svg",
  emblem: "/logo.svg",
  signInLogo: "/logo.svg",
  signUpLogo: "/logo.svg",
  article1:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAfc6kyyhK017Ld0aDOrWJoz9nDZqvbjv8xz_2lM3qb-IkquCf7q82GtcSI20DFjX57kqY3Wh82H3JiXRay8qMFR2NCYKtl0luazbG46JG5ep-IeCb2NkJ36jXLZzCyRK4NdM0orVE9Sb9u4Hl1GwXG5lXysw_G0aoRhsa4MyAg-9HC4BJMMcjLlovvFxuxzODyODU4ha5v6BVobB1HyIC-HmqEWvka8qU1lg5GJny9NO9GGACV4udKag",
  article2:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuB1zI7U5XVVjKmlw-KMvOhKPMqIGl2BCMoSw4yOuZK070HCQAJMNMeBGjrXtSJ0fGoMjKXBK4XHDAp2hiqbB8e8yWtudCQIf6As-A0P-zwUM-iaZzBIaMM3nv5sbahxPBeZoYVcLtRUk71yV_7JWo8o9iO5ceXSCiGjjWWNtkLeZbgBqUNyPMTxIw0FCImKzSbVesXEYskaW-dcuQZnRWGyiSYibBD1AvDDAqK3Jvr_WsvveBzOgbTu5A",
  drSharma:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCOh22XaRlTCnytj7Y9Ya8gx2jL3fZs8uC3Y32ZL0yl-YSIbZUdbONgHd14kg8lJzbfzL_10U8RCVdGs2Uis0eY4ayZf6Klfn5GA85y3064DAlE5-912K6ygQblhZYnmIUFGaXyb9fuC00yOo36t13N4Hzv_yotF-mFak-iGuTTUWmMusSUTc5pusOAJ2oVWCymfLBo05l5A-wOywYKqTIeRWrZHk5gSyGzuCF-_Fku-HRruoTYnusIIg",
  drVance:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAkqhRRKhZtMqTZvZFCeI-6IRdEw0qSabbiWo1eLlzroPC_JGWw9gRFCRas863IAxhMPvS3nbQ5pq0HsYk9AYUzTJmIMA03erUYYtzd3P5tC4kkGQGcYqgh2X0LLd0UN5TPY8BlLpW68oTKX6BI7sk9c5Fksgo8fWB6kSr8EqqLKwY_QWpFvd_WVYtDnGkJviPfJTR_NeP39Yffw5b4cmRU63vGFmRoptAUvCdbP2owq65U_56AVf_fig",
  rohanPartner:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDAwWZ6gylebt-v0AFGCuzoHUHpi3zlgEHhKflSpA9sZ9o5EOp5EdEkxw1uEmuZTVIuQqWGK5qaeqn4nJHs0NGB7ACroO0dmJK8nawXsf1Co8MsFltYF_LIlptkMNMfnjndN6IhwdUbVEXyboMLsY-T1zNFrbDF6S0d6frNuVnir9GwuTW6vMbwa6jWQRndDpMJh7TNVqjAiqAIULlD7sP-Y2CO1iHf0EzqkHhLDeR8X3-FkNHNE2JBKQ",
};

// Used only to seed a brand-new user's Firestore `careTeam` subcollection
// once (see useCareTeam.ts). After that, the live collection is the source
// of truth — editing/removing a member here has no effect on existing users.
export const DEFAULT_CARE_TEAM: CareMember[] = [
  {
    id: "dr-sharma",
    name: "Dr. Ananya Sharma",
    role: "Lead OB-GYN",
    facility: "Metro Maternal Health Center",
    nextAppointment: "Next visit: Oct 24, 10:00 AM",
    badge: "Lead OB-GYN",
    avatar: ASSETS.drSharma,
    status: "Active clinical care",
    canCall: true,
    canMessage: true,
  },
  {
    id: "dr-vance",
    name: "Dr. Marcus Vance",
    role: "Maternal-Fetal Specialist",
    facility: "Advanced Fetal Care Unit",
    nextAppointment: "On-call consultant",
    badge: "Maternal-Fetal Specialist",
    avatar: ASSETS.drVance,
    status: "On-call consultant",
    canCall: false,
    canMessage: true,
  },
  {
    id: "rohan-partner",
    name: "Rohan (Partner)",
    role: "Primary Caregiver",
    facility: "Synced to all alerts & appointments",
    nextAppointment: "Active shared access",
    badge: "Primary Caregiver",
    avatar: ASSETS.rohanPartner,
    status: "Active shared access",
    canCall: true,
    canMessage: true,
  },
];

export const AUDIO_TRACKS: AudioTrack[] = [
  {
    id: "track-1",
    title: "Gentle Pelvic Floor Reset & Breathwork",
    category: "Audio Therapy",
    duration: "8 mins",
    speaker: "Guided by Dr. Ananya Sharma, Women's PT",
    description:
      "Gentle restorative diaphragmatic breathing tailored to decompress the pelvic sling.",
    colorClass: "bg-secondary-container text-on-secondary-container",
    frequency: 174,
  },
  {
    id: "track-2",
    title: "Fourth Trimester Sleep & Nervous System Calm",
    category: "Mindfulness",
    duration: "12 mins",
    speaker: "Deep relaxation for interrupted nights",
    description:
      "Soothing delta-wave pacing designed to calm hyper-vigilance during late pregnancy and newborn nights.",
    colorClass: "bg-primary-fixed text-on-primary-fixed-variant",
    frequency: 216,
  },
  {
    id: "track-3",
    title: "Warm Iron-Rich Soups for Postpartum Qi",
    category: "Nutrition & Vitality",
    duration: "6 mins",
    speaker: "Ayurvedic postpartum recovery wisdom",
    description:
      "Traditional golden month broths, sesame seeds, and warm digestive nourishment guidance.",
    colorClass: "bg-tertiary-fixed text-on-tertiary-fixed",
    frequency: 285,
  },
  {
    id: "track-4",
    title: "Diastasis Recti Safe Postures",
    category: "Core Rehab",
    duration: "10 mins",
    speaker: "Protecting your abdominal wall while lifting baby",
    description:
      "Step-by-step biomechanics for log-rolling out of bed and carrying your infant without intra-abdominal pressure.",
    colorClass: "bg-secondary-fixed text-on-secondary-fixed",
    frequency: 396,
  },
];

export const ARTICLES: ArticleItem[] = [
  {
    id: "art-1",
    category: "Trimester Guide",
    title: "Third Trimester Shift & Preparation",
    snippet:
      "What to expect as you enter the final stretch of your beautiful journey.",
    fullContent:
      "As you transition into the final stretch of your pregnancy, your body undergoes significant hormonal and musculoskeletal shifts. Relaxin softens your pelvic ligaments in preparation for labor, which can manifest as mild pelvic pressure or sacroiliac joint tenderness. Prioritize side-sleeping with supportive pillows, hydrate consistently with electrolyte-rich water, and practice perineal relaxation techniques. Remember that rest is productive preparation.",
    readTime: "4 min read",
    imageUrl: ASSETS.article1,
    alt: "Expectant mother reading a pregnancy journal on a cozy cream-colored sofa in a sunlit room",
  },
  {
    id: "art-2",
    category: "Baby Dev",
    title: "Baby Development: Sensory Awakening",
    snippet:
      "Discover how your little one is reacting to light, sound, and your voice every day.",
    fullContent:
      "At Week 24, your baby weighs approximately 600 grams (about the size of an ear of corn or large ripe mango) and measures 30 cm from crown to heel. Their inner ear structures (the cochlea and vestibular system) are now fully developed! Baby can clearly perceive the cadence of your voice, the rhythm of your heartbeat, and even sudden external music. Talking softly or singing to your belly creates early neural pathways of comfort and attachment.",
    readTime: "3 min read",
    imageUrl: ASSETS.article2,
    alt: "Gentle ultrasound scan glowing softly on a clinical monitor with warm lighting",
  },
];
