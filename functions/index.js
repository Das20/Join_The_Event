// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

//user function
exports.manageCost = functions.region('europe-west1').https.onCall((data, context) => {
  const group = data.group;
  const event = data.event;
  const participate = data.participate; //true = ADD | false = remove
  const userCode = context.auth.uid;
  var refRole = admin.database().ref('/NameUsers/' + userCode + '/role').once("value");
  return refRole.then(snapshot => {
    role = snapshot.val();
    var ref = admin.database().ref("Groups").once("value");
    return ref.then(snapshot => {
      var hasGroup = snapshot.hasChild(group);
      if (hasGroup) { //exist group
        var ref = admin.database().ref("Events/" + group).once("value");
        return ref.then(snapshot => {
          var hasEvent = snapshot.hasChild(event);
          if (hasEvent) { //exist event
            var ref = admin.database().ref('NameUsers/' + userCode + "/Groups").once("value");
            return ref.then(snapshot => {
              var isParticipant = snapshot.hasChild(group);
              if (isParticipant || isAdmin(role)) {
                if (participate) {//REMOVE MONEY, subscribe to the event
                  var queryEvent = admin.database().ref('Events/' + group + "/" + event + "/Members").once("value");
                  return queryEvent.then(snapshot => {
                    var isMember = snapshot.hasChild(userCode);
                    if (!isMember || isAdmin(role)) {
                      var queryEvent = admin.database().ref('Events/' + group + "/" + event).once("value");
                      return queryEvent.then(snapshot => {
                        var active = snapshot.child("active").val();
                        var cost = snapshot.child("cost").val();
                        var namedb = admin.database().ref('NameUsers/' + userCode).once('value');
                        if (active) {
                          return namedb.then(snapshot => {
                            var balance = snapshot.child("balance").val();
                            console.log("il mio saldo" + balance + "il costo:" + cost);
                            //balance-cost;        
                            var newBal = parseFloat(balance) - parseFloat(cost);
                            var nameBal = admin.database().ref('NameUsers/' + userCode);
                            nameBal.child("balance").set(newBal.toFixed(2));
                            //add a new member to the current event
                            var eventRef = admin.database().ref('Events/' + group + "/" + event + "/Members");
                            eventRef.child(userCode).set(true);
                            //create the reference to the event in the current user
                            var userEventRef = admin.database().ref('NameUsers/' + userCode + "/EventsJoined/" + group);
                            userEventRef.child(event).set(true);
                            return outgoHistoryAdd(userCode, group, event);
                          });
                        } else {
                          return null;
                        }
                      });
                    } else {
                      return null;
                    }
                  });
                }
                else if (!participate) { //ADD MONEY, cancel participation
                  var queryM = admin.database().ref('Events/' + group + "/" + event + "/Members").once("value");
                  return queryM.then(snapshot => {
                    var isMember = snapshot.hasChild(userCode);
                    if (isMember || isAdmin(role)) {
                      var queryEvent = admin.database().ref('Events/' + group + "/" + event).once("value");
                      return queryEvent.then(snapshot => {
                        var cost = snapshot.child("cost").val();
                        var active = snapshot.child("active").val();
                        var namedb = admin.database().ref('NameUsers/' + userCode).once('value');
                        if (active) {
                          return namedb.then(snapshot => {
                            //add money if you cancel the participation
                            var balance = snapshot.child("balance").val();
                            var newBal = parseFloat(balance) + parseFloat(cost);
                            var nameBal = admin.database().ref('NameUsers/' + userCode);
                            nameBal.child("balance").set(newBal.toFixed(2));
                            //remove a new member to the current event
                            var eventRef = admin.database().ref('Events/' + group + "/" + event + "/Members/" + userCode);
                            eventRef.remove();
                            //remove the reference to the event in the current user
                            var userEventRef = admin.database().ref('NameUsers/' + userCode + "/EventsJoined/" + group + "/" + event);
                            userEventRef.remove();
                            return outgoHistoryRemove(userCode, group, event);
                          });
                        } else {
                          return null;
                        }
                      });
                    } else {
                      return null;
                    }
                  });
                } else {
                  return null;
                }
              } else {
                return null;
              }
            });
          } else {
            return null;
          }
        });
      } else {
        return null;
      }
    });
  }).catch(error => {
    console.error(error);
  });
});

