import {
  Component,
  Input,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  ElementRef,
  inject,
  DestroyRef,
} from '@angular/core';
import { Store } from '@ngrx/store';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import * as L from 'leaflet';
import { AppState } from '../../../core/store/app.state';
import { selectIsDarkMode } from '../../../core/store/ui/ui.selectors';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

/** Tile layer configurations for each theme. */
const TILE_LAYERS = {
  /** Light: OpenStreetMap standard tiles */
  light: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
  /** Dark: CartoDB Dark Matter – no labels variant for a clean dark aesthetic */
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 19,
  },
} as const;

export interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  label?: string;
  status?: string;
  popupContent?: string;
}

@Component({
  selector: 'app-map-view',
  standalone: true,
  imports: [],
  template: `
    <div
      class="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700"
      [style.height.px]="height"
    >
      <div #mapContainer class="w-full h-full"></div>
    </div>
  `,
})
export class MapViewComponent implements AfterViewInit, OnDestroy {
  @Input() markers: MapMarker[] = [];
  @Input() height = 400;
  @Input() centerLat = 20;
  @Input() centerLng = 0;
  @Input() zoom = 2;
  @Input() clickable = false;

  @ViewChild('mapContainer') mapContainer!: ElementRef<HTMLDivElement>;

  private readonly store = inject(Store<AppState>);
  private readonly destroyRef = inject(DestroyRef);

  private map: L.Map | null = null;
  private tileLayer: L.TileLayer | null = null;
  private isDark = true;

  constructor() {
    // Subscribe to theme changes and swap tile layers accordingly.
    this.store
      .select(selectIsDarkMode)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((dark) => {
        this.isDark = dark;
        // Swap tiles if the map has already been initialised.
        if (this.map) {
          this.swapTileLayer(dark);
        }
      });
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  private initMap(): void {
    this.map = L.map(this.mapContainer.nativeElement, {
      center: [this.centerLat, this.centerLng],
      zoom: this.zoom,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    const tileConfig = this.isDark ? TILE_LAYERS.dark : TILE_LAYERS.light;
    this.tileLayer = L.tileLayer(tileConfig.url, {
      attribution: tileConfig.attribution,
      maxZoom: tileConfig.maxZoom,
    }).addTo(this.map);

    this.addMarkers();
  }

  /**
   * Removes the current tile layer and adds the correct one for the new theme.
   * Called at runtime when the user toggles the theme.
   */
  private swapTileLayer(isDark: boolean): void {
    if (!this.map) return;
    if (this.tileLayer) {
      this.map.removeLayer(this.tileLayer);
    }
    const tileConfig = isDark ? TILE_LAYERS.dark : TILE_LAYERS.light;
    this.tileLayer = L.tileLayer(tileConfig.url, {
      attribution: tileConfig.attribution,
      maxZoom: tileConfig.maxZoom,
    }).addTo(this.map);
  }

  private addMarkers(): void {
    this.markers.forEach((marker) => {
      const color = this.getStatusColor(marker.status);
      const icon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="background:${color};width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);"></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      });

      const m = L.marker([marker.latitude, marker.longitude], { icon }).addTo(this.map!);

      if (marker.popupContent) {
        m.bindPopup(marker.popupContent);
      }
    });

    if (this.markers.length > 0) {
      const bounds = L.latLngBounds(
        this.markers.map((m) => [m.latitude, m.longitude] as [number, number]),
      );
      this.map?.fitBounds(bounds, { padding: [50, 50] });
    }
  }

  private getStatusColor(status?: string): string {
    switch (status) {
      case 'active':
        return '#10B981';
      case 'baseline':
        return '#3B82F6';
      case 'registered':
        return '#7B2FBE';
      case 'completed':
        return '#059669';
      case 'closed':
        return '#EF4444';
      default:
        return '#94A3B8';
    }
  }
}
