let chart;
const graphDuration = new Storager('kfm_graphDuration', '1');
const graphKind = new Storager('kfm_graphKind', 'd');
let graphTimeout;

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
            graphTimeout.start();
          else
            graphTimeout.stop();
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
    }]
  });

  graphTimeout = new TimeoutUpdater(load_graph, 60000);
  load_graph();
}

function load_graph(kind = null, duration = null) {
  kind = graphKind.setIfNotNull(kind);
  duration = graphDuration.setIfNotNull(duration);

  $('.obox.obox-mini').removeClass('obox-selected');
  $('.obox-graph-selector-' + kind + ', .obox-graph-selector-' + duration).addClass('obox-selected');

  $.get(diff_path, { duration, kind },
    function (json) {
      const convert = (data, series) => data.time.map((t, i) => [t * 1000, series[i]]);
      chart.series[0].setData(convert(json, json.play_count));
      chart.series[1].setData(convert(json, json.comment_count));
      chart.series[2].setData(convert(json, json.mylist_count));
      chart.credits.update({ text: convertIntervalNumber(json.interval) });
      chart.redraw();
    }, 'json');

  graphTimeout.start();
}

$(() => {
  initialize_current();
  initialize_speed();
  initialize_graph();
});
