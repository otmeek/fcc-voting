$(document).ready(function() {
    var option = 1;
    $('.createForm').on("click", "#addOption", function() {
        option++;
        addNewOption(option);
    });
    
});

function addNewOption(option) {
    // max 10 options
    if(option <= 10) {
        // append new option
        var newOption =
            '<div class="form-group row">' +
                '<label class="col-sm-3 form-control-label" for="txtChoice' + option + '">Option</label>' +
                '<div class="col-sm-9">' +
                    '<input id="txtChoice' + option + '" name="choice' + option + '" class="form-control" type="text" placeholder="Your poll option" maxlength="130" />' +
                '</div>' +
            '</div>';
        $('.optAdd').prev().after(newOption);
    }
}