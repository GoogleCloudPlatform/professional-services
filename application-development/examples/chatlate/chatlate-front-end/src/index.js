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

import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap/dist/css/bootstrap-theme.css";
import App from "./App";
import reducers from "./reducers";
import {api} from "./middleware";
import {Provider} from "react-redux";
import {applyMiddleware, createStore} from "redux";

ReactDOM.render(
    <Provider store={createStore(reducers, {
      chatList: [],
      login: {valid: false},
      polling: false
    }, applyMiddleware(api))}>
      <App/>
    </Provider>
    , document.getElementById('root')
);

