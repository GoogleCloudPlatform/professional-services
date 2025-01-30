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

import React, { useState } from "react";
import "../style.css";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";

function UserJourneys({ applicationId, backendURL, idToken, refreshJourneys }) {
  const [journeyName, setJourneyName] = useState("");
  const [journeyDescription, setJourneyDescription] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!idToken) return;
    try {
      //saving CUJ data
      if (applicationId) {
        const response = await fetch(`${backendURL}/api/cujs`, {
          method: "POST",
          //mode: 'cors',
          headers: {
            Authorization: `Bearer ${idToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            journeyName,
            journeyDescription,
            applicationId,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          console.log(
            "Critical User Journey saved successfully with ID:",
            data.cujId
          );
          toast.success("Critical User Journey saved successfully!");
          refreshJourneys();
          navigate(`/riskCatalog/${data.cujId}`);
          setJourneyName("");
          setJourneyDescription("");
        } else {
          console.error("Error saving journey:", response.statusText);
          toast.error("Error saving journey. Please try again.");
        }
      } else {
        toast.error("Please select the Application for this journey.");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="content">
        <div className="mb-3">
          <label htmlFor="journeyName" className="form-label">
            Critical User Journey:
          </label>
          <input
            type="text"
            id="journeyName"
            value={journeyName}
            className="form-control"
            onChange={(e) => setJourneyName(e.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <label htmlFor="journeyDescription" className="form-label">
            Critical User Journey Description:
          </label>
          <textarea
            id="journeyDescription"
            className="form-control"
            value={journeyDescription}
            onChange={(e) => setJourneyDescription(e.target.value)}
            required
          />
        </div>

        <div>
          <button type="submit">Save</button>
          &nbsp;
          <button type="button">Cancel</button>
        </div>
      </div>
    </form>
  );
}

export default UserJourneys;
