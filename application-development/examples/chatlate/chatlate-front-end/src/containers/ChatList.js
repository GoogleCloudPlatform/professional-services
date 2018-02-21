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
import {ListGroup, ListGroupItem} from "react-bootstrap";

class ChatList extends Component {

  constructor(props) {
    super(props);
    this.state = {
      timer: null
    };
    this.tick = this.tick.bind(this);
  }

  componentDidMount() {
    let timer = setInterval(this.tick, 1000);
    this.setState({timer});
  }

  componentWillUnmount() {
    this.clearInterval(this.state.timer);
  }

  tick() {
    this.props.pollServer();
  }

  renderList() {
    if (!this.props.chatList) {
      return;
    }
    return this.props.chatList.map(chat => {
      if (chat.unreadCount > 0) {
        return (
            <ListGroupItem
                key={chat.user}
                onClick={() => this.props.selectChat(chat.user)}
                // className="list-group-item"
            >
              <strong>{chat.user} ({chat.unreadCount})</strong>
            </ListGroupItem>
        )
      }
      return (
          <ListGroupItem
              key={chat.user}
              onClick={() => this.props.selectChat(chat.user)}
              // className="list-group-item"
          >
            {chat.user}
          </ListGroupItem>
      );
    });
  }

  render() {
    return (
        <div className="ChatList">
          <h3> {this.props.user} ({this.props.language}) </h3>
          <h3> Open Chats</h3>
          <ListGroup>
            {this.renderList()}
          </ListGroup>
        </div>
    );
  }


}


function selectChat(user) {
  return {
    type: constants.SELECT_CHAT,
    payload: user
  };
}


function pollServer() {
  return {
    type: constants.POLL_SERVER
  };
}


function mapStateToProps(state) {
  return {
    chatList: state.chatList,
    user: state.login.user,
    language: state.login.language
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    selectChat: selectChat,
    pollServer: pollServer
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(ChatList);
