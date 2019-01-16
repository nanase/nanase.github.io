let chart;
const graphDuration = new Storager('kfm_graphDuration', '1');
const graphKind = new Storager('kfm_graphKind', 'd');
const graphTheme = new Storager('kfm_graphTheme', '0');
const graphMax = new Storager('kfm_graphMax', '0');
let graphTimeout;

const light_theme = {
  chart: {
    backgroundColor: '#fff',
  },
};
const dark_theme = {
  chart: {
    backgroundColor: '#222',
  },
  xAxis: {
    lineColor: '#888',
    tickColor: '#666',
    gridLineColor: '#333',
    labels: {
      style: {
        color: '#aaa'
      }
    }
  },
  yAxis: {
    lineColor: '#888',
    tickColor: '#666',
    gridLineColor: '#333',
    labels: {
      style: {
        color: '#aaa'
      }
    }
  },
  legend: {
    itemStyle: {
      color: '#CCC'
    },
    itemHoverStyle: {
      color: '#FFF'
    },
    itemHiddenStyle: {
      color: '#333'
    }
  },
};

var HCDefaults = $.extend(true, {}, Highcharts.getOptions(), {});

function ResetOptions() {
  // Fortunately, Highcharts returns the reference to defaultOptions itself
  // We can manipulate this and delete all the properties
  var defaultOptions = Highcharts.getOptions();
  for (var prop in defaultOptions) {
    if (typeof defaultOptions[prop] !== 'function') delete defaultOptions[prop];
  }
  // Fall back to the defaults that we captured initially, this resets the theme
  Highcharts.setOptions(HCDefaults);
}

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

function format_tooltip_datetime(date) {
  const kind = graphKind.get();
  const duration = graphDuration.get();
  let text = sprintf('%d-%02d-%02d', date.getFullYear(), date.getMonth() + 1, date.getDate())

  if (duration != '12h' && (duration | 0) >= 30)
    return text;

  return text + sprintf(' %02d:%02d', date.getHours(), date.getMinutes());
}

function findIndexOptions(options, pred) {
  for (let i = 0; i < options.length; i++)
    if (pred(options[i], i))
      return i;

  return -1;
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
    boost: {
      useGPUTranslations: true
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
      formatter: function () {
        const date = new Date(this.x);
        const header = sprintf('<small>%s</small><table>', format_tooltip_datetime(date));
        const footer = '</table>';
        const points = this.points.map(p => sprintf('<tr><td style="color: %s">%s: </td><td style="text-align: right;min-width: 40px"><b>%s</b></td></tr>',
          p.color,
          p.series.name,
          numberWithCommas(p.y))).join('');
        return header + points + footer;
      }
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
    plotOptions: {
      series: {
        marker: {
          enabled: null
        },
        dataLabels: {
          enabled: true,
          formatter: function () {
            return graphMax.get() == '1' && this.point.y == this.series.dataMax ? numberWithCommas(this.y) : null;
          }
        }
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
    }],
    annotations: [{
      labels: [{
        point: {
          x: 0,
          y: 0
        },
        text: 'Test'
      }]
    }]
  });

  graphTimeout = new TimeoutUpdater(load_graph, 60000);
  load_graph();
}

function load_graph(kind = null, duration = null) {
  kind = graphKind.setIfNotNull(kind);
  duration = graphDuration.setIfNotNull(duration);

  $.get(diff_path, { duration, kind },
    function (json) {
      const convert = (data, series) => data.time.map((t, i) => [t * 1000, series[i]]);
      set_graph_theme(null, false);
      chart.series[0].setData(convert(json, json.play_count));
      chart.series[1].setData(convert(json, json.comment_count));
      chart.series[2].setData(convert(json, json.mylist_count));
      chart.credits.update({ text: convertIntervalNumber(json.interval) });
      chart.redraw();
    }, 'json');

  graphTimeout.start();
}

function set_graph_theme(theme = null, destroy = true) {
  theme = graphTheme.setIfNotNull(theme);

  if (theme == '1')
    Highcharts.theme = dark_theme;
  else
    Highcharts.theme = light_theme;

  if (destroy)
    ResetOptions();

  Highcharts.setOptions(Highcharts.theme);

  if (destroy) {
    chart.destroy();
    initialize_graph();
  }
}

function set_max_value_showing(showing = null) {
  graphMax.setIfNotNull(showing);
  load_graph();
}

$(() => {
  $('#graph-kind')[0].selectedIndex = findIndexOptions($('#graph-kind')[0].options, o => o.value == graphKind.get());
  $('#graph-duration')[0].selectedIndex = findIndexOptions($('#graph-duration')[0].options, o => o.value == graphDuration.get());
  $('#graph-theme')[0].selectedIndex = findIndexOptions($('#graph-theme')[0].options, o => o.value == graphTheme.get());
  $('#graph-max')[0].selectedIndex = findIndexOptions($('#graph-max')[0].options, o => o.value == graphMax.get());

  initialize_current();
  initialize_speed();
  set_graph_theme(null, false);
  initialize_graph();
});
