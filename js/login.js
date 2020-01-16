//Get elements

const txtEmail = document.getElementById('txtEmail');
const txtPassword = document.getElementById('txtPassword');
const btnLogin = document.getElementById('btnLogin');
const btnSignUp = document.getElementById('btnSignUp');
//const btnLogout = document.getElementById('btnLogout');
const btnGoogle = document.getElementById('btnGoogle');

//add login event
btnLogin.addEventListener('click', e => {
  //get email and password
  const email = txtEmail.value;
  const pass = txtPassword.value;
  const auth = firebase.auth();
  //sign in
  const promise = auth.signInWithEmailAndPassword(email, pass);

  promise.catch(e => console.log(e.message));
  promise.catch(e => alert(e.message));
});

// Add signup event
btnSignUp.addEventListener('click', e => {
  //get email and password
  const email = txtEmail.value;
  const pass = txtPassword.value;
  const auth = firebase.auth();
  //sign in
  const promise = auth.createUserWithEmailAndPassword(email, pass);
  promise.then(alert("registrato con successo!"));
  promise.catch(e => console.log(e.message));
  promise.catch(e => alert(e.message));
});

/*logout
btnLogout.addEventListener('click', e => {
    firebase.auth().signOut();
    window.location.href = "index.html";
    });
*/
//login with google
btnGoogle.addEventListener('click', e => {

  const provider = new firebase.auth.GoogleAuthProvider();

  firebase.auth().signInWithPopup(provider).then(function (result) {
    // This gives you a Google Access Token. You can use it to access the Google API.
    var token = result.credential.accessToken;
    // The signed-in user info.
    var user = result.user;
    alert("accesso effettuato con successo!");

  }).catch(function (error) {
    // Handle Errors here.
    alert(error.message);
    var errorCode = error.code;
    var errorMessage = error.message;
    // The email of the user's account used.
    var email = error.email;
    // The firebase.auth.AuthCredential type that was used.
    var credential = error.credential;
    // ...
  });
});

firebase.auth().onAuthStateChanged(firebaseUser => {
  if (firebaseUser) {   
  startUser();


  } else {
    console.log('not logged in');

  }
});

async function startUser(){
  var user = firebase.auth().currentUser.uid;
  var ref = firebase.database().ref("NameUsers");
  await ref.once("value")
    .then(function (snapshot) { //async fo redirect the page at the end of creating all group's data
      var existUser = snapshot.hasChild(user); 
      if(!existUser){ //if not exist
        var refU = firebase.database().ref('NameUsers/' + user);
        refU.child("name").set("none");
        refU.child("balance").set(0);
        refU.child("role").set("user");
      }
      else{console.log("già registrato!");}
    });

    window.location.href = "nextpage.html";
}

