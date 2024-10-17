/*
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React, { useState, useEffect } from "react";
import "../style.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function Applications({ setIsAddingNewApplication, backendURL, idToken }) {
  const [applicationName, setApplicationName] = useState("");
  const [applicationDescription, setApplicationDescription] = useState("");

  //set flag to disable application selection dropdown
  useEffect(() => {
    setIsAddingNewApplication(true);
    return () => {
      setIsAddingNewApplication(false);
    };
  }, []);

  const handleSubmit = async (event) => {
    try {
      //save a new application
      const response = await fetch(`${backendURL}/api/apps`, {
        method: "POST",
        //mode: 'cors',
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          applicationName,
          applicationDescription,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Application saved successfully with ID:", data.appId);
        toast.success("New Application saved successfully!", {
          autoClose: 3000,
        });
        setApplicationName("");
        setApplicationDescription("");
      } else {
        console.error("Error saving app:", response.statusText);
        toast.error("Error saving Application. Please try again.", {});
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="content">
        <div className="mb-3">
          <label htmlFor="applicationName" className="form-label">
            Application Name
          </label>
          <input
            type="text"
            id="applicationName"
            value={applicationName}
            className="form-control"
            onChange={(e) => setApplicationName(e.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <label htmlFor="applicationDescription" className="form-label">
            Application Description
          </label>
          <textarea
            id="applicationDescription"
            className="form-control"
            value={applicationDescription}
            onChange={(e) => setApplicationDescription(e.target.value)}
            required
          />
        </div>

        <div>
          <button type="submit">Save</button>
          &nbsp;
          <button type="button">Cancel</button>
        </div>
        <ToastContainer />
      </div>
    </form>
  );
}

export default Applications;
