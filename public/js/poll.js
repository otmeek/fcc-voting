$(document).ready(function() {
    
    $('#addCustom').on('click', function() {
        addCustomOption();
    });
    
    $('.form-group').on('click', '#customCancel', function() {
        removeCustomOption();
    });
    
    $('.form-group').on('click', '#customConfirm', function() {
        confirmCustomOption();
    });
});

function addCustomOption() {
    $('#addCustom').hide();
    var customOption =
        '<div id="customOption" class="col-xs-12">' +
            '<input name="newOption" id="inputNewChoice" class="form-control" type="text" placeholder="Your custom option" />' +
            '<span class="pull-right">' +
                '<span id="customConfirm"><a href="#">Add</a></span> ' +
                '<span id="customCancel"><a href="#">Cancel</a></span>' +
            '</span>' +
        '</div>';
    $('#custom').after(customOption);
    $('.btnLabel').addClass('disabled');
    $('#submit').attr('disabled', true);
}

function removeCustomOption() {
    $('#customOption').remove();
    $('#addCustom').show();
}

function confirmCustomOption() {
    var choices = $('#choiceList').text().split(',');
    var choiceIndex = choices.length;
    // disable other options
    // add radio button for new option
    var newOption = $('#inputNewChoice').val();
    if(newOption != '') {
    $('input:radio:lt(' + choiceIndex + ')').attr('disabled', true);
        var newOptionHtml = 
            '<div class="radio">' +
                '<label>' +
                    '<input type="radio" name="choice" value="choice' + choiceIndex + '" checked="checked" />' +
                    newOption +
                '</label>' +
            '</div>';
        $('#customOption').hide();
        $('.radioOpts').append(newOptionHtml);
        $('.btnLabel').removeClass('disabled');
        $('#submit').attr('disabled', false);
    }
}