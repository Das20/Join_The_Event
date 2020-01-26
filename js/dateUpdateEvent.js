
//da cancellare, gli eventi vengono chiusi manualmente
var parts = dateR.split('/');
var mydateR = new Date(parts[2], parts[1] - 1, parts[0]);
var today = new Date();
console.log("Data chiusura evento:" + mydateR.toDateString());
//console.log("Data di oggi:"+today.toDateString());
if (today > mydateR) {
  console.log("possibilità di iscriversi terminata per l'evento:" + title);
}