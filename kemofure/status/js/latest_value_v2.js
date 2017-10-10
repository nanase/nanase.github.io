let old_json = { time: 0, play_count: 0, comment_count: 0, mylist_count: 0 };
let currentTimeout = new TimeoutUpdater(load_current, 5000);

function sameIndexOf(x, y) {
  const length = Math.min(x.length, y.length);
  for (let i = 0; i < length; i++)
    if (x[i] != y[i])
      return i - 1;

  return length - 1;
}

function getChangedText(old_text, new_text) {
  if (old_text.length == new_text.length) {
    const same_index = sameIndexOf(old_text, new_text) + 1;
    const unchanged = old_text.substr(0, same_index);
    const changed_old = old_text.substr(same_index);
    const changed_new = new_text.substr(same_index);
    return { unchanged, changed_old, changed_new };
  }
  else
    return { unchanged: '', changed_old: old_text, changed_new: new_text };
}

function load_current() {
  $.getJSON(current_path, function (json) {
    const func = (json_kind, html_kind = json_kind) => {
      const old = old_json[json_kind + '_count'];
      const current = json[json_kind + '_count'];
      const display = '.stat-box-display-' + html_kind;
      const outer = '.stat-box-outer-' + html_kind;
      const diff = '.stat-box-diff-' + html_kind;

      if (old != current) {
        $(display + ' .stable').text(numberWithCommas(current));
        $(outer).removeClass('updated');
        setTimeout(() => $(outer).addClass('updated'), 100);

        if (old_json.time > 0) {
          $(diff).text(diffText(current - old));
          $(diff).removeClass('updated');
          setTimeout(() => $(diff).addClass('updated'), 100);

          const changed_text = getChangedText(numberWithCommas(old), numberWithCommas(current));
          const fixed = display + ' .animation-fixed';
          const ani_old = display + ' .animation-old';
          const ani_new = display + ' .animation-new';
          $(display + ' .unchange').text(changed_text.unchanged);
          $(fixed + ' .change').text(changed_text.changed_new);
          $(ani_old + ' .change').text(changed_text.changed_old);
          $(ani_new + ' .change').text(changed_text.changed_new);

          $(ani_old).css({ marginTop: -29 + 'px', opacity: 1 });
          $(ani_new).css({ marginTop: -9 + 'px', opacity: 0 });
          $(display).addClass('animate');
          $(ani_old).delay(500).animate({ marginTop: -49 + 'px', opacity: 0 }, 1000);
          $(ani_new).delay(500).animate({ marginTop: -29 + 'px', opacity: 1 }, 1000, () => {
            $(display).removeClass('animate');
          });
        }
      }
    };

    func('play', 'view');
    func('comment');
    func('mylist');

    old_json = json;
    currentTimeout.start();
  }).fail(function () {
    currentTimeout.start();
  });
}

function initialize_current() {
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
      $('.stat-box-speed-value-view').text(diffText(json.play_count));
      $('.stat-box-speed-value-comment').text(diffText(json.comment_count));
      $('.stat-box-speed-value-mylist').text(diffText(json.mylist_count));
      $('.stat-box-speed-span').text('/' + duration);
      speedTimeout.start();
    }, 'json').fail(function () {
      speedTimeout.start();
    });
}

function initialize_speed() {
  speedTimeout = new TimeoutUpdater(load_speed, 60000);
  load_speed();
}
