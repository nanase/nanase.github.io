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
