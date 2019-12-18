const btnCreate = document.getElementById('btnCreate');

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
                .then(function(snapshot) {
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
                }
                else{alert('Esiste già un gruppo con lo stesso nome. \n Si prega di cambiarlo.');}
             });
            
            }
        });
    } else {
    // No user is signed in.
    }
    });

function exist(){
    var ref = firebase.database().ref("Groups");
    ref.once("value").then(function(snapshot) {
    var hasName = snapshot.hasChild("title"); // true
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
    }
  });
}