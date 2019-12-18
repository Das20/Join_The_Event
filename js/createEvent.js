//initialization date picker
const dateEventPicker = document.getElementById('dateEvent');
const dateR = document.getElementById('dateRegistration');

dateEventPicker.addEventListener('click', e => {
    var elems = document.querySelector('.datepicker');
    var instances = M.Datepicker.init(elems, {
        format:'dd/mm/yy',
        showClearBtn:true
});
    instances.open();
  });

dateR.addEventListener('click', e => {
    var elems = document.querySelector('.datepicker2');
    var instances = M.Datepicker.init(elems, {
        format:'dd/mm/yy',
        showClearBtn:true
});
    instances.open();
  });