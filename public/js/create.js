$(document).ready(function() {
    var option = 1;
    $('.createForm').on("click", "#addOption", function() {
        option++;
        addNewOption(option);
    });
    
});

function addNewOption(option) {
    // remove 'add new option'
    // remove button
    $('.optAdd').remove();
    $('#submit').remove();
    $('.btnLabel').remove();
    // append new option
    var newOption =
        '<div class="form-group row">' +
            '<label class="col-sm-3 form-control-label" for="txtChoice' + option + '">Option</label>' +
            '<div class="col-sm-9">' +
                '<input id="txtChoice' + option + '" class="form-control" type="text" placeholder="Your poll option" />' +
            '</div>' +
        '</div>';
    // add 'add new option' button again
    var addOption =
        '<div class="form-group row optAdd">' +
            '<div class="col-sm-6 col-sm-offset-6">' +
                '<p><a id="addOption" href="#">+ Add another option</a></p>' +
            '</div>' +
        '</div>';
    // add button again
    var submitButton =
        '<label for="submit" class="btn btn-primary btnLabel"><i class="fa fa-check-square-o"></i> Submit</label>' +
        '<input id="submit" type="submit" class="hidden" \>'

    $('.createForm').append(newOption + addOption + submitButton);
}