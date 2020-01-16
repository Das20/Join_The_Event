//getting the values from URL (group and event selected from the home)
var queryString = decodeURIComponent(window.location.search);
queryString = queryString.substring(1);
var queries = queryString.split("&");
var group = queries[0];
var event = queries[1];
document.getElementById('groupName').textContent = group.toString() + " >";
document.getElementById('eventName').textContent = event.toString();

var btnP = document.getElementById("btnParticipate");
var btnE = document.getElementById("btnEliminate");
var btnC = document.getElementById("btnCancel");

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
                            var dateR = snapshot.child("dateR").val();

                            document.getElementById('title').textContent = title.toString();
                            document.getElementById('description').textContent = description.toString();
                            document.getElementById('cost').textContent = cost.toString();
                            document.getElementById('dateE').textContent = dateE.toString();
                            document.getElementById('dateR').textContent = dateR.toString();
                            //display participate button or cancel paticipation
                            var ref = firebase.database().ref("Events/" + group + "/" + event + "/Members");
                            ref.once("value").then(function (snapshot) {
                              var joined = snapshot.hasChild(user.uid);
                              if (joined) { //cancel
                                btnC.style.display = "initial";
                                btnC.addEventListener('click', e => {
                                  var namedb = firebase.database().ref('NameUsers/' + user.uid);
                                  namedb.once('value').then(function (snapshot) {
                                    btnC.style.display = "none";
                                    btnP.style.display = "initial";
                                    //add money if you cancel the participation
                                    var balance = snapshot.child("balance").val();
                                    var newBal = parseFloat(balance) + parseFloat(cost);
                                    namedb.child("balance").set(newBal.toFixed(2));
                                    //remove a new member to the current event
                                    var eventRef = firebase.database().ref('Events/' + group + "/" + event + "/Members/" + user.uid);
                                    eventRef.remove();
                                    //remove the reference to the event in the current user
                                    var userEventRef = firebase.database().ref('NameUsers/' + user.uid + "/EventsJoined/" + group + "/" + event);
                                    userEventRef.remove();
                                    window.location.reload();
                                    //RIAGGIUNGI SOLDI
                                  });
                                });
                              }
                              else { //join
                                btnP.style.display = "initial";
                                btnP.addEventListener('click', e => {
                                  var namedb = firebase.database().ref('NameUsers/' + user.uid);
                                  namedb.once('value').then(function (snapshot) {
                                    var balance = snapshot.child("balance").val();
                                    console.log("il mio saldo" + balance + "il costo:" + cost);
                                    if (parseFloat(balance) >= parseFloat(cost)) {
                                      btnP.style.display = "none";
                                      btnC.style.display = "initial";
                                      //balance-cost;        
                                      var newBal = parseFloat(balance) - parseFloat(cost);
                                      namedb.child("balance").set(newBal.toFixed(2));
                                      //add a new member to the current event
                                      var eventRef = firebase.database().ref('Events/' + group + "/" + event + "/Members");
                                      eventRef.child(user.uid).set(true);
                                      //create the reference to the event in the current user
                                      var userEventRef = firebase.database().ref('NameUsers/' + user.uid + "/EventsJoined/" + group);
                                      userEventRef.child(event).set(true);
                                      window.location.reload();
                                    } else { alert("non hai abbastanza soldi per partecipare all'evento" + group); }
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
        //DA AGGIUNGERE restituzione costo a chi ha partecipato                
        var key = childSnapshot.key;
        console.log("elimino da utente:" + key);
        var refU = firebase.database().ref('NameUsers/' + key + "/EventsJoined/" + group + "/" + event);
        refU.remove(); //remove event joined by the user
        //give back money to participant
        var namedb = firebase.database().ref('NameUsers/' + key);
        namedb.once('value').then(function (snapshot) {
          var balance = snapshot.child("balance").val();
          console.log(key + " saldo prec: " + balance + "aggiungo il costo:" + cost);
          var newBal = parseFloat(balance) + parseFloat(cost);
          namedb.child("balance").set(newBal.toFixed(2));
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