//add or remove money from an user balance (FOR ADMINS ONLY)
exports.balanceChange = functions.region('europe-west1').https.onCall((data, context) => { //only admin!!
  const amount = data.amount;
  const userCode = context.auth.uid; //admin
  const userSel = data.userSel; //user selected
  var refRole = admin.database().ref('/NameUsers/' + userCode + '/role').once("value");
  return refRole.then(snapshot => {
    role = snapshot.val();
    if (isAdmin(role)) {
      var namedb = admin.database().ref('NameUsers/' + userSel).once('value');
      return namedb.then(snapshot => {
        var balance = snapshot.child("balance").val();
        console.log(userSel + " saldo precedente: " + balance + "aggiungo il costo:" + amount);
        var newBal = parseFloat(balance) + parseFloat(amount);
        var namebal = admin.database().ref('NameUsers/' + userSel)
        namebal.child("balance").set(newBal.toFixed(2));
        return null;
      });
    } else {
      return null;
    }
  }).catch(error => {
    console.error(error);
  });
});

//initizialize for the first time user's data
exports.initUserData = functions.region('europe-west1').https.onCall((data, context) => {
  const user = context.auth.uid;
  const email = data.email;
  var ref = admin.database().ref("NameUsers").once("value");
  return ref.then(snapshot => {
    var existUser = snapshot.hasChild(user);
    if (!existUser) { //if not exist
      var infoData = {
        name: "",
        email: email,
        tel: "",
        address: "",
        birthday: ""
      };
      var refU = admin.database().ref('NameUsers/' + user);
      refU.child("balance").set(0);
      refU.child("role").set("user");
      var refUI = admin.database().ref('NameUsers/' + user + "/info");
      refUI.set(infoData);
      return null;
    }
    else {
      return null;
    }
  }).catch(error => {
    console.error(error);
  });
});

exports.deleteEvent = functions.region('europe-west1').https.onCall((data, context) => {
  const userCode = context.auth.uid;
  const group = data.group;
  const event1 = data.event1;
  const amount = data.amount;
  var refRole = admin.database().ref('/NameUsers/' + userCode + '/role').once("value");
  return refRole.then(snapshot => {
    role = snapshot.val();
    if (isAdmin(role)) {
      //delete the participation from each player that joined the event
      var query = admin.database().ref('Events/' + group + "/" + event1 + "/Members").orderByKey().once("value");
      return query.then(async snapshot => {
        await snapshot.forEach(childSnapshot => {
          var key = childSnapshot.key;
          console.log("elimino da utente:" + key);
          var refU = admin.database().ref('NameUsers/' + key + "/EventsJoined/" + group + "/" + event1);
          refU.remove(); //remove event joined by the user
          outgoHistoryRemove(key, group, event1); //remove outgo report because money given back
          //give back money to participant
          balanceChangeI(amount, key);
        })
        console.log("eliminazione evento!");
        var refG = admin.database().ref('Groups/' + group + "/Events/" + event1);
        refG.remove();
        refE = admin.database().ref('Events/' + group + "/" + event1);
        refE.remove()
        return null;
      }).catch(error => {
        console.error(error);
      });
    } else {
      return null;
    }
  }).catch(error => {
    console.error(error);
  });
});

