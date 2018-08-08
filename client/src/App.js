import React, { Component } from 'react';
import axios from 'axios';
import Cosmic from 'cosmicjs';
import S from 'shorti';
import {Input, Button, Icon, Loader} from 'semantic-ui-react';
import TwitterLogin from './twitter-login';
import { instanceOf } from 'prop-types';
import { withCookies, Cookies } from 'react-cookie';

function getParameterByName(name, url) {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, "\\$&");
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
      results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function getBucket(){
  return Cosmic().bucket({
    slug: getParameterByName('bucket_slug'),
    read_key: getParameterByName('read_key'),
    write_key: getParameterByName('write_key')
  })
}

var delay = (function(){
  var timer = 0;
  return function(callback, ms){
    clearTimeout (timer);
    timer = setTimeout(callback, ms);
  };
})();

class App extends Component {
  static propTypes = {
    cookies: instanceOf(Cookies).isRequired
  };

  constructor(props) {
    super();
    const { cookies } = props;
    this.state = { 
      displayLoading: false,
      isAuthenticated: !!cookies.get('auth'),
      data:{}
    };
  }

  onSuccess = (response) => {
    const token = response.headers.get('x-auth-token');
    if (token) {
      this.setState({isAuthenticated: true, data:{}});
      const { cookies } = this.props;
      cookies.set('auth', 'yes', {maxAge:600});
    }
  };

  onFailed = (error) => {
    alert(error);
  };

  componentWillUpdate() {
    var x = document.getElementsByClassName('tweets');
    if(this.state.displayLoading && !!x && !!(x[0])) {
      x[0].style.display = 'none';
      document.getElementsByClassName('loader')[0].style.display = 'inline-block';
    }
  }

  componentDidUpdate() {
    setTimeout(function() {
      var x = document.getElementsByClassName('tweets');
      if(!!x && !!(x[0])) {
        x[0].style.display = 'inline-block';
        document.getElementsByClassName('loader')[0].style.display = 'none';
      }
    }, 500);
  }

  componentDidMount() {
    if(this.state.isAuthenticated) {
      document.getElementById('search-input').focus();
    }
  }
  getTweets(q) {
    if(q === '') return;
    axios.get(`/api/twitter/search?q=${encodeURIComponent(q)}`)
    .then(res => {
      const tweets = res.data;
      var added = new Array(tweets.length).fill("");
      var newState = this.state;
      newState.displayLoading = true;
      newState.data = {
        tweets,
        added,
        query: q        
      }
      this.setState(newState);
    })
  }

  handleKeyUp(e) {
    var text = e.target.value;
    if (!text) {
      this.setState({
        data: {},
        added: {},
        displayLoading:false
      })
      return
    }

    var validInput = false;
    for(var i = 0; i < text.length; i++) {
      if(text.charAt(i).match(/^[a-z0-9]+$/i)){
        validInput = true;
        break;
      }
    }
    var self = this;
    if(!validInput) {
      delay(function(){
        self.getTweets("");
      }, 800 );
      document.getElementsByClassName('loader')[0].style.display = 'none';
      return;
    }

    document.getElementsByClassName('loader')[0].style.display = 'inline-block';
    var x = document.getElementsByClassName('tweets');
    if(!!x && !!(x[0])) {
      x[0].style.display = 'none';
    }


    delay(function(){
      self.getTweets(text);
    }, 800 );
  }

  setLoadingState(idx) {
    var newState = this.state;
    newState.displayLoading = false;
    newState.data.added[idx] = "loading";
    this.setState(newState);
  }

  addToBucket(idx){
    this.setLoadingState(idx);
    const objParams = {
      "title": this.state.data.query,
      "type_slug": "tweets",
      "metafields": [
        {
          "key": "Content HTML",
          "type": "html-textarea",
          "value": this.state.data.tweets[idx]
        }
      ],
      "options": {
        "slug_field": false
      }
    }

    getBucket().addObject(objParams).then(data => {
      var newState = this.state;
      newState.data.added[idx] = data.object.slug;
      this.setState(newState);
    }).catch(err => {
      console.log(err)
    })
  }

  removeFromBucket(idx){
    let slug = this.state.data.added[idx];
    this.setLoadingState(idx);

    getBucket().deleteObject({
      slug: slug
    }).then(data => {
      var newState = this.state;
      newState.data.added[idx] = "";
      this.setState(newState);
    }).catch(err => {
      console.log(err)
    })
  }

  getButton(idx){
    if(this.state.data.added[idx] == "") {
      return <Button style={{margin:'0 0 auto auto', width:'50px', 'backgroundColor':'#21ba45'}} onClick={()=>this.addToBucket(idx)}><Icon name="plus" style={{color:'#ffffff'}}/></Button>
    }
    else if(this.state.data.added[idx] == "loading") {
      return <Button style={{margin:'0 0 auto auto', width:'50px', 'backgroundColor':'#21ba45'}}><Loader active inline size="mini"/></Button>
    }
    return <Button style={{margin:'0 0 auto auto', width:'50px', 'backgroundColor':'#21ba45'}} onClick={()=>this.removeFromBucket(idx)}><Icon name="minus" style={{color:'#ffffff'}}/></Button>
  }

  loadWidget(){
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "https://platform.twitter.com/widgets.js";
    document.body.appendChild(script); 
  }

  render() {
    const tweets = this.state.data.tweets;
    var getMarkup = function(tweet){
      return {__html: tweet};
    }

    this.loadWidget();    
    
    let content = !!this.state.isAuthenticated ?
      (
        <div className="App">
          <div style={ S('w-100p') }>
            <div style={ S('pull-left m-15 w-500') }>
              <Input id="search-input" icon='search' placeholder="Search tweets" style={ S('w-100p') } onKeyUp={ this.handleKeyUp.bind(this) }/>
            </div>
            <div style={ S('pull-right m-20') }>
              <a href="https://cosmicjs.com" target="_blank">
                <img src="https://cosmicjs.com/images/logo.svg" style={ S('w-30 pull-left mr-10') }/>
              </a>
              <a href="https://twitter.com" target="_blank">
                <img src="twitter_logo.png" style={ S('w-30 pull-left mr-10') }/>
              </a>
            </div>
          </div>
          <div style={ S('clearfix') }/>
          <div className="loader" style={{display:this.state.displayLoading?'inline-block':'none'}}>
            <Loader active size="large" />
          </div>
          { 
              tweets &&
              <div>
                <div className="tweets" style={{display:this.state.displayLoading?'none':'inline-block'}}>
                  {
                    tweets.map((tweet, idx) =>
                      <div key = {idx} style={S('pull-up ml-15 mb-15 w-300 relative')}>
                          <div style={{width:'500px'}} dangerouslySetInnerHTML={getMarkup(tweet)}/>
                          <div style={{position:'absolute', right:'-200px', bottom:'0px'}}>
                            {this.getButton(idx)}
                          </div>
                      </div>
                    )
                  }
                </div>
              </div>
          }
        </div>
      ) :
      (
          <TwitterLogin loginUrl="/api/twitter/login"
                        onFailure={this.onFailed} onSuccess={this.onSuccess}
                        requestTokenUrl="/api/twitter/reqtoken"/>
      );
      return (
        <div className="App" style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
          {content}
        </div>
      );
  }
}

export default withCookies(App);;
