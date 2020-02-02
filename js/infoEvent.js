//getting the values from URL (group and event selected from the home)
var queryString = decodeURIComponent(window.location.search);
queryString = queryString.substring(1);
var queries = queryString.split("&");
var group = queries[0];
var event = queries[1];
document.getElementById('groupName').textContent = group.toString() + " >";
document.getElementById('eventName').textContent = event.toString();
var today = new Date();
todayS = formatDate(today);

var btnP = document.getElementById("btnParticipate");
var btnE = document.getElementById("btnEliminate");
var btnC = document.getElementById("btnCancel");
var btnOn = document.getElementById("btnOn");
var btnOff = document.getElementById("btnOff");
var btnMod1 = document.getElementById("btnMod1");
var partTab = document.getElementById("partTab");
var btnMod2 = document.getElementById("btnMod2");
var nopartTab = document.getElementById("nopartTab");

//request information and view it on the page
firebase.auth().onAuthStateChanged(firebaseUser => {
  if (firebaseUser) {
    var user = firebase.auth().currentUser;
    // User is signed in. (1)
    var role = firebase.database().ref('NameUsers/' + user.uid + '/role');
    role.once("value")
      .then(function (snapshot) {
        role = snapshot.val(); //check if role is admin (used at point 4)
        //check if the selected group (passed through the URL) exist (2)
        var ref = firebase.database().ref("Groups");
        ref.once("value")
          .then(function (snapshot) {
            var hasGroup = snapshot.hasChild(group);
            if (hasGroup) {
              //check if the selected event (passed through the URL) exist in the group (3)
              var ref = firebase.database().ref("Events/" + group);
              ref.once("value")
                .then(function (snapshot) {
                  var hasEvent = snapshot.hasChild(event);
                  if (hasEvent) {
                    //check if the user belongs to the group or is admin (4)
                    var ref = firebase.database().ref('NameUsers/' + user.uid + "/Groups");
                    ref.once("value")
                      .then(function (snapshot) {
                        var isParticipant = snapshot.hasChild(group);
                        if (isParticipant || isAdmin(role)) {
                          //request of event Data
                          var queryEvent = firebase.database().ref('Events/' + group + "/" + event);
                          queryEvent.once("value").then(function (snapshot) {
                            var title = snapshot.child("title").val();
                            var description = snapshot.child("description").val();
                            var cost = snapshot.child("cost").val();
                            var dateE = snapshot.child("dateE").val();
                            var timeE = snapshot.child("timeE").val();
                            var dateR = snapshot.child("dateR").val();
                            var active = snapshot.child("active").val();
                            var timedateE = dateE + "  " + timeE;
                            document.getElementById('title').textContent = title.toString();
                            document.getElementById('description').textContent = description.toString();
                            document.getElementById('cost').textContent = cost.toString();
                            document.getElementById('dateE').textContent = timedateE.toString();
                            document.getElementById('dateR').textContent = dateR.toString();
                            //display participate button or cancel paticipation
                            var ref = firebase.database().ref("Events/" + group + "/" + event + "/Members");
                            ref.once("value").then(function (snapshot) {
                              var joined = snapshot.hasChild(user.uid);
                              if (joined) { //cancel button
                                btnC.style.display = "initial";
                                if (!active) {
                                  btnC.setAttribute('class', 'waves-effect waves-light btn btnCancel disabled');
                                }
                                btnC.addEventListener('click', e => {
                                  var namedb = firebase.database().ref('NameUsers/' + user.uid);
                                  namedb.once('value').then(async function (snapshot) {
                                    if (active) {
                                      btnC.style.display = "none";
                                      btnP.style.display = "initial";
                                      //server side function
                                      var manageCost = firebase.app().functions('europe-west1').httpsCallable('manageCost');
                                      await manageCost({ group: group, event: event, participate: false }).then(function (result) {
                                        // Read result of the Cloud Function.                                       
                                      }).catch(function (error) {
                                        // Getting the Error details.                                       
                                      });
                                      window.location.reload();
                                    }
                                  });
                                });
                              }
                              else { //join button
                                btnP.style.display = "initial";
                                if (!active) {
                                  btnP.setAttribute('class', 'disabled waves-effect waves-light btn btnParticipate');
                                }
                                btnP.addEventListener('click', e => {
                                  var namedb = firebase.database().ref('NameUsers/' + user.uid);
                                  namedb.once('value').then(async function (snapshot) {
                                    var balance = snapshot.child("balance").val();
                                    console.log("il mio saldo" + balance + "il costo:" + cost);
                                    if (active) {
                                      btnP.style.display = "none";
                                      btnC.style.display = "initial";
                                      //server side function
                                      var manageCost = firebase.app().functions('europe-west1').httpsCallable('manageCost');
                                      await manageCost({ group: group, event: event, participate: true }).then(function (result) {
                                        // Read result of the Cloud Function.
                                      }).catch(function (error) {
                                        // Getting the Error details.
                                      });
                                      if (parseFloat(balance) < parseFloat(cost)) {
                                        alert("Attenzione il saldo è negativo!");
                                      }
                                      window.location.reload();
                                    }
                                  });
                                });
                              }
                            });
                            if (isAdmin(role)) {
                              //display eliminate button only for admin
                              btnE.style.display = "initial";
                              btnE.addEventListener('click', e => {
                                var x = confirm("Sei sicuro di voler cancellare l'evento?");
                                if (x) {
                                  deleteEvent(cost);
                                }
                              });
                              //display open/close event participation
                              if (active) {
                                btnOff.style.display = "initial";
                                btnOff.addEventListener('click', e => {
                                  var activeRef = firebase.database().ref('Events/' + group + "/" + event);
                                  activeRef.child("active").set(false);
                                  window.location.reload();
                                });
                              }
                              else if (!active) {
                                btnOn.style.display = "initial";
                                btnOn.addEventListener('click', e => {
                                  var activeRef = firebase.database().ref('Events/' + group + "/" + event);
                                  activeRef.child("active").set(true);
                                  window.location.reload();
                                });
                              }
                              //list of participants                             
                              partTab.style.display = "initial";
                              //display participants:
                              var query = firebase.database().ref('Events/' + group + "/" + event + "/Members").orderByKey();
                              query.once("value")
                                .then(function (snapshot) {
                                  snapshot.forEach(function (childSnapshot) {
                                    var userCode = childSnapshot.key;
                                    var ref = firebase.database().ref('NameUsers/' + userCode);
                                    ref.once('value').then(function (snapshot) {
                                      var nameUser = snapshot.child("info/name").val();
                                      var codeEvent = '<li class="collection-item blue-grey lighten-3"><label><input id="' + userCode + '" type="checkbox" checked="checked" class="filled-in" /><span class="black-text">' + nameUser + '</span></label></li>';
                                      document.getElementById('participants').insertAdjacentHTML('afterbegin', codeEvent);
                                    });
                                  });
                                });
                              //modify button 1
                              btnMod1.style.display = "initial";
                              btnMod1.addEventListener('click', e => {
                                updateParticipants(cost);
                              });

                              //list of user not registered:
                              nopartTab.style.display = "initial";
                              var query = firebase.database().ref("NameUsers").orderByChild('info/name');
                              query.once("value")
                                .then(function (snapshot) {
                                  snapshot.forEach(function (childSnapshot) {
                                    var userCode = childSnapshot.key;
                                    var ref = firebase.database().ref('Events/' + group + "/" + event + "/Members");
                                    ref.once("value")
                                      .then(function (snapshot) {
                                        var hasParticipant = snapshot.hasChild(userCode);
                                        if (!hasParticipant) { //display user only if isn't a participant of the event
                                          var ref = firebase.database().ref('NameUsers/' + userCode);
                                          ref.once('value').then(function (snapshot) {
                                            var nameUser = snapshot.child("info/name").val();
                                            var codeEvent = '<li class="collection-item blue-grey lighten-3"><label><input id="' + userCode + '" type="checkbox" class="filled-in" /><span class="black-text">' + nameUser + '</span></label></li>';
                                            document.getElementById('users').insertAdjacentHTML('afterbegin', codeEvent);
                                          });
                                        }
                                      });
                                  });
                                });
                              //modify button 2
                              btnMod2.style.display = "initial";
                              btnMod2.addEventListener('click', e => {
                                addParticipants(cost);
                              });
                            }
                          });
                        }
                        else { alert("non fai parte del gruppo: " + group); }
                      });

                  }
                  else { alert("non è stato selezionato un evento valido nel gruppo: " + group); }
                });
            }
            else { alert("non è stato selezionato un gruppo valido"); }
          });
      });
  } else {
    console.log("no user signed in")
  }
});

