/**
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {Component, OnDestroy} from '@angular/core';
import {DomSanitizer, SafeResourceUrl} from '@angular/platform-browser';
import {MatIconRegistry} from '@angular/material/icon';
import {Router} from '@angular/router';
import {UserService} from '../common/services/user.service';
import {AuthService} from '../common/services/auth.service';
import {environment} from '../../environments/environment';
import {UserModel} from '../common/models/user.model';
import {animate, style, transition, trigger} from '@angular/animations';
import {BreakpointObserver, Breakpoints} from '@angular/cdk/layout';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  animations: [
    trigger('fadeSlideInOut', [
      transition(':enter', [
        style({opacity: 0, transform: 'translateY(-10px)'}),
        animate(
          '300ms ease-in-out',
          style({opacity: 1, transform: 'translateY(0)'}),
        ),
      ]),
      transition(':leave', [
        animate(
          '300ms ease-in-out',
          style({opacity: 0, transform: 'translateY(-10px)'}),
        ),
      ]),
    ]),
  ],
})
export class HeaderComponent implements OnDestroy {
  currentUser: UserModel | null;
  menuFixed = false;
  menuIsHovered = false;

  isDesktop = false;
  private readonly destroy$ = new Subject<void>();
  toolsMenuHovered = false;
  private menuTimeout: any;

  constructor(
    private sanitizer: DomSanitizer,
    public matIconRegistry: MatIconRegistry,
    public router: Router,
    public userService: UserService,
    public authService: AuthService,
    private breakpointObserver: BreakpointObserver,
  ) {
    // Initialize menuFixed from localStorage
    const storedMenuFixed = localStorage.getItem('menuFixed');
    this.menuFixed = storedMenuFixed === 'true';

    this.matIconRegistry
      .addSvgIcon(
        'creative-studio-icon',
        this.setPath(`${this.path}/creative-studio-icon.svg`),
      )
      .addSvgIcon(
        'fun-templates-icon',
        this.setPath(`${this.path}/fun-templates-icon.svg`),
      )
      .addSvgIcon(
        'audio-generation-icon',
        this.setPath(`${this.path}/audio-generation-icon.svg`),
      );

    this.currentUser = this.userService.getUserDetails();

    this.breakpointObserver
      .observe([Breakpoints.Medium, Breakpoints.Large, Breakpoints.XLarge])
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        this.isDesktop = result.matches;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private path = '../../assets/images';

  private setPath(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  logout() {
    void this.authService.logout();
  }

  navigate() {
    void this.router.navigateByUrl('/');
  }

  toggleMenu() {
    this.menuFixed = !this.menuFixed;
    localStorage.setItem('menuFixed', String(this.menuFixed));
  }

  getTooltipText() {
    return this.menuFixed
      ? `Hey there ${this.currentUser?.name?.split(' ')?.[0] || ''}! Click to make the menu dynamic`
      : 'Click to make the menu fixed';
  }

  onToolsEnter() {
    // If we enter the area, cancel any pending close action
    if (this.menuTimeout) {
      clearTimeout(this.menuTimeout);
    }
    this.toolsMenuHovered = true;
  }

  onToolsLeave() {
    // When leaving, wait 200ms before actually closing.
    // If the user enters the menu during this time, onToolsEnter()
    // will cancel this timer, keeping the menu open.
    this.menuTimeout = setTimeout(() => {
      this.toolsMenuHovered = false;
    }, 200);
  }
}