exports.updateParticipantsI = functions.region('europe-west1').https.onCall((data, context) => {
  const userCode = context.auth.uid;
  const amount = data.amount;
  const group = data.group;
  const event1 = data.event1;
  const userSel = data.userSel;
  var refRole = admin.database().ref('/NameUsers/' + userCode + '/role').once("value");
  return refRole.then(snapshot => {
    role = snapshot.val();
    if (isAdmin(role)) {
      var ref = admin.database().ref('Events/' + group + "/" + event1 + "/Members").once("value");
      return ref.then(async snapshot => {
        var hasParticipant = snapshot.hasChild(userSel);
        if (hasParticipant) { //to see if a user participate to the event*/
          await balanceChangeI(amount, userSel);
          refE = admin.database().ref('Events/' + group + "/" + event1 + "/Members/" + userSel);
          refE.remove();
          refU = admin.database().ref('NameUsers/' + userSel + '/EventsJoined/' + group + "/" + event1);
          refU.remove();
          console.log(userSel + " si è eliminato dall'evento: " + event1);
          return outgoHistoryRemove(userSel, group, event1); //remove outgo report because money given back
        } else {
          return null;
        }
      });
    } else {
      return null;
    }
  }).catch(error => {
    console.error(error);
  });
});

exports.addParticipantsI = functions.region('europe-west1').https.onCall((data, context) => {
  const userCode = context.auth.uid;
  const group = data.group;
  const event1 = data.event1;
  const amount = data.amount;
  const userSel = data.userSel;
  var refRole = admin.database().ref('/NameUsers/' + userCode + '/role').once("value");
  return refRole.then(snapshot => {
    role = snapshot.val();
    if (isAdmin(role)) {
      var ref = admin.database().ref('Events/' + group + "/" + event1 + "/Members").once("value");
      return ref.then(async snapshot => {
        var hasParticipant = snapshot.hasChild(userSel);
        if (!hasParticipant) { //to see if a user already participate to the event*/         
          var eventRef = admin.database().ref('Events/' + group + "/" + event1 + "/Members");
          eventRef.child(userSel).set(true);
          //create the reference to the event in the current user
          var userEventRef = admin.database().ref('NameUsers/' + userSel + "/EventsJoined/" + group);
          userEventRef.child(event1).set(true);
          await balanceChangeI((-amount), userSel);
          return outgoHistoryAdd(userSel, group, event1);
        } else {
          return null;
        }
      });
    } else {
      return null;
    }
  }).catch(error => {
    console.error(error);
  });
});

//------------NORMAL FUNCTIONS----------------------

//balance change internal function
function balanceChangeI(amount, userSel) {
  var namedb = admin.database().ref('NameUsers/' + userSel).once('value');
  return namedb.then(snapshot => {
    var balance = snapshot.child("balance").val();
    console.log(userSel + " saldo precedente: " + balance + " aggiungo il costo:" + amount);
    var newBal = parseFloat(balance) + parseFloat(amount);
    var namebal = admin.database().ref('NameUsers/' + userSel)
    namebal.child("balance").set(newBal.toFixed(2));
    return null;
  });
}

//event cost history add
function outgoHistoryAdd(userC, group, event) {
  var queryEvent = admin.database().ref('Events/' + group + "/" + event).once("value");
  return queryEvent.then(snapshot => {
    var cost = parseFloat(snapshot.child("cost").val());
    var ref = admin.database().ref('NameUsers/' + userC + "/outgo/" + group + "/" + event);
    var today = new Date();
    todayS = formatDate(today);
    var outgoData = {
      amount: cost.toFixed(2),
      date: todayS
    };
    ref.set(outgoData);
    return true;
  }).catch(error => {
    console.error(error);
  });
}

//event cost history remove
function outgoHistoryRemove(userC, group, event) {
  var ref = admin.database().ref('NameUsers/' + userC + "/outgo/" + group + "/" + event);
  ref.remove();
  return true;
}

//format date to yyyy/mm/dd
function formatDate(date) {
  var year = date.getFullYear();
  var month = date.getMonth() + 1;
  var day = date.getDate();
  if (day < 10) {
    day = '0' + day;
  }
  if (month < 10) {
    month = '0' + month;
  }
  var formattedDate = year + '/' + month + '/' + day
  return formattedDate;
}

function isAdmin(role) {
  if (role === "admin") {
    return true;
  }
  else {
    return false;
  }
}
