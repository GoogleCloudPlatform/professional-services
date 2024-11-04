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

import React, { useEffect } from "react";
import "../style.css";
import { useParams, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function DeleteRisk(backendURL, idToken) {
  //const [riskDeleted, setRiskDeleted] = useState(false);
  const { cujId, riskId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const deleteRisks = async () => {
      if (window.confirm("Are you sure you want to delete this risk?")) {
        try {
          const response = await fetch(
            `${backendURL.backendURL}/api/risks/${riskId}`,
            {
              //can't understand why backendURL is being passed as an object here
              method: "DELETE",
              //mode: 'cors',
              headers: {
                Authorization: `Bearer ${idToken}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (response.ok) {
            //setRiskDeleted(true);
            toast.success("Risk deleted successfully!");
            console.log("Risk deleted successfully");
            setTimeout(() => {
              navigate("/riskCatalog/" + cujId);
            }, 3000);
          } else {
            toast.error("Error deleting risk!");
            console.error("Error deleting risk", response.statusText);
          }
        } catch (error) {
          console.error("Error:", error);
        }
      }
    };

    deleteRisks();
  }, []);

  return (
    <div>
      <ToastContainer />
    </div>
  );
}

export default DeleteRisk;
