import React, { Component, Fragment } from 'react';
import logo from './logo.svg';
import './App.css';
import firebase from './config';
import {Route, Switch} from 'react-router-dom';
import User from './User';
import Shop from './Shop';

const Index = () => {
  return (
    <div className="App">
      {/* <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
      </header>
      <div>
        <h4>{this.state.message}</h4>
        <form>
          <input type="email" name="email" id="email" placeholder="Email" value={this.state.email} onChange={(e) => this.inputChange(e, 'email')} />
          <input type="password" name="password" id="password" placeholder="Password" value={this.state.password} onChange={(e) => this.inputChange(e, 'password')} />
          <input type="checkbox" name="signedIn" id="signedIn" checked={this.state.signedIn} onClick={this.toggle} />
          <input type="submit" value="SignUp" onClick={this.signUpHandler} />
          <input type="submit" value="SignIn" onClick={this.signInHandler} />
          <input type="submit" value="Sign Out" onClick={this.signOutHandler} />
        </form>
      </div> */}
      <p>Open localhost:3000/user in 1 tab</p>
      <p>And localhost:3000/shop in other tab</p>
    </div>
  );
}

class App extends Component {
  state = {
    email: '',
    password: '',
    signedIn: false,
    message: null,
    user: null
  }

  inputChange = (e, key) => {
    let value = e.target.value;
    this.setState({[key]: value});
  }

  toggle = () => {
    let curr = !this.state.signedIn;
    this.setState({signedIn: curr});
  }

  signUpHandler = (e) => {
    e.preventDefault();
    firebase.auth().createUserWithEmailAndPassword(this.state.email, this.state.password).then(user => {
      console.log(user);
      this.setState({user: user});
      firebase.database().ref('/users/' + user.user.uid).set({
        email: user.user.email
      });
    }).catch(error => {
      console.log(error.code, error.message);
    });
  }

  signInHandler = (e) => {
    e.preventDefault();
    firebase.auth().signInWithEmailAndPassword(this.state.email, this.state.password).then(user => {
      console.log(user);
      this.setState({ user: user });
    }).catch(error => {
      console.log(error.code, error.message);
    });
  }

  signOutHandler = (e) => {
    e.preventDefault();
    firebase.auth().signOut().then(() => {
      console.log('Signed Out');
    }).catch(error => {
      console.log(error);
    });
  }

  componentDidMount() {
    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        firebase.database().ref(`/users/${user.uid}`).on('value', function (snapshot) {
          console.log(snapshot.val());
        });
        this.setState({user: user, message: 'Welcome'})
        firebase.database().ref().update({
          [`/users/${user.uid}/email`]: 'rajat@gmail.com',
          [`/users/${user.uid}/addr`]: ['Jaypee', 'Delhi', 'ncr']
        }).then(() => console.log('Done')).catch(error => console.log(error));
      } else {
        this.setState({user: null, message: 'Please SignIn or SignUp'})
      }
    });
  }

  render() {
    return (
      <Fragment>
        <Switch>
          <Route path="/" component={Index} exact />
          <Route path="/user" component={User} />
          <Route path="/shop" component={Shop} />
        </Switch>
      </Fragment>
    );
  }
}

export default App;
