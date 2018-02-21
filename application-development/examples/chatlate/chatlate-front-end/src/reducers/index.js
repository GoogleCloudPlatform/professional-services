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

import constants from "../constants";

function findChat(chatList, chatKey) {
    return chatList.filter(chat => chat.user === chatKey)
}

function findMessage(messages, id) {
    return messages.filter(message => message.id === id)
}

function reduceMessages(state, action) {
    if (action.payload.messages && action.payload.messages.length > 0) {
        var chatList = state.chatList.slice(0)
        for (var i = 0; i < action.payload.messages.length; i++) {
            var message = action.payload.messages[i];
            //Message comes from current active chat user, won't increment unread count.
            //We only increment the count for MSGS_RECEIVED, we assume messages are read if HISTORY_RECEIVED
            var unreadIncrement = (message.sender === state.activeUser || action.type === constants.HISTORY_RECEIVED)
                ? 0 : 1

            var chatKey = message.sender === state.login.user ? message.recipient : message.sender

            if (findChat(chatList, chatKey).length === 0) {
                //Chat doesn't exist create it
                chatList = chatList.concat({user: message.sender, unreadCount: 0, messages: []});
            }

            var chat = findChat(chatList, chatKey)[0]
            var index = chatList.indexOf(chat)

            //If message is not already in list, we add it
            if (findMessage(chat.messages, message.id).length === 0) {
                chatList[index] = Object.assign({}, chat, {
                    unreadCount: chat.unreadCount + unreadIncrement,
                    messages: chat.messages.concat(message)
                })
            }
        }
        var newState = Object.assign({}, state, {
            polling: false,
            chatList: chatList
        })
        return newState;

    }
    return Object.assign({}, state, {polling: false});
}

function sendMsg(state, action) {
    var chatList = state.chatList.slice(0)
    var chat = chatList.filter(chat => chat.user === action.payload.recipient)[0]
    var index = chatList.indexOf(chat)
    chatList[index] = Object.assign({}, chat, {messages: chat.messages.concat(action.payload)})

    var newState = Object.assign({}, state, {
        chatList: chatList
    });
    return newState;
}

function addChat(state, action) {
    var chatList = state.chatList
    if (chatList.filter(chat => chat.user === action.payload).length === 0) {
        //Chat doesn't exist create it
        chatList = chatList.concat({user: action.payload, unreadCount: 0, messages: []});
    }
    var newState = Object.assign({}, state, {
        activeUser: action.payload,
        chatList: chatList
    })
    return newState;
}

export default function (state = null, action) {
    switch (action.type) {
        case constants.HISTORY_RECEIVED:
        case constants.MSGS_RECEIVED:
            return reduceMessages(state, action)
        case constants.LOGIN:
            return Object.assign({}, state, {login: action.payload});
        case constants.LOGOUT:
            return Object.assign({}, state, {login: {valid: false}});
        case constants.SELECT_CHAT:
            //Mark messages as read for this chat
            var chatList = state.chatList.slice(0)
            var chat = chatList.filter(chat => chat.user === action.payload)[0]
            var index = chatList.indexOf(chat)
            chatList[index] = Object.assign({}, chat, {unreadCount: 0})
            return Object.assign({}, state, {activeUser: action.payload, chatList: chatList});
        case constants.ADD_CHAT:
            return addChat(state, action)
        case constants.SEND_MSG:
            return sendMsg(state, action)
        case constants.POLL_STARTED:
            return Object.assign({}, state, {polling: true});
        case constants.POLL_NETWORK_ERROR:
            console.log(action.payload)
            return Object.assign({}, state, {polling: false});
        case constants.NETWORK_ERROR:
            console.log(action.payload)
            return state;
        default:
            return state;
    }

}