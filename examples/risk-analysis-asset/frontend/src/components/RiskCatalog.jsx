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
import { useParams } from "react-router-dom";
import "../style.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare, faTrashCan } from "@fortawesome/free-regular-svg-icons";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function RiskCatalog({ applicationId, backendURL, idToken }) {
  const { cujId } = useParams();
  const [activeTab, setActiveTab] = useState("Risk Catalog");
  const [sortedRisks, setSortedRisks] = useState([]);
  const [clickedCells, setClickedCells] = useState({});
  const [individualThreshold, setIndividualThreshold] = useState();
  const [targetAvailability0, setTargetAvailability0] = useState();
  const [targetAvailability1, setTargetAvailability1] = useState();
  const [targetAvailability2, setTargetAvailability2] = useState();
  const [accepted0, setAccepted0] = useState();
  const [accepted1, setAccepted1] = useState();
  const [accepted2, setAccepted2] = useState();
  const [budget0, setBudget0] = useState();
  const [budget1, setBudget1] = useState();
  const [budget2, setBudget2] = useState();
  const [unallocated0, setUnallocated0] = useState();
  const [unallocated1, setUnallocated1] = useState();
  const [unallocated2, setUnallocated2] = useState();
  const [tooBigThreshold0, setTooBigThreshold0] = useState();
  const [tooBigThreshold1, setTooBigThreshold1] = useState();
  const [tooBigThreshold2, setTooBigThreshold2] = useState();
  // store accepted risk state
  const [acceptedRisks, setAcceptedRisks] = useState({
    0: [],
    1: [],
    2: [],
  });

  // classify risks as high/medium/low
  function calculateRiskLevelForGrid(badMinsData, tooBigThreshold) {
    if (badMinsData >= tooBigThreshold) {
      return "high";
    } else if (
      badMinsData < tooBigThreshold &&
      badMinsData > parseFloat(tooBigThreshold) * 0.8
    ) {
      return "medium";
    } else {
      return "low";
    }
  }

  useEffect(() => {
    const fetchRiskThresholds = async () => {
      try {
        if (!idToken) return;
        //fetch Risk Thresholds for selected journey
        const response = await fetch(`${backendURL}/api/cujs/${cujId}`, {
          method: "GET",
          //mode: 'cors',
          headers: {
            Authorization: `Bearer ${idToken}`,
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const stackValues = await response.json();
        setIndividualThreshold(stackValues.individualThreshold);
        setTargetAvailability0(stackValues.targetAvailability0);
        setTargetAvailability1(stackValues.targetAvailability1);
        setTargetAvailability2(stackValues.targetAvailability2);

        setAccepted0(stackValues.accepted0);
        setBudget0(
          (1 - parseFloat(stackValues.targetAvailability0) / 100) *
            1440 *
            365.25
        );
        setUnallocated0(
          parseFloat(
            (1 - parseFloat(stackValues.targetAvailability0) / 100) *
              1440 *
              365.25
          ) - parseFloat(stackValues.accepted0)
        );
        setTooBigThreshold0(
          (parseFloat(stackValues.individualThreshold) / 100) *
            parseFloat(
              (1 - parseFloat(stackValues.targetAvailability0) / 100) *
                1440 *
                365.25
            )
        );

        setAccepted1(stackValues.accepted1);
        setBudget1(
          (1 - parseFloat(stackValues.targetAvailability1) / 100) *
            1440 *
            365.25
        );
        setUnallocated1(
          parseFloat(
            (1 - parseFloat(stackValues.targetAvailability1) / 100) *
              1440 *
              365.25
          ) - parseFloat(stackValues.accepted1)
        );
        setTooBigThreshold1(
          (parseFloat(stackValues.individualThreshold) / 100) *
            parseFloat(
              (1 - parseFloat(stackValues.targetAvailability1) / 100) *
                1440 *
                365.25
            )
        );

        setAccepted2(stackValues.accepted2);
        setBudget2(
          (1 - parseFloat(stackValues.targetAvailability2) / 100) *
            1440 *
            365.25
        );
        setUnallocated2(
          parseFloat(
            (1 - parseFloat(stackValues.targetAvailability2) / 100) *
              1440 *
              365.25
          ) - parseFloat(stackValues.accepted2)
        );
        setTooBigThreshold2(
          (parseFloat(stackValues.individualThreshold) / 100) *
            parseFloat(
              (1 - parseFloat(stackValues.targetAvailability2) / 100) *
                1440 *
                365.25
            )
        );

        setAcceptedRisks({
          0: stackValues.acceptedRisks0 || [],
          1: stackValues.acceptedRisks1 || [],
          2: stackValues.acceptedRisks2 || [],
        });
      } catch (error) {
        console.error("Error fetching stack rank data:", error);
        toast.error("Error fetching stack rank data!");
      }
    };
    fetchRiskThresholds();
  }, [idToken, cujId, applicationId]);

  useEffect(() => {
    const fetchSortedRisks = async () => {
      try {
        if (!idToken) return;
        //fetch risks sorted in descending order for the selected CUJ.
        const response = await fetch(`${backendURL}/api/cujs/${cujId}/risks`, {
          method: "GET",
          //mode: 'cors',
          headers: {
            Authorization: `Bearer ${idToken}`,
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();
        setSortedRisks(data);
      } catch (error) {
        console.error("Error fetching risk information:", error);
        toast.error("Error fetching risk information!");
      }
    };
    fetchSortedRisks();
  }, [idToken, cujId, applicationId]);

  useEffect(() => {
    //update the accepted risk cells
    const updatedClickedCells = { ...clickedCells };
    if (sortedRisks.length > 0) {
      for (let i = 0; i < 3; i++) {
        acceptedRisks[i].forEach((riskId) => {
          const risk = sortedRisks.find((r) => r.riskId === riskId);
          if (risk) {
            updatedClickedCells[`${cujId}-${risk.riskId}-${i}`] = true;
          }
        });
      }
    }
    setClickedCells(updatedClickedCells);
  }, [idToken, acceptedRisks, sortedRisks]);

  useEffect(() => {
    // This function will be called whenever Threshold for individual risk changes
    const calculateTooBigThresholds = () => {
      setTooBigThreshold0(
        (parseFloat(individualThreshold) / 100) *
          parseFloat(
            (1 - parseFloat(targetAvailability0) / 100) * 1440 * 365.25
          )
      );
      setTooBigThreshold1(
        (parseFloat(individualThreshold) / 100) *
          parseFloat(
            (1 - parseFloat(targetAvailability1) / 100) * 1440 * 365.25
          )
      );
      setTooBigThreshold2(
        (parseFloat(individualThreshold) / 100) *
          parseFloat(
            (1 - parseFloat(targetAvailability2) / 100) * 1440 * 365.25
          )
      );
    };
    calculateTooBigThresholds();
  }, [idToken, individualThreshold]);

  const toggleClickedCell = (prevClickedCells, riskId, columnIndex) => ({
    ...prevClickedCells,
    [`${cujId}-${riskId}-${columnIndex}`]:
      !prevClickedCells[`${cujId}-${riskId}-${columnIndex}`],
  });

  const calculateAcceptedAndUnallocated = (columnIndex, risk) => {
    const isRiskAccepted = acceptedRisks[columnIndex].includes(risk.riskId);

    let accepted = 0;
    switch (columnIndex) {
      case 0:
        accepted =
          parseFloat(accepted0) +
          (isRiskAccepted ? -1 : 1) * parseFloat(risk.badMinsData || 0);
        setAccepted0(accepted);
        setUnallocated0(parseFloat(budget0) - accepted);
        break;
      case 1:
        accepted =
          parseFloat(accepted1) +
          (isRiskAccepted ? -1 : 1) * parseFloat(risk.badMinsData || 0);
        setAccepted1(accepted);
        setUnallocated1(parseFloat(budget1) - accepted);
        break;
      case 2:
        accepted =
          parseFloat(accepted2) +
          (isRiskAccepted ? -1 : 1) * parseFloat(risk.badMinsData || 0);
        setAccepted2(accepted);
        setUnallocated2(parseFloat(budget2) - accepted);
        break;
    }
  };

  const acceptHandler = (risk, columnIndex) => {
    setAcceptedRisks((prevAcceptedRisks) => {
      const updatedAcceptedRisks = { ...prevAcceptedRisks };
      if (updatedAcceptedRisks[columnIndex].includes(risk.riskId)) {
        // Risk is already accepted, remove it
        updatedAcceptedRisks[columnIndex] = updatedAcceptedRisks[
          columnIndex
        ].filter((id) => id !== risk.riskId);
      } else {
        // Risk is not accepted, add it
        updatedAcceptedRisks[columnIndex].push(risk.riskId);
      }
      return updatedAcceptedRisks;
    });

    setClickedCells((prev) =>
      toggleClickedCell(prev, risk.riskId, columnIndex)
    );

    // Recalculate accepted and unallocated budget
    calculateAcceptedAndUnallocated(columnIndex, risk);
  };

  const availabilityHandler = async (event, index) => {
    const newValue = event.target.value || 0; // Default to 0 if empty
    // Update the corresponding targetAvailability state variable
    switch (index) {
      case 0:
        setTargetAvailability0(newValue);
        break;
      case 1:
        setTargetAvailability1(newValue);
        break;
      case 2:
        setTargetAvailability2(newValue);
        break;
    }

    // Recalculate budget, unallocated, and tooBigThreshold for the specific index
    switch (index) {
      case 0:
        setBudget0((1 - parseFloat(newValue) / 100) * 1440 * 365.25);
        setUnallocated0(parseFloat(budget0) - parseFloat(accepted0));
        setTooBigThreshold0(
          (parseFloat(individualThreshold) / 100) *
            ((1 - parseFloat(newValue) / 100) * 1440 * 365.25)
        );
        break;
      case 1:
        setBudget1((1 - parseFloat(newValue) / 100) * 1440 * 365.25);
        setUnallocated1(parseFloat(budget1) - parseFloat(accepted1));
        setTooBigThreshold1(
          (parseFloat(individualThreshold) / 100) *
            ((1 - parseFloat(newValue) / 100) * 1440 * 365.25)
        );
        break;
      case 2:
        setBudget2((1 - parseFloat(newValue) / 100) * 1440 * 365.25);
        setUnallocated2(parseFloat(budget2) - parseFloat(accepted2));
        setTooBigThreshold2(
          (parseFloat(individualThreshold) / 100) *
            ((1 - parseFloat(newValue) / 100) * 1440 * 365.25)
        );
        break;
    }
  };

  const handleSave = async () => {
    try {
      // Prepare data to send to the backend
      if (idToken) {
        const updateData = {
          individualThreshold,
          targetAvailability0,
          targetAvailability1,
          targetAvailability2,
          acceptedRisks0: acceptedRisks[0],
          acceptedRisks1: acceptedRisks[1],
          acceptedRisks2: acceptedRisks[2],
          accepted0,
          accepted1,
          accepted2,
        };
        //update the stack rank information
        const response = await fetch(`${backendURL}/api/cujs/${cujId}`, {
          method: "PUT",
          //mode: 'cors',
          headers: {
            Authorization: `Bearer ${idToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        });

        if (response.ok) {
          console.log("Stack Rank data saved successfully!");
          toast.success("Stack Rank data saved successfully!");
        } else {
          console.error("Error saving data:", response.statusText);
          toast.error("Failed to save stack rank data successfully!");
        }
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Operation Failed!");
    }
  };

  function formatNumber(value) {
    if (value === undefined || isNaN(parseFloat(value))) {
      return value; // Return the original value if it's not a valid number
    } else {
      return parseFloat(value).toFixed(2);
    }
  }

  return (
    <div className="container">
      <div className="key-content">
        {/* Tabs */}
        <div className="tabs">
          <button
            className={activeTab === "Risk Catalog" ? "active" : ""}
            onClick={() => setActiveTab("Risk Catalog")}
          >
            Risk Catalog
          </button>
          <button
            className={activeTab === "Risk Stack Rank" ? "active" : ""}
            onClick={() => setActiveTab("Risk Stack Rank")}
          >
            Risk Stack Rank
          </button>
        </div>
        {/* Risk Table */}
        {activeTab === "Risk Catalog" && (
          <table>
            <thead>
              <tr>
                <th>Risk Theme</th>
                <th>Risk</th>
                <th>MTTD</th>
                <th>MTTR</th>
                <th>% Impact</th>
                <th>Incidents / Year</th>
                <th>Bad Mins / Year</th>
              </tr>
            </thead>
            <tbody>
              {sortedRisks.length > 0 ? (
                sortedRisks.map((risk, index) => (
                  <tr key={index}>
                    <td>
                      {risk.riskThemes.map((themeObj) => (
                        <span
                          key={themeObj.riskThemeID}
                          className="risk-theme-tag"
                        >
                          {themeObj.ThemeName}
                        </span>
                      ))}
                    </td>
                    <td>{risk.riskName}</td>
                    <td>{formatNumber(risk.updatedEttd || risk.ettd)}</td>
                    <td>{formatNumber(risk.updatedEttr || risk.ettr)}</td>
                    <td>{risk.impact}</td>
                    <td>{risk.etbf}</td>
                    <td>{formatNumber(risk.badMinsData)}</td>
                    {risk.riskName === undefined ? (
                      <td></td>
                    ) : (
                      <td>
                        <Link
                          to={`/updateRisk/${cujId}/${risk.riskId}`}
                          state={{ riskData: risk }}
                        >
                          {" "}
                          <FontAwesomeIcon icon={faPenToSquare} />{" "}
                        </Link>
                        &nbsp; {/*EDIT*/}
                        <Link to={`/deleteRisk/${cujId}/${risk.riskId}`}>
                          {" "}
                          <FontAwesomeIcon icon={faTrashCan} />{" "}
                        </Link>{" "}
                        {/*DELETE*/}
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <p>No risks added for this journey</p>
              )}
            </tbody>
          </table>
        )}
        {/* Risk Stack Rank (Add content for this tab later) */}
        {activeTab === "Risk Stack Rank" && (
          <div id="stack-rank-div">
            <form>
              <table>
                <tr>
                  <td colSpan={2}>
                    <label htmlFor="individualThreshold">
                      Threshold of unacceptability for an individual risk
                    </label>
                  </td>
                  <td colSpan={3}>
                    {" "}
                    <input
                      type="text"
                      id="individualThreshold"
                      value={individualThreshold}
                      onChange={(e) => setIndividualThreshold(e.target.value)}
                    />
                  </td>
                </tr>

                <tr>
                  <td colSpan={2}>
                    <div>
                      <label htmlFor="targetAvailability0">
                        Target availability
                      </label>
                    </div>
                  </td>
                  <td>
                    <input
                      type="text"
                      id="targetAvailability0"
                      value={targetAvailability0}
                      onChange={(e) => availabilityHandler(e, 0)}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      id="targetAvailability1"
                      value={targetAvailability1}
                      onChange={(e) => availabilityHandler(e, 1)}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      id="targetAvailability2"
                      value={targetAvailability2}
                      onChange={(e) => availabilityHandler(e, 2)}
                    />
                  </td>
                </tr>

                <tr>
                  <td colSpan={2}>
                    <div>
                      <label htmlFor="budget">Budget (m/yr)</label>
                    </div>
                  </td>
                  <td>{budget0.toFixed(2)}</td>
                  <td>{budget1.toFixed(2)}</td>
                  <td>{budget2.toFixed(2)}</td>
                </tr>
                <tr>
                  <td colSpan={2}>
                    <div>
                      <label htmlFor="accepted">Accepted</label>
                    </div>
                  </td>
                  <td>
                    {accepted0 === undefined ? accepted0 : accepted0.toFixed(2)}
                  </td>
                  <td>
                    {accepted1 === undefined ? accepted1 : accepted1.toFixed(2)}
                  </td>
                  <td>
                    {accepted2 === undefined ? accepted2 : accepted2.toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <td colSpan={2}>
                    <div>
                      <label htmlFor="unallocatedBudget">
                        Unallocated Budget
                      </label>
                    </div>
                  </td>
                  <td>
                    {unallocated0 === undefined
                      ? unallocated0
                      : unallocated0.toFixed(2)}
                  </td>
                  <td>
                    {unallocated1 === undefined
                      ? unallocated1
                      : unallocated1.toFixed(2)}
                  </td>
                  <td>
                    {unallocated2 === undefined
                      ? unallocated2
                      : unallocated2.toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <td colSpan={2}>
                    <div>
                      <label htmlFor="tooBigThreshold">Too Big Threshold</label>
                    </div>
                  </td>
                  <td>{tooBigThreshold0.toFixed(2)}</td>
                  <td>{tooBigThreshold1.toFixed(2)}</td>
                  <td>{tooBigThreshold2.toFixed(2)}</td>
                </tr>
              </table>
            </form>
            <hr></hr>
            <table>
              <thead>
                <tr>
                  <th>Risk</th>
                  <th>Bad Mins/Year</th>
                  <th>Risk Status</th>
                  <th>Risk Status</th>
                  <th>Risk Status</th>
                </tr>
              </thead>
              <tbody>
                {sortedRisks.length > 0 ? (
                  sortedRisks.map((risk, index) => (
                    <tr key={index}>
                      <td id="riskname-div">{risk.riskName}</td>
                      <td>{risk.badMinsData.toFixed(2)}</td>

                      {[
                        tooBigThreshold0,
                        tooBigThreshold1,
                        tooBigThreshold2,
                      ].map((threshold, columnIndex) => {
                        const isClicked =
                          clickedCells[
                            `${cujId}-${risk.riskId}-${columnIndex}`
                          ] || risk[`clicked${columnIndex}`];
                        const riskLevel = calculateRiskLevelForGrid(
                          risk.badMinsData,
                          threshold
                        );
                        const cellText = isClicked
                          ? "Accepted"
                          : riskLevel.charAt(0).toUpperCase() +
                            riskLevel.slice(1);

                        return (
                          <td
                            key={columnIndex}
                            className={`risk-cell ${riskLevel} ${isClicked ? "clicked" : ""}`}
                            onClick={() => acceptHandler(risk, columnIndex)}
                          >
                            {cellText}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                ) : (
                  <p>No risks added for this journey</p>
                )}
              </tbody>
            </table>
            <button type="button" onClick={handleSave}>
              Save
            </button>{" "}
            &nbsp;
            <button
              type="button"
              onClick={() => {
                setActiveTab("Risk Catalog");
              }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default RiskCatalog;
