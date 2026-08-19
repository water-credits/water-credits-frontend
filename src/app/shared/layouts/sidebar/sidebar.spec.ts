import { BehaviorSubject } from 'rxjs';

import { SidebarComponent } from './sidebar';
import { selectSidebarOpen } from '../../../core/store/ui/ui.selectors';
import { selectCurrentUserRole } from '../../../core/store/auth/auth.selectors';
import { UserRole } from '../../../core/models/user.model';

describe('SidebarComponent (role filtering)', () => {
  function createMockStore(role$: BehaviorSubject<string | null>, open$: BehaviorSubject<boolean>) {
    return {
      select: (selector: any) => {
        if (selector === selectCurrentUserRole) return role$.asObservable();
        if (selector === selectSidebarOpen) return open$.asObservable();
        return undefined;
      },
      dispatch: () => {},
    } as any;
  }

  it('BUYER sees no Farmers or Admin links', () => {
    const role$ = new BehaviorSubject<string | null>(UserRole.BUYER);
    const open$ = new BehaviorSubject<boolean>(true);
    const mockStore = createMockStore(role$, open$);

    const comp = new SidebarComponent(mockStore);
    comp.ngOnInit();

    expect(comp['navItems'].some((n) => n.label === 'Farmers')).toBe(false);
    expect(comp['navItems'].some((n) => n.label === 'Admin')).toBe(false);

    comp.ngOnDestroy();
  });

  it('FARMER sees Farmers but not Admin', () => {
    const role$ = new BehaviorSubject<string | null>(UserRole.FARMER);
    const open$ = new BehaviorSubject<boolean>(true);
    const mockStore = createMockStore(role$, open$);

    const comp = new SidebarComponent(mockStore);
    comp.ngOnInit();

    expect(comp['navItems'].some((n) => n.label === 'Farmers')).toBe(true);
    expect(comp['navItems'].some((n) => n.label === 'Admin')).toBe(false);

    comp.ngOnDestroy();
  });

  it('ADMIN sees both Farmers and Admin', () => {
    const role$ = new BehaviorSubject<string | null>(UserRole.ADMIN);
    const open$ = new BehaviorSubject<boolean>(true);
    const mockStore = createMockStore(role$, open$);

    const comp = new SidebarComponent(mockStore);
    comp.ngOnInit();

    expect(comp['navItems'].some((n) => n.label === 'Farmers')).toBe(true);
    expect(comp['navItems'].some((n) => n.label === 'Admin')).toBe(true);

    comp.ngOnDestroy();
  });
});
