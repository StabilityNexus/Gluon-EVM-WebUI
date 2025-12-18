"use client";

import { useState, useEffect } from "react";
import Footer from "./Footer";
import KyaModal from "./KyaModal";
import ShareModal from "./ShareModal";

export default function ClientFooter() {
  const [isKyaModalOpen, setIsKyaModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  useEffect(() => {
    // Check if user has seen KYA modal before
    const kyaSeen = localStorage.getItem("kya_seen_v1");
    if (!kyaSeen) {
      setIsKyaModalOpen(true);
    }
  }, []);

  const handleKyaClick = () => {
    setIsKyaModalOpen(true);
  };

  const handleKyaClose = () => {
    setIsKyaModalOpen(false);
  };

  const handleKyaUnderstand = () => {
    setIsKyaModalOpen(false);
  };

  const handleShareClick = () => {
    setIsShareModalOpen(true);
  };

  const handleShareClose = () => {
    setIsShareModalOpen(false);
  };

  return (
    <>
      <Footer onKyaClick={handleKyaClick} onShareClick={handleShareClick} />
      <KyaModal
        isOpen={isKyaModalOpen}
        onClose={handleKyaClose}
        onUnderstand={handleKyaUnderstand}
      />
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={handleShareClose}
      />
    </>
  );
}

