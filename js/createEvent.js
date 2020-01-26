//initialization date picker
const dateEventPicker = document.getElementById('dateEvent');
const dateR = document.getElementById('dateRegistration');
const timeE = document.getElementById('timeEvent');
const btnCreate = document.getElementById('btnCreate');
//getting the values from URL
var queryString_group = decodeURIComponent(window.location.search);
queryString_group = queryString_group.substring(1);
document.getElementById('groupName').textContent = queryString_group.toString();

//date and time pickers

dateEventPicker.addEventListener('click', e => {
  var elems = document.querySelector('.datepicker');
  var instances = M.Datepicker.init(elems, {
    format: 'dd/mm/yyyy',
    showClearBtn: true
  });
  instances.open();
});

dateR.addEventListener('click', e => {
  var elems = document.querySelector('.datepicker2');
  var instances = M.Datepicker.init(elems, {
    format: 'dd/mm/yyyy',
    showClearBtn: true
  });
  instances.open();
});

timeE.addEventListener('click', e => {
  var elems = document.querySelector('.timePicker');
  var instances = M.Timepicker.init(elems, {
    showClearBtn: true,
    twelveHour: false
  });
  instances.open();
});

//create event

btnCreate.addEventListener('click', e => {
  var user = firebase.auth().currentUser;
  if (user) {
    // User is signed in.
    var role = firebase.database().ref('NameUsers/' + user.uid + '/role');
    role.once("value")
      .then(function (snapshot) {
        role = snapshot.val();
        var title = document.getElementById('title').value;
        var description = document.getElementById('description').value;
        var cost = document.getElementById('cost').value;
        var dateE = document.getElementById('dateEvent').value;
        var timeE = document.getElementById('timeEvent').value;
        var dateR = document.getElementById('dateRegistration').value;
        if (isAdmin(role)) {
          //check if the event already exists
          var ref = firebase.database().ref("Events/" + queryString_group);
          ref.once("value")
            .then(function (snapshot) {
              var hasName = snapshot.hasChild(title); // true
              if (!hasName) {
                //check if the selected group (passed through the URL) exist
                var ref = firebase.database().ref("Groups");
                ref.once("value")
                  .then(function (snapshot) {
                    var hasGroup = snapshot.hasChild(queryString_group);
                    if (hasGroup) {
                      if (cost != "" && cost != null) {
                        if (dateE != "" && dateE != null && dateR != "" && dateR != null) {
                          //create the event
                          var eventData = {
                            title: title,
                            description: description,
                            cost: cost,
                            dateE: dateE,
                            timeE: timeE,
                            dateR: dateR,
                            active: true
                          };
                          //creating child and updates the data
                          var newEventKey = firebase.database().ref('Events').child(title).key;
                          var updates = {};
                          updates['/Events/' + queryString_group + "/" + newEventKey] = eventData;
                          firebase.database().ref().update(updates);

                          //create the reference to the event in the group
                          var groupEventRef = firebase.database().ref('Groups/' + queryString_group + '/Events');
                          groupEventRef.child(title).set(true);
                          alert("evento creato con successo!");
                          window.location.replace("https://prova-179a9.web.app/nextpage.html");
                        } else { alert("non sono state inserite le date correttamente"); }
                      } else { alert("non è stato inserito un 'costo' valido per l'evento"); }
                    }
                    else { alert("non è stato selezionato un gruppo valido per la creazione dell'evento"); }
                  });

              }
              else { alert('Esiste già un evento con lo stesso nome. \n Si prega di cambiarlo.'); }
            });

        }
      });
  } else {
    // No user is signed in.
  }
});

