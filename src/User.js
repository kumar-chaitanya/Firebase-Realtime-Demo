import React, { Component } from 'react'
import firebase from './config';
import ids from './join_id';
import { isArray } from 'util';

const updateStatus = (key, that) => {
  let {userId} = ids;
  let pending = [...that.state.pending];
  let index = pending.findIndex(item => item.messageId === key);
  let reference = pending.splice(index, 1);
  firebase.database().ref(`user/${userId}/messages/${key}`).off('child_changed', reference[0].fn);
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
    let {userId} = ids;
    let pending = [...this.state.pending];
    pending.forEach(item => {
      firebase.database().ref(`user/${userId}/messages/${item.messageId}`).off('child_changed', item.fn);
    });
    this.setState({pending: []});
  }

  componentDidMount() {
    let { userId, shopId } = ids;
    const rootRef = firebase.database().ref();
    const userRef = rootRef.child('user').child(userId);
    const messageRef = userRef.child('messages');
    const query = messageRef.orderByChild('status').equalTo('Sent');

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

    query.once('value', snapshot => {
      snapshot.forEach(snap => {
        let that = this;
        let {messageId} = snap.val();
        let mRef = firebase.database().ref(`user/${userId}/messages/${messageId}`);
        let fn = mRef.on('child_changed', snapshot => {
          if(snapshot.val() === 'Seen')
            updateStatus(messageId, that);
        });
        let handleRef = {
          messageId,
          fn
        };
        this.setState({pending: this.state.pending.concat(handleRef)});
      });
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
      let messageRef = firebase.database().ref(`user/${userId}/messages/${key}`);
      let that = this;
      let fn = messageRef.on('child_changed', snapshot => {
        console.log(snapshot.val())
        if(snapshot.val() === 'Seen')
          updateStatus(key, that);
      });
      let messages = [...this.state.messages, data];
      let handleRef = {
        messageId: key,
        fn
      };
      this.setState({messages: [...messages], text: '', pending: this.state.pending.concat(handleRef)});
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
