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

import './App.css';
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, NavLink } from 'react-router-dom';
import UserJourneys from './components/UserJourneys';
import NewRisk from './components/NewRisk';
import NewApplication from './components/NewApplication';
import RiskCatalog from './components/RiskCatalog';
import DeleteRisk from './components/DeleteRisk';
import Multiselect from 'multiselect-react-dropdown';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


function App() {
  const [journeys, setJourneys] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState('');
  const [appOptions, setAppOptions] = useState([]);
  const [applicationId, setApplicationId] = useState(null);
  const [isAddingNewApplication, setIsAddingNewApplication] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Initially open
  const [idToken, setIdToken] = useState(null);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const backendURL = process.env.REACT_APP_ENV === 'local'
  ? 'http://127.0.0.1:5000'  
  : process.env.REACT_APP_BACKEND_SERVICE_URL;

  //console.log(backendURL)

  //fetching bearer token
  useEffect(() => {
    const fetchIdToken = async () => {
      try {
        const response = await fetch('http://localhost:3001/get-id-token');
        const data = await response.json();
        setIdToken(data.idToken);
        console.log('ID Token:', data.idToken);
      } catch (error) {
        console.error('Error fetching ID token:', error);
      }
    };
    fetchIdToken();
  }, []); 
  console.log(idToken)

  useEffect(() => {
    const fetchApplications = async () => {
      if (!idToken) return;
      try {
        //fetch applications
        const response = await fetch(`${backendURL}/api/apps`, {
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
        const appData = await response.json();

        // Extract App names
        const options = appData.map((appInfo) => ({
          name: appInfo.applicationName,
          id: appInfo.id
        })).sort((a, b) => a.name.localeCompare(b.name));
        setAppOptions(options);

        if (appOptions.length > 0) {
          setSelectedApplication(options[0]);
        }

      } catch (error) {
        toast.error('Error fetching App Names.');
        console.error('Error fetching App Names:', error);
      }
    };
    fetchApplications();
  }, [idToken]);

  useEffect(() => {

    const fetchJourneys = async () => {
      if (!idToken) return;
      try {
        //fetch journeys for the selected pplication
        console.log('fetching journeys, token', idToken)
        const response = await fetch(`${backendURL}/api/${selectedApplication[0]?.id}/cujs`, {
          method: 'GET',
          //mode: 'cors',
          headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json',
          },});
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();

        if (data === null || data.length === 0) {
          console.log("No journeys found for this application");
          setJourneys([]);
        }
        else {
          // Extract journey names and IDs from the response
          const journeyData = data.map(cuj => ({
            name: cuj.CUJName,
            id: cuj.id
          })).sort((a, b) => a.name.localeCompare(b.name));;

          setJourneys(journeyData);
        }
      } catch (error) {
        console.error('Error fetching journeys:', error);
        toast.error('Error fetching journeys.');
      }
    };
    if (selectedApplication && selectedApplication.length > 0) {
      fetchJourneys();
    }
  }, [selectedApplication, idToken]);

  const handleApplicationChange = (selectedList) => {

    if (selectedList.length > 0) {
      setSelectedApplication(selectedList);
      setApplicationId(selectedList[0].id);
    }
  };

  return (
    <BrowserRouter>
      <nav className="navbar">
        <div className="nav-container">
          <div>
            <button className="toggle-button" onClick={toggleSidebar}>
              <FontAwesomeIcon icon={faBars} />
            </button>
          </div>
          <div className="navbar-title">
            <a href="/newApplication">SRE Risk Analysis Tool</a> {/* Current Home page is add a CUJ */}
          </div>
        </div>
        <div className="application-dropdown">
          <Multiselect
            options={appOptions} // Options to display in the dropdown
            selectedValues={selectedApplication} // Preselected value to persist in dropdown
            onSelect={handleApplicationChange}
            onRemove={handleApplicationChange}
            displayValue="name" // Property name to display in the dropdown options
            placeholder="Select Application"
            singleSelect={true}
            closeOnSelect={true}
            disable={isAddingNewApplication}
          />
        </div>
        <div className="navbar-links">
          < Link to={`/newApplication`}>Add a New Application</Link>
          < Link to={`/newUserJourney`}>Add a User Journey</Link>
          < Link to={`/newRisk`}>Add a New Risk</Link>
        </div>
      </nav>
      <div className="container">
        <div className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
          <ul>
            {journeys.length > 0 ? ( // Render only if journeys has items
              journeys.map((journey) => (
                <li key={journey.id}>
                  <NavLink to={`/riskCatalog/${journey.id}`}
                    state={{ journeyData: journey }}
                  > {journey.name}
                  </NavLink>
                </li>
              ))
            ) : (
              <p>No Journeys added</p>
            )}
          </ul>
        </div>
        <div className="key-content">
          <Routes>
            <Route path="/newUserJourney" element={<UserJourneys applicationId={applicationId} backendURL={backendURL} key={`newJourney-${applicationId}`} idToken={idToken}/>} />
            <Route path="/newRisk" element={<NewRisk journeys={journeys} backendURL={backendURL} key={`newRisk-${applicationId}`} idToken={idToken}/>} />
            <Route path="/newApplication" element={<NewApplication journeys={journeys} backendURL={backendURL} setIsAddingNewApplication={setIsAddingNewApplication} idToken={idToken}/>} />
            <Route path="/riskCatalog/:cujId" element={<RiskCatalog journeys={journeys} backendURL={backendURL} applicationId={applicationId} key={`riskcatalog-${applicationId}`} idToken={idToken}/>} />
            <Route path="/updateRisk/:cujId/:riskId" element={<NewRisk journeys={journeys} backendURL={backendURL} key={`updateRisk-${applicationId}`} idToken={idToken}/>} /> {/* Reuse NewRisk for updates */}
            <Route path="/deleteRisk/:cujId/:riskId" element={<DeleteRisk backendURL={backendURL} idToken={idToken}/>} />
          </Routes>
        </div>
      </div>
      <div>
        <ToastContainer />
      </div>
    </BrowserRouter>
  );
}

export default App;

