$(document).ready(function() {
   // Get context with jQuery - using jQuery's .get() method.
    var ctx = $("#resultsChart").get(0).getContext("2d");
    // This will get the first returned node in the jQuery collection.
    var resultsChart = new Chart(ctx); 
    
    var data = [];
    
    var colours = [
        '#F7464A',
        '#46BFBD',
        '#FFC870',
        '#4D5360',
        '#A36EB5',
        '#63AD77',
        '#949FB1',
        '#FF75B3',
        '#4DC99F',
        '#6EE6E0'
    ];
    
    $('.choice').each(function() {
        var obj = {};
        obj.value = $(this).find('.cVotes').text();
        obj.label = $(this).find('.cName').text();
        var index = parseInt($(this).find('.cIndex').text());
        obj.color = colours[index-1];
        data.push(obj);
    });
    
    var options = {
        scaleFontFamily: "''Open Sans', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
        responsive: true,
        maintainAspectRatio: true,
        animationSteps: 50,
        animationEasing: "easeOutQuart"
    }
    
    var myPieChart = new Chart(ctx).Pie(data, options);
});