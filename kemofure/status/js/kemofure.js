const current_path = 'https://nanase.onl/kemofure/stat/';
const speed_path = 'https://nanase.onl/kemofure/speed/';
const diff_path = 'https://nanase.onl/kemofure/diff/';

class TimeoutUpdater {
  constructor(callback, interval) {
    this.callback = callback;
    this.interval = interval;
    this.timeout_id = null;
  }

  start() {
    this.stop();
    this.timeout_id = setTimeout(this.callback, this.interval);
  }

  stop() {
    if (this.timeout_id)
      clearInterval(this.timeout_id);
  }
}

class Storager {
  constructor(storage_name, default_value = null) {
    this.storage_name = storage_name;
    this.default_value = default_value;
    this.get();
  }

  get() {
    const value = localStorage.getItem(this.storage_name)

    if (value == null || typeof value === 'undefined') {
      localStorage.setItem(this.storage_name, this.default_value);
      return this.default_value;
    }

    return value;
  }

  setIfNotNull(value) {
    if (value != null && typeof value !== 'undefined')
      localStorage.setItem(this.storage_name, value);

    return this.get();
  }
}

function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function diffText(value) {
  return value >= 0 ? '+ ' + numberWithCommas(value) : '- ' + numberWithCommas(-value);
}

// -------------------------
let old_json = { time: 0, play_count: 0, comment_count: 0, mylist_count: 0 };
let currentTimeout = new TimeoutUpdater(load_current, 5000);

function load_current() {
  $.getJSON(current_path, function (json) {
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
    currentTimeout.start();
  }).fail(function () {
    currentTimeout.start();
  });
}

function initialize_current() {
  //currentTimeout 
  load_current();
}

// -------------------------
const speedDuration = new Storager('kfm_speedDuration', 'h');
let speedTimeout;

function toggle_speed() {
  speedTimeout.stop();

  if (speedDuration.get() == 'h')
    load_speed('m');
  else
    load_speed('h');
}

function load_speed(duration) {
  duration = speedDuration.setIfNotNull(duration);

  $.get(speed_path, { duration },
    function (json) {
      $('.diff-view').text(diffText(json.play_count));
      $('.diff-comment').text(diffText(json.comment_count));
      $('.diff-mylist').text(diffText(json.mylist_count));
      $('.diff-view ~ .display-name').text('views/' + duration);
      $('.diff-comment ~ .display-name').text('comments/' + duration);
      $('.diff-mylist ~ .display-name').text('mylists/' + duration);
      speedTimeout.start();
    }, 'json').fail(function () {
      speedTimeout.start();
    });
}

function initialize_speed() {
  speedTimeout = new TimeoutUpdater(load_speed, 60000);
  load_speed();
}

// -------------------------
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
