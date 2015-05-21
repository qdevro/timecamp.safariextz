/*
 * Common END script for Safari Timecamp Trello Extension
 * ©2015 Răzvan Ioan Anastasescu
 * Licence: None
 * Resources: Chrome Timecamp Extension
 */

// inject this only in parent document (not in Iframes too), and only on specific domains (services)
if (window === window.top && /((manageprojects|asana|pivotaltracker|podio|teamwork|trello)\.com|insight\.ly)/i.test(window.location.host)/* && /^\/(b|c)\//i.test(window.location.pathname)*/) {
  /***********************************************
   * onMessage received event handler
   ***********************************************/
  var onMessage = function(event){
    var data = event.message;
    
    switch (event.name) {
      case 'ajaxResponse':
        /**************************************************
         * default CORS AJAX response back from global.html
         **************************************************/
        var defer = data.options.identifier ? window[data.options.identifier] : null;
        
        if (defer) {
          if (!'error' in data || data.error !== true) {
            defer.resolve(data.data);
          } else {
            defer.reject(data.errorThrown != '' ? data.errorThrown : data.textStatus);
          }
        } else {
          console.warn('.: NO identifier :. - Ok, we came back from the API call with identifier: ' + data.options.identifier + ', now what ?');
        }
        //window[data.options.identifier] = null;
        break;
      
      case 'log':
        /**************************************************
         * log from global.html
         **************************************************/
        console.debug('global says', event.message);
        break;
      
      default:
        /**************************************************
         * unexpected message
         **************************************************/
        console.warn('Unknow message received: ' + event.name);
        break;
    }
  };
  
  // register listeners: from global.html
  safari.self.addEventListener('message', onMessage, false);
  
  /***********************************************
   * custom DOM events handlers
   ***********************************************/
  
  //var onAjaxRequestIntercept = function(event){
    // console.log(event.detail);
  //};
  
  //var onAjaxResponseIntercept = function(event){
    //console.log(event.detail.url);
  //};
  
  // register listeners: DOM events (ie: intercept AJAX calls for instance)
  //window.addEventListener("ajaxRequest", onAjaxRequestIntercept, false);
  //window.addEventListener("ajaxResponse", onAjaxResponseIntercept, false);
  
  
  /**************************************************************
   * common Timecamp Timer code (converted from Chrome extension)
   **************************************************************/
    var url = window.location.href,
        serverUrl = 'https://www.timecamp.com/',
        restUrl = serverUrl + 'third_party/api/',
        apiUrl = serverUrl + 'third_party/api/timer/format/json',
        tokenUrl = serverUrl + 'auth/token',
        signInUrl = serverUrl + 'auth/login',
        accessUrl = serverUrl + 'auth/access';
    
    var getAccessurl = function (redirect_url) {
      var internalUrl = encodeURIComponent(safari.extension.baseURI + redirect_url);
      return accessUrl + '?redirect_url=' + internalUrl;
    };
    
    var zeroFill = function(number, width) {
      width -= number.toString().length;
      if (width > 0) {
        return new Array(width + (/\./.test(number) ? 2 : 1)).join('0') + number;
      }
      
      return number + ""; // always return a string
    }
    
    var getLoggedOutFlag = function () {
      return $.Deferred(function (dfd) {
        try {
          if (!'removed' in localStorage || localStorage.removed !== true) {
            dfd.resolve(false);
          } else {
            dfd.resolve(true);
          }
        } catch(e) {
          dfd.reject();
        }
      });
    };
    
    var getStoredToken = function () {
      return $.Deferred(function (dfd) {
        try {
          var token = localStorage.token;
        
          if (token) {
            dfd.resolve(token);
          } else {
            dfd.reject();
          }
        } catch(e){
          dfd.reject();
        }
      });
    };
    
    var storeToken = function (token) {
      try{
        localStorage.token = token;
        localStorage.removed = false;
      } catch(e){
        console.warn(e.message);
      }
    };
    
    var removeStoredToken = function () {
      try {
        localStorage.removeItem('token');
      } catch(e) {
        console.warn(e.message);
      }
      
      try {
        localStorage.removed = true;
      } catch(e){
        console.warn(e.message);
      }
    };
    
    var getToken = function (forceApiCall) {
      return $.Deferred(function (dfd) {
        getStoredToken().done(function (token) {
          dfd.resolve(token);
        }).fail(function () {
          getLoggedOutFlag().done(function (loggedOut) {
            if (!loggedOut || forceApiCall) {
              // try to obtain the token using Timecamp session --> send this to global.html to deal with the API call
              var defer = $.Deferred(),
                  identifier = 'deffered_' + guid();
                  
              window[identifier] = defer;
              
              safari.self.tab.dispatchMessage('runAPIcall', {
                url: tokenUrl,
                identifier: identifier,
                responseType: 'text'
              })
              
              $.when(defer).then(function(data){
                if (data.toUpperCase() == 'NO_SESSION') {
                  console.warn('.: Timecamp session missing :. - We need to get your Timecamp user token before using this extension, but we couldn\'t find a valid session. So please authentificate first in your TimeCamp account, you can do this in another tab');
                  
                  notify(MISSING_SESSION_NOTIFICATION_TITLE, {
                    body: MISSING_SESSION_NOTIFICATION_BODY,
                    tag: 'no_timecamp_session'
                  }, {
                    'click': function(){
                      // dispatch a message to search or open a new tab towards timecamp.com
                      safari.self.tab.dispatchMessage('openTab', {
                        url: 'https://www.timecamp.com',
                        urlCheck: 'timecamp.com'
                      });
                      
                      //this.close();
                    }
                  }, 'no_timecamp_session');
                  
                  dfd.reject();
                } else {
                  storeToken(data);
                  dfd.resolve(data);
                }
              }, function(){
                dfd.reject();
              })
            } else {
              dfd.reject();
            }
          });
        });
      });
    };
  
  /**************************************************************
   * Timecamp TimerBase code (converted from Chrome extension)
   **************************************************************/
  
  var TimerBase = function() {
    this.service = '';
    this.oneSecondIntervalId = null;
    this.buttonInsertionInProgress = false;
    this.infoInsertingInProgress = false;
    this.pushInterval = 30000;
    this.isTimerRunning = false;
    this.trackedTaskId = "";
    this.button = null;
    this.syncing = false;
    this.startDate = null;
    this.multiButton = false;
    this.taskDuration = [];
    this.taskDurationToday = [];
    this.buttons = {};
    this.trackableParents = false;
    this.lastParentId = null;
    this.lastData = null;
    this.lastUrl = '';

    var $this = this;

    this.messages = {
        buttonTimerStopping                 : BUTTON_TIMER_STOPPING,
        buttonTimerStarting                 : BUTTON_TIMER_STARTING,
        buttonTimerStopTrackingAnotherTask  : BUTTON_TIMER_STOP_TRACKING_ANOTHER_TASK,
        buttonTimerStarted                  : BUTTON_TIMER_STARTED,
        buttonTimerStopped                  : BUTTON_TIMER_STOPPED,
        buttonLogIn                         : BUTTON_LOG_IN,
        buttonConnectionError               : BUTTON_CONNECTION_ERROR,
        synchronizing                       : SYNCHRONIZING,
        badgeTimerRunning                   : BADGE_TIMER_RUNNING,
        set: function (key, value) {
            $this.messages[key] = value;
        }
    };

    this.canWatch = {
      DOM:      0,
      URL:      1,
      HISTORY:  2
    };
    
    this.isWatching = this.canWatch.DOM;

    this.currentTaskId          = function () { return ''; };
    this.onSyncSuccess          = function (response) {};
    this.onSyncFailure          = function (reason) {};
    this.insertButtonIntoPage   = function () {};
    this.insertInfoIntoPage     = function () {};
    this.updateTopMessage       = function (startDate) {};
    this.getAvailableButtons    = function () {};
    this.onTrackingDisabled     = function () {};

    this.isButtonInserted       = function () {
        return true;
    };

    this.isInfoInserted = function () {
        return true;
    };

    this.getParentId = function() {
        return false;
    };

    this.canTrack = function () {
        var parent = this.getParentId();
        if (!parent || !this.trackableParents)
            return true;

        if (this.trackableParents == 'all')
            return true;

        if (this.trackableParents.indexOf(parent) !== -1)
            return true;

        return false;
    };

    this.runTimer = function (startDate, button) {
        return setInterval(function () {
            var diff = Math.abs((new Date().valueOf() - startDate.valueOf()));
            var minutes = Math.floor(diff / 1000 / 60);
            var seconds = Math.floor((diff - minutes * 1000 * 60 ) / 1000);
            if (button)
                button.uiElement.children('.time').html(zeroFill(minutes, 2) + ':' + zeroFill(seconds, 2));
            if ($this.trackedTaskId == $this.currentTaskId())
                $this.updateTopMessage();
        }, 1000);
    };

    this.buttonClick = function (taskId, onStart, onStop) {
        if (!taskId)
            return;
        if (!$this.buttons[taskId])
            return;
        if (!$this.buttons[taskId].isEnabled())
            return;

        $.when(getToken())
            .then(function (token) {
                var command;
                if ($this.isTimerRunning && $this.trackedTaskId == taskId) {
                    command = 'stop';
                    $this.buttons[taskId].setButtonText($this.messages.buttonTimerStopping);
                    $this.buttons[taskId].enabled = false;
                    $this.buttons[taskId].uiElement.children('.time').hide();
                    if (onStop)
                        onStop();

                    if ($this.oneSecondIntervalId) {
                        clearInterval($this.oneSecondIntervalId);
                    }
                }
                else {
                    command = 'start';
                    $this.buttons[taskId].setButtonText($this.messages.buttonTimerStarting);
                    $this.buttons[taskId].enabled = false;
                    if (onStart)
                        onStart();
                }

                $this.syncing = false;
                $this.apiCall(apiUrl, token, taskId, command).done(function() {
                    $this.updateButtonState();
                });
            })
    };



    this.onDomModified = function () {
        if ($this.multiButton)
        {
            var tasks = $this.getAvailableButtons();
            for (i in tasks)
            {
                if (!$this.isButtonInserted(tasks[i].taskId))
                    $this.insertButtonIntoPage(tasks[i]);
            }
        }
        else
        {
            if ($('#timecamp-track-button').length == 0)
            {
                if (!$this.isButtonInserted()){
                  $this.insertButtonIntoPage();
                }
            }
            if (!$this.isInfoInserted())
                $this.insertInfoIntoPage();

            if (!$this.canTrack())
                $this.onTrackingDisabled();

        }
    };

    this.apiCall = function (apiUrl, token, cardId, action) {
      if (this.syncing)
          return null;
      
      this.syncing = true;
      
      var defer = $.Deferred(),
          identifier = 'deffered_' + guid();
      
      window[identifier] = defer;
      
      safari.self.tab.dispatchMessage('runAPIcall', {
        url: apiUrl,
        method: 'POST',
        identifier: identifier,
        data: {
          api_token   : token,
          service     : this.service,
          action      : action,
          external_task_id : cardId
        }
      })
      
      $.when(defer).always(function(){
          $this.syncing = false;
        })
      
      return defer.promise();
    };

    this.updateButtonState = function () {
        $.when(getToken())
            .then(function (token) {
                var cardId = $this.currentTaskId();
                return $this.apiCall(apiUrl, token, cardId, 'status');
            }).done(function (response) {
                if (response == null)
                    return;

                $this.isTimerRunning = response.isTimerRunning;

                $this.onSyncSuccess(response);

                for (var i in $this.buttons)
                    $this.buttons[i].enabled = true;

                if ($this.isTimerRunning)
                {
                    $this.trackedTaskId = response.external_task_id;
                    var startDate = new Date(new Date().valueOf() - response.elapsed * 1000);
                    var button = $this.buttons[$this.trackedTaskId];
                    $this.startDate = startDate;

                    for (var i in $this.buttons)
                    {
                        if ($this.trackedTaskId != i)
                        {
                            $this.buttons[i].setButtonText($this.messages.buttonTimerStopTrackingAnotherTask);
                            $this.buttons[i].uiElement.children('.time').hide();
                        }
                    }

                    if ($this.oneSecondIntervalId) {
                        clearInterval($this.oneSecondIntervalId);
                    }

                    if(button)
                    {
                        button.setButtonText($this.messages.buttonTimerStarted);
                        $this.oneSecondIntervalId = $this.runTimer(startDate, button);
                        button.uiElement.children('.time').show();
                    }
                    $this.updateTopMessage();
                }
                else {
                    for (var i in $this.buttons)
                    {
                        $this.buttons[i].uiElement.children('.time').hide();
                        $this.buttons[i].setButtonText($this.messages.buttonTimerStopped);
                    }
                    clearInterval($this.oneSecondIntervalId);
                    $this.updateTopMessage();
                }
            }).fail(function (reason) {
              console.log('sync status error ...');
                $this.onSyncFailure(reason);

                getLoggedOutFlag().done(function(loggedOut){
                    if (loggedOut) {
                        for (var i in $this.buttons)
                            $this.buttons[i].setButtonText($this.messages.buttonLogIn);
                    } else {
                        for (var i in $this.buttons)
                            $this.buttons[i].setButtonText($this.messages.buttonConnectionError);
                    }
                    $this.updateTopMessage();
                });
            });
    };

    this.getEntriesStartTime = function () {
        return moment().format('YYYY-MM-DD');
    };

    this.getTrackedTime = function()
    {
        return $.Deferred(function (dfd) {
            $.when(getToken())
                .then(function (token) {
                    var today = moment().format('YYYY-MM-DD');

                    if (!$this.currentTaskId())
                    {
                        dfd.reject();
                        return;
                    }

                    var defer = $.Deferred(),
                        identifier = 'deffered_' + guid();
                    
                    window[identifier] = defer;
                        
                    safari.self.tab.dispatchMessage('runAPIcall', {
                      url: restUrl+'entries/format/json',
                      identifier: identifier,
                      data: {
                          api_token: token,
                          service: $this.service,
                          from: $this.getEntriesStartTime(),
                          to: today,
                          user_ids: 'me',
                          external_task_id: $this.currentTaskId()
                      }
                    })
                    
                    $.when(defer).then(function(response){
                      var sum = 0;
                      var todaySum = 0;
                      if (response.length > 0) {
                        for (var i in response) {
                          sum += parseInt(response[i]['duration']);
                          if (response[i]['date'] == today)
                            todaySum += parseInt(response[i]['duration']);
                        }
                      }
                      dfd.resolve(sum, todaySum);
                    }, function(){
                      dfd.reject();
                    })
                });
        });
    };

    this.getElapsedTime = function (timeInSeconds)
    {
        var duration = moment.duration(timeInSeconds, 'seconds');
        var time = {
            hours : Math.round(duration.hours()),
            minutes : Math.round(duration.minutes()),
            seconds : Math.round(duration.seconds())
        };

        if(time.hours   > 0){   return time.hours   + ' hour'+(time.hours == 1 ? '' : 's')+' and '     + time.minutes  + ' minute'+(time.minutes == 1 ? '' : 's');}
        if(time.minutes > 0){   return time.minutes + ' minute'+(time.minutes == 1 ? '' : 's');}

        return 'seconds';
    };

    this.URLWatcher = function ()
    {
        console.log('URL watcher on');
        var url = document.URL;
        if (url != $this.lastUrl || $this.buttons.length == 0)
        {
            this.lastUrl = url;

            var event;

            if (document.createEvent) {
                event = document.createEvent("HTMLEvents");
                event.initEvent("TCURLChanged", true, true);
            } else {
                event = document.createEventObject();
                event.eventType = "TCURLChanged";
            }

            event.eventName = "TCURLChanged";

            if (document.createEvent) {
                document.dispatchEvent(event);
            } else {
                document.fireEvent("on" + event.eventType, event);
            }
        }
    };


    this.bindEvents = function ($that) {
        $this = $that;
        setInterval($this.updateButtonState, this.pushInterval);

        setTimeout($this.updateButtonState, 3000);
        
        switch ($this.isWatching)
        {
            case $this.canWatch.DOM:
                document.addEventListener("DOMNodeInserted", this.onDomModified);
                break;
            case $this.canWatch.URL:
                setInterval($this.URLWatcher, 100);
                document.addEventListener("TCURLChanged", this.onDomModified);
                break;
            case $this.canWatch.HISTORY:
                // it's nice to insert the button on popstate too ;)
                window.addEventListener("popstate", function(){
                  // defer this because it might happen faster than DOM loading
                  setTimeout($this.onDomModified, 20)
                });
                
                // custom listener injected from starting.js script
                window.addEventListener("historyPushState", function(){
                  // defer this by 100ms because the URL it's not changed yet - TODO: optimize base code of adding a button to accept taskID parameter as well !
                  setTimeout($this.onDomModified, 20)
                });
                break;
        }

        $.when(getToken()).then(function (token) {
          var defer = $.Deferred(),
              identifier = 'deffered_' + guid();
          
          window[identifier] = defer;
              
          safari.self.tab.dispatchMessage('runAPIcall', {
            url: restUrl+'can_track/format/json',
            identifier: identifier,
            data: {
              api_token: token,
              service: $this.service
            }
          })
          
          $.when(defer).then(function(data){
            $this.trackableParents = data['trackable_parents'];
          }, function(){
            $this.trackableParents = false;
          })
        });
    };
  }
  
  var TimerButton = function(taskId) {
    this.taskId     = taskId;
    this.uiElement  = null;
    this.insertInProgress = true;
    this.enabled    = false;
    this.denied     = false;

    var $this = this;

    this.isRunning = function () {
        return timer.trackedTaskId == $this.taskId;
    };

    this.isEnabled = function () {
        return !this.insertInProgress && this.enabled;
    };

    this.isInserted = function () {
        return $this.insertInProgress || $('#timecamp-track-button-'+$this.taskId).length > 0;
    };

    this.setButtonText = function (text) {
        if ($this.uiElement)
            $this.uiElement.children('.text').html(text);
    };
  }

  /******************************************************************
   * Timecamp service specific code (converted from Chrome extension)
   ******************************************************************/
  var defer = $.Deferred(),
      identifier = 'deffered_' + guid();
  
  window[identifier] = defer;
  
  safari.self.tab.dispatchMessage('runAPIcall', {
    url: safari.extension.baseURI + 'scripts/service/' + domain.toLowerCase().replace(/(\.)(ly)$/i, '$2.js').replace(/\.com$/i, '.js'),
    identifier: identifier,
    responseType: 'text'
  })
  
  $.when(defer).then(function(response){
    eval(response);
  }, function(reason){
    console.warn('Something happened while loading service script for: ' + window.location.host, reason);
  })
}