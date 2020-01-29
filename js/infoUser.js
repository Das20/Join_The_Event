var userCode = decodeURIComponent(window.location.search);
userCode = userCode.substring(1);
console.log("profilo: " + userCode)
var today = new Date();
todayS = formatDate(today);

//contribution tab

firebase.auth().onAuthStateChanged(firebaseUser => {
  if (firebaseUser) {
    var user = firebase.auth().currentUser;
    //check if the selected User (passed through the URL) exist
    var ref = firebase.database().ref("NameUsers");
    ref.once("value")
      .then(function (snapshot) {
        var hasUser = snapshot.hasChild(userCode);
        if (hasUser) {
          var role = firebase.database().ref('NameUsers/' + user.uid + '/role');
          role.once("value")
            .then(function (snapshot) {
              role = snapshot.val();
              if (isAdmin(role)) { //ADMIN can modify/add contribution reports
                var addContribution = '<tr>' +
                  '<td><input id="addAmount" type="number" step="0.01" class="validate"></td> <!--DA VALIDARE-->' +
                  '<td><textarea id="addDesc" class="materialize-textarea" type="text">inserisci descrizione</textarea></td>' +
                  '<td>' + todayS +
                  '<a class="btnContribution btn-floating waves-effect waves-light blue" onclick="createDeposit(userCode)"><i class="material-icons small">add</i></a>' +
                  '</td> ' +
                  '</tr>';
                document.getElementById('contrTable').insertAdjacentHTML('afterbegin', addContribution);
                var query = firebase.database().ref('NameUsers/' + userCode + "/deposit").orderByChild('date');
                //all deposit reports (admin)
                query.once("value")
                  .then(function (snapshot) {
                    snapshot.forEach(function (childSnapshot) {
                      var depositCode = childSnapshot.key;
                      var amount = childSnapshot.child("amount").val();
                      var desc = childSnapshot.child("description").val();
                      var date = childSnapshot.child("date").val();
                      var depositReport = '<tr>' +
                        '<td><input id="' + depositCode + 'Amount" value="' + amount + '" type="number" step="0.01" class="validate"></td>' +
                        '<td><textarea id="' + depositCode + 'Desc" class="materialize-textarea" type="text">' + desc + '</textarea></td>' +
                        '<td>' + date + '' +
                        '<a class="btnContribution btn-floating waves-effect waves-light blue" onclick="deleteDeposit(' + "'" + depositCode + "'" + ')"><i class="material-icons small">delete</i></a>' +
                        '<a class="btnContribution btn-floating waves-effect waves-light blue" onclick="updateDeposit(' + "'" + depositCode + "'" + ')"><i class="material-icons small">edit</i></a>' +
                        '</td>' +
                        '</tr>';
                      document.getElementById('contrTable').insertAdjacentHTML('beforeend', depositReport);
                    });
                  });
              }
              else {//USER
                //normal user that check his profile VERIFICA CHE IL CURRENT USER ID == URL.USERCODE
                userID = user.uid;
                if (userCode == userID) {
                  var query = firebase.database().ref('NameUsers/' + userCode + "/deposit").orderByChild('date');
                  //all deposit reports (user)
                  query.once("value")
                    .then(function (snapshot) {
                      snapshot.forEach(function (childSnapshot) {
                        var amount = childSnapshot.child("amount").val();
                        var desc = childSnapshot.child("description").val();
                        var date = childSnapshot.child("date").val();
                        var depositReport = '<tr>' +
                          '<td>' + amount + '</td>' +
                          '<td>' + desc + '</td>' +
                          '<td>' + date + '</td>' +
                          '</tr>';
                        document.getElementById('contrTable').insertAdjacentHTML('beforeend', depositReport);
                      });
                    });
                }
                else { alert("permesso negato"); }
              }
              //display all outgo reports
              if (isAdmin(role) || userCode == user.uid) {
                var query = firebase.database().ref('NameUsers/' + userCode + "/outgo").orderByChild('date');
                query.once("value")
                  .then(function (snapshot) {
                    snapshot.forEach(function (childSnapshot) {
                      var group = childSnapshot.key;
                      var query = firebase.database().ref('NameUsers/' + userCode + "/outgo/" + group).orderByChild('date');
                      query.once("value")
                        .then(function (snapshot) {
                          snapshot.forEach(function (childSnapshot) {
                            var event = childSnapshot.key;
                            var amount = childSnapshot.child("amount").val();
                            var date = childSnapshot.child("date").val();
                            var outgoReport = '<tr>' +
                              '<td>' + amount + '</td>' +
                              '<td>' + group + '</td>' +
                              '<td>' + event + '</td>' +
                              '<td>' + date + '</td>' +
                              '</tr>';
                            document.getElementById('costHistory').insertAdjacentHTML('afterbegin', outgoReport);
                          });
                        });
                    });
                  });
              }
            });
        }
      });
  }
});

//create a new deposit report
async function createDeposit(userC) {
  var amount = parseFloat(document.getElementById('addAmount').value);
  var description = document.getElementById('addDesc').value;
  if (amount != "" && amount != null) {
    var ref = firebase.database().ref('NameUsers/' + userC + "/deposit").push();
    var depositData = {
      amount: amount.toFixed(2),
      description: description,
      date: todayS
    };
    ref.set(depositData);
    window.location.reload();
    //INSERIRE LA FUNZIONE di aggiunta importo CHE DOVRà ESSERE SERVER SIDE
  } else { alert("non è stato inserito un deposito valido"); }
}

//update a deposit report
function updateDeposit(depositC) {
  var amount = parseFloat(document.getElementById(depositC + "Amount").value);
  var description = document.getElementById(depositC + "Desc").value;
  if (amount != "" && amount != null) {
    var ref = firebase.database().ref('NameUsers/' + userCode + "/deposit/" + depositC);
    var depositData = {
      amount: amount.toFixed(2),
      description: description,
      date: todayS
    };
    ref.update(depositData);
    window.location.reload();
    //INSERIRE LA FUNZIONE di Modifica importo CHE DOVRà ESSERE SERVER SIDE
  } else { alert("non è stato inserito un deposito valido"); }
}

//delete a deposit report and remove amount
function deleteDeposit(depositC) {
  var x = confirm("Sei sicuro di voler cancellare il report?");
  if (x) {
    refD = firebase.database().ref('NameUsers/' + userCode + "/deposit/" + depositC);
    refD.remove();
    window.location.reload();
  }
  //INSERIRE LA FUNZIONE di ELIMINAZIONE importo CHE DOVRà ESSERE SERVER SIDE
}

