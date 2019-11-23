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
const promise = auth.signInWithEmailAndPassword(email,pass);

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
const promise = auth.createUserWithEmailAndPassword(email,pass);
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

    firebase.auth().signInWithPopup(provider).then(function(result) {
        // This gives you a Google Access Token. You can use it to access the Google API.
        var token = result.credential.accessToken;
        // The signed-in user info.
        var user = result.user;
        // ...
      }).catch(function(error) {
        // Handle Errors here.
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
      if(firebaseUser){
          console.log(firebaseUser);
          window.location.href = "nextpage.html";
          
        } else{
          console.log('not logged in');
          
      }
  });

  

