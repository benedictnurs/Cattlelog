import { Helmet } from "react-helmet";

type Props = {
  title?: string;
  description?: string;
  keywords?: string[];
  canonical?: string;
  showLanding?: boolean;
  ogUrl?: string;
};

export default function HomeHelmet({
  title = "Cattlelog - Explore and Compare Courses",
  description = "Browse and compare UC Davis courses with Cattlelog. Discover the best classes, view grade distributions and find the perfect course for your schedule.",
  keywords = [
    "Cattlelog",
    "UC Davis",
    "grade distributions",
    "courses",
    "schedule planning",
    "academic planning",
    "top-rated courses",
  ],
  canonical,
  showLanding = false,
  ogUrl,
}: Props) {
  const canonicalHref =
    canonical ?? `https://daviscattlelog.com${showLanding ? "/home" : "/"}`;
  const finalOgUrl = ogUrl ?? "https://daviscattlelog.com/";

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords.join(", ")} />
      <meta name="author" content="Cattlelog Team" />
      <meta property="og:title" content="Cattlelog - Explore Courses" />
      <meta property="og:description" content={description} />
      <link rel="canonical" href={canonicalHref} />
      <meta property="og:url" content={finalOgUrl} />
      <meta property="og:type" content="website" />
    </Helmet>
  );
}
