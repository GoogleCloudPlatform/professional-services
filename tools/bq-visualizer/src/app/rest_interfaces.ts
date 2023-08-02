/*
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/** The interface to the return of the API call list jobs in BQ */

import { Dictionary } from "lodash";

export interface QueryStep {
  kind: string;
  substeps: string[];
}

export interface QueryStage {
  completedParallelInputs: string;
  computeMsAvg: string;
  computeMsMax: string;
  computeRatioAvg: number;
  computeRatioMax: number;
  endMs?: string;
  inputStages?: string[];
  id: string;
  name: string;
  parallelInputs: string;
  readMsAvg: string;
  readMsMax: string;
  readRatioAvg: number;
  readRatioMax: number;
  recordsRead: string;
  recordsWritten: string;
  shuffleOutputBytes: string;
  shuffleOutputBytesSpilled: string;
  startMs?: string;
  status: string;
  isExternal?: boolean;
  steps: QueryStep[];
  writeRatioAvg: string;
  writeMsAvg: string;
  writeMsMax: string;
  writeRatioMax: string;
  waitRatioAvg: string;
  waitMsAvg: string;
  waitRatioMax: string;
  waitMsMax: string;
  performanceInsights?:StagePerformanceStandaloneInsight[];
}

interface Status {
  state: string;
  errors?:Record<string,string>[];
}

interface ReferencedTable {
  datasetId: string;
  projectId: string;
  tableId: string;
}

interface Timeline {
  activeUnits: string;
  completedUnits: string;
  elapsedMs: string;
  pendingUnits: string;
  totalSlotMs: string;
  estimatedRunnableUnits: string;
}

interface Query {
  billingTier: number;
  cacheHit: boolean;
  referencedTables: ReferencedTable[];
  statementType: string;
  totalBytesBilled: number;
  totalBytesProcessed: number;
  totalPartitionsProcessed: number;
  estimatedBytesProcessed: string;
  reservationUsage: ReservationUsage[];
  totalSlotMs: string;
  useQueryCache?: string;
  queryPlan?: QueryStage[];
  timeline: Timeline[];
  metadataCacheStatistics?: MetadataCacheStatistics;
  performanceInsights?: PerformanceInsights;
}

interface ReservationUsage {
  name: string;
  slotMs: string;
}

interface MetadataCacheStatistics {
  tableMetadataCacheUsage?: TableMetadataCacheUsage[];
}


interface TableMetadataCacheUsage {
  tableReference: ReferencedTable;
  unusedReason?: string;
  explanation?: string;
}

interface StagePerformanceStandaloneInsight {
  stageId: string;
  slotContention: boolean;
  insufficientShuffleQuota: boolean;
}

interface InputDataChange {
  recordsReadDiffPercentage: number;
}

interface StagePerformanceChangeInsight {
  stageId: string;
  inputDataChange: InputDataChange;
}

interface PerformanceInsights {
  avgPreviousExecutionMs: string;
  stagePerformanceStandaloneInsights: StagePerformanceStandaloneInsight[];
  stagePerformanceChangeInsights : StagePerformanceChangeInsight[];
}

interface Statistics {
  creationTime: string;
  endTime: string;
  startTime: string;
  totalBytesProcessed: string;
  reservation_id: string;
  reservationUsage: ReservationUsage[];
  query?: Query;
  finalExecutionDurationMs?: string;
}

interface JobReference {
  jobId: string;
  location: string;
  projectId: string;
}

interface DestinationTable {
  datasetId: string;
  projectId: string;
  tableId: string;
}

interface ConfigurationQuery {
  createDisposition: string;
  destinationTable: DestinationTable;
  priority: string;
  query: string;
  useLegacySql: boolean;
  writeDisposition: string;
  useQueryCache?: boolean;
}

interface Configuration {
  jobType: string;
  query?: ConfigurationQuery;
  labels: Record<string,string>;
}

interface ErrorResult {
  reason: string;
  location: string;
  debugInfo: string;
  message: string;
}

export interface Job {
  id: string;
  etag: string;
  jobReference?: JobReference;
  kind: string;
  principal_subject?: string;
  user_email: string;
  state: string;
  status: Status;
  errorResult?: ErrorResult;
  statistics: Statistics;
  configuration?: Configuration;
}

export interface BqListJobResponse {
  kind: string;
  etag: string;
  nextPageToken: string;
  jobs: Job[];
}

enum LifeCycleState {
  LIFECYCLE_STATE_UNSPECIFIED,
  ACTIVE,
  DELETE_REQUESTED,
  DELETE_IN_PROGRESS
}

export interface Project {
  projectNumber: string;
  projectId: string;
  lifecycleState: LifeCycleState;
  name: string;
  labels?: Record<string,string>;
  parent?: object;
}

export interface GcpProjectListResponse {
  projects: Project[];
  nextPageToken?: string;
}

interface BqProjectReference {
  projectId: string;
}

export interface BqProject {
  kind: string;
  id: string;
  numericId: number;
  projectReference: BqProjectReference;
  friendlyName: string;
}

export interface BqProjectListResponse {
  kind: string;
  etag: string;
  nextPageToken: string;
  projects: BqProject[];
  totalItems: number;
}

export interface GetJobsRequest {
  project: BqProject;
  limit: number;
  allUsers: boolean;
}