import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
/** Class for holding shared variables between components. */
export class ResultsService {
  setSegmentToxicity(toxicityResults: object) {
    localStorage.setItem('segmentToxicity', JSON.stringify(toxicityResults));
  }

  getSegmentToxicity() {
    return JSON.parse(localStorage.getItem('segmentToxicity'));
  }

  setFullTranscript(fullTranscript: string) {
    localStorage.setItem('fullTranscript', fullTranscript);
  }

  getFullTranscript() {
    return localStorage.getItem('fullTranscript');
  }

  setFileName(fileName: string) {
    localStorage.setItem('fileName', fileName);
  }

  getFileName() {
    return localStorage.getItem('fileName');
  }

  constructor() {}
}
