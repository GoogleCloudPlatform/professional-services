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

import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import {MatTableDataSource} from '@angular/material/table';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MediaTemplatesService} from './media-templates.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import { handleErrorSnackbar, handleSuccessSnackbar } from '../../utils/handleMessageSnackbar';
import {MatDialog} from '@angular/material/dialog';
import {MediaTemplateFormComponent} from './media-template-form/media-template-form.component';
import {MediaTemplate} from '../../fun-templates/media-template.model';

@Component({
  selector: 'app-media-templates-management',
  templateUrl: './media-templates-management.component.html',
  styleUrls: ['./media-templates-management.component.scss'],
})
export class MediaTemplatesManagementComponent
  implements OnInit, AfterViewInit
{
  displayedColumns: string[] = [
    'thumbnail',
    'name',
    'description',
    'mimeType',
    'industry',
    'brand',
    'actions',
  ];
  dataSource: MatTableDataSource<MediaTemplate>;
  isLoading = true;
  errorLoading: string | null = null;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private mediaTemplatesService: MediaTemplatesService,
    public dialog: MatDialog,
    private snackBar: MatSnackBar,
  ) {
    this.dataSource = new MatTableDataSource<MediaTemplate>([]);
  }

  ngOnInit(): void {
    this.fetchTemplates();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  fetchTemplates(): void {
    this.isLoading = true;
    this.errorLoading = null;
    this.mediaTemplatesService.getMediaTemplates().subscribe({
      next: templates => {
        this.dataSource.data = templates.data;
        this.isLoading = false;
      },
      error: err => {
        console.error('Error fetching media templates', err);
        this.errorLoading =
          'Could not load media templates. Please try again later.';
        this.isLoading = false;
      },
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  openTemplateDialog(template?: MediaTemplate): void {
    const dialogRef = this.dialog.open(MediaTemplateFormComponent, {
      width: '800px',
      data: {template: template ? {...template} : {}},
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        let saveObservable;
        if (result.id) {
          const {id, mimeType, ...updatePayload} = result;
          saveObservable = this.mediaTemplatesService.updateMediaTemplate(
            id,
            updatePayload,
          );
        } else {
          saveObservable =
            this.mediaTemplatesService.createMediaTemplate(result);
        }

        // TODO: Replace with actual service call
        // For now, just simulating a successful save.
        // saveObservable = of(result);

        saveObservable.subscribe({
          next: () => {
            console.log(
              `Template ${result.id ? 'updated' : 'created'} successfully`,
            );
            this.fetchTemplates();
            // TODO: Add snackbar for user feedback
          },
          error: (err: Error) => {
            console.error(
              `Error ${result.id ? 'updating' : 'creating'} template`,
              err,
            );
            // TODO: Add snackbar for user feedback
          },
        });
      }
    });
  }

  createTemplate(): void {
    this.openTemplateDialog();
  }

  editTemplate(template: MediaTemplate): void {
    this.openTemplateDialog(template);
  }

  deleteTemplate(template: MediaTemplate): void {
    if (
      template.id &&
      confirm(`Are you sure you want to delete template "${template.name}"?`)
    ) {
      this.mediaTemplatesService.deleteMediaTemplate(template.id).subscribe({
        next: () => {
          this.fetchTemplates();
          handleSuccessSnackbar(this.snackBar, 'Template deleted successfully');
        },
        error: (err: Error) => {
          handleErrorSnackbar(this.snackBar, err, 'Delete template');
        },
      });
    }
  }
}
