import React, { FC, useEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import clsx from "clsx";

export interface DropdownItem {
  value: string;
  label: string;
  count?: number;
}

interface Props {
  items: DropdownItem[];
  value: string | null;
  onChange: (value: string | null) => void;
  totalCount: number;
}

const CourseDropdown: FC<Props> = ({ items, value, onChange, totalCount }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedItem = items.find((i) => i.value === value);
  const label = selectedItem ? selectedItem.label : "All Courses";
  const buttonCount = selectedItem?.count ?? totalCount;

  return (
    <div className="w-48 relative shadow-md rounded-md" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between w-full px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-md bg-gray-100 text-left drop-shadow-lg focus:outline-none focus:ring-2 focus:ring-slate-700"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <div>
          {label}
          <span className="text-gray-500 ml-1">({buttonCount})</span>
        </div>
        <ChevronDown className="ml-2 text-gray-500" />
      </button>
      {open && (
        <ul className="absolute mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto z-10">
          {items.map((item) => (
            <li
              key={item.value}
              onClick={() => {
                onChange(item.value || null);
                setOpen(false);
              }}
              className={clsx(
                "flex cursor-pointer items-center justify-between px-4 py-2 hover:bg-slate-200",
                (value || "") === item.value && "bg-slate-200 font-semibold",
              )}
            >
              <span>
                {item.label}
                {typeof item.count === "number" && (
                  <span className="ml-1 text-gray-500">({item.count})</span>
                )}
              </span>
              {(value || "") === item.value && (
                <Check className="h-4 w-4 text-slate-700" />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CourseDropdown;
