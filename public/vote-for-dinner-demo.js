(function(window, document, undefined) {

  function App() {
    var usersRef = firebase.database().ref('users');
    var dinnersRef = firebase.database().ref('dinners');
    var votesRef = firebase.database().ref('votes');

    var userLookup = {};
    var dinnerLookup = {};

    this.initialize = function() {
      document.getElementById('addNewUser')
              .addEventListener('click', function() {
                // get the user input and clear
                var userName = document.getElementById('userName').value;
                document.getElementById('userName').value = '';

                // create a new user and set the name
                var userRef = usersRef.push();
                userRef.set({name: userName});
              });

      usersRef.on('child_added', function(data) {
        // get the user information from the snapshot
        var userId = data.key;
        var userData = data.val();
        var userName = userData.name;

        // store a local reference
        userLookup[userId] = userName;

        // create the list item that will parent the user components
        var userListItem = document.createElement('li');
        userListItem.id = 'user-' + userId;

        // create a radio button so users will be able to select
        // themselves when voting
        var userRadio = document.createElement('input');
        userRadio.type = 'radio';
        userRadio.name = 'userName';
        userRadio.value = userId;
        userListItem.appendChild(userRadio);

        // create a text node to display the name
        var nameNode = document.createTextNode(userName);
        userListItem.appendChild(nameNode);

        // create a delete button so users will be able
        // to remove themselves from the system
        var deleteButton = document.createElement('button');
        deleteButton.innerText = 'Delete';
        deleteButton.addEventListener('click', function(event) {
          // remove the user from the users database
          firebase.database().ref('users/' + userId).remove();

          // remove vote mapping
          firebase.database().ref('votes/' + userId).remove();
        });
        userListItem.appendChild(deleteButton);
        
        // append the user list item to the user list
        document.getElementById('userList').appendChild(userListItem);
      });
    };

    usersRef.on('child_removed', function(data) {
      // get the user information from the snapshot
      var userId = data.key;

      // remove the user list item
      document.getElementById('user-' + userId).remove();

      // remove the local reference
      delete userLookup[userId];
    });

    document.getElementById('addNewDinner')
            .addEventListener('click', function() {
              var dinnerName = document.getElementById('dinnerName').value;
              document.getElementById('dinnerName').value = '';

              // create a new dinner option and set the name
              var dinnerRef = dinnersRef.push();
              dinnerRef.set({name: dinnerName});
            });

    dinnersRef.on('child_added', function(data) {
      // get the dinner information from the snapshot
      var dinnerId = data.key;
      var dinnerData = data.val();
      var dinnerName = dinnerData.name;

      // store a local reference
      dinnerLookup[dinnerId] = dinnerName;

      // create the list item that will parent the user components
      var dinnerListItem = document.createElement('li');
      dinnerListItem.id = 'dinner-' + dinnerId;

      // set the text to display the name
      dinnerListItem.innerText = dinnerName;

      // create a button for voting
      var voteButton = document.createElement('button');
      voteButton.innerText = 'Vote';
      voteButton.addEventListener('click', function() {
        var selectedUserName;

        var userNames = document.getElementsByName('userName');

        for (var i = 0; i < userNames.length; i++) {
          if (userNames[i].checked) {
            selectedUserName = userNames[i];
            break;
          }
        }

        if (selectedUserName) {
          // get the user information from the selected radio
          var userId = selectedUserName.value;

          // save the user vote
          firebase.database().ref('votes/' + userId).set({dinnerId: dinnerId});
        } else {
          alert('You did not select a username!');
        }
      });
      dinnerListItem.appendChild(voteButton);

      // create a button for deleting the dinner option
      var deleteButton = document.createElement('button');
      deleteButton.innerText = 'Delete';
      deleteButton.addEventListener('click', function() {
        // remove the dinner from the dinners database
        firebase.database().ref('dinners/' + dinnerId).remove();

        // query the votes database and remove everything
        // with a matching dinner vote
        votesRef.once('value', function(votesSnapshot) {
          votesSnapshot.forEach(function(voteSnapshot) {
            if (voteSnapshot.val()['dinnerId'] === dinnerId) {
              firebase.database().ref('votes/' + voteSnapshot.key).remove();
            }
          });
        });
      });
      dinnerListItem.appendChild(deleteButton);

      // append the dinner list item to the dinner list
      document.getElementById('dinnerList').appendChild(dinnerListItem);
    });

    dinnersRef.on('child_removed', function(data) {
      // get the dinner information from the snapshot
      var dinnerId = data.key;

      // remove the dinner list item
      document.getElementById('dinner-' + dinnerId).remove();

      // remove the local reference
      delete dinnerLookup[dinnerId];
    });

    votesRef.on('child_added', function(data) {
      // get the user information from the snapshot
      var userId = data.key;
      var voteData = data.val();
      var dinnerId = voteData.dinnerId;

      // create the list item
      var voteListItem = document.createElement('li');
      voteListItem.id = 'vote-' + userId;
      voteListItem.innerText = userLookup[userId] + ' voted for ' + dinnerLookup[dinnerId];

      // append the vote list item to the vote list
      document.getElementById('voteList').appendChild(voteListItem);        
    });

    votesRef.on('child_changed', function(data) {
      // get the user information from the snapshot
      var userId = data.key;
      var voteData = data.val();
      var dinnerId = voteData.dinnerId;

      document.getElementById('vote-' + userId).innerText = userLookup[userId] + ' voted for ' + dinnerLookup[dinnerId];
    });

    votesRef.on('child_removed', function(data) {
      // get the user information from the snapshot
      var userId = data.key;

      // remove the vote list item
      document.getElementById('vote-' + userId).remove();
    });
  }

  var app = new App();
  app.initialize();

})(window, document);
