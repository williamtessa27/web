/// <reference types="vite/client" />

// Permet au build de résoudre ces modules si node_modules n'est pas encore installé (ex: après git pull, avant npm install)
declare module 'leaflet';
declare module 'react-leaflet';

declare module 'react-google-recaptcha' {
  import type { ComponentType, RefObject } from 'react';
  export interface ReCAPTCHAProps {
    sitekey: string;
    theme?: 'light' | 'dark';
    size?: 'compact' | 'normal' | 'invisible';
  }
  export interface ReCAPTCHAInstance {
    getValue(): string;
    reset(): void;
  }
  const ReCAPTCHA: ComponentType<ReCAPTCHAProps & { ref?: RefObject<ReCAPTCHAInstance | null> }>;
  export default ReCAPTCHA;
}
