const btnLogout = document.getElementById('Logout');

//logout
btnLogout.addEventListener('click', e => {
    firebase.auth().signOut();
    window.location.href = "index.html";
    });

// Add a realtime listener
firebase.auth().onAuthStateChanged(firebaseUser => {
    if(firebaseUser){
        console.log(firebaseUser);
    } else{
        alert('not logged id');
        console.log('not logged in');
        window.location.href = "index.html";        
    }
});