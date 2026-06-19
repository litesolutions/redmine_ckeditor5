window.RedmineCkeditor5 = window.RedmineCkeditor5 || (function () {
  var queue = [];
  return {
    ready: false,
    whenReady: function (callback) {
      if (this.ready) {
        callback(this);
      } else {
        queue.push(callback);
      }
    },
    _flush: function () {
      this.ready = true;
      queue.forEach(function (callback) { callback(window.RedmineCkeditor5); });
      queue = [];
    }
  };
})();
