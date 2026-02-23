import { useState, useRef, useEffect } from 'react';
import { HiOutlineInformationCircle } from 'react-icons/hi2';

interface InfoTooltipProps {
  /** Contenu affiché au survol (texte ou JSX). */
  content: React.ReactNode;
  /** Taille de l’icône en pixels. */
  size?: number;
  /** Classe CSS optionnelle pour le conteneur. */
  className?: string;
}

/**
 * Icône info qui affiche une bulle d’aide au survol (hover).
 * Composant réutilisable pour expliquer un champ ou une notion.
 */
export default function InfoTooltip({ content, size = 18, className = '' }: InfoTooltipProps) {
  const [visible, setVisible] = useState(false);
  const wrapperRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!visible) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setVisible(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [visible]);

  return (
    <span
      ref={wrapperRef}
      className={`relative inline-flex align-middle ${className}`}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      <HiOutlineInformationCircle
        className="text-gray-400 hover:text-primary-500 cursor-help shrink-0 transition-colors"
        size={size}
        aria-hidden
      />
      {visible && (
        <span
          className="absolute left-1/2 bottom-full -translate-x-1/2 mb-2 z-50 w-72 p-3 text-sm text-left text-gray-800 bg-white border border-gray-200 rounded-lg shadow-lg ring-1 ring-black/5"
          role="tooltip"
        >
          <span className="block">{content}</span>
          <span className="absolute left-1/2 top-full -translate-x-1/2 -mt-1 border-4 border-transparent border-t-white" />
        </span>
      )}
    </span>
  );
}
