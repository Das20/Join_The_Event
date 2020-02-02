var userCode = decodeURIComponent(window.location.search);
userCode = userCode.substring(1);
console.log("profilo: " + userCode)
var today = new Date();
todayS = formatDate(today);
const btnEdit = document.getElementById('change');


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

              if (isAdmin(role) || userCode == user.uid) {
                //display info of the user
                var namedb = firebase.database().ref('NameUsers/' + userCode);
                namedb.once('value').then(function (snapshot) {
                  document.getElementById('nameU').value = snapshot.child("info/name").val();
                  document.getElementById('emailU').value = snapshot.child("info/email").val();
                  document.getElementById('telU').value = snapshot.child("info/tel").val();
                  document.getElementById('addressU').value = snapshot.child("info/address").val();
                  document.getElementById('birthU').value = snapshot.child("info/birthday").val();
                  document.getElementById('balanceU').textContent = snapshot.child("balance").val();
                });
                btnEdit.addEventListener('click', e => {
                  change();
                });
                //display all outgo reports
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
    //server side function
    var balanceChange = firebase.app().functions('europe-west1').httpsCallable('balanceChange');
    await balanceChange({ amount: amount, userSel: userC }).then(function (result) {
      // Read result of the Cloud Function.                                       
    }).catch(function (error) {
      // Getting the Error details.                                       
    });
    ref.set(depositData);
    window.location.reload();
  } else { alert("non è stato inserito un deposito valido"); }
}

//update a deposit report
function updateDeposit(depositC) {
  var amount = parseFloat(document.getElementById(depositC + "Amount").value);
  var description = document.getElementById(depositC + "Desc").value;
  if (amount != "" && amount != null) {
    var bal = firebase.database().ref('NameUsers/' + userCode + "/deposit/" + depositC);
    bal.once("value")
      .then(async function (snapshot) {
        var oldAmount = snapshot.child('amount').val();
        var ref = firebase.database().ref('NameUsers/' + userCode + "/deposit/" + depositC);
        var depositData = {
          amount: amount.toFixed(2),
          description: description,
          date: todayS
        };
        var amountDiff = amount - parseFloat(oldAmount);
        //server side function
        var balanceChange = firebase.app().functions('europe-west1').httpsCallable('balanceChange');
        await balanceChange({ amount: amountDiff, userSel: userCode }).then(function (result) {
        }).catch(function (error) {
        });

        ref.update(depositData);
        window.location.reload();
      });
  } else { alert("non è stato inserito un deposito valido"); }
}

//delete a deposit report and remove amount
async function deleteDeposit(depositC) {
  var x = confirm("Sei sicuro di voler cancellare il report?");
  if (x) {
    var bal = firebase.database().ref('NameUsers/' + userCode + "/deposit/" + depositC);
    bal.once("value")
      .then(async function (snapshot) {
        var amount = snapshot.child('amount').val();
        refD = firebase.database().ref('NameUsers/' + userCode + "/deposit/" + depositC);
        //server side function
        var balanceChange = firebase.app().functions('europe-west1').httpsCallable('balanceChange');
        await balanceChange({ amount: (-amount), userSel: userCode }).then(function (result) {
        }).catch(function (error) {
        });
        refD.remove();
        window.location.reload();
      });
  }
}

//function that change info of the user
function change() {
  var nameU = document.getElementById('nameU').value;
  var emailU = document.getElementById('emailU').value;
  var telU = document.getElementById('telU').value;
  var addressU = document.getElementById('addressU').value;
  var birthU = document.getElementById('birthU').value;
  var refU = firebase.database().ref('NameUsers/' + userCode);
  refU.child("info/name").set(nameU);
  refU.child("info/email").set(emailU);
  refU.child("info/tel").set(telU);
  refU.child("info/address").set(addressU);
  refU.child("info/birthday").set(birthU);
  alert("dati modificati correttamente!");
}

