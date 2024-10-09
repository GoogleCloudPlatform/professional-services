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

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Multiselect from 'multiselect-react-dropdown';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../style.css'

function NewRisk({ journeys, applicationId, backendURL, idToken }) {
  const [riskName, setRiskName] = useState('');
  const [ettd, setEttd] = useState('');
  const [ettr, setEttr] = useState('');
  const [etbf, setEtbf] = useState('');
  const [impact, setImpact] = useState('');
  //const [journeyName, setJourneyName] = useState('');
  const [creationDate, setCreationDate] = useState(new Date());
  const [selectedJourneys, setSelectedJourneys] = useState([]);
  const [selectedRiskThemes, setSelectedRiskThemes] = useState([]);
  const [options, setOptions] = useState([]);
  const [riskThemeOptions, setRiskThemeOptions] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const { cujId, riskId } = useParams();
  const [preselectedJourneyIds, setPreselectedJourneyIds] = useState([]);

  const fetchRiskThemes = async () => {
    try {
      const response = await fetch(`${backendURL}/api/riskThemes`,  {
        method: 'GET',
        //mode: 'cors',  
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const riskthemedata = await response.json();

      // Extract risk themes
      const riskThemeOptions = riskthemedata.map((riskthemeinfo) => ({
        name: riskthemeinfo.ThemeName,
        id: riskthemeinfo.id
      }));
      setRiskThemeOptions(riskThemeOptions);

    } catch (error) {
      console.error('Error fetching risk themes:', error);
      toast.error('Error fetching risk themes');
    }
  };

  useEffect(() => {
    setSelectedJourneys([]);
    setSelectedRiskThemes([]);
    setRiskThemeOptions([]);
    setEttd('');
    setEttr('');
    setImpact('');
    setEtbf('');
    setRiskName('');

    const options = journeys.map((journey) => ({
      name: journey.name,
      id: journey.id
    }));
    setOptions(options);

    fetchRiskThemes();
  }, [journeys]);


  // Update fields incase of Edit operation
  useEffect(() => {

    if (location.state && location.state.riskData) {

      const riskData = location.state.riskData;
      setRiskName(riskData.riskName);
      setEttd(riskData.ettd);
      setEttr(riskData.ettr);
      setImpact(riskData.impact);
      setEtbf(riskData.etbf);

      const preselectedJourneys = riskData.journeyDetails.map(journeyDetail => ({
        id: journeyDetail.JourneyID,
        name: journeyDetail.CUJName
      }));
      setSelectedJourneys(preselectedJourneys);
      setPreselectedJourneyIds(preselectedJourneys.map(j => j.id));

      // Pre-select risk themes in the dropdown
      const preselectedRiskThemes = riskData.riskThemes.map(riskTheme => ({
        id: riskTheme.riskThemeID,
        name: riskTheme.ThemeName
      }));
      setSelectedRiskThemes(preselectedRiskThemes);
    }
  }, [location.state, cujId, riskId, journeys]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const selectedJourneyIds = selectedJourneys.map(j => j.id);
      const selectedRiskThemeIds = selectedRiskThemes.map(x => x.id);

      const riskData = {
        riskName,
        riskThemeID: selectedRiskThemeIds,
        journeyID: selectedJourneyIds,
        ettd,
        ettr,
        impact,
        etbf,
        creationDate,
        badMinsData: (parseFloat(ettd) + parseFloat(ettr)) * parseFloat(impact / 100) * parseFloat(etbf),
      };

      //save risk data
      let response;
      let newRiskId = null;
      let allStepsSuccessful = true;

      if (riskId) { //Update existing risk
        response = await fetch(`${backendURL}/api/risks/${riskId}`, {
          method: 'PUT',
          //mode: 'cors',  
          headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(riskData)
        });
        if (response.ok) { //update risk and CUJ mapping
          // Find deselected journey IDs
          const deselectedJourneyIds = preselectedJourneyIds.filter(id => !selectedJourneyIds.includes(id));

          //Delete risk mapping at CUJ level if CUJ removed while editing risk
          for (const journeyID of deselectedJourneyIds) {
            const removeResponse = await fetch(`${backendURL}/api/cujs/${journeyID}/remove_risk/${riskId}`, {
              method: 'PUT',
              //mode: 'cors',  
              headers: {
                'Authorization': `Bearer ${idToken}`,
                'Content-Type': 'application/json',
              },
            });
            if (!removeResponse.ok) {
              console.error('Error removing risk mapping from CUJ:', removeResponse.statusText);
              allStepsSuccessful = false; // Mark as failure if any removal fails
            }
          }
          for (const journeyID of selectedJourneyIds) {
            const riskResponse = await fetch(`${backendURL}/api/cujs/${journeyID}`, {
              method: 'PUT',
              //mode: 'cors',  
              headers: {
                'Authorization': `Bearer ${idToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                RiskIDs: riskId // Add new risk ID to the array
              })
            });
            if (!riskResponse.ok) {
              console.error('Error adding risk mapping to CUJ:', riskResponse.statusText);
              allStepsSuccessful = false; // Mark as failure if any addition fails
            }
          }
          if (allStepsSuccessful) {
            console.log(`Risk information updated successfully! Risk Id: ${riskId}`);
            toast.success('Risk information updated successfully!');

            // Delay navigation slightly to allow the toast to render
            setTimeout(() => {
              navigate('/riskCatalog/' + cujId);
            }, 3000);
          } else {
            console.error('Some operations failed during risk update.');
            toast.error('Error saving risk. Please try again.');
          }
        } else {
          console.error('Error updating risk:', response.statusText);
        }
      }
      else { //create a new risk
        response = await fetch(`${backendURL}/api/risks`, {
          method: 'POST',
          //mode: 'cors',  
          headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(riskData)
        });
        if (response.ok) {
          // map risks back to the CUJ
          const data = await response.json();
          newRiskId = data.riskId;

          for (const journeyID of selectedJourneyIds) {
            if (journeyID) {
              const riskResponse = await fetch(`${backendURL}/api/cujs/${journeyID}`, {
                method: 'PUT',
                //mode: 'cors',  
                headers: {
                  'Authorization': `Bearer ${idToken}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  RiskIDs: newRiskId // Add new risk ID to the array
                })
              });
              if (!riskResponse.ok) {
                allStepsSuccessful = false;
              }
            }
          }
          if (allStepsSuccessful) {
            console.log(`Risk information saved successfully! Risk Id ${newRiskId}`);
            toast.success('Risk information saved successfully!');
            setTimeout(() => {
              navigate('/riskCatalog/' + selectedJourneyIds[0]);
            }, 3000);

          }
          else {
            console.log('Failed to save Risk Information!');
            toast.error('Error saving risk. Please try again.');
          }

        }
      }

    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleChange = (selectedValues, dropdownIdentifier) => {
    if (dropdownIdentifier === 'journeys') {
      setSelectedJourneys(selectedValues);
    } else if (dropdownIdentifier === 'riskThemes') {
      setSelectedRiskThemes(selectedValues);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="risk-form">
      <div className="form-row">
        <div className="form-column">
          <div className="form-group">
            <label htmlFor="journeyName">Critical User Journey</label>
            <Multiselect
              options={options} // Options to display in the dropdown
              selectedValues={selectedJourneys} // Preselected value to persist in dropdown
              onSelect={(selectedList, selectedItem) => handleChange(selectedList, 'journeys')}
              onRemove={(selectedList, removedItem) => handleChange(selectedList, 'journeys')}
              displayValue="name" // Property name to display in the dropdown options
              placeholder="Select User Journeys"
              required
            />
          </div>
        </div>

        <div className="form-column">
          <div className="form-group">
            <label htmlFor="riskTheme">Risk Theme</label>
            <Multiselect
              options={riskThemeOptions} // Options to display in the dropdown
              selectedValues={selectedRiskThemes} // Preselected value to persist in dropdown
              onSelect={(selectedList, selectedItem) => handleChange(selectedList, 'riskThemes')}
              onRemove={(selectedList, removedItem) => handleChange(selectedList, 'riskThemes')}
              displayValue="name" // Property name to display in the dropdown options
              placeholder="Select Risk Theme"
              required
            />
          </div>
        </div>
      </div>

      <div className="form-group full-width">
        <label htmlFor="riskName">Risk Name</label>
        <input
          type="text"
          id="riskName"
          value={riskName}
          onChange={(e) => setRiskName(e.target.value)}
          required
        />
      </div>

      <div className="form-row">
        <div className="form-column">
          <div className="form-group">
            <label htmlFor="ettd">[ETTD] Estimated Time to Detect (Mins)</label>
            <input
              type="number"
              id="ettd"
              value={ettd}
              onChange={(e) => setEttd(e.target.value)}
              required
              min="0"
            />
          </div>
        </div>
        <div className="form-column">
          <div className="form-group">
            <label htmlFor="ettr">[ETTR] Estimated Time to Resolve (Mins)</label>
            <input
              type="number"
              id="ettr"
              value={ettr}
              onChange={(e) => setEttr(e.target.value)}
              required
              min="0"
            />
          </div>
        </div>
      </div>
      <div className="form-row">
        <div className="form-column">
          <div className="form-group">
            <label htmlFor="etbf">Frequency - Incidents/Yr</label>
            <input
              type="number"
              id="etbf"
              value={etbf}
              onChange={(e) => setEtbf(e.target.value)}
              required
              min="0"
            />
          </div>
        </div>
        <div className="form-column">
          <div className="form-group">
            <label htmlFor="impact">Impact (% of Users Impacted)</label>
            <input
              type="number"
              id="impact"
              value={impact}
              onChange={(e) => setImpact(e.target.value)}
              required
              min="0"
              max="100"
            />
          </div>
        </div>
      </div>
      <div className="form-buttons"> {/* Apply the CSS class */}
        <button type="submit">Save</button>
        &nbsp; &nbsp;
        <button type="button" onClick={() => navigate('/riskCatalog/' + cujId)}>Cancel</button>
      </div>
      <div>
        <ToastContainer />
      </div>
    </form>

  );
}

export default NewRisk;
