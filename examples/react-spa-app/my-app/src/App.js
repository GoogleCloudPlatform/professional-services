/*
# Copyright 2024 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

Created using create-react-app: https://create-react-app.dev/
*/
import Logo from './logo.svg';
import './App.css';
import React, { useState, useEffect } from "react";

function App(props) {
  const [apiResult, setApiResult] = useState(null);
  useEffect(() => {
    fetch(props.backendUrl + "/api/hello", {
      method: "GET",
      // This is required for IAP support or sending a session cookie to the backend when it's 
      // in a different domain.
      credentials: "include",
    })
      .then((response) => response.text())
      .then((data) => {
        setApiResult(data);
        console.log(data);
      })
      .catch((error) => console.log(error));
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1 id="title-text">Cloud Foundation Fabric</h1>
        <h2 id="subtitle-text">React test app</h2>
        <Logo className="App-logo" alt="logo" />
        <p>
          Anything is possible at this URL. The backend says:
          <pre>
            {apiResult}
          </pre>
        </p>
      </header>
    </div>
  );
}

export default App;
