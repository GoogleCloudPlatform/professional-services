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
import {
  Button,
  ControlLabel,
  DropdownButton,
  FormControl,
  FormGroup,
  MenuItem
} from "react-bootstrap";


class Search extends Component {
  constructor(props) {
    super(props);
    this.state = {user: '', language: 'en', url: 'http://localhost:8080/'};
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  getUsernameValidationState() {
    if (this.state.user.length < 1) {
      return 'error'
    }
    const re = /^[a-zA-Z0-9]+$/i;
    if (!this.state.user.match(re)) {
      return 'error'
    }
    return 'success'
  }

  getUrlValidationState() {
    if (this.state.url.length < 1) {
      return 'error'
    }
    if (!this.state.url.toLocaleLowerCase().startsWith("http://")) {
      return 'error'
    }
    return 'success'
  }

  handleSubmit() {
    if (this.getUsernameValidationState() === 'success' &&
        this.getUrlValidationState() === 'success') {
      this.props.login(this.state)
    }
  }

  renderLanguageOptions() {
    return LANGUAGES.map(lang => {
      const active = lang.language === this.state.language;
      return (
          <MenuItem key={lang.language}
                    eventKey={lang.language}
                    id={lang.language}
                    active={active}>{lang.language}</MenuItem>
      );
    });
  }

  render() {
    return (
        <div className="Login">
          <br/>
          <label>
            <FormGroup
                controlId="formUsername"
                validationState={this.getUsernameValidationState()}
            >
              <ControlLabel>Username</ControlLabel>
              <FormControl
                  type="text"
                  value={this.state.user}
                  onChange={(e) =>
                      this.setState({user: e.target.value})}
                  placeholder="Enter Username"
                  autoComplete="off"
              />
              <FormControl.Feedback/>
            </FormGroup>
          </label>
          <br/> <br/>
          <label>
            <FormGroup
                controlId="formLanguage"
            >
              <ControlLabel>Language</ControlLabel> &nbsp; &nbsp;
              <DropdownButton id="languageDropdown"
                              title={this.state.language}
                              onSelect={(e) =>
                                  this.setState({language: e})}>
                {this.renderLanguageOptions()}
              </DropdownButton>
            </FormGroup>
          </label>
          <br/> <br/>
          <label>
            <FormGroup
                controlId="formUrl"
                validationState={this.getUrlValidationState()}
            >
              <ControlLabel>Backend URL</ControlLabel>
              <FormControl
                  type="text"
                  value={this.state.url}
                  onChange={(e) =>
                      this.setState({url: e.target.value})}
                  placeholder="Enter backend URL"
                  autoComplete="off"
              />
              <FormControl.Feedback/>
            </FormGroup>
          </label>
          <br/>

          <br/>
          <Button bsStyle="primary"
                  onClick={() => this.handleSubmit()}>Login</Button>

        </div>
    );
  }
}

function login(state) {
  return {
    type: constants.LOGIN,
    payload: {
      user: state.user,
      language: state.language,
      url: state.url,
      valid: true
    }
  };
}


function mapStateToProps(state) {
  return {};
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({login: login}, dispatch);
}


export default connect(mapStateToProps, mapDispatchToProps)(Search);


const LANGUAGES = [
  {
    "language": "af"
  },
  {
    "language": "am"
  },
  {
    "language": "ar"
  },
  {
    "language": "az"
  },
  {
    "language": "be"
  },
  {
    "language": "bg"
  },
  {
    "language": "bn"
  },
  {
    "language": "bs"
  },
  {
    "language": "ca"
  },
  {
    "language": "ceb"
  },
  {
    "language": "co"
  },
  {
    "language": "cs"
  },
  {
    "language": "cy"
  },
  {
    "language": "da"
  },
  {
    "language": "de"
  },
  {
    "language": "el"
  },
  {
    "language": "en"
  },
  {
    "language": "eo"
  },
  {
    "language": "es"
  },
  {
    "language": "et"
  },
  {
    "language": "eu"
  },
  {
    "language": "fa"
  },
  {
    "language": "fi"
  },
  {
    "language": "fr"
  },
  {
    "language": "fy"
  },
  {
    "language": "ga"
  },
  {
    "language": "gd"
  },
  {
    "language": "gl"
  },
  {
    "language": "gu"
  },
  {
    "language": "ha"
  },
  {
    "language": "haw"
  },
  {
    "language": "hi"
  },
  {
    "language": "hmn"
  },
  {
    "language": "hr"
  },
  {
    "language": "ht"
  },
  {
    "language": "hu"
  },
  {
    "language": "hy"
  },
  {
    "language": "id"
  },
  {
    "language": "ig"
  },
  {
    "language": "is"
  },
  {
    "language": "it"
  },
  {
    "language": "iw"
  },
  {
    "language": "ja"
  },
  {
    "language": "jw"
  },
  {
    "language": "ka"
  },
  {
    "language": "kk"
  },
  {
    "language": "km"
  },
  {
    "language": "kn"
  },
  {
    "language": "ko"
  },
  {
    "language": "ku"
  },
  {
    "language": "ky"
  },
  {
    "language": "la"
  },
  {
    "language": "lb"
  },
  {
    "language": "lo"
  },
  {
    "language": "lt"
  },
  {
    "language": "lv"
  },
  {
    "language": "mg"
  },
  {
    "language": "mi"
  },
  {
    "language": "mk"
  },
  {
    "language": "ml"
  },
  {
    "language": "mn"
  },
  {
    "language": "mr"
  },
  {
    "language": "ms"
  },
  {
    "language": "mt"
  },
  {
    "language": "my"
  },
  {
    "language": "ne"
  },
  {
    "language": "nl"
  },
  {
    "language": "no"
  },
  {
    "language": "ny"
  },
  {
    "language": "pa"
  },
  {
    "language": "pl"
  },
  {
    "language": "ps"
  },
  {
    "language": "pt"
  },
  {
    "language": "ro"
  },
  {
    "language": "ru"
  },
  {
    "language": "sd"
  },
  {
    "language": "si"
  },
  {
    "language": "sk"
  },
  {
    "language": "sl"
  },
  {
    "language": "sm"
  },
  {
    "language": "sn"
  },
  {
    "language": "so"
  },
  {
    "language": "sq"
  },
  {
    "language": "sr"
  },
  {
    "language": "st"
  },
  {
    "language": "su"
  },
  {
    "language": "sv"
  },
  {
    "language": "sw"
  },
  {
    "language": "ta"
  },
  {
    "language": "te"
  },
  {
    "language": "tg"
  },
  {
    "language": "th"
  },
  {
    "language": "tl"
  },
  {
    "language": "tr"
  },
  {
    "language": "uk"
  },
  {
    "language": "ur"
  },
  {
    "language": "uz"
  },
  {
    "language": "vi"
  },
  {
    "language": "xh"
  },
  {
    "language": "yi"
  },
  {
    "language": "yo"
  },
  {
    "language": "zh"
  },
  {
    "language": "zh-TW"
  },
  {
    "language": "zu"
  }
]

