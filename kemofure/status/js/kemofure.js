const json_path = 'https://nanase.onl/kemofure/stat/';
const diff_path = 'https://nanase.onl/kemofure/diff/';

function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function diffText(value) {
  return value >= 0 ? '+ ' + value : '- ' + (-value);
}

function load_json() {
  $.getJSON(json_path, function (json) {
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
  }).fail(function () {
    setTimeout(load_json, 5000);
  });
}

function load_diff() {
  $.get(diff_path, {},
    function (json) {
      $('.diff-view').text(diffText(json.play_count[json.time.length - 1]));
      $('.diff-comment').text(diffText(json.comment_count[json.time.length - 1]));
      $('.diff-mylist').text(diffText(json.mylist_count[json.time.length - 1]));
      setTimeout(load_diff, 60000);
    }, 'json').fail(function () {
      setTimeout(load_diff, 60000);
    });
}

// -------------------------

let chart;
let old_json = { time: 0, play_count: 0, comment_count: 0, mylist_count: 0 };
let graphDuration, graphKind;
let graphUpdateTimeout = null;

if (!(graphKind = localStorage.getItem('kfm_graphKind')))
  graphKind = 'd';

if (!(graphDuration = localStorage.getItem('kfm_graphDuration')))
  graphDuration = '1';

function convertIntervalNumber(interval) {
  switch (interval) {
    case 60: return 'per 1 minute';
    case 300: return 'per 5 minutes';
    case 600: return 'per 10 minutes';
    case 1800: return 'per 30 minutes';
    case 86400: return 'per 1 day';
    default: 'per ' + interval + ' seconds';
  }
}

function startGraphUpdate() {
  stopGraphUpdate();
  graphUpdateTimeout = setTimeout(load_graph, 60000);
}

function stopGraphUpdate() {
  if (graphUpdateTimeout)
    clearInterval(graphUpdateTimeout);
}

function initialize_graph() {
  Highcharts.setOptions({
    global: {
      timezoneOffset: 9 * 3600,
      useUTC: false
    },
    lang: {
      thousandsSep: ','
    }
  });

  chart = Highcharts.chart({
    chart: {
      renderTo: 'graph',
      type: 'line',
      zoomType: 'x',
      resetZoomButton: {
        position: {
          align: 'left',
          x: 0,
          y: -1
        },
        theme: {
          height: 12
        }
      },
      spacing: [5, 5, 5, 5],
      events: {
        selection: function (event) {
          if (event.resetSelection)
            startGraphUpdate();
          else
            stopGraphUpdate();
        }
      }
    },
    title: {
      text: null
    },
    xAxis: {
      type: 'datetime',
      gridLineWidth: 1,
      dateTimeLabelFormats: {
        second: '%H:%M:%S',
        minute: '%H:%M',
        hour: '%d %H:%M',
        day: '%m-%d',
        week: '%m-%d',
        month: '%Y-%m',
        year: '%Y'
      },
    },
    yAxis: {
      allowDecimals: true,
      min: 0,
      title: {
        text: null
      }
    },
    tooltip: {
      crosshairs: true,
      shared: true,
      useHTML: true,
      headerFormat: '<small>{point.key}</small><table>',
      pointFormat: '<tr><td style="color: {series.color}">{series.name}: </td>' +
      '<td style="text-align: right;min-width: 40px"><b>{point.y}</b></td></tr>',
      footerFormat: '</table>',
      xDateFormat: '%Y-%m-%d %H:%M'
    },
    legend: {
      enabled: true,
      align: 'right',
      verticalAlign: 'top',
      padding: 0,
      margin: 0,
    },
    credits: {
      enabled: true,
      href: null,
      text: '',
      style: { cursor: 'default', color: '#aaa', fontSize: '10px' },
      position: {
        verticalAlign: 'top',
        align: 'left',
        x: 60,
        y: 12
      }
    },
    series: [{
      name: 'View',

      color: '#26aa44',
      lineWidth: 1,
    },
    {
      name: 'Comment',
      color: '#2f7edb',
      lineWidth: 1,
    },
    {
      name: 'Mylist',
      color: '#ec7835',
      lineWidth: 1,
    }
    ]
  });
}

function load_graph(kind = null, duration = null) {
  if (kind != null)
    localStorage.setItem('kfm_graphKind', (graphKind = kind));

  if (duration != null)
    localStorage.setItem('kfm_graphDuration', (graphDuration = duration));

  $('.obox.obox-mini').removeClass('obox-selected');
  $('.obox-graph-selector-' + graphKind + ', .obox-graph-selector-' + graphDuration).addClass('obox-selected');

  $.get(diff_path, {
    duration: graphDuration,
    kind: graphKind
  },
    function (json) {
      let convert = (data, series) => data.time.map((t, i) => [t * 1000, series[i]]);
      chart.series[0].setData(convert(json, json.play_count));
      chart.series[1].setData(convert(json, json.comment_count));
      chart.series[2].setData(convert(json, json.mylist_count));
      chart.credits.update({ text: convertIntervalNumber(json.interval) });
      chart.redraw();
    }, 'json');

  startGraphUpdate();
}

$(() => {
  load_json();
  load_diff();
  initialize_graph();
  load_graph();
});
