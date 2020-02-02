const btnCreate = document.getElementById('btnCreate');

//display all members names
firebase.auth().onAuthStateChanged(firebaseUser => {
    if(firebaseUser){
        var user = firebase.auth().currentUser;
        var role = firebase.database().ref('NameUsers/'+ user.uid + '/role');
        role.once("value")
        .then(function(snapshot) {
          role = snapshot.val();
        if(isAdmin(role)){ //admin will see all members
            var query = firebase.database().ref('NameUsers').orderByChild('info/name');
            query.once("value")
                .then(function(snapshot) {
                snapshot.forEach(function(childSnapshot) {
                    var userCode = childSnapshot.key;
                    var ref = firebase.database().ref('NameUsers/'+ userCode);
                    ref.once('value').then(function(snapshot) {
                        var nameUser = snapshot.child("info/name").val();
                        var codeEvent = '<li class="collection-item blue-grey lighten-3"><label><input id="'+userCode+'" type="checkbox" class="filled-in" /><span class="black-text">'+nameUser+'</span></label></li>';
                        console.log("display: "+ userCode + " name: "+ nameUser);
                        document.getElementById('addMembers').insertAdjacentHTML('beforeend', codeEvent);
                        });                 
                    });
                });
            }
        });  
    }
});  

btnCreate.addEventListener('click', e => {
    var user = firebase.auth().currentUser;
    if (user) {
    // User is signed in.
        var role = firebase.database().ref('NameUsers/'+ user.uid + '/role');
        role.once("value")
        .then(function(snapshot) {
            role = snapshot.val();
            console.log(role);
            var title = document.getElementById('title').value;
            var description = document.getElementById('description').value;
            if(isAdmin(role) ){
                //check if the group already exists
                var ref = firebase.database().ref("Groups");
                ref.once("value")
                .then(async function(snapshot) { //async fo redirect the page at the end of creating all group's data
                var hasName = snapshot.hasChild(title); // true
                if(!hasName){
                    //create the group
                    console.log(title);
                    var groupData = {
                        title: title,
                        description: description,
                    };
                    //creating child and updates the data
                    var newGroupKey = firebase.database().ref('Groups').child(title).key;
                    var updates = {};
                    updates['/Groups/' + newGroupKey] = groupData;
                    firebase.database().ref().update(updates);
                    //add members to the group    
                    var query = firebase.database().ref('NameUsers').orderByKey();
                    await query.once("value")
                        .then(function(snapshot) {
                        snapshot.forEach(function(childSnapshot) {
                            var userCode = childSnapshot.key;
                            if(document.getElementById(userCode)){ //verify if the element id exist
                                var namecheck= document.getElementById(userCode).checked;
                                if(namecheck){//true if checked
                                    var member = firebase.database().ref('Groups/'+title+'/Members');
                                    member.child(userCode).set(true);
                                    console.log(userCode + " si è aggiunto al gruppo: "+ title);
                                    //ref to the group in the user data
                                    var member = firebase.database().ref('NameUsers/'+userCode+'/Groups');
                                    member.child(title).set(true);
                                }
                            }  
                            });
                        });
                    alert("gruppo creato con successo!");
                    window.location.replace("https://prova-179a9.web.app/nextpage.html");
                }
                else{alert('Esiste già un gruppo con lo stesso nome. \n Si prega di cambiarlo.');}
             });
            
            }
        });
    } else {
    // No user is signed in.
    }
    });
