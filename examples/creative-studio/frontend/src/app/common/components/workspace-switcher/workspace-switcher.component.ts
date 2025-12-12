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

import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {Workspace, WorkspaceScope} from '../../models/workspace.model';
import {WorkspaceService} from '../../../services/workspace/workspace.service';
import {WorkspaceStateService} from '../../../services/workspace/workspace-state.service';
import {CreateWorkspaceModalComponent} from '../create-workspace-modal/create-workspace-modal.component';
import {ConfirmationDialogComponent} from '../confirmation-dialog/confirmation-dialog.component';
import {
  handleErrorSnackbar,
  handleSuccessSnackbar,
} from '../../../utils/handleMessageSnackbar';
import {
  InviteUserData,
  InviteUserModalComponent,
} from '../invite-user-modal/invite-user-modal.component';
import {UserService} from '../../services/user.service';
import {UserModel, UserRolesEnum} from '../../models/user.model';
import {
  BrandGuidelineDialogComponent,
  BrandGuidelineDialogData,
} from '../brand-guideline-dialog/brand-guideline-dialog.component';
import {BrandGuidelineService} from '../../services/brand-guideline/brand-guideline.service';
import {finalize, map, switchMap} from 'rxjs';
import {JobStatus, MediaItem} from '../../models/media-item.model';

@Component({
  selector: 'app-workspace-switcher',
  templateUrl: './workspace-switcher.component.html',
  styleUrls: ['./workspace-switcher.component.scss'],
})
export class WorkspaceSwitcherComponent implements OnInit {
  workspaces: Workspace[] = [];
  activeWorkspaceId: number | null = null;
  activeWorkspace: Workspace | null = null;
  currentUser: UserModel | null;
  readonly JobStatus = JobStatus;
  public WorkspaceScope = WorkspaceScope;

  constructor(
    private workspaceService: WorkspaceService,
    private workspaceStateService: WorkspaceStateService,
    public brandGuidelineService: BrandGuidelineService,
    private userService: UserService,
    private route: ActivatedRoute,
    public dialog: MatDialog,
    private snackBar: MatSnackBar,
  ) {
    this.currentUser = this.userService.getUserDetails();
  }

  ngOnInit(): void {
    this.loadWorkspaces();
    this.workspaceStateService.activeWorkspaceId$.subscribe(id => {
      // Ensure we handle both string (from legacy/url) and number types safely if needed,
      // but ideally workspaceStateService should also be consistent.
      // Assuming workspaceStateService might still emit strings if not updated, let's cast or parse if needed.
      // For now, let's assume strict number typing is propagated.
      // Actually, workspaceStateService might need checking too.
      // Let's assume id is number here based on the goal.
      this.activeWorkspaceId = typeof id === 'string' ? parseInt(id, 10) : id;
      this.activeWorkspace = this.workspaces.find(w => w.id === this.activeWorkspaceId) || null;
    });

    this.brandGuidelineService.activeBrandGuidelineJob$.subscribe(job => {
      if (job) {
        if (job.status === JobStatus.COMPLETED) {
          handleSuccessSnackbar(
            this.snackBar,
            'Brand Guidelines processed successfully!',
          );
          // Reset the job so the spinner disappears and the button is re-enabled.
          this.brandGuidelineService.clearActiveJob();
        } else if (job.status === JobStatus.FAILED) {
          handleErrorSnackbar(
            this.snackBar,
            {
              message: job.errorMessage || 'Brand Guideline processing failed.',
            },
            'Processing Error',
          );
          this.brandGuidelineService.clearActiveJob();
        }
      }
    });
  }

  loadWorkspaces(): void {
    this.workspaceService.getWorkspaces().subscribe({
      next: workspaces => {
        this.workspaces = workspaces;
        // Now that we have the workspaces, we can determine the initial active one.
        this.initializeActiveWorkspace();
      },
      error: error => {
        handleErrorSnackbar(this.snackBar, error, 'Could not load workspaces');
      },
    });
  }

