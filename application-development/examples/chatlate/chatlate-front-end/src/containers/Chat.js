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
import "../App.css";
import {connect} from "react-redux";

import {bindActionCreators} from "redux";
import constants from "../constants";

import {default as UUID} from "node-uuid";

import {Alert, FormControl, FormGroup} from "react-bootstrap";


class Chat extends Component {

  constructor(props) {
    super(props);
    this.state = {msg: ''};

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }


  getValidationState() {
    const length = this.state.msg.length;
    if (length > 0) return 'success';
    else return 'error'
  }

  handleChange(e) {
    this.setState({msg: e.target.value})
  }

  handleSubmit(event) {
    event.preventDefault();
    if (this.getValidationState() === 'success') {
      this.props.sendMessage(this.state.msg,
          this.props.state.activeUser,
          this.props.state.login.user,
          this.props.state.login.language
      );
      this.setState({msg: ''})
    }
  }

  renderMessages(messages) {
    return messages.map(message => {
      let style = 'success';
      let align = 'text-right';
      if (message.sender !== this.props.state.login.user) {
        style = 'info';
        align = 'text-left';
      }
      return (
          <div className={align} key={message.id}>
            <Alert bsStyle={style}>
              {message.message}
            </Alert>
          </div>
      );
    });
  }

  renderActiveChat() {
    if (!this.props.state || !this.props.state.chatList
        || !this.props.state.activeUser) {
      return (<div><h3>No active chat</h3></div>)
    }
    let activeUser = this.props.state.activeUser;
    let activeChat = this.props.state.chatList.filter(chat =>
        chat.user === activeUser)[0];
    if (activeChat) {
      return (<div>
        <h3>{activeChat.user}</h3>

        {this.renderMessages(activeChat.messages)}

        <form onSubmit={this.handleSubmit}
              className="col align-self-end">
          <FormGroup
              controlId="formBasicText"
              validationState={this.getValidationState()}
          >
            <FormControl
                type="text"
                value={this.state.msg}
                placeholder="Enter message"
                onChange={this.handleChange}
                autoComplete="off"
            />
            <FormControl.Feedback/>
          </FormGroup>
        </form>

      </div>)
    } else {
      return (<div><h3>Invalid state</h3></div>)
    }
  }

  render() {
    return (
        <div className="ActiveChat">
          {this.renderActiveChat()}
        </div>
    );
  }
}


function mapStateToProps(state) {
  // Whatever is returned will show up as props
  // inside of ChatList
  return {
    state: state
  };
}


function sendMessage(msg, recipient, sender, language) {
  return {
    type: constants.SEND_MSG,
    payload: {
      id: UUID.v4().toString(),
      message: msg,
      recipient: recipient,
      sender: sender,
      language: language

    }
  };
}


function mapDispatchToProps(dispatch) {
  return bindActionCreators({sendMessage: sendMessage}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Chat);
