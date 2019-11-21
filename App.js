var firebaseConfig = {
    apiKey: "AIzaSyCKcDkiqUksIcHYcrwZAFzgC0UQ2Nw11RM",
    authDomain: "prova-179a9.firebaseapp.com",
    databaseURL: "https://prova-179a9.firebaseio.com",
    projectId: "prova-179a9",
    storageBucket: "prova-179a9.appspot.com",
    messagingSenderId: "289892666318",
    appId: "1:289892666318:web:bcb4a6d27e745f3d80f99f",
    measurementId: "G-KS01M7H46T"
  };
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
firebase.analytics();

        function save_user(){
         var user_name = document.getElementById('user_name').value;
        
         var uid = firebase.database().ref().child('users').push().key;
         
         var data = {
          user_id: uid,
          user_name: user_name
         }
         
         var updates = {};
         updates['/users/' + uid] = data;
         firebase.database().ref().update(updates);
         
         alert('The user is created successfully!');
         reload_page();
        }
        
        function update_user(){
         var user_name = document.getElementById('user_name').value;
         var user_id = document.getElementById('user_id').value;
      
         var data = {
          user_id: user_id,
          user_name: user_name
         }
         
         var updates = {};
         updates['/users/' + user_id] = data;
         firebase.database().ref().update(updates);
         
         alert('The user is updated successfully!');
         
         reload_page();
        }
        
        function delete_user(){
         var user_id = document.getElementById('user_id').value;
        
         firebase.database().ref().child('/users/' + user_id).remove();
         alert('The user is deleted successfully!');
         reload_page();
        }
        
        function reload_page(){
         window.location.reload();
        }