  initializeActiveWorkspace(): void {
    const storedWorkspaceId = localStorage.getItem('activeWorkspaceId');
    const queryParamId = this.route.snapshot.queryParamMap.get('workspaceId');

    // Order of precedence: URL query param > localStorage > default public.
    let preferredWorkspaceId: number | null = null;

    if (queryParamId) {
        preferredWorkspaceId = parseInt(queryParamId, 10);
    } else if (storedWorkspaceId) {
        preferredWorkspaceId = parseInt(storedWorkspaceId, 10);
    }

    if (
      preferredWorkspaceId &&
      !isNaN(preferredWorkspaceId) &&
      this.workspaces.some(w => w.id === preferredWorkspaceId)
    ) {
      this.setActiveWorkspace(preferredWorkspaceId);
      return;
    }

    const googleWorkspace = this.workspaces.find(
      w => w.scope === WorkspaceScope.PUBLIC,
    );
    if (googleWorkspace) {
      // Fallback to public workspace
      this.setActiveWorkspace(googleWorkspace.id);
    } else if (this.workspaces.length > 0) {
      // Fallback to the first workspace
      this.setActiveWorkspace(this.workspaces[0].id);
    }
  }

  setActiveWorkspace(workspaceId: number | null): void {
    // We might need to cast to any if workspaceStateService expects string,
    // but we should check that service too. For now, let's assume we pass number.
    this.workspaceStateService.setActiveWorkspaceId(workspaceId as any);
    this.activeWorkspace =
      this.workspaces.find(w => w.id === workspaceId) || null;
    this.brandGuidelineService.clearCache();
    if (workspaceId) {
      localStorage.setItem('activeWorkspaceId', workspaceId.toString());
    } else {
      localStorage.removeItem('activeWorkspaceId');
    }
  }

