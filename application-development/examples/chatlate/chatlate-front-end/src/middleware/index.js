/* Copyright 2017 Google Inc.

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.*/

import constants from "../constants";
import request from "superagent";


const log = store => next => action => {
  console.log('dispatching', action);
  let result = next(action);
  console.log('next state', store.getState());
  return result
}


const api = store => next => action => {
  next(action);
  switch (action.type) {
    case constants.LOGIN:
      const loginUrl = store.getState().login.url + 'chat/login/'
          + store.getState().login.user + '/'
          + store.getState().login.language;
      request
          .post(loginUrl)
          .end((err, res) => {
            if (err) {
              return next({
                type: constants.NETWORK_ERROR,
                err
              })
            }
            const data = JSON.parse(res.text);
            /*
             Once data is received, dispatch an action telling
             the application that data was received successfully,
             along with the parsed data
             */
            next({
              type: constants.LOGGED_IN,
              payload: data
            })
          });
      break;
    case constants.POLL_SERVER:
      if (!store.getState().polling) {
        const getUrl = store.getState().login.url + 'chat/message/'
            + store.getState().login.user + '/'
            + store.getState().login.language;
        request
            .get(getUrl)
            .end((err, res) => {
              if (err) {
                return next({
                  type: constants.POLL_NETWORK_ERROR,
                  err
                })
              }
              const data = JSON.parse(res.text);

              next({
                type: constants.MSGS_RECEIVED,
                payload: data
              })
            });
        next({
          type: constants.POLL_STARTED
        })

      }
      break;
    case constants.SEND_MSG:
      const sendMsgUrl = store.getState().login.url + 'chat/message';
      request
          .post(sendMsgUrl, action.payload)
          .end((err, res) => {
            if (err) {
              return next({
                type: constants.NETWORK_ERROR,
                err
              })
            }
            const data = JSON.parse(res.text);

            next({
              type: constants.MSG_SENT,
              data
            })
          });
      break;
    case constants.ADD_CHAT:
      const chatHistoryUrl = store.getState().login.url + 'chat/history/' +
          store.getState().login.user + '/' +
          store.getState().login.language + '/' +
          action.payload;
      request
          .get(chatHistoryUrl)
          .end((err, res) => {
            if (err) {
              if (err) {
                return next({
                  type: constants.NETWORK_ERROR,
                  err
                })
              }
            }
            const data = JSON.parse(res.text);

            next({
              type: constants.HISTORY_RECEIVED,
              payload: data
            })
          });
      break;
    default:
      break;
  }
};

export {log, api}
