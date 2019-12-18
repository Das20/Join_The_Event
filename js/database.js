var database = firebase.database();

//retrieve users Data on auth

firebase.auth().onAuthStateChanged(firebaseUser => {
  if(firebaseUser){
    var user = firebase.auth().currentUser.uid;
  console.log(user);
  var namedb = firebase.database().ref('NameUsers/'+ user);
  namedb.once('value').then(function(snapshot) {
      var name = snapshot.child("name").val();
      document.getElementById('nameU').textContent = name.toString();
    });  

//get groups and show it to the sidenav
var role = firebase.database().ref('NameUsers/'+ user + '/role');
role.once("value")
.then(function(snapshot) {
  role = snapshot.val();
if(isAdmin(role)){ //admin will see all groups
  var query = firebase.database().ref('Groups').orderByKey();
query.once("value")
  .then(function(snapshot) {
    snapshot.forEach(function(childSnapshot) {
      //title group
      var title = childSnapshot.child('title').val();
        // key name of the group      
        var key = childSnapshot.key;
        var code = '<li><a class="waves-effect" onclick="displayGroup('+ "'"+ key +"'" +')" >'+ key +'</a></li>';
        document.getElementById('groups').insertAdjacentHTML('beforeend', code);
        console.log(key);
      
  });
});
      }
      else{ //normal user will see only the groups where he participates
        var query = firebase.database().ref('NameUsers/'+ user + '/Groups').orderByKey();
query.once("value")
  .then(function(snapshot) {
    snapshot.forEach(function(childSnapshot) {
      //value of the child
      var childData = childSnapshot.val();
      if(childData==true){
        // key name of the child that are enabled       
        var key = childSnapshot.key;
        var code = '<li><a class="waves-effect" onclick="displayGroup('+ "'"+ key +"'" +')" >'+ key +'</a></li>';
        document.getElementById('groups').insertAdjacentHTML('beforeend', code);
        console.log(key);
      }
  });
});
      }
    });
 

//display the button with which create a group only if role="admin"
var role = firebase.database().ref('NameUsers/'+ user + '/role');
role.once("value")
.then(function(snapshot) {
  role = snapshot.val();
  console.log(role);
if(isAdmin(role)){
  var code = '<li><a href="createGroup.html"><i class="material-icons">add_circle</i> Create group</a></li>';
  document.getElementById('groups').insertAdjacentHTML('afterend', code);
      }
    });
  } 
});


//group function called from buttons in the sidenav, to change the group data in the page
function displayGroup(group){
  console.log("cliccato sul gruppo: " + group);
  //setting data from group selected
  var groupDb = firebase.database().ref('Groups/'+ group);
  groupDb.once('value').then(function(snapshot) {
    var title = snapshot.child("title").val();
  document.getElementById('groupName').textContent = title.toString();
  }); 
}

