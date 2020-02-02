//getting the values from URL
var group = decodeURIComponent(window.location.search);
group = group.substring(1);
document.getElementById('groupName').textContent = group.toString();

const btnEdit = document.getElementById('btnEdit');

//display all members names
firebase.auth().onAuthStateChanged(firebaseUser => {
  if (firebaseUser) {
    var user = firebase.auth().currentUser;
    var role = firebase.database().ref('NameUsers/' + user.uid + '/role');
    role.once("value")
      .then(function (snapshot) {
        role = snapshot.val();
        if (isAdmin(role)) { //admin will see all members
          var query = firebase.database().ref('NameUsers').orderByChild('info/name');
          query.once("value")
            .then(function (snapshot) {
              snapshot.forEach(function (childSnapshot) {
                var userCode = childSnapshot.key;
                var ref = firebase.database().ref("Groups/" + group + "/Members");
                ref.once("value")
                  .then(function (snapshot) {
                    var hasUserCheck = snapshot.hasChild(userCode);
                    if (hasUserCheck) {
                      //the user is already a member and is checked
                      var ref = firebase.database().ref('NameUsers/' + userCode);
                      ref.once('value').then(function (snapshot) {
                        var nameUser = snapshot.child("info/name").val();
                        var codeEvent = '<li class="collection-item blue-grey lighten-3"><label><input id="' + userCode + '" type="checkbox" checked="checked" class="filled-in" /><span class="black-text">' + nameUser + '</span></label></li>';
                        console.log("display: " + userCode + " name: " + nameUser + " --- già membro!");
                        document.getElementById('addMembers').insertAdjacentHTML('afterbegin', codeEvent);
                      });
                    }
                    else {
                      //user isn't a member of the group (unchecked)
                      var ref = firebase.database().ref('NameUsers/' + userCode);
                      ref.once('value').then(function (snapshot) {
                        var nameUser = snapshot.child("info/name").val();
                        var codeEvent = '<li class="collection-item blue-grey lighten-3"><label><input id="' + userCode + '" type="checkbox" class="filled-in" /><span class="black-text">' + nameUser + '</span></label></li>';
                        console.log("display: " + userCode + " name: " + nameUser);
                        document.getElementById('addMembers').insertAdjacentHTML('afterbegin', codeEvent);
                      });
                    }
                  });
              });
            });
        }
      });
  }
});


btnEdit.addEventListener('click', e => {
  var user = firebase.auth().currentUser;
  if (user) {
    // User is signed in.
    var role = firebase.database().ref('NameUsers/' + user.uid + '/role');
    role.once("value")
      .then(function (snapshot) {
        role = snapshot.val();
        if (isAdmin(role)) {
          //check if the selected group (passed through the URL) exist
          var ref = firebase.database().ref("Groups");
          ref.once("value")
            .then(function (snapshot) {
              var hasGroup = snapshot.hasChild(group);
              if (hasGroup) {
                updateUsers();
              }
              else { alert("Non è stato selezionato un gruppo valido"); }
            });
        }
      });
  } else {
    // No user is signed in.
  }
});

async function updateUsers() {
  var query = firebase.database().ref('NameUsers').orderByKey();
  await query.once("value")
    .then(function (snapshot) {
      snapshot.forEach(function (childSnapshot) {
        var userCode = childSnapshot.key;
        if (document.getElementById(userCode)) { //verify if the element id exist
          var namecheck = document.getElementById(userCode).checked;
          if (namecheck) {//true if checked
            var member = firebase.database().ref('Groups/' + group + '/Members');
            member.child(userCode).set(true);
            console.log(userCode + " si è aggiunto al gruppo: " + group);
            //ref to the group in the user data
            var member = firebase.database().ref('NameUsers/' + userCode + '/Groups');
            member.child(group).set(true);
          } else {
            var ref = firebase.database().ref("Groups/" + group + "/Members");
            ref.once("value")
              .then(function (snapshot) {
                var hasUser = snapshot.hasChild(userCode);
                if (hasUser) {
                  refG = firebase.database().ref("Groups/" + group + "/Members/" + userCode);
                  refG.remove();
                  refU = firebase.database().ref('NameUsers/' + userCode + '/Groups/' + group);
                  refU.remove();
                  console.log(userCode + " si è eliminato dal gruppo: " + group);
                }
              });
          }
        }
      });
    });
  alert('modifica effettuata');
}