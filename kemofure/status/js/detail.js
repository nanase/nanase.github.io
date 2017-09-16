let chart;
let chart_vs;

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
      spacing: [5, 5, 5, 5]
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
      minRange: 60 * 60 * 24
    },
    yAxis: {
      allowDecimals: true,
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
      align: 'center',
      verticalAlign: 'top',
      padding: 0,
      margin: 0,
    },
    credits: {
      enabled: false
    },
    series: [{
      name: '再生数',
      color: '#26aa44',
      lineWidth: 1,
    },
    {
      name: 'コメント数',
      color: '#2f7edb',
      lineWidth: 1,
    },
    {
      name: 'マイリスト数',
      color: '#ec7835',
      lineWidth: 1,
    }]
  });

  chart_vs = Highcharts.chart({
    chart: {
      renderTo: 'graph-vs',
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
      spacing: [5, 5, 5, 5]
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
      minRange: 60 * 60 * 24
    },
    yAxis: {
      allowDecimals: true,
      title: {
        text: null
      },
      formatter: function() {
        return this.value * 100.0;
      }
    },
    tooltip: {
      crosshairs: true,
      shared: true,
      useHTML: true,
      headerFormat: '<small>{point.key}</small><table>',
      pointFormat: '<tr><td style="color: {series.color}">{series.name}: </td>' +
      '<td style="text-align: right;min-width: 40px"><b>{point.y:.3f}</b></td></tr>',
      footerFormat: '</table>',
      xDateFormat: '%Y-%m-%d %H:%M'
    },
    legend: {
      enabled: true,
      align: 'center',
      verticalAlign: 'top',
      padding: 0,
      margin: 0,
    },
    credits: {
      enabled: false
    },
    series: [{
      name: '再生数 vs コメント率 (%)',
      color: '#2f7edb',
      lineWidth: 1,
    },
    {
      name: '再生数 vs マイリスト率 (%)',
      color: '#ec7835',
      lineWidth: 1,
    }]
  });

  load_graph();
}

function convert_form_date(date) {
  const datetime = new Date(date);
  return datetime.getFullYear() + '-' + ('0' + (datetime.getMonth() + 1)).slice(-2) + '-' + ('0' + datetime.getDate()).slice(-2);
}

function normalize(value, normal) {
  return value - value % normal;
}

function load_graph() {
  const kind = $('#graph-kind')[0].value;
  const duration = $('#graph-duration')[0].value;
  const interval = $('#graph-interval')[0].value;
  const begin = ($('#graph-begin-date')[0].valueAsNumber / 1000 - 60 * 60 * 9) | 0;
  const end = ($('#graph-end-date')[0].valueAsNumber / 1000 - 60 * 60 * 9 + 86400 - 1) | 0;

  $('.graph-message').text('読み込み中...');
  $.get(detail_graph_path, { kind, duration, interval, begin, end },
    function (json) {
      const convert = (data, series) => data.time.map((t, i) => [t * 1000, series[i]]);
      const vsconvert = (data, series, series2) => data.time.map((t, i) => [t * 1000, series[i] / series2[i] * 100]);
      chart.series[0].setData(convert(json, json.play_count));
      chart.series[1].setData(convert(json, json.comment_count));
      chart.series[2].setData(convert(json, json.mylist_count));
      chart.redraw();

      chart_vs.series[0].setData(vsconvert(json, json.comment_count, json.play_count));
      chart_vs.series[1].setData(vsconvert(json, json.mylist_count, json.play_count));
      chart_vs.redraw();

      if (json.throttled)
        $('.graph-message').text('データが多いため一部を表示しています');
      else
        $('.graph-message').text('');
    }, 'json');
}

function change_interval_form() {
  const isAllDuration = ($('#graph-duration')[0].selectedIndex == '0');
  $('#graph-interval')[0].disabled = isAllDuration;

  if (isAllDuration) {
    $('#graph-interval')[0].selectedIndex = $('#graph-interval option[value=24h]')[0].index;
    $('#graph-interval').addClass('disabled');
    $('#graph-begin-date')[0].min = convert_form_date(1484319600000);
    $('#graph-end-date')[0].min = convert_form_date(1484319600000 + 86400000);
  }
  else {
    $('#graph-interval').removeClass('disabled');
    $('#graph-begin-date')[0].min = convert_form_date(1504310400000);
    $('#graph-end-date')[0].min = convert_form_date(1504310400000 + 86400000);
  }
}

$(() => {
  $('#graph-end-date')[0].valueAsNumber = normalize(new Date().getTime(), 86400000);

  $('#graph-begin-date')[0].max = convert_form_date(new Date().getTime(), 86400000);
  $('#graph-end-date')[0].max = convert_form_date(new Date().getTime(), 86400000);
  change_interval_form();
  initialize_current();
  initialize_speed();
  initialize_graph();
});
