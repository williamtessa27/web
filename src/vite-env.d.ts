/// <reference types="vite/client" />

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
