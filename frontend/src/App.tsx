import React, { useEffect, Suspense } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useParams,
  Navigate,
  useLocation,
} from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import Favorites from "./pages/FavoritesPage";
import CattlelogBlog from "./pages/GradeDistBlog";
import EasyClassesBlog from "./pages/EasyClassesBlog";
import About from "./pages/About";
import Home from "./pages/Home";
import QRCodeGenerator from "./pages/QRInternalPage";
import GradeDistPage from "./pages/GradeDistPage";
import CookedClass from "./pages/CookedClass";
import LandingGradeDistPage from "./pages/LandingGradeDistPage";
import ProfessorPage from "./pages/ProfessorPage";
import { Analytics } from "@vercel/analytics/react";
import { usePostHog } from "posthog-js/react";
import WriteReview from "./pages/WriteReview";
import ShareCory from "./components/ShareCory";
import GiveEmail from "./pages/GiveEmail";
import ProfHome from "./pages/ProfHome";
import Trivia from "./pages/Trivia";
import { StackHandler, StackProvider, StackTheme } from "@stackframe/react";
import { stackClientApp } from "./stack/client";

function HandlerRoutes() {
  const location = useLocation();

  return (
    <StackHandler app={stackClientApp} location={location.pathname} fullPage />
  );
}

// Hook to track page views
const PostHogPageViewTracker = () => {
  const location = useLocation();
  const posthog = usePostHog();
  useEffect(() => {
    if (posthog) {
      posthog.capture("$pageview", { path: location.pathname });
    }
  }, [location, posthog]);
  return null;
};

/* Redirects old endpoint */
const RedirectCourseGrade = () => {
  const { courseId } = useParams();
  return <Navigate to={`/grade/${courseId}`} replace />;
};

const RedirectProfessors = () => {
  const { identifier } = useParams();
  return <Navigate to={`/professor/${identifier}`} replace />;
};

function App() {
  return (
    <Suspense fallback={"Loading..."}>
      <BrowserRouter>
        <StackProvider app={stackClientApp}>
          <StackTheme>
            <Analytics />
            <PostHogPageViewTracker />
            <ShareCory />
            <Routes>
              {/* Stack auth routes */}
              <Route path="/handler/*" element={<HandlerRoutes />} />

              {/* Existing routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/home" element={<Home />} />
              <Route path="/profs" element={<ProfHome />} />
              <Route
                path="/grade-distribution"
                element={<LandingGradeDistPage />}
              />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/about" element={<About />} />
              <Route path="/blog" element={<CattlelogBlog />} />
              <Route
                path="/easy-classes-uc-davis"
                element={<EasyClassesBlog />}
              />
              <Route
                path="/blog/easy-ge-courses"
                element={<EasyClassesBlog />}
              />
              <Route
                path="/professors/:identifier"
                element={<RedirectProfessors />}
              />
              <Route
                path="/professor/:identifier"
                element={<ProfessorPage />}
              />
              <Route path="/write-review" element={<WriteReview />} />
              <Route path="/course/:courseId" element={<Home />} />
              <Route
                path="/course_grade/:courseId"
                element={<RedirectCourseGrade />}
              />
              <Route path="/grade/:courseId" element={<GradeDistPage />} />
              <Route path="/cooked/:compareData" element={<CookedClass />} />
              <Route path="/email/" element={<GiveEmail />} />
              <Route path="/qr/" element={<QRCodeGenerator />} />
              <Route path="/trivia/" element={<Trivia />} />
            </Routes>
          </StackTheme>
        </StackProvider>
      </BrowserRouter>
    </Suspense>
  );
}

export default App;
