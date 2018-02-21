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

import {connect} from "react-redux";
import {bindActionCreators} from "redux";
import constants from "../constants";
import {Button, FormControl, FormGroup} from "react-bootstrap";

class Search extends Component {
  constructor(props) {
    super(props);
    this.state = {user: ''};
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  getValidationState() {
    if (this.state.user.length < 1) {
      return 'error'
    }
    const re = /^[a-zA-Z0-9]+$/i;
    if (!this.state.user.match(re)) {
      return 'error'
    }
    if (this.state.user === this.props.user) {
      return 'error'
    }
    return 'success'
  }

  handleSubmit() {
    if (this.getValidationState() === 'success') {
      this.props.addChat(this.state.user);
      this.setState({user: ''})
    }
  }

  render() {
    return (
        <div className="Search">
          <br/>
          <label>
            <FormGroup
                controlId="formUrl"
                validationState={this.getValidationState()}
            >
              <FormControl
                  type="text"
                  value={this.state.msg}
                  placeholder="Enter username"
                  onChange={(e) => this.setState({user: e.target.value})}
              />
            </FormGroup>

          </label>
          <Button bsStyle="primary" onClick={() =>
              this.handleSubmit()}>Chat</Button>
        </div>
    );
  }
}

function addChat(user) {
  return {
    type: constants.ADD_CHAT,
    payload: user
  };
}


function mapStateToProps(state) {
  return {
    user: state.login.user
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({addChat: addChat}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Search);
