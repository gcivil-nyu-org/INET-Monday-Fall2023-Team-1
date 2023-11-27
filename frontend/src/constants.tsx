import axios from "axios";

const getProdAPIHost = () => {
  // const vercelCommitRef = process.env["VERCEL_GIT_COMMIT_REF"]?.toLowerCase();
  // if ("master" === vercelCommitRef) {
  //   return "https://production.furbabyapi.net";
  // }

  return "https://api.furbabyapi.net";
};

export const DEFAULT_PROFILE_PICTURE = "https://randomuser.me/api/portraits/lego/1.jpg" as const;

const PROD_API_HOST = getProdAPIHost();
const LOCAL_API_HOST = "http://localhost:8000";
const API_HOST = process.env.NODE_ENV === "development" ? LOCAL_API_HOST : PROD_API_HOST;

axios.defaults.baseURL = API_HOST;
axios.defaults.xsrfHeaderName = "X-CSRFToken";
axios.defaults.xsrfCookieName = "csrftoken";
axios.defaults.headers.post["Content-Type"] = "application/json";
axios.defaults.withCredentials = true;

export const ROUTES = {
  ROOT: "/",
  SIGN_UP: "/signup",
  LOGIN: "/login",
  FORGOT_PASSWORD: "/forgot-password",
  PROTECTED_ROUTES: {
    HOME: "/home",
    PROFILE: "/profile",
    SETTINGS: "/settings",
    PET_PROFILES: "/pet-profiles",
    JOBS: "/jobs",
    DASHBOARD: "/home",
    LOCATIONS: "/locations",
  },
} as const;

export const API_ROUTES = {
  AUTH: {
    REGISTER: "auth/register",
    LOGIN: "auth/login",
    LOGOUT: "auth/logout",
    SESSION: "auth/session",
    WHOAMI: "auth/whoami",
    FORGOT_PASSWORD: {
      INIT_RESET_PASSWORD: "auth/password_reset/",
      VERIFY_TOKEN: "auth/password_reset/validate_token/",
      CONFIRM_NEW_PASSWORD: "auth/password_reset/confirm/",
    },
  },
  HOME: "/",
  USER: {
    USER_ROOT: "api/user",
    PROFILE_PICTURE: "api/user/profile_picture",
    LOCATION: "api/location",
  },
  PETS: "pets/",
  JOBS: "jobs/",
  APPLY: "applications/",
} as const;
