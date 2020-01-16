var database = firebase.database();

//retrieve users Data on auth

firebase.auth().onAuthStateChanged(firebaseUser => {
  if (firebaseUser) {
    var user = firebase.auth().currentUser.uid;
    console.log(user);
    var namedb = firebase.database().ref('NameUsers/' + user);
    namedb.once('value').then(function (snapshot) {
      var name = snapshot.child("name").val();
      var balance = snapshot.child("balance").val();
      document.getElementById('nameU').value = name.toString();
      document.getElementById('balanceU').textContent = balance.toString();
    });

    //get groups and show it to the sidenav
    var role = firebase.database().ref('NameUsers/' + user + '/role');
    role.once("value")
      .then(function (snapshot) {
        role = snapshot.val();
        if (isAdmin(role)) { //admin will see all groups
          var query = firebase.database().ref('Groups').orderByKey();
          query.once("value")
            .then(function (snapshot) {
              snapshot.forEach(function (childSnapshot) {
                //title group
                var title = childSnapshot.child('title').val();
                // key name of the group      
                var key = childSnapshot.key;
                var code = '<li><a class="waves-effect" onclick="displayGroup(' + "'" + key + "'" + ')" >' + key + '</a></li>';
                document.getElementById('groups').insertAdjacentHTML('beforeend', code);
                console.log(key);

              });
            });
        }
        else { //normal user will see only the groups where he participates
          var query = firebase.database().ref('NameUsers/' + user + '/Groups').orderByKey();
          query.once("value")
            .then(function (snapshot) {
              snapshot.forEach(function (childSnapshot) {
                //value of the child
                var childData = childSnapshot.val();
                if (childData == true) {
                  // key name of the child that are enabled       
                  var key = childSnapshot.key;
                  var code = '<li><a class="waves-effect" onclick="displayGroup(' + "'" + key + "'" + ')" >' + key + '</a></li>';
                  document.getElementById('groups').insertAdjacentHTML('beforeend', code);
                  console.log(key);
                }
              });
            });
        }
      });


    //display the buttons with which create a group & events only if role="admin"
    var role = firebase.database().ref('NameUsers/' + user + '/role');
    role.once("value")
      .then(function (snapshot) {
        role = snapshot.val();
        console.log(role);
        if (isAdmin(role)) {
          var codeGroup = '<li><a href="createGroup.html"><i class="material-icons">add_circle</i> Crea gruppo</a></li>';
          document.getElementById('groups').insertAdjacentHTML('afterend', codeGroup);
        }
      });
  }
});


//group function called from buttons in the sidenav, to change the group data in the page
function displayGroup(group) {
  console.log("cliccato sul gruppo: " + group);
  //setting data from group selected
  var groupDb = firebase.database().ref('Groups/' + group);
  groupDb.once('value').then(function (snapshot) {
    var titleG = snapshot.child("title").val();
    document.getElementById('groupName').textContent = titleG.toString();
  });
  //adding the createEvent button for the showed group
  document.getElementById("functions").innerHTML = "";
  var codeEvent = '<li><a href="createEvent.html?' + group + '"><i class="material-icons">add_circle</i> Crea nuovo evento</a></li>';
  document.getElementById('functions').insertAdjacentHTML('afterbegin', codeEvent);
  //adding the deleteGroup button
  document.getElementById("deleteGroup").innerHTML = "";
  var codeGD = '<li><a class="waves-effect" onclick="deleteGroup(' + "'" + group + "'" + ')" ><i class="material-icons">delete_forever</i>Cancella gruppo: ' + group + '</a></li>';
  document.getElementById('deleteGroup').insertAdjacentHTML('afterbegin', codeGD);
  //adding the editMembers button
  document.getElementById("editMembers").innerHTML = "";
  var codeGD = '<li><a href="groupMembers.html?' + group + '"><i class="material-icons">person_add</i> Modifica membri</a></li>';
  document.getElementById('editMembers').insertAdjacentHTML('afterbegin', codeGD);
  //adding all events of the group
  document.getElementById("eventTable").innerHTML = "";
  var query = firebase.database().ref('Groups/' + group + '/Events').orderByKey();
  query.once("value")
    .then(function (snapshot) {
      snapshot.forEach(function (childSnapshot) {
        //value of the child
        var childData = childSnapshot.val();
        if (childData == true) {
          // key name of the child that are enabled
          var key = childSnapshot.key;
          console.log(key);
          //requesting the events of the selected group. BISOGNA ORDINARLI PER DATA!!! 
          var queryEvent = firebase.database().ref('Events/' + group + "/" + key);
          queryEvent.once("value").then(function (snapshot) {
            var title = snapshot.child("title").val();
            var cost = snapshot.child("cost").val();
            var dateE = snapshot.child("dateE").val();
            var dateR = snapshot.child("dateR").val();
            //insert values in the Event Table
            var codeSingleEvent = '<tr>' +
              '<td><a href="infoEvent.html?' + group + '&' + title + '"><i class="material-icons">info_outline</i></a>' + title + '</td>' +
              '<td>' + cost + '</td>' +
              '<td>' + dateE + '</td>' +
              '<td>' + dateR + '</td>' +
              '</tr>';
            document.getElementById('eventTable').insertAdjacentHTML('afterbegin', codeSingleEvent);

          });

        }
      });
    });
}

//funciont that delete the group selected (async)
async function deleteGroup(group) {
  var x = confirm("Sei sicuro di voler cancellare il gruppo " + group + "?");
  if (x) {
    //remove ref in user/groups/groupRemoved for each member of the group deleted
    var query = firebase.database().ref('Groups/' + group + '/Members').orderByKey();
    await query.once("value")
      .then(function (snapshot) {
        snapshot.forEach(function (childSnapshot) {
          //remove ref of event joined by members
          var memberKey = childSnapshot.key;
          refP = firebase.database().ref('NameUsers/' + memberKey + '/EventsJoined/' + group);
          refP.remove()
          //remove ref of the group in the member's data
          var refM = firebase.database().ref('NameUsers/' + memberKey + '/Groups/' + group);
          refM.remove();
        });
      });
    refE = firebase.database().ref('Events/' + group);
    refE.remove();
    var refG = firebase.database().ref('Groups/' + group);
    refG.remove()
      .then(function () {
        alert("Rimosso con successo il gruppo: " + group)
        window.location.reload();
      })
      .catch(function (error) {
        alert("Rimozione del gruppo non riuscita: " + error.message)
      });
  }
}

//function that change name of the user
function changeName(){
  var nameU = document.getElementById('nameU').value;
  var user = firebase.auth().currentUser.uid;
  var refU = firebase.database().ref('NameUsers/' + user);
  refU.child("name").set(nameU);
  alert("nome cambiato correttamente!");
}