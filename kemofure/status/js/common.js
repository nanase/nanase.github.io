const current_path = 'https://nanase.onl/kemofure/stat/';
const speed_path = 'https://nanase.onl/kemofure/speed/';
const diff_path = 'https://nanase.onl/kemofure/diff/';

const detail_graph_path = 'https://nanase.onl/kemofure/detail/graph/';

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
