interface ImportMetaEnv {
  /** ID público do Meta Pixel, definido no build (GitHub Actions: vars.META_PIXEL_ID). */
  readonly VITE_META_PIXEL_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
