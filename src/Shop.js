import React, { Component } from 'react'
import firebase from './config';
import ids from './join_id';

export class Shop extends Component {
  state = {
    messages: [],
    initialised: false
  }

  componentDidMount() {
    let {shopId} = ids;
    const rootRef = firebase.database().ref();
    const userRef = rootRef.child('shop').child(shopId);
    const messageRef = userRef.child('messages');

    messageRef.once('value', snapshot => {
      if (snapshot.val()) {
        let messages = Object.keys(snapshot.val()).map(key => {
          return {
            ...snapshot.val()[key]
          };
        });
        this.setState({ messages: [...messages] });
      }
    });

    let query = messageRef.orderByChild('status').equalTo('Sent');
    query.on('child_added', snapshot => {
      if(this.state.initialised)
        {
          let message = {
            ...snapshot.val()
          };
          this.setState({messages: this.state.messages.concat(message)});
        }
    });

    this.setState({initialised: true});
  }

  changeStatus = key => {
    let {userId, shopId} = ids;
    firebase.database().ref().update({
      [`user/${userId}/messages/${key}/status`]: 'Seen',
      [`shop/${shopId}/messages/${key}/status`]: 'Seen'
    }).then(() => {
      let {messages} = this.state;
      let index = messages.findIndex(message => key === message.messageId);
      let message = messages.splice(index,1);
      let newMessage = {
        ...message[0],
        status: 'Seen'
      }
      messages.splice(index,0,newMessage);
      this.setState({messages: [...messages]});
    }).catch(error => console.log(error));
  }

  render() {
    let {messages} = this.state;

    return (
      <div>
        <h3>Press Seen button for a message and status of that message gets changed at user tab</h3>
        {messages.map(message => {
          return (
            <div key={message.messageId}>
              <p>{message.text}</p>
              <p>{message.status}</p>
              {(message.status === 'Sent') ? <button onClick={this.changeStatus.bind(this, message.messageId)}>Seen</button> : null}
            </div>
          );
        })}
      </div>
    )
  }
}

export default Shop
