import React, { Component } from 'react';
import socketIOClient from "socket.io-client";

import './App.css';

// For some reason, cannot use 127.0.0.1
const endpoint = window.location.hostname + ':4001';
const socket = socketIOClient(endpoint);

class App extends Component {
  constructor() {
    super();
    this.state = {
      response: false
    };
  }

  runServerFunction(functionName, args) {
    socket.emit('runFunction', functionName, args);
  }

  componentDidMount() {
    socket.on("FromAPI", data => this.setState({ response: data }));
  }
  render() {
    const { response } = this.state;

    console.log(response);
    return (
      <div className="App">
        <div onClick={() => this.runServerFunction('allOn', "0")}>All on</div>
        <div onClick={() => this.runServerFunction('allOff', "0")}>All off</div>
      </div>
    );
  }
}

export default App;
