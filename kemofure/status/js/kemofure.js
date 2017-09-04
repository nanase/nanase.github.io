var json_path = 'https://nanase.onl/kemofure/stat/';
var diff_path = 'https://nanase.onl/kemofure/diff/';
var old_json = { time: 0, play_count: 0,comment_count: 0, mylist_count: 0 };
var graphDuration, graphKind;

if (!(graphKind = localStorage.getItem('kfm_graphKind')))
    graphKind = 's';

if (!(graphDuration = localStorage.getItem('kfm_graphDuration')))
    graphDuration = '1';

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
        if (data.play_count[i] != null)
            play_count.push({
                x: data.time[i],
                y: Math.round(data.play_count[i])
            });

        if (data.comment_count[i] != null)
            comment_count.push({
                x: data.time[i],
                y: Math.round(data.comment_count[i])
            });

        if (data.mylist_count[i] != null)
            mylist_count.push({
                x: data.time[i],
                y: Math.round(data.mylist_count[i])
            });
    }

    return [{
        values: play_count.reverse(),
        key: 'View',
        color: '#26aa44'
    },
    {
        values: comment_count.reverse(),
        key: 'Comment',
        color: '#2f7edb'
    },
    {
        values: mylist_count.reverse(),
        key: 'Mylist',
        color: '#ec7835'
    }];
}

function load_diff() {
    $.get(diff_path, { },
    function(json) {
        $('.diff-view').text(diffText(json.play_count[json.time.length - 1]));
        $('.diff-comment').text(diffText(json.comment_count[json.time.length - 1]));
        $('.diff-mylist').text(diffText(json.mylist_count[json.time.length - 1]));
        setTimeout(load_diff, 60000);
    }, 'json').fail(function() {
        setTimeout(load_diff, 60000);
    });
}

function load_graph(kind = null, duration = null) {
    if (kind != null)
        localStorage.setItem('kfm_graphKind', (graphKind = kind));

    if (duration != null)
        localStorage.setItem('kfm_graphDuration', (graphDuration = duration));

    $.get(diff_path, {
        duration: graphDuration,
        kind: graphKind
    },
    function(json) {

        if (graphDuration >= 30)
            time_format = '%m/%d';
        else if (graphDuration >= 7)
            time_format = '%d %H:%M';
        else
            time_format = '%H:%M';

        nv.addGraph(function() {
            var chart = nv.models.lineChart()
                .margin({left: 70, bottom: 20, top: 0})
                .useInteractiveGuideline(true);
            chart.xAxis.tickFormat(d => d3.time.format(time_format)(new Date(d * 1000)));
            chart.yAxis.tickFormat(d3.format(","));
            d3.select('.obox-graph .graph svg')
                .datum(expandData(json))
                .call(chart);
            nv.utils.windowResize(chart.update);
            return chart;
        });
    }, 'json');
}

$(() => {
    load_json();
    load_diff();
    load_graph();
    setInterval(load_graph, 60000);
});
