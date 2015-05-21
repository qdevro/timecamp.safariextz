(function(history){
  var pushState = history.pushState;
  
  history.pushState = function(state, title, url) {
    var details = {
      state: state,
      title: title,
      url: url
    }
    
    if (typeof history.onpushstate === "function") {
      history.onpushstate(details);
    }
    
    // NOW it's working on Safari 5.1.7 for Windows too but cross-browser : https://github.com/ariya/phantomjs/issues/11289#issuecomment-32555786 (http://tjrus.com/blog/custom-javascript-events)
    var event;
    
    if (['function', 'object'].indexOf(typeof CustomEvent) > -1) {
      event = new CustomEvent("historyPushState", {
        detail: details
      });
    } else {
      event = document.createEvent('CustomEvent');
      event.initEvent('historyPushState', true, true);
      event['detail'] = details;
    }
    
    window.dispatchEvent(event);
    
    return pushState.apply(history, arguments);
  }
})(window.history);