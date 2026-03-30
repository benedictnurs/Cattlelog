import React, { useEffect, useState, useId } from "react";
import { AlignJustify, X, Star, Info } from "lucide-react";
import posthog from "posthog-js";
import { Link } from "react-router-dom";
import { ScheduleIcon, GradesIcon, WriteReviewIcon } from "./header/Icons";
import { UserButton } from "@stackframe/react";

interface HeaderProps {
  showSearch?: boolean;
  searchTerm?: string;
  onSearchTermChange?: (term: string) => void;
  onClearFilters?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  showSearch = false,
  searchTerm,
  onSearchTermChange,
  onClearFilters,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const FEATURES = {
    auth: false,
  };

  type LinkItem = {
    label: string;
    to: string;
    enabled: boolean;
    icon: React.ComponentType<{ className?: string; size?: number | string }>;
  };

  const LINKS: LinkItem[] = [
    {
      label: "Write a Review",
      to: "/write-review",
      enabled: true,
      icon: WriteReviewIcon,
    },
    {
      label: "Favorites",
      to: "/favorites",
      enabled: true,
      icon: Star,
    },
    {
      label: "Schedules",
      to: "/cooked/start",
      enabled: true,
      icon: ScheduleIcon,
    },
    { label: "About", to: "/about", enabled: false, icon: Info },
    {
      label: "Grades",
      to: "/grade-distribution",
      enabled: true,
      icon: GradesIcon,
    },
  ];

  const toggle = () => setMenuOpen((v) => !v);
  const searchInputId = useId();

  const onSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    posthog.capture("filters_search_changed", { value });
    onSearchTermChange?.(value);
  };

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = menuOpen ? "hidden" : prev || "";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  return (
    <div className="relative">
      <nav className="hidden py-1.5 md:flex px-6 justify-between items-center bg-[#15374D]">
        <div className="flex items-center">
          <Link
            to="/home"
            className="flex items-center"
            onClick={() => {
              onSearchTermChange?.("");
              onClearFilters?.();
              posthog.capture("clicked_logo_clear_filters", {
                location: "desktop",
              });
            }}
          >
            <img src="/cory-logo.avif" alt="Logo" className="h-14 w-auto" />
            <img
              src="/cattlelog-gradient.svg"
              alt="Cattlelog"
              className="h-[44px] w-auto ml-1"
            />
          </Link>
        </div>

        {showSearch && (
          <div className="flex-1 mx-8 hidden lg:block">
            <div className="relative">
              <img
                src="/magnifying-glass-solid 1.svg"
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 w-4 h-4 transform -translate-y-1/2"
              />
              <input
                id={searchInputId}
                type="text"
                placeholder="Search Courses..."
                value={searchTerm ?? ""}
                onChange={onSearchInput}
                className="p-1.5 pl-10 pr-8 w-full rounded-3xl border focus:outline-none focus:border-gray-500 placeholder-[#7C7C7C]"
              />
              {(searchTerm ?? "").length > 0 && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => {
                    onSearchTermChange?.("");
                    posthog.capture("filters_search_cleared", {
                      location: "header",
                    });
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-red-500"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center space-x-6">
          {LINKS.filter((l) => l.enabled).map((l) => {
            const Icon = l.icon;
            return (
              <Link
                key={l.to}
                to={l.to}
                className="text-white hover:underline flex items-center gap-1.5"
              >
                <Icon className="w-4 h-4" />
                <span>{l.label}</span>
              </Link>
            );
          })}

          {FEATURES.auth ? <UserButton /> : <></>}
        </div>
      </nav>

      {/*Mobile view of header*/}
      <nav className="flex p-2 md:hidden pl-6 pr-4 justify-between items-center bg-[#15374D]">
        <div className="flex items-center">
          <Link
            to="/home"
            className="flex items-center"
            onClick={() => {
              onSearchTermChange?.("");
              onClearFilters?.();
              posthog.capture("clicked_logo_clear_filters", {
                location: "mobile",
              });
            }}
          >
            <img src="/cory-logo.avif" alt="Logo" className="h-11 w-12" />
            <img
              src="/cattlelog-gradient.svg"
              alt="Cattlelog"
              className="h-8 w-auto ml-1"
            />
          </Link>
        </div>
        <button onClick={toggle}>
          {menuOpen ? (
            <X className="text-white" />
          ) : (
            <AlignJustify className=" text-white" />
          )}
        </button>

        {/* Backdrop and Modal Container */}
        {menuOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 mt-[60px]"
            onClick={toggle}
          ></div>
        )}

        <div
          className={`fixed top-[60px] inset-y-0 right-0 w-1/2 bg-white shadow-xl pt-5 pr-6 z-50 transform transition-transform duration-300 ease-in-out ${
            menuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="relative flex flex-col items-end justify-center gap-4 ml-5">
            {LINKS.filter((l) => l.enabled).map((l) => {
              const Icon = l.icon;
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  className="text-black hover:underline flex items-center gap-1.5"
                  onClick={() => setMenuOpen(false)}
                >
                  <Icon className="w-4 h-4" />
                  <span>{l.label}</span>
                </Link>
              );
            })}

            {FEATURES.auth ? <UserButton /> : <></>}
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Header;
