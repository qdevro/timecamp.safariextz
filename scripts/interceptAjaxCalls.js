// AJAX interceptor - https://github.com/slorber/ajax-interceptor
var COMPLETED_READY_STATE = 4,
    RealXHRSend = XMLHttpRequest.prototype.send,
    RealXHROpen = XMLHttpRequest.prototype.open,
    requestCallbacks = [],
    responseCallbacks = [],
    wired = false;

function arrayRemove(array,item) {
  var index = array.indexOf(item);
  if (index > -1) {
    array.splice(index, 1);
  } else {
    throw new Error("Could not remove " + item + " from array");
  }
}

function uri2obj(str){
  return str ? JSON.parse('{"' + str.replace(/&/g, '","').replace(/=/g,'":"') + '"}', function(key, value) { return key === "" ? value : decodeURIComponent(value) }) : {};
}

function extend(objects){
  var extended = {};
  var merge = function (obj) {
    for (var prop in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, prop)) {
        extended[prop] = obj[prop];
      }
    }
  };
  
  merge(arguments[0]);
  
  for (var i = 1; i < arguments.length; i++) {
    var obj = arguments[i];
    merge(obj);
  }
  
  return extended;
}

function fireCallbacks(callbacks,xhr) {
  for( var i = 0; i < callbacks.length; i++ ) {
    callbacks[i](xhr);
  }
}

var addRequestCallback = function(callback) {
  requestCallbacks.push(callback);
};

var removeRequestCallback = function(callback) {
  arrayRemove(requestCallbacks,callback);
};

var addResponseCallback = function(callback) {
  responseCallbacks.push(callback);
};

var removeResponseCallback = function(callback) {
  arrayRemove(responseCallbacks,callback);
};

function fireResponseCallbacksIfCompleted(xhr) {
  if( xhr.readyState === COMPLETED_READY_STATE ) {
    fireCallbacks(responseCallbacks,xhr);
  }
}

function proxifyOnReadyStateChange(xhr) {
  var realOnReadyStateChange = xhr.onreadystatechange;
  if ( realOnReadyStateChange ) {
    xhr.onreadystatechange = function() {
      fireResponseCallbacksIfCompleted(xhr);
      realOnReadyStateChange();
    };
  }
}

var wire = function() {
  if ( wired ) throw new Error("Ajax interceptor already wired");
  
  // Override open method
  XMLHttpRequest.prototype.open = function(method, url){
    this.method = method;
    
    // if we have parameters to URL, let's move them to sentData section and keep a clear URL
    if (/\?/.test(url)) {
      var uri = url.split('?');
      
      this.originalUrl = url;
      this.url = uri[0];
      
      this.dataSent = uri2obj(uri[1]);
    } else {
      this.url = url;
    }
    
    RealXHROpen.apply(this, arguments);
  }

  // Override send method of all XHR requests
  XMLHttpRequest.prototype.send = function(dataSent) {
    this.dataSent = extend(this.dataSent, typeof dataSent === 'object' ? dataSent : uri2obj(dataSent));
  
    // Fire request callbacks before sending the request
    fireCallbacks(requestCallbacks,this);

    // Wire response callbacks
    if( this.addEventListener ) {
      var self = this;
      this.addEventListener("readystatechange", function() {
        fireResponseCallbacksIfCompleted(self);
      }, false);
    }
    else {
      proxifyOnReadyStateChange(this);
    }

    RealXHRSend.apply(this, arguments);
  };
  
  wired = true;
};

var unwire = function() {
  if ( !wired ) throw new Error("Ajax interceptor not currently wired");
  XMLHttpRequest.prototype.send = RealXHRSend;
  wired = false;
};

// add time signature on XHR send & send a message to the injected script
addRequestCallback(function(xhr) {
  xhr.time = new Date().getTime();
  
  var event;
  
  if (['function', 'object'].indexOf(typeof CustomEvent) > -1) {
    event = new CustomEvent("ajaxRequest", {
      detail: xhr
    })
  } else {
    event = document.createEvent('CustomEvent');
    event.initEvent('historyPushState', true, true);
    event['detail'] = xhr;
  }
  
  window.dispatchEvent(event);
});

// send the response as well
addResponseCallback(function(xhr) {
  var event;
  
  if (['function', 'object'].indexOf(typeof CustomEvent) > -1) {
    event = new CustomEvent("ajaxResponse", {
      detail: xhr
    })
  } else {
    event = document.createEvent('CustomEvent');
    event.initEvent('historyPushState', true, true);
    event['detail'] = xhr;
  }
  
  window.dispatchEvent(event);
});

wire();