$(document).ready(function() {
   // Get context with jQuery - using jQuery's .get() method.
    var ctx = $("#resultsChart").get(0).getContext("2d");
    // This will get the first returned node in the jQuery collection.
    var resultsChart = new Chart(ctx); 
    
    var data = [
        {
            value: 300,
            color:"#F7464A",
            highlight: "#FF5A5E",
            label: "Red"
        },
        {
            value: 50,
            color: "#46BFBD",
            highlight: "#5AD3D1",
            label: "Green"
        },
        {
            value: 100,
            color: "#FDB45C",
            highlight: "#FFC870",
            label: "Yellow"
        }
    ]
    
    // to do
    // write $.get that gets data json
    
    var myPieChart = new Chart(ctx).Pie(data);
});