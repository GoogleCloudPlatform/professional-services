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

import {Component, OnInit, OnDestroy, ViewChild} from '@angular/core';
import {MatTableDataSource} from '@angular/material/table';
import {MatPaginator, PageEvent} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {Subject, firstValueFrom} from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  takeUntil,
  catchError,
} from 'rxjs/operators';
import {UserService, PaginatedResponse} from './user.service';
import {MatDialog} from '@angular/material/dialog';
import {UserFormComponent} from './user-form.component';
import {MatSnackBar} from '@angular/material/snack-bar';
import {UserModel, UserRolesEnum} from '../../common/models/user.model';

@Component({
  selector: 'app-users-management',
  templateUrl: './users-management.component.html',
  styleUrls: ['./users-management.component.scss'],
})
export class UsersManagementComponent implements OnInit, OnDestroy {
  displayedColumns: string[] = [
    'picture',
    'name',
    'email',
    'roles',
    'createdAt',
    'updatedAt',
    'actions',
  ];
  dataSource: MatTableDataSource<UserModel> =
    new MatTableDataSource<UserModel>();
  isLoading = true;
  errorLoadingUsers: string | null = null;
  lastResponse: PaginatedResponse | undefined;

  // --- Pagination State ---
  totalUsers = 0;
  limit = 10;
  currentPageIndex = 0;
  // Stores the cursor for the START of each page.
  // pageCursors[0] is null
  // pageCursors[i] is the last document of page i-1
  private pageCursors: Array<string | null | undefined> = [null];

  // --- Filtering & Destroy State ---
  private filterSubject = new Subject<string>();
  private destroy$ = new Subject<void>();
  currentFilter = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private userService: UserService,
    public dialog: MatDialog,
    private _snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.fetchPage(0);

    // Debounce filter input to avoid excessive Firestore reads
    this.filterSubject
      .pipe(debounceTime(500), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(filterValue => {
        this.currentFilter = filterValue;
        this.resetPaginationAndFetch();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  handlePageEvent(event: PageEvent) {
    // If page size changes, we must reset everything.
    if (this.limit !== event.pageSize) {
      this.limit = event.pageSize;
      this.resetPaginationAndFetch();
      return;
    }
    this.fetchPage(event.pageIndex);
  }

  async fetchPage(targetPageIndex: number) {
    this.isLoading = true;

    // Find the most recent page we have a cursor for that is before our target.
    let startPageIndex = 0;
    for (let i = targetPageIndex; i >= 0; i--) {
      if (this.pageCursors[i] !== undefined) {
        startPageIndex = i;
        break;
      }
    }

    // Get the cursor for our starting point.
    let cursor: string | null | undefined = this.pageCursors[startPageIndex];

    try {
      // Walk from the known page to the target page, fetching and discarding pages
      for (let i = startPageIndex; i < targetPageIndex; i++) {
        this.lastResponse = await firstValueFrom(
          this.userService.getUsers(
            this.limit,
            this.currentFilter,
            cursor ?? undefined,
          ),
        );

        if (!this.lastResponse || this.lastResponse.data.length === 0) {
          this.isLoading = false;
          this.dataSource.data = []; // Show empty table
          return;
        }
        cursor = this.lastResponse.nextPageCursor ?? null;
        this.pageCursors[i + 1] = cursor; // Cache the new cursor
      }

      // Now we have the correct cursor to fetch the target page
      const finalResponse = await firstValueFrom(
        this.userService.getUsers(
          this.limit,
          this.currentFilter,
          cursor ?? undefined,
        ),
      );

      this.dataSource.data = finalResponse.data;
      this.totalUsers = finalResponse.count;
      this.currentPageIndex = targetPageIndex;

      // Cache the cursor for the *next* page if it exists and we don't have it
      if (
        finalResponse.nextPageCursor &&
        this.pageCursors[targetPageIndex + 1] === undefined
      ) {
        this.pageCursors[targetPageIndex + 1] = finalResponse.nextPageCursor;
      }
    } catch (err) {
      this.errorLoadingUsers = 'Failed to load users.';
      console.error(err);
    } finally {
      this.isLoading = false;
    }
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.filterSubject.next(filterValue.trim().toLowerCase());
  }

  private resetPaginationAndFetch() {
    this.currentPageIndex = 0;
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
    this.pageCursors = [null];
    this.fetchPage(0);
  }

  openUserForm(user: UserModel): void {
    const dialogRef = this.dialog.open(UserFormComponent, {
      width: '450px',
      data: {user: user, isEditMode: true},
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(async (result: UserModel | undefined) => {
        if (result) {
          this.isLoading = true;
          try {
            // The form returns the full user object with updated roles
            await firstValueFrom(this.userService.updateUser(result));
            this._snackBar.open('UserModel updated successfully!', 'Close', {
              duration: 3000,
            });
            // Refetch to show updated data on the current page.
            this.fetchPage(this.currentPageIndex);
          } catch (err) {
            console.error(`Error updating user ${result.id}:`, err);
            this._snackBar.open('Failed to update user.', 'Close', {
              duration: 5000,
            });
          } finally {
            this.isLoading = false;
          }
        }
      });
  }

  async deleteUser(userId: string): Promise<void> {
    // Simple confirmation, consider using a MatDialog for a better UX
    if (confirm(`Are you sure you want to delete user with ID: ${userId}?`)) {
      this.isLoading = true;
      try {
        await firstValueFrom(this.userService.deleteUser(userId));
        this._snackBar.open('UserModel deleted successfully!', 'Close', {
          duration: 3000,
        });
        this.resetPaginationAndFetch();
      } catch (err) {
        console.error(`Error deleting user ${userId}:`, err);
        this._snackBar.open('Failed to delete user.', 'Close', {
          duration: 5000,
        });
      } finally {
        this.isLoading = false;
      }
    }
  }

  public getRoleChipClass(role: string): string {
    const roleLower = role.toLowerCase();

    // Using a switch statement makes it easy to add more roles later
    switch (roleLower) {
      case UserRolesEnum.ADMIN.toLowerCase():
        return '!bg-amber-500/20 !text-amber-300';
      case UserRolesEnum.USER.toLowerCase():
        return '!bg-blue-500/20 !text-blue-300';
      case UserRolesEnum.CREATOR.toLowerCase():
        return '!bg-purple-500/20 !text-purple-300';
      default:
        // It's good practice to have a default style
        return '!bg-gray-500/20 !text-gray-300';
    }
  }
}
