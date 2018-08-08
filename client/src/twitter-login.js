// MIT License

// Copyright (c) 2017 GenFirst

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import 'whatwg-fetch'
import 'url-search-params-polyfill';
import  TwitterIcon from 'react-icons/lib/fa/twitter';
import {Button} from 'semantic-ui-react';

class TwitterLogin extends Component {

  constructor(props) {
    super(props);
    this.onButtonClick = this.onButtonClick.bind(this);
  }

  onButtonClick(e) {
    e.preventDefault();
    return this.getRequestToken();
  }

  getHeaders() {
    const headers = Object.assign({}, this.props.customHeaders);
    headers['Content-Type'] = 'application/json';
    return headers;
  }

  getRequestToken() {
    var popup = this.openPopup();

    return window.fetch(this.props.requestTokenUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: this.props.credentials,
    }).then(response => {
      return response.json();
    }).then(data => {
      if(data.errors && data.errors.length > 0) {
        popup.close();
        return;
      }
      popup.location = `https://api.twitter.com/oauth/authenticate?oauth_token=${data.oauth_token}&force_login=${this.props.forceLogin}`;
      this.polling(popup);
    }).catch(error => {
      popup.close();
      return this.props.onFailure(error);
    });
  }

  openPopup() {
    const w = this.props.dialogWidth;
    const h = this.props.dialogHeight;
    const left = (window.screen.width/2)-(w/2);
    const top = (window.screen.height/2)-(h/2);

    return window.open('', '', 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width='+w+', height='+h+', top='+top+', left='+left);
  }

  polling(popup) {

    const polling = setInterval(() => {
      if (!popup || popup.closed || popup.closed === undefined) {

        clearInterval(polling);
        this.props.onFailure(new Error('Popup has been closed by user'));
      }

      const closeDialog = () => {
        clearInterval(polling);
        popup.close();
      };

      try {
        if (!popup.location.hostname.includes('api.twitter.com') &&
              !popup.location.hostname == '') {
          if (popup.location.search) {
            const query = new URLSearchParams(popup.location.search);

            const oauthToken = query.get('oauth_token');
            const oauthVerifier = query.get('oauth_verifier');

            closeDialog();
            return this.getOauthToken(oauthVerifier, oauthToken);
          } 
          else {
            closeDialog();
            return this.props.onFailure(new Error(
              'OAuth redirect has occurred but no query or hash parameters were found. ' +
              'They were either not set during the redirect, or were removed—typically by a ' +
              'routing library—before Twitter react component could read it.'
            ));
          }
        }
      } catch (error) {
        // Ignore DOMException: Blocked a frame with origin from accessing a cross-origin frame.
        // A hack to get around same-origin security policy errors in IE.
      }
    }, 500);
  }

  getOauthToken(oAuthVerifier, oauthToken) {
    return window.fetch(`${this.props.loginUrl}?oauth_verifier=${oAuthVerifier}&oauth_token=${oauthToken}`, {
      method: 'GET',
      credentials: this.props.credentials,
      headers: this.getHeaders()
    }).then(response => {
      this.props.onSuccess(response);
    }).catch(error => {
      return this.props.onFailure(error);
    });
  }

  getDefaultButtonContent() {
    const defaultIcon = this.props.showIcon? <TwitterIcon color='#00aced' size={25}/> : null;

    return (
      <span>
        {defaultIcon} {this.props.text}
      </span>
    );
  }

  render() {
    const twitterButton = <Button default onClick={this.onButtonClick}>{this.props.children ? this.props.children : this.getDefaultButtonContent()}</Button>

    return (
          <div style={{justifyContent:'center', display:'flex', width:'100%', height:'40px', marginTop:'300px'}}>
            {twitterButton}
          </div>
    )
  }
}

TwitterLogin.propTypes = {
  tag: PropTypes.string,
  text: PropTypes.string,
  loginUrl: PropTypes.string.isRequired,
  requestTokenUrl: PropTypes.string.isRequired,
  onFailure: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  style: PropTypes.object,
  className: PropTypes.string,
  dialogWidth: PropTypes.number,
  dialogHeight: PropTypes.number,
  showIcon: PropTypes.bool,
  credentials: PropTypes.oneOf(['omit', 'same-origin', 'include']),
  customHeaders: PropTypes.object,
  forceLogin: PropTypes.bool
};

TwitterLogin.defaultProps = {
  tag: 'button',
  text: 'Sign in with Twitter',
  disabled: false,
  dialogWidth: 600,
  dialogHeight: 400,
  showIcon: true,
  credentials: 'same-origin',
  customHeaders: {},
  forceLogin: false
};

export default TwitterLogin;