import React, { Component } from 'react'
import firebase from './config';
import ids from './join_id';
import { isArray } from 'util';

const addToStorage = key => {
  let pending =  JSON.parse(localStorage.getItem('pending'));
  
  if(!pending) {
    pending = [];
  }

  pending.push(key);
  localStorage.setItem('pending', JSON.stringify(pending));
}

const getFromStorage = () => {
   let pending = JSON.parse(localStorage.getItem('pending'));
   if(!pending)
      return [];
    else
      return pending;
}

const removeFromStorage = key => {
  let pending = JSON.parse(localStorage.getItem('pending'));
  let index = pending.indexOf(key);
  let t = pending.splice(index, 1);
  localStorage.setItem('pending', JSON.stringify(pending));
  return index;
}

const updateStatus = (key, that) => {
  let {userId} = ids;
  let index = removeFromStorage(key);
  let pending = [...that.state.pending];
  let reference = pending.splice(index, 1);
  firebase.database().ref(`user/${userId}/messages/${key}`).off('child_changed', reference[0]);
  let messages = [...that.state.messages];
  index = messages.findIndex(message => key === message.messageId);
  let message = messages.splice(index, 1);
  let newMessage = {
    ...message[0],
    status: 'Seen'
  }
  messages.splice(index, 0, newMessage);
  that.setState({ messages: [...messages], pending: [...pending] });
}

export class User extends Component {
  state = {
    messages: [],
    pending: [],
    text: ''
  }

  componentWillUnmount() {
    let items = getFromStorage();
    let {userId} = ids;
    let pending = [...this.state.pending];
    items.forEach((item, i) => {
      firebase.database().ref(`user/${userId}/messages/${item}`).off('child_changed', pending[i]);
    });
    this.setState({pending: []});
  }

  componentDidMount() {
    let { userId, shopId } = ids;
    const rootRef = firebase.database().ref();
    const userRef = rootRef.child('user').child(userId);
    const messageRef = userRef.child('messages');

    messageRef.once('value', snapshot => {
      if(snapshot.val()){
        let messages = Object.keys(snapshot.val()).map(key => {
          return {
            ...snapshot.val()[key]
          };
        });
        this.setState({messages: [...messages]});
      }
    });

    let pending = getFromStorage();
    pending.forEach(item => {
      let messageRef = firebase.database().ref(`user/${userId}/messages/${item}`);
      let that = this;
      let fn = messageRef.on('child_changed', snapshot => {
        if(snapshot.val() === 'Seen')
          updateStatus(item, that);
      });
      this.setState({pending: this.state.pending.concat(fn)});
    });
  }

  inputHandler = e => {
    this.setState({text: e.target.value});
  }

  formHandler = e => {
    e.preventDefault();
    let { userId, shopId } = ids;
    let key = firebase.database().ref(`user/${userId}/messages`).push().key;
    let data = {
      userId,
      shopId,
      messageId: key,
      text: this.state.text,
      status: 'Sent'
    };
    firebase.database().ref().update({
      [`user/${userId}/messages/${key}`]: data,
      [`shop/${shopId}/messages/${key}`]: data
    }).then(() => {
      addToStorage(key);
      let messageRef = firebase.database().ref(`user/${userId}/messages/${key}`);
      let that = this;
      let fn = messageRef.on('child_changed', snapshot => {
        console.log(snapshot.val())
        if(snapshot.val() === 'Seen')
          updateStatus(key, that);
      });
      let messages = [...this.state.messages, data];
      this.setState({messages: [...messages], text: '', pending: this.state.pending.concat(fn)});
    }).catch(error => console.log(error));
  }

  render() {
    return (
      <div>
        <h3>Enter a message and post it and it gets added at the shop tab</h3>
        <div>
          <form onSubmit={this.formHandler}>
            <input type="text" onChange={this.inputHandler} value={this.state.text} />
            <input type="submit" value="Post"/>
          </form>
        </div>
        <div>
          {this.state.messages.map(message => {
            return (
              <div key={message.messageId}>
                <p>{message.text}</p>
                <p>{message.status}</p>
              </div>
            );
          })}
        </div>
      </div>
    )
  }
}

export default User;