//i use an async function to wait for the elimination of the participation of each user
async function deleteEvent(cost) {
  //delete the participation from each player that joined the event
  console.log('Events/' + group + "/" + event + "/Members");
  var query = firebase.database().ref('Events/' + group + "/" + event + "/Members").orderByKey();
  await query.once("value")
    .then(function (snapshot) {
      snapshot.forEach(function (childSnapshot) {
        var key = childSnapshot.key;
        console.log("elimino da utente:" + key);
        var refU = firebase.database().ref('NameUsers/' + key + "/EventsJoined/" + group + "/" + event);
        refU.remove(); //remove event joined by the user
        outgoHistoryRemove(key); //remove outgo report because money given back
        //give back money to participant
        //server side function
        var balanceChange = firebase.app().functions('europe-west1').httpsCallable('balanceChange');
        balanceChange({ amount:cost,userSel:key}).then(function (result) {
          // Read result of the Cloud Function.                                       
        }).catch(function (error) {
          // Getting the Error details.                                       
        });

      });
    });
  var refG = firebase.database().ref('Groups/' + group + "/Events/" + event);
  refG.remove();
  refE = firebase.database().ref('Events/' + group + "/" + event);
  refE.remove()
    .then(function () {
      alert("Rimosso con successo l'evento: " + event)
      window.location.reload();
    })
    .catch(function (error) {
      alert("Rimozione dell' evento non riuscita: " + error.message)
    });
}

