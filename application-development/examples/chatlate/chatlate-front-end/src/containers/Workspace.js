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

import React, {Component} from "react";
import Search from "./Search";
import ChatList from "./ChatList";
import Chat from "./Chat";
import {Col, Grid} from "react-bootstrap";
import Login from "./Login";
import {connect} from "react-redux";

class Workspace extends Component {
  render() {
    if (this.props.login.valid) {
      return (
          <div className="workspace">

            <Grid>
              <Col xs={12} md={8}>
                <Chat/>
              </Col>
              <Col xs={6} md={4}>
                <Search/>
                <ChatList/>
              </Col>
            </Grid>
          </div>
      );
    }

    return (
        <div className="workspace">
          <p className="App-intro">
            To get started...


          </p>
          <Login/>

        </div>
    );
  }
}


function mapStateToProps(state) {
  return {
    login: state.login
  };
}

export default connect(mapStateToProps)(Workspace);
