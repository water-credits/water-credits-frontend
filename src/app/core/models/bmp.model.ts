/**
 * Represents a Best Management Practice (BMP) available for farmer enrollment.
 *
 * The `icon` field holds a Lucide icon constructor reference. It is typed as
 * `any` deliberately: Lucide's published `LucideIconData` type is an internal
 * tuple type that varies between versions and importing it directly creates a
 * hard coupling to the Lucide internals. Using `any` keeps the model portable
 * while the concrete icon object is always resolved at the feature-component
 * level, which is the only place Lucide is actually rendered.
 */
export interface Bmp {
  /** Stable server-side identifier, e.g. "cover-crops". */
  id: string;
  name: string;
  description: string;
  category: string;
  /** Server-authoritative enrollment status for the current farmer. */
  enrolled: boolean;
  /** Estimated water-quality credits earned per year when enrolled. */
  estimatedCredits: number;
  /**
   * Lucide icon constructor — typed as `any` for portability.
   * See file-level comment for rationale.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
  requirements: string[];
}
