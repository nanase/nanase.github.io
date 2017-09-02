var json_path = 'http://157.7.132.203/kemofure/stat/';
var old_json = { time: 0, play_count: 0,comment_count: 0, mylist_count: 0 };

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function load_json() {
    $.getJSON(json_path, function(json) {
        if (old_json.play_count != json.play_count) {
            $('.obox-view .display-big').text(numberWithCommas(json.play_count));
            $('.obox-view').removeClass('updated');
            setTimeout(() => $('.obox-view').addClass('updated'), 10);
        }
        if (old_json.comment_count != json.comment_count) {
            $('.obox-comment .display-big').text(numberWithCommas(json.comment_count));
            $('.obox-comment').removeClass('updated');
            setTimeout(() => $('.obox-comment').addClass('updated'), 10);
            
        }
        if (old_json.mylist_count != json.mylist_count) {
            $('.obox-mylist .display-big').text(numberWithCommas(json.mylist_count));
            $('.obox-mylist').removeClass('updated');
            setTimeout(() => $('.obox-mylist').addClass('updated'), 10);
        }

        old_json = json;
        setTimeout(load_json, 5000);
    }).fail(function() {
        setTimeout(load_json, 5000);
    });
}

$(load_json);
