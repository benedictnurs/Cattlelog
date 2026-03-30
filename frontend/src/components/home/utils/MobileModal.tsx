"use client";
import React, { useState, useEffect, ReactNode } from "react";
import { motion } from "framer-motion";
import SelectedCourse from "../SelectedCourse";
import Header from "../../Header";
import { Course } from "../../types/Course";

interface ModalContentProps {
  children: ReactNode;
}
const ModalContent = ({ children }: ModalContentProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.3, duration: 0.5 }}
    className="flex-grow overflow-auto"
  >
    {children}
  </motion.div>
);

interface MobileExpandingModalProps {
  selected: Course | null;
  setSelected: (value: Course | null) => void;
}

export default function MobileExpandingModal({
  selected,
  setSelected,
}: MobileExpandingModalProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);

    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  useEffect(() => {
    if (!isMobile) {
      setSelected(null); // Close the modal when switching to non-mobile view
    }
  }, [isMobile, setSelected]);

  if (!isMobile || !selected) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-hidden">
      <Header />
      <div className="h-full flex flex-col">
        <ModalContent>
          <SelectedCourse
            selected={selected}
            onClose={() => setSelected(null)}
          />
        </ModalContent>
      </div>
    </div>
  );
}
