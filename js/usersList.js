firebase.auth().onAuthStateChanged(firebaseUser => {
  if (firebaseUser) {
    var user = firebase.auth().currentUser;
    var role = firebase.database().ref('NameUsers/' + user.uid + '/role');
    role.once("value")
      .then(function (snapshot) {
        role = snapshot.val();
        if (isAdmin(role)) { //admin will see all members
          var query = firebase.database().ref('NameUsers').orderByChild('info/name'); //PROVO ad ordinarli per child
          query.once("value")
            .then(function (snapshot) {
              snapshot.forEach(function (childSnapshot) {
                var userCode = childSnapshot.key;
                var ref = firebase.database().ref('NameUsers/' + userCode);
                ref.once('value').then(function (snapshot) {
                  var nameUser = snapshot.child("info/name").val();
                  var codeEvent = '<li class="collection-item yellow lighten-3"><div>'+nameUser+'<a href="infoUser.html?'+ userCode +'" class="secondary-content"><i class="material-icons">send</i></a></div></li>' ;
                  document.getElementById('users').insertAdjacentHTML('beforeend', codeEvent);
                });
              });
            });
        }
      });
  }
});