//eliminate and refund deselected participants
async function updateParticipants(cost) {
  var query = firebase.database().ref('Events/' + group + "/" + event + "/Members").orderByKey();
  await query.once("value")
    .then(function (snapshot) {
      snapshot.forEach(function (childSnapshot) {
        var userCode = childSnapshot.key;
        if (document.getElementById(userCode)) {
          var namecheck = document.getElementById(userCode).checked; //true if checked
          if (!namecheck) { //select only the unchecked members
            //server side function
            var balanceChange = firebase.app().functions('europe-west1').httpsCallable('balanceChange');
            balanceChange({ amount: cost,userSel:userCode }).then(function (result) {
              // Read result of the Cloud Function.                                       
            }).catch(function (error) {
              // Getting the Error details.                                       
            });
            //remove user from event
            refE = firebase.database().ref('Events/' + group + "/" + event + "/Members/" + userCode);
            refE.remove();
            refU = firebase.database().ref('NameUsers/' + userCode + '/EventsJoined/' + group + "/" + event);
            refU.remove();
            outgoHistoryRemove(userCode); //remove outgo report because money given back
            console.log(userCode + " si è eliminato dall'evento: " + event);
          }
        }
      });
    });
  window.location.reload();
}

async function addParticipants(cost) {
  var query = firebase.database().ref("NameUsers").orderByKey();
  await query.once("value")
    .then(function (snapshot) {
      snapshot.forEach(function (childSnapshot) {
        var userCode = childSnapshot.key;
        if (document.getElementById(userCode)) {
          var ref = firebase.database().ref('Events/' + group + "/" + event + "/Members");
          ref.once("value")
            .then(function (snapshot) {
              var hasParticipant = snapshot.hasChild(userCode);
              if (!hasParticipant) { //to see if a user already participate to the event
                var namecheck = document.getElementById(userCode).checked; //true if checked
                if (namecheck) { //select only the checked users
                  //server side function
                  var balanceChange = firebase.app().functions('europe-west1').httpsCallable('balanceChange');
                  balanceChange({ amount: (-cost),userSel:userCode }).then(function (result) {
                    // Read result of the Cloud Function.                                       
                  }).catch(function (error) {
                    // Getting the Error details.                                       
                  });
                  //add user to the event
                  var eventRef = firebase.database().ref('Events/' + group + "/" + event + "/Members");
                  eventRef.child(userCode).set(true);
                  //create the reference to the event in the current user
                  var userEventRef = firebase.database().ref('NameUsers/' + userCode + "/EventsJoined/" + group);
                  userEventRef.child(event).set(true);
                  outgoHistoryAdd(userCode); //add outgo report to the user
                }
              }
            });
        }
      });
    });
  window.location.reload();
}

//event cost history add
function outgoHistoryAdd(userC) {
  var queryEvent = firebase.database().ref('Events/' + group + "/" + event);
  queryEvent.once("value").then(function (snapshot) {
    var cost = parseFloat(snapshot.child("cost").val());
    var ref = firebase.database().ref('NameUsers/' + userC + "/outgo/" + group + "/" + event);
    var outgoData = {
      amount: cost.toFixed(2),
      date: todayS
    };
    ref.set(outgoData);
  });
}

//event cost history remove
function outgoHistoryRemove(userC) {
  var ref = firebase.database().ref('NameUsers/' + userC + "/outgo/" + group + "/" + event);
  ref.remove();
}