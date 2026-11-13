import { ROLES } from "./roles";
import { ROUTES } from "./routes";

export const PUBLIC_NAV = [
  { labelKey: "nav.home", fallback: "Home", href: ROUTES.HOME },
  { labelKey: "nav.myths", fallback: "Myths & Facts", href: ROUTES.MYTHS },
  { labelKey: "nav.selfExam", fallback: "Self-Exam", href: ROUTES.SELF_EXAM },
  { labelKey: "nav.modelCard", fallback: "Model Card", href: ROUTES.MODEL_CARD },
  { labelKey: "nav.roadmap", fallback: "Roadmap", href: ROUTES.ROADMAP },
  { labelKey: "nav.emergency", fallback: "Emergency", href: ROUTES.EMERGENCY, isEmergency: true },
];

export const ROLE_NAVIGATION = {
  [ROLES.PATIENT]: [
    { labelKey: "nav.dashboard", fallback: "Overview", href: ROUTES.PATIENT_HOME, icon: "LayoutDashboard" },
    { labelKey: "nav.intake", fallback: "Health Intake", href: ROUTES.PATIENT_INTAKE, icon: "ClipboardList" },
    { labelKey: "nav.symptoms", fallback: "Symptom Check", href: ROUTES.PATIENT_SYMPTOMS, icon: "Activity" },
    { labelKey: "nav.photo", fallback: "Photo Screener", href: ROUTES.PATIENT_PHOTO, icon: "Camera" },
    { labelKey: "nav.results", fallback: "Screening Results", href: ROUTES.PATIENT_RESULTS, icon: "FileText" },
    { labelKey: "nav.cases", fallback: "My Cases", href: ROUTES.PATIENT_CASES, icon: "FolderOpen" },
    { labelKey: "nav.quitTobacco", fallback: "Quit Tobacco", href: ROUTES.PATIENT_QUIT, icon: "Heart" },
  ],
  [ROLES.HEALTH_WORKER]: [
    { labelKey: "nav.dashboard", fallback: "Camp Overview", href: ROUTES.HEALTH_WORKER_HOME, icon: "LayoutDashboard" },
    { labelKey: "nav.campMode", fallback: "Camp Screening", href: ROUTES.HEALTH_WORKER_CAMP, icon: "Users" },
    { labelKey: "nav.intake", fallback: "Assisted Intake", href: ROUTES.HEALTH_WORKER_INTAKE, icon: "UserPlus" },
  ],
  [ROLES.DOCTOR]: [
    { labelKey: "nav.queue", fallback: "Case Queue", href: ROUTES.DOCTOR_HOME, icon: "ClipboardCheck" },
    { labelKey: "nav.insights", fallback: "Analytics & Hotspots", href: ROUTES.DOCTOR_INSIGHTS, icon: "BarChart3" },
  ],
  [ROLES.ADMIN]: [
    { labelKey: "nav.admin", fallback: "Admin Dashboard", href: ROUTES.ADMIN_HOME, icon: "Shield" },
    { labelKey: "nav.staffManagement", fallback: "Staff Management", href: ROUTES.ADMIN_STAFF, icon: "UserCog" },
    { labelKey: "nav.insights", fallback: "Global Analytics", href: ROUTES.INSIGHTS, icon: "PieChart" },
  ],
};
