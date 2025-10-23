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

import {Injectable, PLATFORM_ID, inject} from '@angular/core';
import {
  Firestore,
  collection,
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from '@angular/fire/firestore';
import {UserModel} from '../models/user.model';
import {environment} from '../../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {user} from '@angular/fire/auth';
import {isPlatformBrowser} from '@angular/common';

const USER_COLLECTION = 'users';
interface LooseObject {
  [key: string]: any;
}

const badgeURL = `${environment.backendURL}/`;

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly firestore: Firestore = inject(Firestore);
  private platformId = inject(PLATFORM_ID);

  constructor(private http: HttpClient) {}

  async get(uid: string): Promise<UserModel> {
    const userRef = doc(this.firestore, USER_COLLECTION, uid);
    const userDoc = await getDoc(userRef);
    return userDoc.data() as UserModel;
  }

  async delete(uid: string) {
    const userRef = doc(this.firestore, USER_COLLECTION, uid);
    await deleteDoc(userRef);
  }

  getUserDetails(): UserModel | null {
    if (!isPlatformBrowser(this.platformId)) return null;

    if (localStorage.getItem('USER_DETAILS') !== null) {
      const userObj = localStorage.getItem('USER_DETAILS');
      return JSON.parse(userObj || '{}') as UserModel;
    } else {
      const userDetails: LooseObject = {};
      userDetails['name'] = '';
      userDetails['email'] = '';
      userDetails['photoURL'] = '';
      userDetails['domain'] = '';
      userDetails['roles'] = [];
      return userDetails as UserModel;
    }
  }

  getUserBadges(userEmail: string) {
    return this.http.post<any>(badgeURL + 'badge-info', {email: userEmail});
  }

  updateBadgeInfo(reqObj: LooseObject) {
    return this.http.post<any>(badgeURL + 'badge-confetti-status', reqObj);
  }
}
