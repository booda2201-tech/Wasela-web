import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  BaseRouteReuseStrategy,
  DetachedRouteHandle,
} from '@angular/router';

/**
 * Routes with `data: { keepAlive: true }` are detached instead of destroyed, so their
 * DOM (and GIF playback) survives navigation until a full page refresh.
 */
@Injectable()
export class KeepAliveRouteReuseStrategy extends BaseRouteReuseStrategy {
  private readonly handles = new Map<string, DetachedRouteHandle>();

  override shouldDetach(route: ActivatedRouteSnapshot): boolean {
    return !!route.routeConfig?.data?.['keepAlive'];
  }

  override store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle | null): void {
    const key = this.key(route);
    if (!key) {
      return;
    }
    if (handle) {
      this.handles.set(key, handle);
    } else {
      this.handles.delete(key);
    }
  }

  override shouldAttach(route: ActivatedRouteSnapshot): boolean {
    const key = this.key(route);
    return !!key && this.handles.has(key);
  }

  override retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
    const key = this.key(route);
    return key ? this.handles.get(key) ?? null : null;
  }

  private key(route: ActivatedRouteSnapshot): string | null {
    return route.routeConfig?.data?.['keepAlive'] ? route.routeConfig.path ?? '' : null;
  }
}
