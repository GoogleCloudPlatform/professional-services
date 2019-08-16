import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ResultsService {

  setSegmentToxicity(toxicity_results){
    localStorage.setItem('segment_toxicity', JSON.stringify(toxicity_results));
  }

  getSegmentToxicity(){
    return JSON.parse(localStorage.getItem('segment_toxicity'));
  }

  setFullTranscript(full_transcript){
    localStorage.setItem('full_transcript', full_transcript);
  }

  getFullTranscript(){
    return localStorage.getItem('full_transcript');
  }

  setGCSLink(gcs_link){
    localStorage.setItem('gcs_link', gcs_link);
  }

  getGCSLink(){
    return localStorage.getItem('gcs_link');
  }


  setFileName(file_name){
    localStorage.setItem('file_name', file_name);
  }

  getFileName(){
    return localStorage.getItem('file_name');
  }

  constructor() { }
}
