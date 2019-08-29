import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ResultsService {
  setSegmentToxicity(toxicityResults: object) {
    localStorage.setItem('segment_toxicity', JSON.stringify(toxicityResults));
  }

  getSegmentToxicity() {
    return JSON.parse(localStorage.getItem('segment_toxicity'));
  }

  setFullTranscript(fullTranscript: string) {
    localStorage.setItem('full_transcript', fullTranscript);
  }

  getFullTranscript() {
    return localStorage.getItem('full_transcript');
  }

  setFileName(fileName: string) {
    localStorage.setItem('file_name', fileName);
  }

  getFileName() {
    return localStorage.getItem('file_name');
  }

  constructor() {}
}