  openCreateWorkspaceDialog(): void {
    const dialogRef = this.dialog.open(CreateWorkspaceModalComponent, {
      width: '300px',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.createWorkspace(result);
      }
    });
  }

  createWorkspace(name: string): void {
    this.workspaceService.createWorkspace(name).subscribe({
      next: newWorkspace => {
        handleSuccessSnackbar(this.snackBar, `Workspace "${name}" created!`);
        this.workspaces.push(newWorkspace);
        this.setActiveWorkspace(newWorkspace.id);
      },
      error: error => {
        handleErrorSnackbar(this.snackBar, error, 'Could not create workspace');
      },
    });
  }

  get canInvite(): boolean {
    if (
      !this.currentUser ||
      !this.activeWorkspace ||
      this.activeWorkspace?.scope === WorkspaceScope.PUBLIC
    ) {
      return false;
    }
    const isOwner = this.currentUser.id === this.activeWorkspace.ownerId;
    const isAdmin = !!this.currentUser.roles?.includes(UserRolesEnum.ADMIN);
    return isOwner || isAdmin;
  }

  get canAccessBrandGuidelines(): boolean {
    if (!this.currentUser || !this.activeWorkspace) return false;

    // Anyone can access guidelines on a public workspace.
    if (this.activeWorkspace.scope === WorkspaceScope.PUBLIC) return true;

    // For private workspaces, only admins or owners can access.
    const isAdmin = !!this.currentUser.roles?.includes(UserRolesEnum.ADMIN);
    const isOwnerOfPrivateWorkspace =
      this.activeWorkspace.scope === WorkspaceScope.PRIVATE &&
      this.currentUser.id === this.activeWorkspace.ownerId;
    return isAdmin || isOwnerOfPrivateWorkspace;
  }

  get canPerformEditActionsOnBrandGuidelines(): boolean {
    if (!this.currentUser || !this.activeWorkspace) return false;
    const isAdmin = !!this.currentUser.roles?.includes(UserRolesEnum.ADMIN);
    const isOwner = this.currentUser.id === this.activeWorkspace.ownerId;
    return isAdmin || isOwner;
  }

  openInviteDialog(event: MouseEvent): void {
    event.stopPropagation();
    if (!this.activeWorkspace) return;

    const dialogRef = this.dialog.open<
      InviteUserModalComponent,
      InviteUserData
    >(InviteUserModalComponent, {
      width: '350px',
      data: {workspaceName: this.activeWorkspace.name},
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && this.activeWorkspaceId) {
        this.workspaceService
          .inviteUser(this.activeWorkspaceId, result.email, result.role)
          .subscribe({
            next: () => {
              handleSuccessSnackbar(this.snackBar, 'Invitation sent!');
            },
            error: error => {
              handleErrorSnackbar(
                this.snackBar,
                error,
                'Failed to send invitation',
              );
            },
          });
      }
    });
  }

  openBrandGuidelinesDialog(event: MouseEvent): void {
    event.stopPropagation();
    if (!this.activeWorkspaceId) return;
    const workspaceId = this.activeWorkspaceId;

    this.brandGuidelineService
      .getBrandGuidelineForWorkspace(workspaceId)
      .pipe(
        switchMap(guideline => {
          const dialogRef = this.dialog.open<
            BrandGuidelineDialogComponent,
            BrandGuidelineDialogData
          >(BrandGuidelineDialogComponent, {
            width: '800px',
            maxWidth: '90vw',
            panelClass: 'brand-guideline-dialog',
            data: {
              workspaceId: workspaceId,
              guideline,
              canEdit: this.canPerformEditActionsOnBrandGuidelines,
            },
          });
          return dialogRef
            .afterClosed()
            .pipe(map(result => ({result, guideline})));
        }),
      )
      .subscribe(({result, guideline}) => {
        if (!result) {
          return; // Dialog was closed without action
        }

        // Handle Deletion
        if (result.delete && guideline?.id) {
          const confirmationDialogRef = this.dialog.open(
            ConfirmationDialogComponent,
            {
              data: {
                title: 'Delete Brand Guideline?',
                message:
                  'Are you sure you want to delete the brand guideline for this workspace? This action cannot be undone.',
              },
            },
          );

          confirmationDialogRef.afterClosed().subscribe(confirmed => {
            if (confirmed) {
              this.brandGuidelineService
                .deleteBrandGuideline(guideline.id)
                .subscribe({
                  next: () => {
                    handleSuccessSnackbar(this.snackBar, 'Brand Guideline deleted.');
                  },
                  error: error =>
                    handleErrorSnackbar(
                      this.snackBar,
                      error,
                      'Could not delete brand guideline.',
                    ),
                });
            }
          });
        } else if (result.name && result.file && workspaceId) {
          // 1. Immediately show spinner and show initial snackbar
          this.brandGuidelineService.setProcessingState();
          handleSuccessSnackbar(
            this.snackBar,
            'Uploading file, please keep this window open...',
          );

          // 2. Start the upload process
          this.brandGuidelineService
            .createBrandGuideline(workspaceId, result.file, result.name)
            .subscribe({
            next: () => {
              // 3. On success, show the "processing" snackbar
              handleSuccessSnackbar(
                this.snackBar,
                'File uploaded! We will process it and notify you upon completion. You can close this window or navigate away!',
              );
            },
            error: error => {
              // On error, clear the job so the spinner disappears
              this.brandGuidelineService.clearActiveJob();
              handleErrorSnackbar(this.snackBar, error, 'Upload failed');
            },
          });
        }
      });
  }

  openFeedbackForm(event: MouseEvent): void {
    event.stopPropagation();
    window.open(
      'https://docs.google.com/forms/d/e/1FAIpQLSceWvu7G354h-dTbOGvNGEraEjcUAgPE300WNY5qr-WJbh3Eg/viewform',
      '_blank',
    );
  }
}
