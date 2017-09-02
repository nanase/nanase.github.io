var json_path = 'http://157.7.132.203/kemofure/stat/';
var diff_path = 'http://157.7.132.203/kemofure/diff/';
var old_json = { time: 0, play_count: 0,comment_count: 0, mylist_count: 0 };

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function diffText(value) {
    return value >= 0 ? '+ ' + value : '- ' + (-value);
}

function load_json() {
    $.getJSON(json_path, function(json) {
        if (old_json.play_count != json.play_count) {
            $('.obox-view .display-big').text(numberWithCommas(json.play_count));
            $('.obox-view').removeClass('updated');
            setTimeout(() => $('.obox-view').addClass('updated'), 10);

            if (old_json.time > 0) {
                $('.obox-diff-view').text(diffText(json.play_count - old_json.play_count));
                $('.obox-diff-view').removeClass('updated');
                setTimeout(() => $('.obox-diff-view').addClass('updated'), 10);
            }
        }
        if (old_json.comment_count != json.comment_count) {
            $('.obox-comment .display-big').text(numberWithCommas(json.comment_count));
            $('.obox-comment').removeClass('updated');
            setTimeout(() => $('.obox-comment').addClass('updated'), 10);
            
            if (old_json.time > 0) {
                $('.obox-diff-comment').text(diffText(json.comment_count - old_json.comment_count));
                $('.obox-diff-comment').removeClass('updated');
                setTimeout(() => $('.obox-diff-comment').addClass('updated'), 10);
            }
        }
        if (old_json.mylist_count != json.mylist_count) {
            $('.obox-mylist .display-big').text(numberWithCommas(json.mylist_count));
            $('.obox-mylist').removeClass('updated');
            setTimeout(() => $('.obox-mylist').addClass('updated'), 10);

            if (old_json.time > 0) {
                $('.obox-diff-mylist').text(diffText(json.mylist_count - old_json.mylist_count));
                $('.obox-diff-mylist').removeClass('updated');
                setTimeout(() => $('.obox-diff-mylist').addClass('updated'), 10);
            }
        }

        old_json = json;
        setTimeout(load_json, 5000);
    }).fail(function() {
        setTimeout(load_json, 5000);
    });
}

function expandData(data) {
    var play_count = [],
        comment_count = [],
        mylist_count = [];

    for (var i = data.time.length; i >= 0 ; i--) {
        play_count.push({
            x: data.time[i],
            y: data.play_count[i]
        });
        comment_count.push({
            x: data.time[i],
            y: data.comment_count[i]
        });
        mylist_count.push({
            x: data.time[i],
            y: data.mylist_count[i]
        });
    }

    return [{
        values: play_count,
        key: 'View',
        color: '#26aa44'
    },
    {
        values: comment_count,
        key: 'Comment',
        color: '#2f7edb'
    },
    {
        values: mylist_count,
        key: 'Mylist',
        color: '#ec7835'
    }];
}

function load_diff() {
    $.getJSON(diff_path, function(json) {
        $('.diff-view').text(diffText(json.play_count[0]));
        $('.diff-comment').text(diffText(json.comment_count[0]));
        $('.diff-mylist').text(diffText(json.mylist_count[0]));

        nv.addGraph(function() {
            var chart = nv.models.lineChart()
                .margin({left: 30, bottom: 20, top: 0})
                .useInteractiveGuideline(true);
            chart.xAxis.tickFormat(d => d3.time.format('%H:%M')(new Date(d * 1000)));
            d3.select('.obox-graph .graph svg')
                .datum(expandData(json))
                .call(chart);
            nv.utils.windowResize(chart.update);
            return chart;
        });

        setTimeout(load_diff, 60000);
    }).fail(function() {
        setTimeout(load_diff, 60000);
    });
}

$(() => {
    load_json();
    load_diff();
});
